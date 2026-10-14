import agricultureKnowledge from '../data/agriculture_knowledge.json';
import { callOpenAIChat } from './aiService.ts';

interface KnowledgeChunk {
  id: string;
  topic: string;
  content: string;
  keywords: string[];
}

const knowledgeBase: KnowledgeChunk[] = agricultureKnowledge as KnowledgeChunk[];

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
