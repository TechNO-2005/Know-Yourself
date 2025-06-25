import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY || "" 
});

export async function analyzeSelfReflections(reflections: string[]): Promise<string[]> {
  try {
    const reflectionText = reflections.join('\n\n---\n\n');
    
    const prompt = `Provide a crisp and critical analysis of all the answers to the questions on self-reflection by the user using all psychological principles. It is not going to be a gospel truth, rather an AI-based interpretation.

Based on these reflections:
${reflectionText}

Please provide 7-10 psychological self-discoveries as clear, sharp bullet points. Each discovery should be a concise observation about the person's psychological patterns, growth areas, strengths, or behavioral tendencies. Focus on actionable insights rather than generic statements.

Format your response as a JSON array of strings, where each string is a psychological discovery starting with a bold psychological concept followed by a colon and explanation.

Example format:
["**Growth Mindset Orientation:** Your response demonstrates...", "**Emotional Regulation Development:** You show evidence of..."]`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
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
  } catch (error) {
    console.error("Failed to analyze reflections:", error);
    throw new Error(`Failed to analyze reflections: ${error}`);
  }
}
