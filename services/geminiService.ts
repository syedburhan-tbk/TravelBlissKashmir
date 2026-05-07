
import { GoogleGenAI, Type } from "@google/genai";

// Fixed: Moved ai instantiation inside functions to ensure process.env.API_KEY is current at call time.

export async function generateDayDescription(title: string, activities: string[]): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const prompt = `Act as a luxury travel consultant for Travel Bliss Kashmir, a travel agency in Kashmir.
    Write a 3-4 sentence poetic and inviting itinerary description for a day titled "${title}".
    The activities planned are: ${activities.join(', ')}.
    Keep the tone professional yet enchanting, suitable for a high-end client.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return response.text || "No description generated.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Error generating AI description. Please write manually.";
  }
}

export async function suggestNextDayTitle(prevTitle: string, tripType: string, dayNumber: number): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const prompt = `Act as an expert Kashmir travel planner. 
    The previous day of the trip was: "${prevTitle}".
    This is a ${tripType} trip in Kashmir. 
    What is a logical and catchy title for Day ${dayNumber}? 
    Respond with ONLY the title text, no quotes, no "Day ${dayNumber}:" prefix. Just the title.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return response.text?.trim() || `Day ${dayNumber} Exploration`;
  } catch (error) {
    console.error("Gemini Title Suggestion Error:", error);
    return `Day ${dayNumber} Plan`;
  }
}

export async function suggestFollowUp(leadName: string, stage: string, notes: string, interest: string): Promise<{ task: string, daysFromNow: number }> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const prompt = `Suggest the most effective next sales step for this Kashmir travel lead.
    Lead Name: ${leadName}
    Current Stage: ${stage}
    Lead Interest: ${interest}
    Notes: ${notes}
    
    Provide a specific, actionable task and a logical number of days from now to perform it.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            task: {
              type: Type.STRING,
              description: 'The specific sales task to perform.',
            },
            daysFromNow: {
              type: Type.NUMBER,
              description: 'Recommended number of days until this follow-up should happen.',
            }
          },
          required: ['task', 'daysFromNow']
        }
      }
    });

    return JSON.parse(response.text || '{"task": "General Follow-up", "daysFromNow": 2}');
  } catch (error) {
    console.error("Gemini Followup Error:", error);
    return { task: "Check back with client", daysFromNow: 2 };
  }
}

export async function draftWhatsAppMessage(leadName: string, interest: string, lastNote: string): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const prompt = `Draft a personalized, warm, and professional WhatsApp message for a travel lead.
    Agency: Travel Bliss Kashmir (Kashmir specialists)
    Client: ${leadName}
    Interest: ${interest}
    Context: ${lastNote}
    
    The message should be short (under 60 words), use relevant emojis, and end with a gentle question to encourage a reply. 
    Do not use generic placeholders like [Your Name]. Just the body of the message.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return response.text?.trim() || `Hi ${leadName}, just checking in about your Kashmir trip plans! How can we help?`;
  } catch (error) {
    console.error("Gemini WhatsApp Draft Error:", error);
    return `Hi ${leadName}, I hope you're having a great day. Just wanted to check if you had any updates on your Kashmir travel plans?`;
  }
}

export async function suggestKashmirItinerary(tripType: string, days: number): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const prompt = `Create a brief bullet-point summary for a ${days}-day ${tripType} trip to Kashmir.
    Include must-visit spots in Srinagar, Gulmarg, and Pahalgam. Focus on unique experiences.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return response.text || "No suggestions available.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Failed to fetch suggestions.";
  }
}
