import { CPR_LESSON, CPR_QUIZ_QUESTION, CPR_VIDEO_SUMMARY } from "./content/cprLesson.js";

export interface McpResource {
  uri: string;
  name: string;
  description: string;
  mimeType: string;
  content: string;
}

export interface McpPrompt {
  name: string;
  description: string;
  input: string;
}

export const RESOURCES: McpResource[] = [
  {
    uri: "cpr://lesson",
    name: "CPR Basics Lesson",
    description: "Step-by-step CPR training module including the DRSABC sequence, AED guidance, and a reflective question.",
    mimeType: "text/markdown",
    content: CPR_LESSON
  },
  {
    uri: "cpr://video",
    name: "CPR Demonstration Video",
    description: "Link to a CPR demonstration video that shows compression technique and timing.",
    mimeType: "text/plain",
    content: CPR_VIDEO_SUMMARY
  },
  {
    uri: "cpr://question",
    name: "Check for Understanding",
    description: "Single reflective question to confirm the learner remembers the first CPR step.",
    mimeType: "text/plain",
    content: CPR_QUIZ_QUESTION
  }
];

export const PROMPTS: McpPrompt[] = [
  {
    name: "cpr-quick-start",
    description: "Summarise the key CPR steps and emphasise safety before compressions.",
    input: `You are a CPR trainer. Summarise the DRSABC steps, mention the AED, and ask: \\"${CPR_QUIZ_QUESTION}\\".`
  },
  {
    name: "cpr-video-intro",
    description: "Introduce the CPR video and explain what to watch for.",
    input: "Provide a friendly invitation to watch the CPR basics video and tell the learner to focus on the compression rate and hand placement."
  }
];
