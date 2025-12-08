import { GoogleGenAI } from "@google/genai";

// Initialize Gemini API
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Generates a witty, short GM message for Farcaster in English.
 */
export const generateGMText = async (topic: string): Promise<string> => {
  try {
    const prompt = topic.trim() 
      ? `Write a GM (Good Morning) post about: ${topic}` 
      : "Write a cool, high-energy GM (Good Morning) post for crypto natives.";

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        systemInstruction: `You are 'Onchain GM Bot'. Your sole task is to generate short morning greetings (GM) for Web3/Farcaster users.
        
        Rules:
        - MUST contain the word "GM" or "gm".
        - Language: ENGLISH only.
        - Tone: Casual, High Energy, Degen, Optimistic.
        - Length: Short (under 280 characters).
        - Use crypto slang appropriately (WAGMI, LFG, Bag, Builder, Mint, Based).
        - Use matching emojis (☀️, ☕, 🚀, 🐸, ⛓️).
        `,
        temperature: 1.1,
      },
    });

    return response.text || "GM! ☀️ WAGMI";
  } catch (error) {
    console.error("Gemini GM Text Error:", error);
    throw new Error("Unable to generate GM content.");
  }
};

/**
 * Generates a 'Morning Vibe' image.
 */
export const generateGMImage = async (userPrompt: string): Promise<string> => {
  try {
    // Enhance the prompt to ensure it looks like a "GM" post
    const enhancedPrompt = userPrompt.trim() 
      ? `A bright, optimistic morning scene, ${userPrompt}, digital art style, high quality, 4k, sunrise lighting, crypto art aesthetic`
      : `A futuristic solarpunk city sunrise with a glowing ethereum logo in the sky, optimistic, bright colors, digital art, web3 vibes, lo-fi aesthetic`;

    // Using gemini-2.5-flash-image for fast image generation
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: {
        parts: [
          { text: enhancedPrompt }
        ]
      },
    });

    // Safely access candidates using optional chaining
    const candidates = response.candidates;
    if (candidates && candidates.length > 0) {
      const candidate = candidates[0];
      // Check if content and parts exist
      if (candidate.content && candidate.content.parts) {
        for (const part of candidate.content.parts) {
          // Check if inlineData exists
          if (part.inlineData && part.inlineData.data) {
            const base64Data = part.inlineData.data;
            return `data:image/png;base64,${base64Data}`;
          }
        }
      }
    }
    
    throw new Error("No image found.");
  } catch (error) {
    console.error("Gemini GM Image Error:", error);
    throw new Error("Error generating GM image.");
  }
};
