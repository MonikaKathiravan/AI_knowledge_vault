import "./Documents.css";
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaUpload,
  FaSearch,
  FaFilePdf,
  FaFileWord,
  FaFilePowerpoint,
  FaFileImage,
  FaFileAlt,
  FaStar,
  FaRegStar,
  FaTrash,
  FaDownload,
  FaEye,
  FaPencilAlt,
  FaTimes,
  FaBrain,
  FaBook,
  FaComments,
  FaQuestionCircle,
  FaStickyNote,
  FaInfoCircle,
  FaClock,
  FaPlus,
} from "react-icons/fa";

function Documents() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("latest");
  const [filterType, setFilterType] = useState("all");
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [category, setCategory] = useState("Uncategorized");
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [viewMode, setViewMode] = useState("grid");
  const [recentActivity, setRecentActivity] = useState([]);
  const [selectedDocInfo, setSelectedDocInfo] = useState(null);
  const [showInfoModal, setShowInfoModal] = useState(false);

  // ─── Fetch documents ───
  const fetchDocuments = useCallback(async () => {
    try {
      const res = await fetch("http://localhost:5000/api/documents", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setDocuments(data.documents);
        const savedActivity = localStorage.getItem("docRecentActivity");
        if (savedActivity) setRecentActivity(JSON.parse(savedActivity));
      }
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  // ─── Add to recent activity ───
  const addRecentActivity = (text, icon) => {
    const newActivity = [
      { id: Date.now(), text, icon, time: new Date().toLocaleString() },
      ...recentActivity.slice(0, 9),
    ];
    setRecentActivity(newActivity);
    localStorage.setItem("docRecentActivity", JSON.stringify(newActivity));
  };

  // ─── Upload ───
  const handleUpload = async (file) => {
    if (!file) {
      setError("Please select a file");
      return;
    }
    const formData = new FormData();
    formData.append("file", file);
    formData.append("displayName", displayName || file.name);
    formData.append("category", category);

    setUploading(true);
    setUploadProgress(0);
    setError("");
    setSuccessMessage("");

    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 200);

    try {
      const res = await fetch("http://localhost:5000/api/documents/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      clearInterval(progressInterval);
      const data = await res.json();
      if (res.ok) {
        setUploadProgress(100);
        setSuccessMessage("✅ Document uploaded successfully!");
        const newDoc = data.document;
        setDocuments([newDoc, ...documents]);
        addRecentActivity(`Uploaded ${newDoc.displayName}`, "📄");
        setShowUploadModal(false);
        setSelectedFile(null);
        setDisplayName("");
        setCategory("Uncategorized");
        setUploadProgress(0);
        setTimeout(() => setSuccessMessage(""), 3000);
      } else {
        setError(data.message || "Upload failed");
        setUploadProgress(0);
      }
    } catch (err) {
      clearInterval(progressInterval);
      setError("Network error. Please try again.");
      setUploadProgress(0);
    } finally {
      setUploading(false);
    }
  };

  // ─── Delete ───
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this document?")) return;
    try {
      const res = await fetch(`http://localhost:5000/api/documents/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const deleted = documents.find((d) => d._id === id);
        setDocuments(documents.filter((d) => d._id !== id));
        addRecentActivity(`Deleted ${deleted?.displayName}`, "🗑");
      }
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  // ─── Toggle Favorite (Unified) ───
  const toggleFavorite = async (id, current) => {
    try {
      // Step 1: Update the document's own `isFavorite` flag
      const docRes = await fetch(`http://localhost:5000/api/documents/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isFavorite: !current }),
      });
      if (!docRes.ok) throw new Error("Failed to update document");

      // Step 2: Sync with the unified favorites collection
      if (!current) {
        // Add to favorites
        await fetch("http://localhost:5000/api/favorites", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ itemType: "document", itemId: id }),
        });
      } else {
        // Remove from favorites: find the favorite ID first
        const checkRes = await fetch(
          `http://localhost:5000/api/favorites/check?itemType=document&itemId=${id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const checkData = await checkRes.json();
        if (checkData.success && checkData.favorite) {
          await fetch(`http://localhost:5000/api/favorites/${checkData.favorite._id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
          });
        }
      }

      // Update local state
      setDocuments(
        documents.map((doc) =>
          doc._id === id ? { ...doc, isFavorite: !current } : doc
        )
      );

      addRecentActivity(
        `${!current ? "Favorited" : "Unfavorited"} ${documents.find((d) => d._id === id)?.displayName}`,
        "⭐"
      );
    } catch (err) {
      console.error("Favorite error:", err);
      alert("Failed to update favorite. Please try again.");
    }
  };

  // ─── View ───
  const handleView = (id) => {
    const token = localStorage.getItem("token");
    window.open(`http://localhost:5000/api/documents/view/${id}?token=${token}`, "_blank");
    addRecentActivity(`Viewed ${documents.find((d) => d._id === id)?.displayName}`, "👁");
  };

  // ─── Download ───
  const handleDownload = (id) => {
    const token = localStorage.getItem("token");
    window.open(`http://localhost:5000/api/documents/download/${id}?token=${token}`, "_blank");
    addRecentActivity(`Downloaded ${documents.find((d) => d._id === id)?.displayName}`, "⬇");
  };

  // ─── Rename ───
  const handleRename = async (id, currentName) => {
    const newName = prompt("Enter new display name:", currentName);
    if (newName && newName.trim() !== "") {
      try {
        const res = await fetch(`http://localhost:5000/api/documents/${id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ displayName: newName.trim() }),
        });
        if (res.ok) {
          setDocuments(
            documents.map((doc) =>
              doc._id === id ? { ...doc, displayName: newName.trim() } : doc
            )
          );
          addRecentActivity(`Renamed to ${newName.trim()}`, "✏");
        }
      } catch (err) {
        console.error("Rename error:", err);
      }
    }
  };

  // ─── AI Actions ───
  const handleAISummary = (docId) => navigate(`/summary/${docId}`);
  const handleAIFlashcards = () => navigate("/flashcards");
  const handleAIChat = () => navigate("/chat");
  const handleAIQuiz = () => navigate("/quiz");
  const handleAINotes = () => navigate("/notes/create");

  // ─── Info modal ───
  const showInfo = (doc) => {
    setSelectedDocInfo(doc);
    setShowInfoModal(true);
  };

  // ─── File icon & color ───
  const getFileInfo = (type) => {
    const map = {
      pdf: { icon: <FaFilePdf />, color: "#dc2626" },
      doc: { icon: <FaFileWord />, color: "#2563eb" },
      docx: { icon: <FaFileWord />, color: "#2563eb" },
      ppt: { icon: <FaFilePowerpoint />, color: "#f59e0b" },
      pptx: { icon: <FaFilePowerpoint />, color: "#f59e0b" },
      jpg: { icon: <FaFileImage />, color: "#10b981" },
      jpeg: { icon: <FaFileImage />, color: "#10b981" },
      png: { icon: <FaFileImage />, color: "#10b981" },
      txt: { icon: <FaFileAlt />, color: "#6b7280" },
    };
    return map[type] || { icon: <FaFileAlt />, color: "#6b7280" };
  };

  // ─── Search & filter ───
  const filteredDocs = documents.filter((doc) => {
    const matchName = doc.displayName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchType = filterType === "all" || doc.fileType === filterType;
    return matchName && matchType;
  });

  const sortedDocs = [...filteredDocs].sort((a, b) => {
    switch (sortBy) {
      case "latest": return new Date(b.uploadDate) - new Date(a.uploadDate);
      case "oldest": return new Date(a.uploadDate) - new Date(b.uploadDate);
      case "name": return a.displayName.localeCompare(b.displayName);
      case "size": return b.fileSize - a.fileSize;
      default: return 0;
    }
  });

  // ─── Statistics ───
  const totalDocs = documents.length;
  const totalStorageMB = documents.reduce((acc, d) => acc + d.fileSize, 0) / (1024 * 1024);
  const favoritesCount = documents.filter((d) => d.isFavorite).length;

  return (
    <div className="documents-page">
      {/* ─── Header ─── */}
      <div className="documents-header">
        <div className="doc-header-left">
          <h1>📂 My AI Workspace</h1>
          <p className="doc-subtitle">Manage • Analyze • Summarize • Generate Flashcards • Chat with Documents</p>
        </div>
        <button className="doc-upload-btn" onClick={() => setShowUploadModal(true)}>
          <FaUpload /> Upload New
        </button>
      </div>

      {/* ─── Statistics ─── */}
      <div className="doc-stats">
        <div className="stat-item"><span className="stat-icon">📄</span><div><h3>{totalDocs}</h3><p>Total Documents</p></div></div>
        <div className="stat-item"><span className="stat-icon">💾</span><div><h3>{totalStorageMB.toFixed(0)} MB</h3><p>Storage Used</p></div></div>
        <div className="stat-item"><span className="stat-icon">⭐</span><div><h3>{favoritesCount}</h3><p>Favorites</p></div></div>
        <div className="stat-item"><span className="stat-icon">🧠</span><div><h3>0</h3><p>AI Summaries</p></div></div>
        <div className="stat-item"><span className="stat-icon">📚</span><div><h3>0</h3><p>Flashcards</p></div></div>
        <div className="stat-item"><span className="stat-icon">📝</span><div><h3>0</h3><p>Notes Created</p></div></div>
      </div>

      {/* ─── Recent Activity & Toolbar ─── */}
      <div className="doc-toolbar-wrapper">
        <div className="doc-recent-activity">
          <h4>🕒 Recent Activity</h4>
          <div className="activity-list">
            {recentActivity.length === 0 ? <p>No recent activity</p> : recentActivity.map((act) => (
              <div key={act.id} className="activity-item">
                <span>{act.icon}</span>
                <span>{act.text}</span>
                <span className="activity-time">{act.time}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="documents-toolbar">
          <div className="doc-search">
            <FaSearch />
            <input
              type="text"
              placeholder="Search by name or content..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="doc-filters">
            <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
              <option value="all">All Types</option>
              <option value="pdf">PDF</option>
              <option value="doc">DOC</option>
              <option value="docx">DOCX</option>
              <option value="ppt">PPT</option>
              <option value="pptx">PPTX</option>
              <option value="jpg">JPG</option>
              <option value="png">PNG</option>
              <option value="txt">TXT</option>
            </select>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="latest">Latest</option>
              <option value="oldest">Oldest</option>
              <option value="name">Name</option>
              <option value="size">Size</option>
            </select>
            <div className="view-toggle">
              <button className={viewMode === "grid" ? "active" : ""} onClick={() => setViewMode("grid")}>⊞</button>
              <button className={viewMode === "list" ? "active" : ""} onClick={() => setViewMode("list")}>☰</button>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Document Grid ─── */}
      {loading ? (
        <div className="doc-loading">Loading documents...</div>
      ) : sortedDocs.length === 0 ? (
        <div className="doc-empty">
          <div className="doc-empty-icon">📂</div>
          <h2>No Documents Yet</h2>
          <p>Upload your first document to get started with AI Knowledge Vault.</p>
          <button className="doc-empty-btn" onClick={() => setShowUploadModal(true)}><FaUpload /> Upload Document</button>
        </div>
      ) : (
        <div className={`doc-grid ${viewMode}`}>
          {sortedDocs.map((doc) => {
            const { icon, color } = getFileInfo(doc.fileType);
            return (
              <div key={doc._id} className="doc-card">
                <div className="doc-card-top">
                  <div className="doc-card-icon" style={{ color }}>{icon}</div>
                  <div className="doc-card-badges">
                    <button
                      className="doc-fav-btn"
                      onClick={() => toggleFavorite(doc._id, doc.isFavorite)}
                      title={doc.isFavorite ? "Unfavorite" : "Favorite"}
                    >
                      {doc.isFavorite ? <FaStar style={{ color: "#f59e0b" }} /> : <FaRegStar />}
                    </button>
                    <button className="doc-info-btn" onClick={() => showInfo(doc)} title="Details"><FaInfoCircle /></button>
                  </div>
                </div>
                <div className="doc-card-info">
                  <h3>{doc.displayName}</h3>
                  <p className="doc-card-meta">{doc.fileType.toUpperCase()} • {(doc.fileSize / 1024 / 1024).toFixed(2)} MB</p>
                  <div className="doc-card-tags">
                    <span className="doc-tag category">{doc.category}</span>
                    <span className="doc-tag ai-pending">⏳ AI Pending</span>
                  </div>
                </div>
                <div className="doc-card-actions">
                  <button onClick={() => handleView(doc._id)} title="View"><FaEye /></button>
                  <button onClick={() => handleDownload(doc._id)} title="Download"><FaDownload /></button>
                  <button onClick={() => handleRename(doc._id, doc.displayName)} title="Rename"><FaPencilAlt /></button>
                  <button onClick={() => handleDelete(doc._id)} title="Delete"><FaTrash /></button>
                </div>
                <div className="doc-ai-actions">
                  <button onClick={() => handleAISummary(doc._id)} title="Summary"><FaBrain /> Summary</button>
                  <button onClick={handleAIFlashcards} title="Flashcards"><FaBook /> Flashcards</button>
                  <button onClick={handleAIChat} title="Chat"><FaComments /> Chat</button>
                  <button onClick={handleAIQuiz} title="Quiz"><FaQuestionCircle /> Quiz</button>
                  <button onClick={handleAINotes} title="Notes"><FaStickyNote /> Notes</button>
                </div>
                <div className="doc-card-footer">
                  <span className="doc-upload-date"><FaClock /> Uploaded: {new Date(doc.uploadDate).toLocaleDateString()}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── Floating Action Button ─── */}
      <button className="doc-fab" onClick={() => setShowUploadModal(true)} title="Upload New Document"><FaPlus /></button>

      {/* ─── Upload Modal ─── */}
      {showUploadModal && (
        <div className="doc-modal-overlay" onClick={() => setShowUploadModal(false)}>
          <div className="doc-modal" onClick={(e) => e.stopPropagation()}>
            <div className="doc-modal-header">
              <h2>📤 Upload Document</h2>
              <button className="doc-modal-close" onClick={() => setShowUploadModal(false)}><FaTimes /></button>
            </div>
            <div className="doc-modal-body">
              {error && <div className="doc-error">{error}</div>}
              {successMessage && <div className="doc-success">{successMessage}</div>}
              <div
                className={`doc-drop-zone ${dragOver ? "dragover" : ""}`}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  const file = e.dataTransfer.files[0];
                  if (file) setSelectedFile(file);
                }}
                onClick={() => document.getElementById("fileInput").click()}
              >
                {selectedFile ? (
                  <div>
                    <p className="doc-file-selected">📄 {selectedFile.name}</p>
                    <p className="doc-file-size">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                ) : (
                  <div>
                    <p className="doc-drop-icon">📤</p>
                    <p>Drag & drop your file here</p>
                    <p className="doc-drop-hint">or click to browse</p>
                    <div className="doc-supported-formats">
                      <span>PDF</span><span>DOCX</span><span>PPTX</span><span>TXT</span><span>JPG</span><span>PNG</span>
                    </div>
                  </div>
                )}
                <input id="fileInput" type="file" style={{ display: "none" }} onChange={(e) => setSelectedFile(e.target.files[0])} />
              </div>
              <div className="doc-modal-form">
                <div className="doc-form-group">
                  <label>Display Name (optional)</label>
                  <input type="text" placeholder="Enter a name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
                </div>
                <div className="doc-form-group">
                  <label>Category</label>
                  <select value={category} onChange={(e) => setCategory(e.target.value)}>
                    <option value="Uncategorized">Uncategorized</option>
                    <option value="Semester 5">Semester 5</option>
                    <option value="Semester 6">Semester 6</option>
                    <option value="Projects">Projects</option>
                    <option value="Research Papers">Research Papers</option>
                    <option value="Interview Preparation">Interview Preparation</option>
                    <option value="Personal Notes">Personal Notes</option>
                  </select>
                </div>
              </div>
              {uploading && (
                <div className="doc-progress">
                  <div className="doc-progress-bar" style={{ width: `${uploadProgress}%` }}></div>
                  <span>{uploadProgress}%</span>
                </div>
              )}
              <button className="doc-modal-submit" onClick={() => handleUpload(selectedFile)} disabled={uploading || !selectedFile}>
                {uploading ? "Uploading..." : "Upload"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Info Modal ─── */}
      {showInfoModal && selectedDocInfo && (
        <div className="doc-modal-overlay" onClick={() => setShowInfoModal(false)}>
          <div className="doc-modal" onClick={(e) => e.stopPropagation()}>
            <div className="doc-modal-header">
              <h2>📄 Document Details</h2>
              <button className="doc-modal-close" onClick={() => setShowInfoModal(false)}><FaTimes /></button>
            </div>
            <div className="doc-modal-body">
              <div className="doc-info-grid">
                <div><strong>Name:</strong> {selectedDocInfo.displayName}</div>
                <div><strong>Original Name:</strong> {selectedDocInfo.originalName}</div>
                <div><strong>Type:</strong> {selectedDocInfo.fileType.toUpperCase()}</div>
                <div><strong>Size:</strong> {(selectedDocInfo.fileSize / 1024 / 1024).toFixed(2)} MB</div>
                <div><strong>Category:</strong> {selectedDocInfo.category}</div>
                <div><strong>Uploaded:</strong> {new Date(selectedDocInfo.uploadDate).toLocaleString()}</div>
                <div><strong>Modified:</strong> {new Date(selectedDocInfo.updatedAt).toLocaleString()}</div>
                <div><strong>Downloads:</strong> {selectedDocInfo.downloads || 0}</div>
                <div><strong>Favorite:</strong> {selectedDocInfo.isFavorite ? "⭐ Yes" : "No"}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Documents;