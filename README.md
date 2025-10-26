# CPR MCP Server

This project provides a beginner-friendly Model Context Protocol (MCP) server implemented in TypeScript. The server exposes CPR (Cardiopulmonary Resuscitation) training resources — a structured lesson, a demonstration video link, and a reflective question — so that AI assistants and applications can pull trusted content on demand.

The server is transport-agnostic JSON-RPC over HTTP, making it easy to run locally or deploy to [Render](https://render.com/) for wider access.

## Features

- ✅ **Structured CPR lesson** covering danger checks, response, airway, breathing, compressions, and AED usage.
- 🎬 **Demonstration video reference** with guidance on what to watch for.
- ❓ **Reflective check question** so each interaction ends by confirming understanding.
- 📦 **MCP-style JSON-RPC interface** with `initialize`, `resources/*`, and `prompts/*` methods.
- 🌐 **Built-in REST helpers** (`/resources`, `/prompts`) for quick manual testing.
- ☁️ **Render-ready** with zero external dependencies.

## Prerequisites

- [Node.js](https://nodejs.org/) 18 or newer (comes with `npm`).
- Git (for cloning the repository).

## 1. Clone the project

```bash
git clone <your-fork-or-repo-url>
cd MCP_Server
```

If you are starting from this template on a fresh machine, replace `<your-fork-or-repo-url>` with the repository address where you store your copy.

## 2. Install dependencies

The project only relies on TypeScript tooling, so installation is quick:

```bash
npm install
```

> **Tip:** If you are working behind a proxy, configure `npm config set proxy http://...` before running the command.

## 3. Run the MCP server locally

### Development mode (TypeScript directly)

```bash
npm run dev
```

This command uses `ts-node-dev` so the server restarts automatically when you edit files. You will see a console message similar to:

```
CPR MCP server listening on port 3000
```

### Production build

```bash
npm run build
npm start
```

`npm run build` emits compiled JavaScript into `dist/`, and `npm start` runs the compiled code with Node.js.

By default the server listens on port `3000`. Override this by exporting `PORT` before running the server:

```bash
PORT=8080 npm start
```

## 4. Explore the API

The server speaks JSON-RPC 2.0 at `/mcp` and also exposes helper endpoints for humans.

### 4.1 Quick health check

```bash
curl http://localhost:3000/
```

Response:

```json
{
  "message": "CPR MCP Server is running.",
  "endpoints": {
    "rpc": "/mcp",
    "resources": "/resources",
    "prompts": "/prompts"
  }
}
```

### 4.2 List MCP resources

```bash
curl http://localhost:3000/resources
```

### 4.3 Fetch the lesson via JSON-RPC

```bash
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "resources/read",
    "params": {
      "uri": "cpr://lesson"
    }
  }'
```

### 4.4 Get the question prompt

```bash
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 2,
    "method": "prompts/get",
    "params": {
      "name": "cpr-quick-start"
    }
  }'
```

## 5. Deploy to Render

Render can host this server as a free web service.

1. Commit your changes and push them to a GitHub/GitLab repository.
2. Create a new **Web Service** on Render and connect your repository.
3. Choose the **Node** environment.
4. Set the **Build Command** to:
   ```bash
   npm install && npm run build
   ```
5. Set the **Start Command** to:
   ```bash
   npm start
   ```
6. Keep the default `PORT` environment variable that Render injects.
7. (Optional) Add a [health check](https://render.com/docs/health-checks) hitting `/` to ensure the service is ready.

When Render finishes deployment you will receive a public URL like `https://cpr-mcp.onrender.com`. Test it with the same `curl` commands, swapping `localhost:3000` for your Render domain.

## 6. Customising the content

- Edit `src/content/cprLesson.ts` to update the lesson copy, link to a different video, or change the reflective question.
- Add more entries to `RESOURCES` in `src/resources.ts` to expose additional articles, downloads, or checklists.
- Create new entries in `PROMPTS` for other pre-composed tutor responses your MCP client can reuse.

After making changes, rebuild (`npm run build`) and redeploy.

## 7. Next steps

- Connect the MCP server to an MCP-compatible client (for example, a local AI assistant) by pointing it to the `/mcp` endpoint.
- Expand the protocol support with additional methods such as `tools/list` or `tools/call` if your client expects them.
- Add automated tests for JSON-RPC handlers to keep the CPR content verified.

---

Happy learning, and remember: ensure the area is safe **before** you begin CPR!
