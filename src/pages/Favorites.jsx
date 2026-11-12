import "./Favorites.css";
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaSearch, FaTrash, FaEdit, FaThumbtack,
  FaPlus, 
  FaFileAlt, FaStickyNote, FaBrain, FaBook, FaComments,
  FaCheck, FaStar
} from "react-icons/fa";

function Favorites() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [collections, setCollections] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterCollection, setFilterCollection] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [showPinnedOnly, setShowPinnedOnly] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkMode, setBulkMode] = useState(false);
  const [showAddCollectionModal, setShowAddCollectionModal] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [editingFavorite, setEditingFavorite] = useState(null);
  const [editingNote, setEditingNote] = useState("");
  const [editingColor, setEditingColor] = useState("gray");

  // ─── Type colours ──────────────────────────────────────────
  const getTypeColor = (type) => {
    const colors = {
      document: "#3b82f6",   // blue
      note: "#22c55e",       // green
      summary: "#8b5cf6",    // purple
      flashcard: "#f59e0b",  // amber
      chat: "#ec4899",       // pink
    };
    return colors[type] || "#94a3b8";
  };

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

  // ─── Fetch functions ──────────────────────────────────────
  const fetchFavorites = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filterType !== "all") params.append("type", filterType);
      if (filterCollection !== "all") params.append("collection", filterCollection);
      if (showPinnedOnly) params.append("pinned", "true");
      const res = await fetch(`http://localhost:5000/api/favorites?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setFavorites(data.favorites);
    } catch (error) { console.error(error); } finally { setLoading(false); }
  }, [token, filterType, filterCollection, showPinnedOnly]);

  const fetchStats = useCallback(async () => {
    const res = await fetch("http://localhost:5000/api/favorites/stats", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (data.success) setStats(data.stats);
  }, [token]);

  const fetchCollections = useCallback(async () => {
    const res = await fetch("http://localhost:5000/api/favorites/collections", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (data.success) setCollections(data.collections);
  }, [token]);

  useEffect(() => {
    fetchFavorites();
    fetchStats();
    fetchCollections();
  }, [fetchFavorites, fetchStats, fetchCollections]);

  // ─── CRUD operations ──────────────────────────────────────
  const deleteFavorite = async (id) => {
    if (!window.confirm("Remove from favorites?")) return;
    const res = await fetch(`http://localhost:5000/api/favorites/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      fetchFavorites();
      fetchStats();
    }
  };

  const togglePin = async (id, currentPin) => {
    const res = await fetch(`http://localhost:5000/api/favorites/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ isPinned: !currentPin }),
    });
    if (res.ok) {
      fetchFavorites();
      fetchStats();
    }
  };

  const updateMetadata = async (id, note, color) => {
    const res = await fetch(`http://localhost:5000/api/favorites/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ note, colorLabel: color }),
    });
    if (res.ok) {
      fetchFavorites();
      setEditingFavorite(null);
    }
  };

  const bulkDelete = async () => {
    if (!window.confirm(`Delete ${selectedIds.length} favorites?`)) return;
    const res = await fetch("http://localhost:5000/api/favorites/bulk-delete", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ ids: selectedIds }),
    });
    if (res.ok) {
      setSelectedIds([]);
      setBulkMode(false);
      fetchFavorites();
      fetchStats();
    }
  };

  const createCollection = async () => {
    if (!newCollectionName.trim()) return;
    setCollections([...collections, newCollectionName.trim()]);
    setNewCollectionName("");
    setShowAddCollectionModal(false);
  };

  // ─── Helpers ──────────────────────────────────────────────
  const getTitle = (fav) => {
    if (fav.item) {
      if (fav.itemType === "document") return fav.item.displayName;
      if (fav.itemType === "note") return fav.item.title;
      if (fav.itemType === "summary") return fav.item.summaryTitle;
      if (fav.itemType === "flashcard") return fav.item.question;
      if (fav.itemType === "chat") return fav.item.title || "Chat";
    }
    return "Untitled";
  };

  const getSnippet = (fav) => {
    if (fav.item) {
      if (fav.itemType === "document") return fav.item.displayName || "";
      if (fav.itemType === "note") {
        const plain = fav.item.content.replace(/<[^>]+>/g, "");
        return plain.slice(0, 100) + (plain.length > 100 ? "..." : "");
      }
      if (fav.itemType === "summary") return fav.item.summaryText.slice(0, 100) + "...";
      if (fav.itemType === "flashcard") return fav.item.answer.slice(0, 100) + "...";
      if (fav.itemType === "chat") return fav.item.messages?.[0]?.content?.slice(0, 100) || "";
    }
    return "";
  };

  const getUrl = (fav) => {
    switch (fav.itemType) {
      case "document": return `/documents`;
      case "note": return `/notes/view/${fav.itemId}`;
      case "summary": return `/summary/view/${fav.itemId}`;
      case "flashcard": return `/flashcards`;
      case "chat": return `/chat`;
      default: return "#";
    }
  };

  const getColor = (color) => {
    const colors = {
      red: "#ef4444",
      orange: "#f97316",
      yellow: "#eab308",
      green: "#22c55e",
      blue: "#3b82f6",
      purple: "#8b5cf6",
      pink: "#ec4899",
      gray: "#94a3b8",
    };
    return colors[color] || "#94a3b8";
  };

  // ─── Render card ──────────────────────────────────────────
  const renderFavorite = (fav) => {
    const isSelected = selectedIds.includes(fav._id);
    return (
      <div key={fav._id} className={`fav-card ${fav.isPinned ? "pinned" : ""}`}>
        {bulkMode && (
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => {
              if (isSelected) setSelectedIds(selectedIds.filter(id => id !== fav._id));
              else setSelectedIds([...selectedIds, fav._id]);
            }}
            className="fav-select"
          />
        )}
        <div className="fav-card-header">
          <div className="fav-type-icon" style={{ color: getTypeColor(fav.itemType) }}>
            {getTypeIcon(fav.itemType)}
          </div>
          <div className="fav-actions">
            <button onClick={() => togglePin(fav._id, fav.isPinned)} title="Pin">
              <FaThumbtack style={{ color: fav.isPinned ? "#f59e0b" : "#94a3b8" }} />
            </button>
            <button onClick={() => { setEditingFavorite(fav); setEditingNote(fav.note || ""); setEditingColor(fav.colorLabel || "gray"); }} title="Edit">
              <FaEdit />
            </button>
            <button onClick={() => deleteFavorite(fav._id)} title="Remove">
              <FaTrash />
            </button>
          </div>
        </div>
        <div className="fav-card-body" onClick={() => navigate(getUrl(fav))}>
          <h3>{getTitle(fav)}</h3>
          <p className="fav-snippet">{getSnippet(fav)}</p>
          <div className="fav-meta">
            <span className="fav-type">{fav.itemType}</span>
            <span className="fav-collection">{fav.collectionName}</span>
            <span className="fav-date">{new Date(fav.createdAt).toLocaleDateString()}</span>
          </div>
          {fav.note && <p className="fav-note">📝 {fav.note}</p>}
        </div>
        <div className="fav-card-footer">
          <span className={`color-dot ${fav.colorLabel}`}></span>
          {fav.reminderDate && <span className="fav-reminder">⏰ {new Date(fav.reminderDate).toLocaleDateString()}</span>}
        </div>
      </div>
    );
  };

  // ─── Stats with icons ─────────────────────────────────────
  const statConfig = [
    { key: "total", label: "Total", icon: <FaStar />, color: "#f59e0b" },
    { key: "document", label: "Documents", icon: <FaFileAlt />, color: "#3b82f6" },
    { key: "note", label: "Notes", icon: <FaStickyNote />, color: "#22c55e" },
    { key: "summary", label: "Summaries", icon: <FaBrain />, color: "#8b5cf6" },
    { key: "flashcard", label: "Flashcards", icon: <FaBook />, color: "#f59e0b" },
    { key: "chat", label: "Chats", icon: <FaComments />, color: "#ec4899" },
  ];

  // ─── Sort & filter ────────────────────────────────────────
  const filtered = favorites.filter(fav => {
    const matchSearch = getTitle(fav).toLowerCase().includes(searchTerm.toLowerCase());
    const matchType = filterType === "all" || fav.itemType === filterType;
    const matchCollection = filterCollection === "all" || fav.collectionName === filterCollection;
    return matchSearch && matchType && matchCollection;
  });

  const sorted = [...filtered].sort((a, b) => {
    switch (sortBy) {
      case "newest": return new Date(b.createdAt) - new Date(a.createdAt);
      case "oldest": return new Date(a.createdAt) - new Date(b.createdAt);
      case "title": return getTitle(a).localeCompare(getTitle(b));
      default: return 0;
    }
  });

  return (
    <div className="favorites-page">
      <div className="favorites-header">
        <h1>⭐ Favorites</h1>
        <p>Your personal knowledge collection</p>
      </div>

      {/* ─── Stats ─── */}
      <div className="favorites-stats">
        {statConfig.map(({ key, label, icon, color }) => (
          <div className="stat-card" key={key}>
            <div className="stat-icon" style={{ background: color }}>
              {icon}
            </div>
            <div className="stat-info">
              <span>{label}</span>
              <h3>{stats[key] || 0}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* ─── Toolbar ─── */}
      <div className="favorites-toolbar">
        <div className="search-box">
          <FaSearch />
          <input
            type="text"
            placeholder="Search favorites..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filters">
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
            <option value="all">All Types</option>
            <option value="document">Documents</option>
            <option value="note">Notes</option>
            <option value="summary">Summaries</option>
            <option value="flashcard">Flashcards</option>
            <option value="chat">Chats</option>
          </select>
          <select value={filterCollection} onChange={(e) => setFilterCollection(e.target.value)}>
            <option value="all">All Collections</option>
            {collections.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="title">Title</option>
          </select>
          <label>
            <input type="checkbox" checked={showPinnedOnly} onChange={() => setShowPinnedOnly(!showPinnedOnly)} /> Pinned
          </label>
          <button className="bulk-toggle" onClick={() => setBulkMode(!bulkMode)}>
            <FaCheck /> Select
          </button>
          <button className="add-collection-btn" onClick={() => setShowAddCollectionModal(true)}>
            <FaPlus /> Collection
          </button>
        </div>
      </div>

      {bulkMode && selectedIds.length > 0 && (
        <div className="bulk-actions">
          <button onClick={bulkDelete}><FaTrash /> Delete Selected</button>
          <button onClick={() => { setSelectedIds([]); setBulkMode(false); }}>Cancel</button>
        </div>
      )}

      {/* ─── Grid ─── */}
      {loading ? (
        <div className="loading">Loading favorites...</div>
      ) : sorted.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">⭐</div>
          <h2>No favorites yet</h2>
          <p>Start saving important content from across your knowledge base.</p>
        </div>
      ) : (
        <div className="favorites-grid">
          {sorted.map(renderFavorite)}
        </div>
      )}

      {/* ─── Edit Modal ─── */}
      {editingFavorite && (
        <div className="modal-overlay" onClick={() => setEditingFavorite(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Edit Favorite</h2>
            <div className="modal-body">
              <label>Note</label>
              <textarea value={editingNote} onChange={(e) => setEditingNote(e.target.value)} placeholder="Add a personal note..." />
              <label>Color Label</label>
              <div className="color-picker">
                {["red","orange","yellow","green","blue","purple","pink","gray"].map(c => (
                  <button
                    key={c}
                    className={`color-option ${editingColor === c ? "active" : ""}`}
                    style={{ backgroundColor: getColor(c) }}
                    onClick={() => setEditingColor(c)}
                  />
                ))}
              </div>
              <button className="save-btn" onClick={() => updateMetadata(editingFavorite._id, editingNote, editingColor)}>Save</button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Add Collection Modal ─── */}
      {showAddCollectionModal && (
        <div className="modal-overlay" onClick={() => setShowAddCollectionModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Create Collection</h2>
            <div className="modal-body">
              <input
                type="text"
                placeholder="Collection name"
                value={newCollectionName}
                onChange={(e) => setNewCollectionName(e.target.value)}
              />
              <button className="save-btn" onClick={createCollection}>Create</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Favorites;