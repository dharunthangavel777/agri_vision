import { callOpenAIChat } from './aiService.ts';

interface KnowledgeChunk {
  id: string;
  topic: string;
  content: string;
  keywords: string[];
}

const DEFAULT_KNOWLEDGE: KnowledgeChunk[] = [
  {
    id: "crop_rec_1",
    topic: "Crop Recommendation",
    content: "For black soil with high moisture retention, cotton and soybean are highly recommended. Cotton requires a temperature range of 21-30°C and rainfall of 50-100cm. Soybean thrives in 15-32°C with 60-100cm rainfall. Ensure proper drainage to avoid waterlogging.",
    keywords: ["black soil", "cotton", "soybean", "moisture", "drainage"]
  },
  {
    id: "disease_1",
    topic: "Plant Diseases",
    content: "Tomato Early Blight is caused by the fungus Alternaria solani. Symptoms include small, brown spots with concentric rings on older leaves. Treatment: Apply copper-based fungicides or Mancozeb. Prevention: Rotate crops, remove infected debris, and avoid overhead irrigation.",
    keywords: ["tomato", "early blight", "fungus", "brown spots", "fungicide"]
  },
  {
    id: "pest_1",
    topic: "Pest Control",
    content: "Fall Armyworm (FAW) is a major pest for maize. It feeds on leaves, causing large ragged holes. Control: Use Neem-based pesticides or Bacillus thuringiensis (Bt). Pheromone traps can help in early detection. Intercropping with legumes like cowpea can reduce infestation.",
    keywords: ["maize", "fall armyworm", "pest", "neem", "pesticide"]
  },
  {
    id: "fertilizer_1",
    topic: "Fertilizer Usage",
    content: "For Rice (Paddy), the recommended NPK ratio is usually 120:60:60 kg/ha. Apply Nitrogen in three split doses: at transplanting, tillering, and panicle initiation. Phosphorus and Potassium should be applied as a basal dose during transplanting.",
    keywords: ["rice", "paddy", "npk", "nitrogen", "phosphorus", "potassium"]
  },
  {
    id: "irrigation_1",
    topic: "Irrigation Planning",
    content: "Drip irrigation is most efficient for fruit crops like Pomegranate and Grapes, saving up to 40-50% water. For wheat, critical stages for irrigation are Crown Root Initiation (CRI), tillering, and flowering. Avoid irrigation during high winds to prevent lodging.",
    keywords: ["drip irrigation", "water saving", "wheat", "pomegranate", "grapes"]
  },
  {
    id: "scheme_1",
    topic: "Government Schemes",
    content: "PM-KISAN (Pradhan Mantri Kisan Samman Nidhi) provides Rs. 6,000 per year in three equal installments to small and marginal farmers. PMFBY (Pradhan Mantri Fasal Bima Yojana) offers crop insurance against natural calamities, pests, and diseases with low premium rates.",
    keywords: ["pm-kisan", "pmfby", "insurance", "subsidy", "financial aid"]
  }
];

const knowledgeBase: KnowledgeChunk[] = DEFAULT_KNOWLEDGE;

export const initKnowledgeBase = async () => {
  // Knowledge base initialized from agriculture database
  return true;
};

// Retrieve top-k chunks using semantic keyword matching
const retrieveChunks = async (query: string, k: number = 3) => {
  const safeQuery = (query || '').toLowerCase();
  const queryTokens = safeQuery.split(/\W+/).filter(Boolean);
  return knowledgeBase
    .map(chunk => ({
      ...chunk,
      score: (chunk.keywords || []).filter(keyword => queryTokens.includes((keyword || '').toLowerCase())).length +
             ((chunk.topic || '').toLowerCase().includes(safeQuery) ? 3 : 0) +
             ((chunk.content || '').toLowerCase().includes(safeQuery) ? 1 : 0),
    }))
    .filter(chunk => chunk.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, k);
};

export const generateChatResponse = async (query: string, history: any[] = []) => {
  // 1. Retrieve relevant context
  const relevantChunks = await retrieveChunks(query);
  const context = relevantChunks.map(c => c.content).join("\n\n");

  // 2. System prompt
  const systemInstruction = `You are ChatGPT, acting as a helpful and encouraging AI Farmer Copilot for the "Smart Agriculture" app.
Your goal is to provide clear, actionable, and practical agricultural advice.

Use the following reference context if relevant to the farmer's question:
${context}

If the user asks about a plant disease, crop, market price, or weather, provide a structured answer:
- Problem: (Briefly identify the condition)
- Cause: (Underlying cause)
- Solution: (Immediate actionable steps with organic or chemical remedies)
- Prevention: (How to avoid this issue in future seasons)

Keep answers direct, respectful, and easy for farmers to understand.`;

  try {
    const messages: any[] = [
      { role: 'system', content: systemInstruction },
      ...history.map(h => ({
        role: h.role === 'model' || h.role === 'assistant' ? 'assistant' : 'user',
        content: h.content,
      })),
      { role: 'user', content: query }
    ];

    const reply = await callOpenAIChat(messages);
    return reply || "I'm sorry, I couldn't generate a response. Please try again.";
  } catch (error) {
    console.error("ChatGPT chat generation error:", error);
    if (context) {
      return `Here is helpful guidance from your local agricultural database:\n\n${context}`;
    }
    return "I'm having trouble connecting to the advisory server. Please check your network connection and try again.";
  }
};
