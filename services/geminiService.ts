import { GoogleGenAI } from "@google/genai";

// Initialize Gemini API with fallback to prevent immediate crash if key is missing
// The actual error will be caught during the function call
const apiKey = process.env.API_KEY || '';
// Ensure we don't throw immediately on load if env is missing during build
const ai = new GoogleGenAI({ apiKey: apiKey || 'dummy-key-for-build' });

/**
 * Generates a witty, short GM message for Farcaster in English.
 */
export const generateGMText = async (topic: string): Promise<string> => {
  if (!apiKey) {
    return "GM! ☀️ (Config Error: Missing API Key)";
  }

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
    // Return a fallback so the UI doesn't break completely
    return "GM! ☀️ (AI is sleeping, but we are building!)";
  }
};

/**
 * Generates a 'Morning Vibe' image.
 */
export const generateGMImage = async (userPrompt: string): Promise<string> => {
  if (!apiKey) {
    throw new Error("Missing API Key");
  }

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

    // Extract image data
    if (response.candidates && response.candidates.length > 0) {
      const candidate = response.candidates[0];
      // Use optional chaining for safety
      if (candidate?.content?.parts) {
        for (const part of candidate.content.parts) {
          // Fix: Use optional chaining to safely access inlineData.data
          const base64Data = part.inlineData?.data;
          if (base64Data) {
            return `data:image/png;base64,${base64Data}`;
          }
        }
      }
    }
    
    throw new Error("No image data found in response.");
  } catch (error) {
    console.error("Gemini GM Image Error:", error);
    throw new Error("Unable to generate image. Please try again later.");
  }
};
