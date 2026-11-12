import "./Notes.css";
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaPlus,
  FaSearch,
  FaStar,
  FaEye,
  FaClock,
  FaFileAlt,
  FaRobot,
  FaBrain,
  FaComments,
  FaMagic,
  FaLightbulb,
  FaFolderOpen,
} from "react-icons/fa";
import NoteCard from "../components/NoteCard";
import CategoryFilter from "../components/CategoryFilter";

function Notes() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [showFavorites, setShowFavorites] = useState(false);
  const [categories, setCategories] = useState([]);

  // ─── Fetch notes ───
  const fetchNotes = useCallback(async () => {
    try {
      let url = "http://localhost:5000/api/notes";
      if (searchTerm) {
        url = `http://localhost:5000/api/notes/search?q=${encodeURIComponent(searchTerm)}`;
      }
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        let filtered = data.notes;
        if (selectedCategory !== "all") {
          filtered = filtered.filter((n) => n.category === selectedCategory);
        }
        if (showFavorites) {
          filtered = filtered.filter((n) => n.favorite);
        }
        switch (sortBy) {
          case "newest":
            filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            break;
          case "oldest":
            filtered.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
            break;
          case "alphabetical":
            filtered.sort((a, b) => a.title.localeCompare(b.title));
            break;
          case "updated":
            filtered.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
            break;
          default:
            break;
        }
        const cats = [...new Set(data.notes.map((n) => n.category))];
        setCategories(cats);
        setNotes(filtered);
      }
    } catch (error) {
      console.error("Error fetching notes:", error);
    } finally {
      setLoading(false);
    }
  }, [token, searchTerm, selectedCategory, showFavorites, sortBy]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  // ─── Toggle Favorite (Unified) ───
  const toggleFavorite = async (id) => {
    try {
      // Find the current note
      const note = notes.find((n) => n._id === id);
      if (!note) return;

      const current = note.favorite;

      // Step 1: Update the note's own `favorite` flag
      const noteRes = await fetch(`http://localhost:5000/api/notes/favorite/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ favorite: !current }),
      });
      if (!noteRes.ok) throw new Error("Failed to update note favorite");

      // Step 2: Sync with the unified favorites collection
      if (!current) {
        // Add to favorites
        const favRes = await fetch("http://localhost:5000/api/favorites", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ itemType: "note", itemId: id }),
        });
        if (!favRes.ok) throw new Error("Failed to add to favorites");
      } else {
        // Remove from favorites: find the favorite ID first
        const checkRes = await fetch(
          `http://localhost:5000/api/favorites/check?itemType=note&itemId=${id}`,
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
      setNotes(
        notes.map((n) => (n._id === id ? { ...n, favorite: !current } : n))
      );
    } catch (err) {
      console.error("Favorite error:", err);
      alert("Failed to update favorite. Please try again.");
    }
  };

  // ─── Pin ───
  const togglePin = async (id) => {
    const res = await fetch(`http://localhost:5000/api/notes/pin/${id}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data = await res.json();
      setNotes(notes.map((n) => (n._id === id ? data.note : n)));
    }
  };

  // ─── Delete ───
  const handleDelete = async (id) => {
    if (window.confirm("Delete this note?")) {
      const res = await fetch(`http://localhost:5000/api/notes/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setNotes(notes.filter((n) => n._id !== id));
      }
    }
  };

  // ─── Duplicate ───
  const handleDuplicate = async (id) => {
    const note = notes.find((n) => n._id === id);
    if (!note) return;
    const newNote = { ...note, title: note.title + " (copy)" };
    delete newNote._id;
    delete newNote.createdAt;
    delete newNote.updatedAt;
    const res = await fetch("http://localhost:5000/api/notes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(newNote),
    });
    if (res.ok) {
      const data = await res.json();
      setNotes([data.note, ...notes]);
    }
  };

  // ─── Stats ───
  const totalNotes = notes.length;
  const pinnedCount = notes.filter((n) => n.pinned).length;
  const favoriteCount = notes.filter((n) => n.favorite).length;
  const totalWords = notes.reduce((acc, n) => {
    const plain = n.content.replace(/<[^>]+>/g, "");
    return acc + (plain.match(/\S+/g)?.length || 0);
  }, 0);
  const categoriesCount = categories.length;
  const todayNotes = notes.filter((n) => {
    const today = new Date();
    const created = new Date(n.createdAt);
    return created.toDateString() === today.toDateString();
  }).length;

  // ─── Recent activity ───
  const recentNotes = [...notes]
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    .slice(0, 3);

  // ─── AI Suggestions ───
  const aiSuggestions = [
    { icon: <FaRobot />, label: "Generate Summary", color: "#2563eb" },
    { icon: <FaBrain />, label: "Create Flashcards", color: "#8b5cf6" },
    { icon: <FaComments />, label: "Ask AI", color: "#10b981" },
    { icon: <FaMagic />, label: "Improve Grammar", color: "#f59e0b" },
    { icon: <FaLightbulb />, label: "Get Ideas", color: "#ec4899" },
  ];

  const pinnedNotes = notes.filter((n) => n.pinned);
  const unpinnedNotes = notes.filter((n) => !n.pinned);

  return (
    <div className="notes-page">
      {/* ─── HERO HEADER ─── */}
      <div className="notes-hero">
        <div className="notes-hero-content">
          <h1>📒 My Notes</h1>
          <p>Create, organize and manage your knowledge with AI.</p>
          <div className="notes-hero-stats">
            <span className="notes-hero-stat">
              <FaFileAlt /> {totalNotes} Notes
            </span>
            <span className="notes-hero-stat">
              <FaClock /> Last edited:{" "}
              {notes.length > 0
                ? new Date(
                    notes.reduce(
                      (a, b) => (new Date(a.updatedAt) > new Date(b.updatedAt) ? a : b)
                    ).updatedAt
                  ).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                : "Never"}
            </span>
            <span className="notes-hero-stat">
              <FaFolderOpen /> {categoriesCount} Categories
            </span>
          </div>
        </div>
        <div className="notes-hero-illustration">🧠</div>
      </div>

      {/* ─── STATISTICS CARDS ─── */}
      <div className="notes-stats">
        <div className="notes-stat-card">
          <div className="notes-stat-icon">📄</div>
          <div className="notes-stat-info">
            <h3>{totalNotes}</h3>
            <p>Total Notes</p>
          </div>
        </div>
        <div className="notes-stat-card">
          <div className="notes-stat-icon">📌</div>
          <div className="notes-stat-info">
            <h3>{pinnedCount}</h3>
            <p>Pinned</p>
          </div>
        </div>
        <div className="notes-stat-card">
          <div className="notes-stat-icon">⭐</div>
          <div className="notes-stat-info">
            <h3>{favoriteCount}</h3>
            <p>Favorites</p>
          </div>
        </div>
        <div className="notes-stat-card">
          <div className="notes-stat-icon">📝</div>
          <div className="notes-stat-info">
            <h3>{totalWords.toLocaleString()}</h3>
            <p>Words Written</p>
          </div>
        </div>
        <div className="notes-stat-card">
          <div className="notes-stat-icon">📂</div>
          <div className="notes-stat-info">
            <h3>{categoriesCount}</h3>
            <p>Categories</p>
          </div>
        </div>
        <div className="notes-stat-card">
          <div className="notes-stat-icon">📅</div>
          <div className="notes-stat-info">
            <h3>{todayNotes}</h3>
            <p>Today's Notes</p>
          </div>
        </div>
      </div>

      {/* ─── TOOLBAR ─── */}
      <div className="notes-toolbar">
        <div className="notes-search">
          <FaSearch className="notes-search-icon" />
          <input
            type="text"
            placeholder="Search notes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button className="notes-search-clear" onClick={() => setSearchTerm("")}>×</button>
          )}
        </div>
        <div className="notes-toolbar-actions">
          <CategoryFilter
            categories={categories}
            selected={selectedCategory}
            onSelect={setSelectedCategory}
          />
          <select
            className="notes-sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="updated">Last Updated</option>
            <option value="alphabetical">Alphabetical</option>
          </select>
          <button
            className={`notes-filter-btn ${showFavorites ? "active" : ""}`}
            onClick={() => setShowFavorites(!showFavorites)}
          >
            <FaStar /> Favorites
          </button>
          <button
            className="notes-create-btn-small"
            onClick={() => navigate("/notes/create")}
          >
            <FaPlus /> New
          </button>
        </div>
      </div>

      {/* ─── PINNED NOTES ─── */}
      {pinnedNotes.length > 0 && (
        <div className="notes-section">
          <h2 className="notes-section-title">📌 Pinned Notes</h2>
          <div className="notes-grid">
            {pinnedNotes.map((note) => (
              <NoteCard
                key={note._id}
                note={note}
                onDelete={handleDelete}
                onFavorite={toggleFavorite}
                onPin={togglePin}
                onDuplicate={handleDuplicate}
                onEdit={() => navigate(`/notes/edit/${note._id}`)}
                onView={() => navigate(`/notes/view/${note._id}`)}
              />
            ))}
          </div>
        </div>
      )}

      {/* ─── ALL NOTES ─── */}
      <div className="notes-section">
        <h2 className="notes-section-title">
          {pinnedNotes.length > 0 ? "📚 All Notes" : "📚 Your Notes"}
        </h2>
        {loading ? (
          <div className="notes-loading">Loading your notes...</div>
        ) : unpinnedNotes.length === 0 && pinnedNotes.length === 0 ? (
          <div className="notes-empty">
            <div className="notes-empty-icon">📝</div>
            <h2>No Notes Yet</h2>
            <p>Start writing your first note and build your knowledge base.</p>
            <button
              className="notes-empty-btn"
              onClick={() => navigate("/notes/create")}
            >
              <FaPlus /> Create Note
            </button>
          </div>
        ) : (
          <div className="notes-grid">
            {unpinnedNotes.map((note) => (
              <NoteCard
                key={note._id}
                note={note}
                onDelete={handleDelete}
                onFavorite={toggleFavorite}
                onPin={togglePin}
                onDuplicate={handleDuplicate}
                onEdit={() => navigate(`/notes/edit/${note._id}`)}
                onView={() => navigate(`/notes/view/${note._id}`)}
              />
            ))}
          </div>
        )}
      </div>

      {/* ─── RECENT ACTIVITY ─── */}
      {recentNotes.length > 0 && (
        <div className="notes-recent">
          <h2 className="notes-section-title">🕒 Recent Activity</h2>
          <div className="notes-recent-list">
            {recentNotes.map((note) => (
              <div key={note._id} className="notes-recent-item">
                <span className="notes-recent-icon">📄</span>
                <div className="notes-recent-info">
                  <p className="notes-recent-title">{note.title}</p>
                  <span className="notes-recent-time">
                    Edited {new Date(note.updatedAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <button
                  className="notes-recent-view"
                  onClick={() => navigate(`/notes/view/${note._id}`)}
                >
                  <FaEye />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── AI SUGGESTIONS ─── */}
      <div className="notes-ai-suggestions">
        <h2 className="notes-section-title">🤖 AI Suggestions</h2>
        <div className="notes-ai-grid">
          {aiSuggestions.map((suggestion, index) => (
            <button
              key={index}
              className="notes-ai-btn"
              style={{ borderColor: suggestion.color, color: suggestion.color }}
            >
              {suggestion.icon} {suggestion.label}
            </button>
          ))}
        </div>
      </div>

      {/* ─── FLOATING ACTION BUTTON ─── */}
      <button
        className="notes-fab"
        onClick={() => navigate("/notes/create")}
        title="Create New Note"
      >
        <FaPlus />
      </button>
    </div>
  );
}

export default Notes;