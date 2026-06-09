import { askGeminiServer, askGeminiVisionServer } from "./api/gemini.functions";

// Wrapper that keeps the original (prompt, context) call signature.
// Internally calls the server function so the API key never reaches the browser.
export async function askGemini(prompt: string, context: string): Promise<string> {
  const result = await askGeminiServer({ data: { prompt, context } });
  return result.text;
}

export async function askGeminiVision(
  prompt: string,
  base64Image: string,
  mimeType: string
): Promise<string> {
  const result = await askGeminiVisionServer({ data: { prompt, base64Image, mimeType } });
  return result.text;
}
