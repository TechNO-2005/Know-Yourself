import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY || "" 
});

export async function analyzeSelfReflections(reflections: string[]): Promise<string[]> {
  try {
    const reflectionText = reflections.join('\n\n---\n\n');
    
    const prompt = `Analyze these self-reflections and provide 5-7 key psychological insights:

${reflectionText}

Return a JSON array of strings. Each insight should start with a bold psychological concept followed by a colon and brief explanation.

Example: ["**Growth Mindset:** You demonstrate resilience...", "**Self-Awareness:** Your reflections show..."]`;

    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "array",
          items: {
            type: "string"
          }
        },
      },
      contents: prompt,
    });

    const rawJson = response.text;
    if (rawJson) {
      const discoveries: string[] = JSON.parse(rawJson);
      return discoveries;
    } else {
      throw new Error("Empty response from AI model");
    }
  } catch (error: any) {
    console.error("Failed to analyze reflections:", error);
    
    // Handle quota exceeded error specifically
    if (error.status === 429 || error.message?.includes('quota')) {
      throw new Error("AI analysis is temporarily unavailable due to high demand. Please try again in a few minutes.");
    }
    
    // Handle other API errors
    if (error.status >= 400) {
      throw new Error("AI analysis service is currently unavailable. Please try again later.");
    }
    
    throw new Error(`Failed to analyze reflections: ${error.message || 'Unknown error'}`);
  }
}
