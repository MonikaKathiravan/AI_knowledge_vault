import "./Summaries.css";
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaSearch,
  FaStar,
  FaRegStar,
  FaTrash,
  FaEye,
  FaDownload,
  FaCopy,
  FaFileAlt,
  FaStickyNote,
  FaClock,
  FaTimes,
} from "react-icons/fa";

function Summaries() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const [summaries, setSummaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [showFavorites, setShowFavorites] = useState(false);

  // ─── Fetch summaries ───
  const fetchSummaries = useCallback(async () => {
    try {
      const res = await fetch("http://localhost:5000/api/summary/user", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setSummaries(data.summaries);
      }
    } catch (error) {
      console.error("Error fetching summaries:", error);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchSummaries();
  }, [fetchSummaries]);

  // ─── Delete ───
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this summary?")) return;
    try {
      const res = await fetch(`http://localhost:5000/api/summary/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setSummaries(summaries.filter((s) => s._id !== id));
      }
    } catch (error) {
      console.error("Delete error:", error);
    }
  };

  // ─── Toggle Favorite (Unified) ───
  const toggleFavorite = async (id) => {
    try {
      // Find the current summary
      const summary = summaries.find((s) => s._id === id);
      if (!summary) return;

      const current = summary.isFavorite;

      // Step 1: Update the summary's own `isFavorite` flag
      const summaryRes = await fetch(`http://localhost:5000/api/summary/favorite/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isFavorite: !current }),
      });
      if (!summaryRes.ok) throw new Error("Failed to update summary favorite");

      // Step 2: Sync with the unified favorites collection
      if (!current) {
        // Add to favorites
        const favRes = await fetch("http://localhost:5000/api/favorites", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ itemType: "summary", itemId: id }),
        });
        if (!favRes.ok) throw new Error("Failed to add to favorites");
      } else {
        // Remove from favorites: find the favorite ID first
        const checkRes = await fetch(
          `http://localhost:5000/api/favorites/check?itemType=summary&itemId=${id}`,
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

      // Update local state only after both operations succeed
      setSummaries(
        summaries.map((s) => (s._id === id ? { ...s, isFavorite: !current } : s))
      );
    } catch (err) {
      console.error("Favorite error:", err);
      alert("Failed to update favorite. Please try again.");
    }
  };

  // ─── View Summary ───
  const handleView = (id) => {
    navigate(`/summary/view/${id}`);
  };

  // ─── Copy summary ───
  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    alert("Summary copied to clipboard!");
  };

  // ─── Download as TXT ───
  const handleDownload = (summary) => {
    const content = `${summary.summaryTitle}\n\n${summary.summaryText}`;
    const blob = new Blob([content], { type: "text/plain" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${summary.summaryTitle || "summary"}.txt`;
    link.click();
  };

  // ─── Filtering & Sorting ───
  const filteredSummaries = summaries.filter((s) => {
    const titleMatch = s.summaryTitle.toLowerCase().includes(searchTerm.toLowerCase());
    const typeMatch = filterType === "all" || s.summaryType === filterType;
    const favMatch = !showFavorites || s.isFavorite;
    return titleMatch && typeMatch && favMatch;
  });

  const sortedSummaries = [...filteredSummaries].sort((a, b) => {
    switch (sortBy) {
      case "newest":
        return new Date(b.createdAt) - new Date(a.createdAt);
      case "oldest":
        return new Date(a.createdAt) - new Date(b.createdAt);
      case "title":
        return a.summaryTitle.localeCompare(b.summaryTitle);
      default:
        return 0;
    }
  });

  // ─── Stats ───
  const totalSummaries = summaries.length;
  const favoriteCount = summaries.filter((s) => s.isFavorite).length;
  const todayCount = summaries.filter((s) => {
    const today = new Date();
    const created = new Date(s.createdAt);
    return created.toDateString() === today.toDateString();
  }).length;

  // ─── Get source name ───
  const getSourceName = (summary) => {
    if (summary.documentId) return summary.documentId.displayName || "Document";
    if (summary.noteId) return summary.noteId.title || "Note";
    return "Unknown source";
  };

  const getSourceIcon = (summary) => {
    if (summary.documentId) return <FaFileAlt />;
    if (summary.noteId) return <FaStickyNote />;
    return <FaFileAlt />;
  };

  const getTypeLabel = (type) => {
    const map = {
      short: "Short",
      medium: "Medium",
      detailed: "Detailed",
      bullet: "Bullet Points",
      paragraph: "Paragraph",
      academic: "Academic",
      technical: "Technical",
      beginner: "Beginner",
    };
    return map[type] || type;
  };

  return (
    <div className="summaries-page">
      {/* ─── HEADER ─── */}
      <div className="summaries-header">
        <div>
          <h1>🧠 AI Summaries</h1>
          <p className="summaries-subtitle">All your AI‑generated summaries in one place.</p>
        </div>
        <div className="summaries-stats">
          <span className="summaries-stat">{totalSummaries} total</span>
          <span className="summaries-stat">⭐ {favoriteCount} favorites</span>
          <span className="summaries-stat">📅 {todayCount} today</span>
        </div>
      </div>

      {/* ─── TOOLBAR ─── */}
      <div className="summaries-toolbar">
        <div className="summaries-search">
          <FaSearch className="summaries-search-icon" />
          <input
            type="text"
            placeholder="Search summaries..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button className="summaries-search-clear" onClick={() => setSearchTerm("")}>
              <FaTimes />
            </button>
          )}
        </div>
        <div className="summaries-filters">
          <select
            className="summaries-filter-select"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="all">All Types</option>
            <option value="short">Short</option>
            <option value="medium">Medium</option>
            <option value="detailed">Detailed</option>
            <option value="bullet">Bullet Points</option>
            <option value="paragraph">Paragraph</option>
            <option value="academic">Academic</option>
            <option value="technical">Technical</option>
            <option value="beginner">Beginner</option>
          </select>
          <select
            className="summaries-filter-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="title">Title</option>
          </select>
          <button
            className={`summaries-filter-btn ${showFavorites ? "active" : ""}`}
            onClick={() => setShowFavorites(!showFavorites)}
          >
            <FaStar /> Favorites
          </button>
        </div>
      </div>

      {/* ─── SUMMARIES LIST ─── */}
      {loading ? (
        <div className="summaries-loading">Loading your summaries...</div>
      ) : sortedSummaries.length === 0 ? (
        <div className="summaries-empty">
          <div className="summaries-empty-icon">🧠</div>
          <h2>No Summaries Yet</h2>
          <p>Generate your first AI summary from a document or note.</p>
          <button className="summaries-empty-btn" onClick={() => navigate("/documents")}>
            Go to Documents
          </button>
        </div>
      ) : (
        <div className="summaries-grid">
          {sortedSummaries.map((summary) => (
            <div key={summary._id} className={`summary-card ${summary.isFavorite ? "favorite" : ""}`}>
              <div className="summary-card-header">
                <div className="summary-card-title">
                  <h3>{summary.summaryTitle}</h3>
                  <span className="summary-card-badge">{getTypeLabel(summary.summaryType)}</span>
                </div>
                <div className="summary-card-actions">
                  <button onClick={() => toggleFavorite(summary._id)} title="Favorite">
                    {summary.isFavorite ? <FaStar className="active" /> : <FaRegStar />}
                  </button>
                  <button onClick={() => handleDelete(summary._id)} title="Delete">
                    <FaTrash />
                  </button>
                </div>
              </div>

              <div className="summary-card-meta">
                <span className="summary-card-source">
                  {getSourceIcon(summary)} {getSourceName(summary)}
                </span>
                <span className="summary-card-date">
                  <FaClock /> {new Date(summary.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>

              <div className="summary-card-preview">
                {summary.summaryText.slice(0, 120)}...
              </div>

              <div className="summary-card-stats">
                <span>📄 {summary.originalWordCount} words</span>
                <span>📝 {summary.summaryWordCount} words</span>
                <span>⏱️ {summary.readingTimeMinutes} min read</span>
              </div>

              <div className="summary-card-footer">
                <button onClick={() => handleView(summary._id)} className="summary-action-btn">
                  <FaEye /> View
                </button>
                <button onClick={() => handleCopy(summary.summaryText)} className="summary-action-btn">
                  <FaCopy /> Copy
                </button>
                <button onClick={() => handleDownload(summary)} className="summary-action-btn">
                  <FaDownload /> Download
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Summaries;