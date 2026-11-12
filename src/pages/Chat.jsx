import "./Chat.css";
import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import {
  FaPaperPlane,
  FaMicrophone,
  FaVolumeUp,
  FaVolumeMute,
  FaCopy,
  FaStar,
  FaRegStar,
  FaTrash,
  FaFileAlt,
  FaPlus,
  FaRobot,
  FaSync,
  FaDownload,
  FaBook,
  FaBrain,
  FaListUl,
  FaQuestionCircle,
  FaGraduationCap,
  FaClock,
  FaFire,
  FaSearch,
  FaThumbtack,
  FaShareAlt,
  FaSun,
  FaMoon,
  FaTimes,
  FaChevronRight,
  FaUpload,
  FaPaperclip,
  FaSmile,
  FaStop,
  FaKeyboard,
  FaInfoCircle,
} from "react-icons/fa";

function Chat() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const [documents, setDocuments] = useState([]);
  const [selectedDocId, setSelectedDocId] = useState("");
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [explanationLevel, setExplanationLevel] = useState("intermediate");
  const [showRightPanel, setShowRightPanel] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [theme, setTheme] = useState("light");
  const [isTyping, setIsTyping] = useState(false);
  const [estimatedTime, setEstimatedTime] = useState(null);
  const [stats, setStats] = useState({
    questions: 0,
    avgTime: 0,
    totalChats: 0,
  });

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Suggested questions
  const suggestions = [
    { icon: <FaBook />, label: "Summarize this document" },
    { icon: <FaBrain />, label: "Generate Flashcards" },
    { icon: <FaListUl />, label: "List all definitions" },
    { icon: <FaQuestionCircle />, label: "Important interview questions" },
    { icon: <FaGraduationCap />, label: "Explain Chapter 3" },
    { icon: <FaRobot />, label: "Key concepts" },
  ];

  // Prompt templates
  const promptTemplates = [
    "Summarize",
    "Explain",
    "Generate Quiz",
    "Flashcards",
    "MCQs",
    "Definitions",
  ];

  // AI action buttons
  const aiActions = [
    { label: "Generate Summary", icon: <FaBook />, action: "summary" },
    { label: "Generate Flashcards", icon: <FaBrain />, action: "flashcards" },
    { label: "Create Notes", icon: <FaListUl />, action: "notes" },
    { label: "Generate Quiz", icon: <FaQuestionCircle />, action: "quiz" },
  ];

  // ─── Fetch documents ───
  const fetchDocuments = useCallback(async () => {
    const res = await fetch("http://localhost:5000/api/documents", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (data.success) {
      setDocuments(data.documents);
      if (data.documents.length > 0) {
        setSelectedDocId(data.documents[0]._id);
        setSelectedDoc(data.documents[0]);
      }
    }
  }, [token]);

  // ─── Fetch conversations ───
  const fetchConversations = useCallback(async () => {
    const res = await fetch("http://localhost:5000/api/chat/conversations", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (data.success) {
      // Fetch favorite status for each conversation
      const convWithFav = await Promise.all(
        data.conversations.map(async (conv) => {
          const favRes = await fetch(
            `http://localhost:5000/api/favorites/check?itemType=chat&itemId=${conv._id}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          const favData = await favRes.json();
          return { ...conv, isFavorite: favData.success && favData.favorite ? true : false };
        })
      );
      setConversations(convWithFav);
    }
  }, [token]);

  // ─── Create new conversation ───
  const createConversation = useCallback(async () => {
    if (!selectedDocId) return alert("Please select a document first.");
    const res = await fetch("http://localhost:5000/api/chat/conversations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ documentId: selectedDocId }),
    });
    const data = await res.json();
    if (data.success) {
      setCurrentConversation(data.conversation);
      setMessages([]);
      setShowSuggestions(true);
      fetchConversations();
    }
  }, [selectedDocId, token, fetchConversations]);

  // ─── Load conversation ───
  const loadConversation = async (conv) => {
    setCurrentConversation(conv);
    setMessages(conv.messages);
    setSelectedDocId(conv.documentId._id);
    setSelectedDoc(conv.documentId);
    setShowSuggestions(false);
  };

  // ─── Send message ───
  const sendMessage = useCallback(
    async (customInput = null) => {
      const messageText = customInput !== null ? customInput : input.trim();
      if (!messageText || !currentConversation) {
        if (!currentConversation) alert("Please create a new chat first.");
        return;
      }
      setInput("");
      setShowSuggestions(false);
      setMessages((prev) => [...prev, { role: "user", content: messageText }]);
      setLoading(true);
      setIsTyping(true);
      const startTime = Date.now();

      try {
        const res = await fetch("http://localhost:5000/api/chat/send", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            conversationId: currentConversation._id,
            message: messageText,
          }),
        });
        const data = await res.json();
        if (data.success) {
          setMessages((prev) => [...prev, data.message]);
          const elapsed = (Date.now() - startTime) / 1000;
          const newStats = {
            questions: stats.questions + 1,
            avgTime:
              (stats.avgTime * stats.questions + elapsed) /
              (stats.questions + 1),
            totalChats: stats.totalChats + (messages.length === 0 ? 1 : 0),
          };
          setStats(newStats);
          localStorage.setItem("chatStats", JSON.stringify(newStats));
          fetchConversations();
        } else {
          alert(data.message);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
        setIsTyping(false);
        setEstimatedTime(null);
      }
    },
    [
      input,
      currentConversation,
      token,
      messages.length,
      stats,
      fetchConversations,
    ],
  );

  // ─── Toggle Favorite Conversation ───
  const toggleFavoriteConversation = async (convId, currentFavorite) => {
    try {
      if (!currentFavorite) {
        // Add to favorites
        const favRes = await fetch("http://localhost:5000/api/favorites", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ itemType: "chat", itemId: convId }),
        });
        if (!favRes.ok) throw new Error("Failed to add to favorites");
      } else {
        // Remove from favorites: find the favorite ID first
        const checkRes = await fetch(
          `http://localhost:5000/api/favorites/check?itemType=chat&itemId=${convId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const checkData = await checkRes.json();
        if (checkData.success && checkData.favorite) {
          const delRes = await fetch(
            `http://localhost:5000/api/favorites/${checkData.favorite._id}`,
            {
              method: "DELETE",
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          if (!delRes.ok) throw new Error("Failed to remove from favorites");
        }
      }

      // Update local state
      setConversations(
        conversations.map((conv) =>
          conv._id === convId
            ? { ...conv, isFavorite: !currentFavorite }
            : conv
        )
      );
    } catch (err) {
      console.error("Favorite error:", err);
      alert("Failed to update favorite. Please try again.");
    }
  };

  // ─── Copy message ───
  const copyMessage = (text) => {
    navigator.clipboard.writeText(text);
    // Could show a toast instead of alert
  };

  // ─── Speak message ───
  const speakMessage = (text) => {
    if (!voiceSupported) return alert("Voice not supported.");
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.onend = () => setSpeaking(false);
    window.speechSynthesis.speak(utterance);
    setSpeaking(true);
  };

  // ─── Delete conversation ───
  const deleteConversation = async (id) => {
    if (!window.confirm("Delete this conversation?")) return;
    const res = await fetch(
      `http://localhost:5000/api/chat/conversations/${id}`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    if (res.ok) {
      fetchConversations();
      if (currentConversation?._id === id) {
        setCurrentConversation(null);
        setMessages([]);
        setShowSuggestions(true);
      }
    }
  };

  // ─── Regenerate last response ───
  const regenerate = async () => {
    const lastUserMsg = [...messages].reverse().find((m) => m.role === "user");
    if (!lastUserMsg) return;
    const newMessages = messages.slice(0, -1);
    setMessages(newMessages);
    await sendMessage(lastUserMsg.content);
  };

  // ─── Voice input ───
  const startVoice = () => {
    if (!("webkitSpeechRecognition" in window)) {
      return alert("Voice input not supported in this browser.");
    }
    const recognition = new window.webkitSpeechRecognition();
    recognition.lang = "en-US";
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      inputRef.current?.focus();
    };
    recognition.start();
  };

  // ─── Download chat ───
  const downloadChat = () => {
    if (!messages.length) return alert("No messages to download.");
    const text = messages
      .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
      .join("\n\n");
    const blob = new Blob([text], { type: "text/plain" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `chat_${currentConversation?.title || "conversation"}.txt`;
    link.click();
  };

  // ─── Handle suggestion click ───
  const handleSuggestion = (text) => {
    setInput(text);
    inputRef.current?.focus();
  };

  // ─── Handle prompt template click ───
  const handleTemplate = (template) => {
    setInput(`Explain this topic in ${explanationLevel} level: ${template}`);
    inputRef.current?.focus();
  };

  // ─── Handle AI action click ───
  const handleAIAction = (action) => {
    const actions = {
      summary: "Summarize this document",
      flashcards: "Generate flashcards from this document",
      notes: "Create notes from this document",
      quiz: "Generate quiz questions from this document",
    };
    if (actions[action]) {
      setInput(actions[action]);
      inputRef.current?.focus();
    }
  };

  // ─── Render document info ───
  const renderDocInfo = () => {
    if (!selectedDoc) return null;
    return (
      <div className="doc-info-card">
        <div className="doc-info-icon">
          <FaFileAlt />
        </div>
        <div className="doc-info-details">
          <h4>{selectedDoc.displayName}</h4>
          <div className="doc-info-meta">
            <span>📄 {Math.ceil(selectedDoc.fileSize / 1024 / 1024)} MB</span>
            <span>🟢 Ready</span>
            <span>
              📅 {new Date(selectedDoc.uploadDate).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>
    );
  };

  // ─── UseEffects ───
  useEffect(() => {
    if (window.speechSynthesis) setVoiceSupported(true);
    fetchDocuments();
    fetchConversations();
    const savedStats = localStorage.getItem("chatStats");
    if (savedStats) setStats(JSON.parse(savedStats));
  }, [fetchDocuments, fetchConversations]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        sendMessage();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        document.getElementById("search-conversations")?.focus();
      }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "N") {
        e.preventDefault();
        createConversation();
      }
      if (e.key === "Escape" && loading) {
        setLoading(false);
        setIsTyping(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [sendMessage, loading, createConversation]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className={`chat-page ${theme}`}>
      {/* ─── Left Sidebar ─── */}
      <aside className="chat-sidebar">
        <div className="chat-sidebar-header">
          <h2>💬 AI Chats</h2>
          <button className="new-chat-btn" onClick={createConversation}>
            <FaPlus /> New
          </button>
        </div>

        <div className="chat-sidebar-search">
          <FaSearch />
          <input
            id="search-conversations"
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="chat-doc-selector">
          <select
            value={selectedDocId}
            onChange={(e) => {
              setSelectedDocId(e.target.value);
              const doc = documents.find((d) => d._id === e.target.value);
              setSelectedDoc(doc);
            }}
          >
            <option value="">Select Document</option>
            {documents.map((d) => (
              <option key={d._id} value={d._id}>
                {d.displayName}
              </option>
            ))}
          </select>
        </div>

        <div className="chat-conversations">
          {conversations
            .filter((conv) =>
              conv.title.toLowerCase().includes(searchQuery.toLowerCase()),
            )
            .map((conv) => (
              <div
                key={conv._id}
                className={`chat-conv-item ${currentConversation?._id === conv._id ? "active" : ""}`}
                onClick={() => loadConversation(conv)}
              >
                <div className="conv-info">
                  <span className="conv-title">{conv.title}</span>
                  <span className="conv-doc">
                    {conv.documentId?.displayName}
                  </span>
                </div>
                <div className="conv-actions">
                  <button
                    className="conv-fav"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavoriteConversation(conv._id, conv.isFavorite);
                    }}
                    title={conv.isFavorite ? "Unfavorite" : "Favorite"}
                  >
                    {conv.isFavorite ? (
                      <FaStar style={{ color: "#f59e0b" }} />
                    ) : (
                      <FaRegStar />
                    )}
                  </button>
                  <button
                    className="conv-pin"
                    onClick={(e) => e.stopPropagation()}
                    title="Pin"
                  >
                    <FaThumbtack />
                  </button>
                  <button
                    className="conv-delete"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteConversation(conv._id);
                    }}
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>
            ))}
        </div>

        <div className="chat-sidebar-footer">
          <div className="chat-stats">
            <span>
              <FaQuestionCircle /> {stats.questions}
            </span>
            <span>
              <FaClock /> {stats.avgTime.toFixed(1)}s
            </span>
            <span>
              <FaFire /> {stats.totalChats}
            </span>
          </div>
          <div className="sidebar-actions">
            <button className="export-all-btn" onClick={downloadChat}>
              <FaDownload /> Export All
            </button>
            <button
              className="clear-history-btn"
              onClick={() => {
                if (window.confirm("Clear all chat history?")) {
                  // Implement clear history
                }
              }}
            >
              Clear History
            </button>
          </div>
        </div>
      </aside>

      {/* ─── Main Chat ─── */}
      <main className="chat-main">
        {!currentConversation ? (
          <div className="chat-empty">
            <div className="empty-icon">
              <FaRobot style={{ fontSize: "80px", color: "#2563eb" }} />
            </div>
            <h2>Hello Sabaris 👋</h2>
            <p>Ready to explore your knowledge today?</p>
            <div className="suggestions-empty">
              {suggestions.map((s, i) => (
                <span
                  key={i}
                  className="suggestion-chip"
                  onClick={() => handleSuggestion(s.label)}
                >
                  {s.icon} {s.label}
                </span>
              ))}
            </div>
            <button
              className="upload-doc-btn"
              onClick={() => navigate("/documents")}
            >
              <FaPlus /> Upload Document
            </button>
          </div>
        ) : (
          <>
            {/* ─── Header ─── */}
            <div className="chat-header">
              <div className="chat-header-left">
                <h1>🤖 AI Knowledge Assistant</h1>
                <p>Ask anything about your uploaded documents.</p>
              </div>
              <div className="chat-header-right">
                {renderDocInfo()}
                <button
                  className="header-btn"
                  onClick={() => setShowRightPanel(!showRightPanel)}
                >
                  <FaInfoCircle />
                </button>
                <button
                  className="header-btn"
                  onClick={() => setTheme(theme === "light" ? "dark" : "light")}
                >
                  {theme === "light" ? <FaMoon /> : <FaSun />}
                </button>
                <button
                  className="header-btn"
                  onClick={() => navigate("/documents")}
                >
                  <FaUpload />
                </button>
                <button className="header-btn" onClick={downloadChat}>
                  <FaDownload />
                </button>
                <button
                  className="header-btn"
                  onClick={() => setShowShortcuts(!showShortcuts)}
                >
                  <FaKeyboard />
                </button>
              </div>
            </div>

            {/* ─── Suggested Questions ─── */}
            {showSuggestions && messages.length === 0 && (
              <div className="chat-suggestions">
                <h4>Suggested Questions</h4>
                <div className="suggestions-grid">
                  {suggestions.map((s, i) => (
                    <button
                      key={i}
                      className="suggestion-btn"
                      onClick={() => handleSuggestion(s.label)}
                    >
                      {s.icon} {s.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ─── Chat Messages ─── */}
            <div className="chat-messages">
              {messages.map((msg, idx) => (
                <div key={idx} className={`message ${msg.role}`}>
                  <div className="message-avatar">
                    {msg.role === "user" ? "👤" : "🤖"}
                  </div>
                  <div className="message-content-wrapper">
                    <div className="message-content">
                      {msg.role === "assistant" ? (
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            code({
                              node,
                              inline,
                              className,
                              children,
                              ...props
                            }) {
                              const match = /language-(\w+)/.exec(
                                className || "",
                              );
                              return !inline && match ? (
                                <SyntaxHighlighter
                                  style={vscDarkPlus}
                                  language={match[1]}
                                  PreTag="div"
                                  {...props}
                                >
                                  {String(children).replace(/\n$/, "")}
                                </SyntaxHighlighter>
                              ) : (
                                <code className={className} {...props}>
                                  {children}
                                </code>
                              );
                            },
                          }}
                        >
                          {msg.content}
                        </ReactMarkdown>
                      ) : (
                        <p>{msg.content}</p>
                      )}
                      <div className="message-meta">
                        <span className="message-time">
                          {new Date().toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>
                    <div className="message-actions">
                      <button
                        onClick={() => copyMessage(msg.content)}
                        title="Copy"
                      >
                        <FaCopy />
                      </button>
                      <button
                        onClick={() => speakMessage(msg.content)}
                        title="Listen"
                      >
                        {speaking ? <FaVolumeMute /> : <FaVolumeUp />}
                      </button>
                      {msg.role === "assistant" && (
                        <>
                          <button onClick={regenerate} title="Regenerate">
                            <FaSync />
                          </button>
                          <button title="Bookmark">
                            <FaRegStar />
                          </button>
                          <button title="Like">👍</button>
                          <button title="Dislike">👎</button>
                          <button title="Share">
                            <FaShareAlt />
                          </button>
                          <button title="Expand">
                            <FaChevronRight />
                          </button>
                        </>
                      )}
                    </div>
                    {msg.role === "assistant" && (
                      <div className="assistant-actions">
                        {aiActions.map((action) => (
                          <button
                            key={action.action}
                            className="ai-action-btn"
                            onClick={() => handleAIAction(action.action)}
                          >
                            {action.icon} {action.label}
                          </button>
                        ))}
                      </div>
                    )}
                    {msg.role === "assistant" && (
                      <div className="source-reference">
                        <span>📄 Source: Page 12, 15, 18</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="message assistant">
                  <div className="message-avatar">🤖</div>
                  <div className="message-content-wrapper">
                    <div className="message-content typing">
                      <span>AI is thinking</span>
                      <span className="dot">.</span>
                      <span className="dot">.</span>
                      <span className="dot">.</span>
                      {estimatedTime && (
                        <span className="est-time"> (~{estimatedTime}s)</span>
                      )}
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* ─── Prompt Templates ─── */}
            <div className="prompt-templates">
              {promptTemplates.map((t, i) => (
                <button
                  key={i}
                  className="template-btn"
                  onClick={() => handleTemplate(t)}
                >
                  {t}
                </button>
              ))}
              <div className="explanation-level">
                <select
                  value={explanationLevel}
                  onChange={(e) => setExplanationLevel(e.target.value)}
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="expert">Expert</option>
                </select>
              </div>
            </div>

            {/* ─── Input Area ─── */}
            <div className="chat-input-area">
              <div className="input-left-actions">
                <button className="input-action-btn" title="Upload Document">
                  <FaUpload />
                </button>
                <button
                  className="input-action-btn"
                  onClick={startVoice}
                  title="Voice Input"
                >
                  <FaMicrophone />
                </button>
                <button className="input-action-btn" title="Attach File">
                  <FaPaperclip />
                </button>
                <button className="input-action-btn" title="Emoji">
                  <FaSmile />
                </button>
              </div>
              <input
                ref={inputRef}
                type="text"
                placeholder="Ask anything about your documents..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                disabled={loading}
                className="chat-input"
              />
              <div className="input-right-actions">
                {loading && (
                  <button
                    className="stop-btn"
                    onClick={() => {
                      setLoading(false);
                      setIsTyping(false);
                    }}
                  >
                    <FaStop />
                  </button>
                )}
                <button
                  className="send-btn"
                  onClick={() => sendMessage()}
                  disabled={loading || !input.trim()}
                >
                  <FaPaperPlane />
                </button>
              </div>
            </div>

            {/* ─── Keyboard Shortcuts Modal ─── */}
            {showShortcuts && (
              <div
                className="shortcuts-modal"
                onClick={() => setShowShortcuts(false)}
              >
                <div
                  className="shortcuts-content"
                  onClick={(e) => e.stopPropagation()}
                >
                  <h3>Keyboard Shortcuts</h3>
                  <ul>
                    <li>
                      <kbd>Ctrl+Enter</kbd> Send message
                    </li>
                    <li>
                      <kbd>Ctrl+K</kbd> Search conversations
                    </li>
                    <li>
                      <kbd>Ctrl+Shift+N</kbd> New chat
                    </li>
                    <li>
                      <kbd>Esc</kbd> Stop AI generation
                    </li>
                  </ul>
                  <button onClick={() => setShowShortcuts(false)}>Close</button>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* ─── Right Context Panel ─── */}
      {showRightPanel && currentConversation && (
        <aside className="chat-right-panel">
          <div className="right-panel-header">
            <h3>Document Context</h3>
            <button onClick={() => setShowRightPanel(false)}>
              <FaTimes />
            </button>
          </div>
          <div className="right-panel-content">
            <div className="doc-context">
              <h4>{selectedDoc?.displayName}</h4>
              <p>
                <strong>Uploaded:</strong>{" "}
                {selectedDoc
                  ? new Date(selectedDoc.uploadDate).toLocaleDateString()
                  : "N/A"}
              </p>
              <p>
                <strong>Pages:</strong> ~10
              </p>
              <p>
                <strong>Reading Time:</strong> ~5 min
              </p>
              <p>
                <strong>AI Confidence:</strong> 92%
              </p>
              <div className="doc-tags">
                <span className="tag">AI Ready</span>
                <span className="tag">{selectedDoc?.category}</span>
              </div>
              <div className="quick-actions">
                <button onClick={() => handleAIAction("summary")}>
                  <FaBrain /> Summary
                </button>
                <button onClick={() => handleAIAction("flashcards")}>
                  <FaBook /> Flashcards
                </button>
                <button onClick={() => handleAIAction("quiz")}>
                  <FaQuestionCircle /> Quiz
                </button>
                <button onClick={() => navigate("/notes/create")}>
                  <FaListUl /> Notes
                </button>
              </div>
            </div>
            <div className="chat-statistics">
              <h4>Chat Statistics</h4>
              <p>Questions: {stats.questions}</p>
              <p>Avg Response: {stats.avgTime.toFixed(1)}s</p>
              <p>Total Chats: {stats.totalChats}</p>
            </div>
          </div>
        </aside>
      )}

      {/* ─── Floating AI Assistant ─── */}
      <div className="floating-ai">
        <FaRobot />
        <span className="ai-status">
          {loading ? "Thinking..." : speaking ? "Speaking..." : "Ready"}
        </span>
      </div>
    </div>
  );
}

export default Chat;