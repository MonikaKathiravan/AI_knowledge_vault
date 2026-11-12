import "./SmartSearch.css";
import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaSearch,
  FaMicrophone,
  FaTimes,
  FaFileAlt,
  FaStickyNote,
  FaBrain,
  FaBook,
  FaComments,
  FaStar,
  FaRegStar,
  FaFilter,
  FaCalendarAlt,
  FaTag,
  FaArrowRight,
  FaRobot,
  FaClock,
  FaFire,
} from "react-icons/fa";

function SmartSearch() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [aiAnswer, setAiAnswer] = useState(null);
  const [analytics, setAnalytics] = useState({ total: 0, time: 0, confidence: 0 });
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filterType, setFilterType] = useState("all");
  const [filterFavorite, setFilterFavorite] = useState(false);
  const [filterTag, setFilterTag] = useState("");
  const [recentSearches, setRecentSearches] = useState([]);
  const [trendingTopics, setTrendingTopics] = useState([
    "Java", "Cyber Security", "AI", "Cloud Computing", "React", "Database", "Networking"
  ]);
  const [showVoice, setShowVoice] = useState(false);
  const inputRef = useRef(null);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const placeholders = [
    'Search "Explain HashMap"',
    'Search "Java Interview Questions"',
    'Search "Summarize OS Notes"',
    'Search "Generate Flashcards"',
  ];

  // ─── Animated placeholder ───
  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % placeholders.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // ─── Load recent searches ───
  useEffect(() => {
    const saved = localStorage.getItem("recentSearches");
    if (saved) setRecentSearches(JSON.parse(saved));
  }, []);

  // ─── Perform search ───
  const performSearch = useCallback(async (searchQuery) => {
    if (!searchQuery.trim()) {
      setResults([]);
      setAiAnswer(null);
      return;
    }
    setLoading(true);
    try {
      const params = new URLSearchParams({
        q: searchQuery,
        type: filterType,
        favorite: filterFavorite,
        tag: filterTag,
      });
      const res = await fetch(`http://localhost:5000/api/search?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.results) {
        setResults(data.results);
        setAiAnswer(data.aiAnswer);
        setAnalytics(data.analytics);
        setSuggestions(data.suggestions || []);
        // Save recent search
        if (searchQuery.trim()) {
          const updated = [searchQuery, ...recentSearches.filter(s => s !== searchQuery)].slice(0, 10);
          setRecentSearches(updated);
          localStorage.setItem("recentSearches", JSON.stringify(updated));
        }
      }
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setLoading(false);
    }
  }, [token, filterType, filterFavorite, filterTag, recentSearches]);

  // ─── Handle search input ───
  const handleSearch = (e) => {
    e.preventDefault();
    performSearch(query);
    setShowSuggestions(false);
  };

  // ─── Handle suggestion click ───
  const handleSuggestionClick = (suggestion) => {
    setQuery(suggestion);
    performSearch(suggestion);
    setShowSuggestions(false);
  };

  // ─── Voice search ───
  const startVoice = () => {
    if (!("webkitSpeechRecognition" in window)) {
      return alert("Voice input not supported.");
    }
    setShowVoice(true);
    const recognition = new window.webkitSpeechRecognition();
    recognition.lang = "en-US";
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setQuery(transcript);
      performSearch(transcript);
      setShowVoice(false);
    };
    recognition.onerror = () => setShowVoice(false);
    recognition.start();
  };

  // ─── Keyboard shortcut (Ctrl+K) ───
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // ─── Get icon for result type ───
  const getTypeIcon = (type) => {
    switch (type) {
      case "document": return <FaFileAlt />;
      case "note": return <FaStickyNote />;
      case "summary": return <FaBrain />;
      case "flashcard": return <FaBook />;
      case "chat": return <FaComments />;
      default: return <FaFileAlt />;
    }
  };

  // ─── Render result card ───
  const renderResult = (result) => {
    const isFavorite = result.data.isFavorite || result.data.favorite;
    return (
      <div key={result.id} className="search-result-card">
        <div className="result-header">
          <div className="result-type">
            {getTypeIcon(result.type)}
            <span>{result.source}</span>
          </div>
          <div className="result-actions">
            {isFavorite && <FaStar className="favorite" />}
            <span className="result-score">Match {result.score}%</span>
          </div>
        </div>
        <h3 className="result-title">{result.title}</h3>
        <p className="result-snippet">{result.snippet}</p>
        <div className="result-footer">
          <button className="result-open-btn" onClick={() => navigate(result.url)}>
            Open <FaArrowRight />
          </button>
          <button className="result-action-btn" title="View">👁</button>
          <button className="result-action-btn" title="AI Summary">🧠</button>
          <button className="result-action-btn" title="Chat">💬</button>
          <button className="result-action-btn" title="Flashcards">📚</button>
        </div>
      </div>
    );
  };

  return (
    <div className="smart-search-page">
      {/* ─── Premium Hero Section ─── */}
      <div className="search-hero">
        <div className="hero-glow"></div>
        <div className="hero-content">
          <h1>🔍 AI Smart Search</h1>
          <p>Search anything from your personal knowledge base using Artificial Intelligence.</p>
          <div className="hero-chips">
            <span>📄 Documents</span>
            <span>📝 Notes</span>
            <span>🧠 AI Summaries</span>
            <span>💬 AI Chats</span>
            <span>🃏 Flashcards</span>
          </div>
        </div>
      </div>

      {/* ─── Search Section with Animated Placeholder ─── */}
      <div className="search-section">
        <form onSubmit={handleSearch} className="search-form">
          <div className="search-input-wrapper">
            <FaSearch className="search-icon" />
            <input
              ref={inputRef}
              type="text"
              placeholder={placeholders[placeholderIndex]}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              className="search-input"
            />
            {query && (
              <button type="button" className="clear-btn" onClick={() => setQuery("")}>
                <FaTimes />
              </button>
            )}
            <button type="button" className="voice-btn" onClick={startVoice} title="Voice Search">
              <FaMicrophone />
              {showVoice && <span className="voice-indicator">🎙</span>}
            </button>
            <button type="button" className="ocr-btn" title="OCR Search">📷</button>
            <button type="button" className="ai-search-btn" title="AI Search">⚡</button>
            <button type="submit" className="search-submit-btn">
              Search
            </button>
          </div>
          <div className="search-shortcut">⌘K</div>
          {showSuggestions && (suggestions.length > 0 || recentSearches.length > 0) && (
            <div className="search-suggestions">
              {suggestions.map((s, i) => (
                <div key={i} className="suggestion-item" onClick={() => handleSuggestionClick(s)}>
                  <FaSearch /> {s}
                </div>
              ))}
              {recentSearches.length > 0 && (
                <>
                  <div className="suggestion-divider">Recent Searches</div>
                  {recentSearches.slice(0, 3).map((s, i) => (
                    <div key={i} className="suggestion-item" onClick={() => handleSuggestionClick(s)}>
                      <FaClock /> {s}
                    </div>
                  ))}
                </>
              )}
            </div>
          )}
        </form>

        {/* ─── AI Suggestions ─── */}
        <div className="ai-suggestions">
          <span>Try asking</span>
          <button onClick={() => handleSuggestionClick("Explain SQL Injection")}>Explain SQL Injection</button>
          <button onClick={() => handleSuggestionClick("Generate Flashcards")}>Generate Flashcards</button>
          <button onClick={() => handleSuggestionClick("List Interview Questions")}>List Interview Questions</button>
          <button onClick={() => handleSuggestionClick("Summarize Chapter 3")}>Summarize Chapter 3</button>
          <button onClick={() => handleSuggestionClick("Explain TCP")}>Explain TCP</button>
        </div>
      </div>

      {/* ─── Filters ─── */}
      <div className="search-filters">
        <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
          <option value="all">All Types</option>
          <option value="document">Documents</option>
          <option value="note">Notes</option>
          <option value="summary">Summaries</option>
          <option value="flashcard">Flashcards</option>
          <option value="chat">Chats</option>
        </select>
        <label className="filter-label">
          <input type="checkbox" checked={filterFavorite} onChange={() => setFilterFavorite(!filterFavorite)} />
          Favorites
        </label>
        <input
          type="text"
          placeholder="Tag filter"
          value={filterTag}
          onChange={(e) => setFilterTag(e.target.value)}
          className="tag-filter"
        />
        <button className="search-btn" onClick={() => performSearch(query)}>Search</button>
      </div>

      {/* ─── Trending Topics ─── */}
      {!query && (
        <div className="trending-section">
          <h3>🔥 Trending Topics</h3>
          <div className="trending-list">
            {trendingTopics.map((topic, i) => (
              <button key={i} className="trending-chip" onClick={() => handleSuggestionClick(topic)}>
                {topic}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ─── Results ─── */}
      {loading && (
        <div className="search-loading">
          <div className="loading-spinner"></div>
          <p>Searching your knowledge...</p>
        </div>
      )}

      {!loading && results.length === 0 && query && (
        <div className="empty-state">
          <div className="empty-icon">🔍</div>
          <h2>No results found</h2>
          <p>Try adjusting your search or ask a different question.</p>
        </div>
      )}

      {!loading && results.length > 0 && (
        <>
          {/* ─── AI Answer Card ─── */}
          {aiAnswer && (
            <div className="ai-answer-card">
              <div className="ai-answer-header">
                <FaRobot className="ai-icon" />
                <span>AI Answer</span>
                <span className="ai-confidence">Confidence: {Math.round(aiAnswer.confidence * 100)}%</span>
              </div>
              <div className="ai-answer-content">{aiAnswer.text}</div>
              <div className="ai-answer-actions">
                <button>📋 Copy</button>
                <button>🔊 Read</button>
                <button>💬 Chat</button>
              </div>
            </div>
          )}

          {/* ─── Analytics ─── */}
          <div className="search-analytics">
            <span>Results: {analytics.total}</span>
            <span>Time: {analytics.time}s</span>
            <span>AI Confidence: {Math.round(analytics.confidence * 100)}%</span>
          </div>

          {/* ─── Results Grid ─── */}
          <div className="results-grid">
            {results.map(renderResult)}
          </div>
        </>
      )}

      {/* ─── Recent Searches ─── */}
      {!query && recentSearches.length > 0 && (
        <div className="recent-searches">
          <h3>🕒 Recent Searches</h3>
          <div className="recent-list">
            {recentSearches.map((s, i) => (
              <button key={i} className="recent-chip" onClick={() => handleSuggestionClick(s)}>
                {s}
              </button>
            ))}
            <button className="clear-recent" onClick={() => { setRecentSearches([]); localStorage.removeItem("recentSearches"); }}>
              Clear
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default SmartSearch;