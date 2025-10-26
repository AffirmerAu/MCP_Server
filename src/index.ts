import http, { IncomingMessage, ServerResponse } from "node:http";
import { URL } from "node:url";
import { PROMPTS, RESOURCES } from "./resources.js";

interface JsonRpcRequest {
  jsonrpc: "2.0";
  id?: number | string;
  method: string;
  params?: Record<string, unknown>;
}

interface JsonRpcSuccess {
  jsonrpc: "2.0";
  id: number | string | null;
  result: unknown;
}

interface JsonRpcError {
  jsonrpc: "2.0";
  id: number | string | null;
  error: {
    code: number;
    message: string;
    data?: unknown;
  };
}

type JsonRpcResponse = JsonRpcSuccess | JsonRpcError;

type Handler = (request: JsonRpcRequest) => JsonRpcResponse;

const SERVER_INFO = {
  name: "cpr-mcp-server",
  version: "0.1.0"
};

function listResources(): JsonRpcSuccess {
  return {
    jsonrpc: "2.0",
    id: null,
    result: {
      resources: RESOURCES.map(({ content, ...meta }) => meta)
    }
  };
}

function readResource(uri: string): JsonRpcResponse {
  const match = RESOURCES.find((resource) => resource.uri === uri);

  if (!match) {
    return {
      jsonrpc: "2.0",
      id: null,
      error: {
        code: -32004,
        message: `Resource not found for URI: ${uri}`
      }
    };
  }

  return {
    jsonrpc: "2.0",
    id: null,
    result: {
      resource: {
        ...match
      }
    }
  };
}

function listPrompts(): JsonRpcSuccess {
  return {
    jsonrpc: "2.0",
    id: null,
    result: {
      prompts: PROMPTS
    }
  };
}

function getPrompt(name: string): JsonRpcResponse {
  const prompt = PROMPTS.find((entry) => entry.name === name);

  if (!prompt) {
    return {
      jsonrpc: "2.0",
      id: null,
      error: {
        code: -32005,
        message: `Prompt not found: ${name}`
      }
    };
  }

  return {
    jsonrpc: "2.0",
    id: null,
    result: {
      prompt
    }
  };
}

const methodHandlers: Record<string, Handler> = {
  initialize(request) {
    return {
      jsonrpc: "2.0",
      id: request.id ?? null,
      result: {
        server: SERVER_INFO,
        resources: RESOURCES.map(({ content, ...meta }) => meta),
        prompts: PROMPTS
      }
    };
  },
  "resources/list": (request) => ({
    ...listResources(),
    id: request.id ?? null
  }),
  "resources/read": (request) => {
    const uri = typeof request.params?.uri === "string" ? request.params.uri : undefined;

    if (!uri) {
      return {
        jsonrpc: "2.0",
        id: request.id ?? null,
        error: {
          code: -32602,
          message: "Missing or invalid 'uri' parameter"
        }
      };
    }

    const response = readResource(uri);
    return {
      ...response,
      id: request.id ?? null
    };
  },
  "prompts/list": (request) => ({
    ...listPrompts(),
    id: request.id ?? null
  }),
  "prompts/get": (request) => {
    const name = typeof request.params?.name === "string" ? request.params.name : undefined;

    if (!name) {
      return {
        jsonrpc: "2.0",
        id: request.id ?? null,
        error: {
          code: -32602,
          message: "Missing or invalid 'name' parameter"
        }
      };
    }

    const response = getPrompt(name);
    return {
      ...response,
      id: request.id ?? null
    };
  }
};

function handleJsonRpc(request: JsonRpcRequest): JsonRpcResponse {
  const handler = methodHandlers[request.method];

  if (!handler) {
    return {
      jsonrpc: "2.0",
      id: request.id ?? null,
      error: {
        code: -32601,
        message: `Method not found: ${request.method}`
      }
    };
  }

  try {
    return handler(request);
  } catch (error) {
    return {
      jsonrpc: "2.0",
      id: request.id ?? null,
      error: {
        code: -32000,
        message: error instanceof Error ? error.message : "Unknown error"
      }
    };
  }
}

function respondJson(res: ServerResponse, statusCode: number, payload: unknown): void {
  const data = JSON.stringify(payload, null, 2);
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*"
  });
  res.end(data);
}

function handleRpcRequest(req: IncomingMessage, res: ServerResponse, body: string): void {
  try {
    const parsed = JSON.parse(body) as JsonRpcRequest | JsonRpcRequest[];

    if (Array.isArray(parsed)) {
      const responses = parsed.map((item) => handleJsonRpc(item));
      respondJson(res, 200, responses);
      return;
    }

    const response = handleJsonRpc(parsed);
    respondJson(res, 200, response);
  } catch (error) {
    respondJson(res, 400, {
      jsonrpc: "2.0",
      id: null,
      error: {
        code: -32700,
        message: error instanceof Error ? error.message : "Invalid JSON payload"
      }
    });
  }
}

function handleHttpRequest(req: IncomingMessage, res: ServerResponse): void {
  const url = req.url ? new URL(req.url, `http://${req.headers.host ?? "localhost"}`) : undefined;

  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Methods": "POST, GET, OPTIONS"
    });
    res.end();
    return;
  }

  if (req.method === "GET" && url?.pathname === "/") {
    respondJson(res, 200, {
      message: "CPR MCP Server is running.",
      endpoints: {
        rpc: "/mcp",
        resources: "/resources",
        prompts: "/prompts"
      }
    });
    return;
  }

  if (req.method === "GET" && url?.pathname === "/resources") {
    respondJson(res, 200, {
      resources: RESOURCES
    });
    return;
  }

  if (req.method === "GET" && url?.pathname === "/prompts") {
    respondJson(res, 200, {
      prompts: PROMPTS
    });
    return;
  }

  if (req.method === "POST" && url?.pathname === "/mcp") {
    let body = "";
    req.on("data", (chunk: Buffer) => {
      body += chunk.toString("utf-8");
    });
    req.on("end", () => handleRpcRequest(req, res, body));
    return;
  }

  respondJson(res, 404, {
    jsonrpc: "2.0",
    id: null,
    error: {
      code: -32601,
      message: "Route not found"
    }
  });
}

const port = Number.parseInt(process.env.PORT ?? "3000", 10);

const server = http.createServer(handleHttpRequest);

server.listen(port, () => {
  console.log(`CPR MCP server listening on port ${port}`);
});
