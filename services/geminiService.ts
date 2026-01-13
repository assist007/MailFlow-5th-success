
import { GoogleGenAI } from "@google/genai";

// Fixed: Correctly initialize GoogleGenAI with the expected named parameter.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateEmailDraft = async (prompt: string, context?: string) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are a professional email assistant. Based on the following context, write a draft for an email.
      Prompt: ${prompt}
      Context: ${context || 'None'}
      Return only the email body.`,
    });
    // Fixed: Direct access to the .text property.
    return response.text;
  } catch (error) {
    console.error('Gemini Error:', error);
    return "Failed to generate draft.";
  }
};

export const summarizeThread = async (emails: string[]) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Summarize this email conversation thread in 2-3 concise bullet points:
      ${emails.join('\n---\n')}`,
    });
    // Fixed: Direct access to the .text property.
    return response.text;
  } catch (error) {
    console.error('Gemini Error:', error);
    return "Summary unavailable.";
  }
};
