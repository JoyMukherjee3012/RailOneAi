// Re-export server function wrappers so existing imports keep working.
// The actual Gemini API key lives in process.env.GEMINI_API_KEY (server-side only)
// and is NEVER sent to the browser bundle.
export { askGeminiServer as askGemini, askGeminiVisionServer as askGeminiVision } from "./api/gemini.functions";
