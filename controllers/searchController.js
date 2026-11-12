const Document = require('../models/Document');
const Note = require('../models/Note');
const Summary = require('../models/Summary');
const Flashcard = require('../models/Flashcard');
const Conversation = require('../models/Conversation');
const { chatWithDocument } = require('../services/geminiService');

exports.search = async (req, res) => {
  const { q, type, favorite, tag, dateFrom, dateTo } = req.query;
  if (!q || q.trim() === '') {
    return res.json({
      results: [],
      aiAnswer: null,
      suggestions: [],
      analytics: { total: 0, time: 0, confidence: 0 }
    });
  }
  const start = Date.now();
  const userId = req.userId;
  const regex = new RegExp(q, 'i');
  let results = [];
  const types = type === 'all' ? ['document', 'note', 'summary', 'flashcard', 'chat'] : [type];

  // ─── Search Documents ───
  if (types.includes('document')) {
    const docs = await Document.find({
      userId,
      $or: [
        { displayName: regex },
        { originalName: regex },
        { category: regex }
      ]
    });
    docs.forEach(doc => {
      results.push({
        type: 'document',
        id: doc._id,
        title: doc.displayName,
        snippet: doc.category || '',
        score: 0,
        url: `/documents`,
        data: doc,
        source: 'Document'
      });
    });
  }

  // ─── Search Notes ───
  if (types.includes('note')) {
    const notes = await Note.find({
      userId,
      $or: [
        { title: regex },
        { content: regex },
        { category: regex },
        { tags: regex }
      ]
    });
    notes.forEach(note => {
      const plainContent = note.content.replace(/<[^>]+>/g, '');
      const snippet = plainContent.slice(0, 150);
      results.push({
        type: 'note',
        id: note._id,
        title: note.title,
        snippet: snippet + (plainContent.length > 150 ? '...' : ''),
        score: 0,
        url: `/notes/view/${note._id}`,
        data: note,
        source: 'Note'
      });
    });
  }

  // ─── Search AI Summaries ───
  if (types.includes('summary')) {
    const summaries = await Summary.find({
      userId,
      $or: [
        { summaryTitle: regex },
        { summaryText: regex },
        { keywords: regex }
      ]
    });
    summaries.forEach(sum => {
      const snippet = sum.summaryText.slice(0, 150);
      results.push({
        type: 'summary',
        id: sum._id,
        title: sum.summaryTitle,
        snippet: snippet + (sum.summaryText.length > 150 ? '...' : ''),
        score: 0,
        url: `/summary/view/${sum._id}`,
        data: sum,
        source: 'AI Summary'
      });
    });
  }

  // ─── Search Flashcards ───
  if (types.includes('flashcard')) {
    const flashcards = await Flashcard.find({
      userId,
      $or: [
        { question: regex },
        { answer: regex },
        { category: regex },
        { tags: regex }
      ]
    });
    flashcards.forEach(card => {
      const snippet = card.question + ' - ' + card.answer.slice(0, 80);
      results.push({
        type: 'flashcard',
        id: card._id,
        title: card.question,
        snippet: snippet + (card.answer.length > 80 ? '...' : ''),
        score: 0,
        url: `/flashcards`,
        data: card,
        source: 'Flashcard'
      });
    });
  }

  // ─── Search Chats ───
  if (types.includes('chat')) {
    const conversations = await Conversation.find({
      userId,
      'messages.content': regex
    });
    conversations.forEach(conv => {
      const matchedMsg = conv.messages.find(m => m.content.match(regex));
      if (matchedMsg) {
        const snippet = matchedMsg.content.slice(0, 150);
        results.push({
          type: 'chat',
          id: conv._id,
          title: conv.title || 'Chat',
          snippet: snippet + (matchedMsg.content.length > 150 ? '...' : ''),
          score: 0,
          url: `/chat`,
          data: conv,
          source: 'Chat'
        });
      }
    });
  }

  // ─── Apply Filters ───
  if (favorite === 'true') {
    results = results.filter(r => {
      if (r.type === 'document') return r.data.isFavorite;
      if (r.type === 'note') return r.data.favorite;
      if (r.type === 'flashcard') return r.data.favorite;
      if (r.type === 'summary') return r.data.isFavorite;
      return false;
    });
  }

  if (tag) {
    const tagRegex = new RegExp(tag, 'i');
    results = results.filter(r => {
      if (r.type === 'note') return r.data.tags && r.data.tags.some(t => t.match(tagRegex));
      if (r.type === 'flashcard') return r.data.tags && r.data.tags.some(t => t.match(tagRegex));
      if (r.type === 'document') return r.data.category && r.data.category.match(tagRegex);
      if (r.type === 'summary') return r.data.keywords && r.data.keywords.some(k => k.match(tagRegex));
      return false;
    });
  }

  // ─── Score & Rank ───
  results.forEach(r => {
    let score = 0;
    const fields = [];
    if (r.type === 'document') {
      fields.push(r.data.displayName, r.data.originalName, r.data.category);
    } else if (r.type === 'note') {
      fields.push(r.data.title, r.data.content, r.data.category, ...(r.data.tags || []));
    } else if (r.type === 'summary') {
      fields.push(r.data.summaryTitle, r.data.summaryText, ...(r.data.keywords || []));
    } else if (r.type === 'flashcard') {
      fields.push(r.data.question, r.data.answer, r.data.category, ...(r.data.tags || []));
    } else if (r.type === 'chat') {
      fields.push(r.snippet);
    }
    fields.forEach(f => {
      if (f && f.match(regex)) score++;
    });
    r.score = score;
  });

  results.sort((a, b) => b.score - a.score || new Date(b.data.createdAt) - new Date(a.data.createdAt));
  const limited = results.slice(0, 20);

  // ─── AI Answer Generation ───
  let aiAnswer = null;
  if (limited.length > 0 && q.length > 3) {
    try {
      const context = limited.slice(0, 3).map(r => {
        if (r.type === 'note') return r.data.content.replace(/<[^>]+>/g, '');
        if (r.type === 'summary') return r.data.summaryText;
        if (r.type === 'flashcard') return `Q: ${r.data.question}\nA: ${r.data.answer}`;
        if (r.type === 'document') return r.data.displayName + ' ' + (r.data.category || '');
        if (r.type === 'chat') return r.snippet;
        return '';
      }).join('\n\n');
      const answer = await chatWithDocument(context, q, []);
      aiAnswer = { text: answer, confidence: 0.9 };
    } catch (error) {
      console.error('AI answer error:', error);
    }
  }

  // ─── Suggestions ─── (we'll generate from query expansion)
  const suggestions = []; // could be implemented with AI or static

  // ─── Analytics ───
  const analytics = {
    total: results.length,
    time: ((Date.now() - start) / 1000).toFixed(2),
    confidence: aiAnswer ? 0.9 : 0
  };

  res.json({ results: limited, aiAnswer, suggestions, analytics });
};