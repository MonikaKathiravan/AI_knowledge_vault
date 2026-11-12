const axios = require('axios');

const generateSummary = async (text, type = 'medium') => {
  try {
    const prompt = `
Summarize the following document in 150-200 words. Include introduction, main concepts, and conclusion.
Also extract key points and keywords.

Document:
"""
${text.substring(0, 8000)}
"""

Return your response as JSON:
{
  "summary": "The summary...",
  "keyPoints": ["point1", "point2", ...],
  "keywords": ["keyword1", "keyword2", ...]
}
`;

    const response = await axios.post('http://localhost:11434/api/generate', {
      model: 'mistral',
      prompt: prompt,
      stream: false,
    });

    const raw = response.data.response;

    let parsed;
    try {
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found');
      }
    } catch (e) {
      parsed = {
        summary: raw,
        keyPoints: [],
        keywords: [],
      };
    }

    const originalWords = text.split(/\s+/).length;
    const summaryWords = (parsed.summary || '').split(/\s+/).length;

    return {
      summary: parsed.summary || raw,
      keyPoints: parsed.keyPoints || [],
      keywords: parsed.keywords || [],
      originalWordCount: originalWords,
      summaryWordCount: summaryWords,
    };
  } catch (error) {
    console.error('Ollama summary error:', error.message);
    throw new Error('Failed to generate summary with Ollama. Is Ollama running?');
  }
};

// ─── Generate Flashcards using Ollama ───
const generateFlashcards = async (text) => {
  try {
    const prompt = `
Generate up to 20 flashcards from the following content.
Each flashcard must have a question and an answer.
Return the result as a JSON array:
[
  { "question": "...", "answer": "...", "category": "...", "tags": ["..."] }
]
Content:
${text.substring(0, 12000)}
`;
    const response = await axios.post('http://localhost:11434/api/generate', {
      model: 'mistral',
      prompt: prompt,
      stream: false,
    });

    const raw = response.data.response;
    const match = raw.match(/\[[\s\S]*\]/);
    if (match) {
      return JSON.parse(match[0]);
    }
    // If no array found, try to parse the whole response
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    } catch (e) {}
    return [];
  } catch (error) {
    console.error('Ollama flashcard generation error:', error.message);
    throw new Error('Failed to generate flashcards with Ollama. Is Ollama running?');
  }
};

// ─── Chat with Document using Ollama ───
const chatWithDocument = async (documentText, question, history = []) => {
  try {
    // Build conversation history
    let historyText = '';
    for (const msg of history) {
      historyText += `${msg.role}: ${msg.content}\n`;
    }

    const prompt = `
You are an AI assistant that answers questions based ONLY on the provided document content.
Do NOT use external knowledge.
If the answer is not in the document, say "I don't have enough information in the document to answer that."

Document content:
"""
${documentText.substring(0, 20000)}  // Limit to avoid token limits
"""

Conversation so far:
${historyText}

User question: ${question}

Provide a clear, structured answer. Use headings, bullet points, and code blocks if appropriate.
`;

    const response = await axios.post('http://localhost:11434/api/generate', {
      model: 'mistral',
      prompt: prompt,
      stream: false,
      options: {
        temperature: 0.3, // lower temperature for more focused answers
      },
    });

    const raw = response.data.response;
    return raw;
  } catch (error) {
    console.error('Ollama chat error:', error.message);
    throw new Error('Failed to generate chat response with Ollama. Is Ollama running?');
  }
};

module.exports = { generateSummary, generateFlashcards, chatWithDocument };