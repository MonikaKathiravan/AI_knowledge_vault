import "./NoteCard.css";
import { FaStar, FaRegStar, FaThumbtack, FaTrash, FaEdit, FaCopy, FaEye, FaClock } from "react-icons/fa";

function NoteCard({ note, onDelete, onFavorite, onPin, onDuplicate, onEdit, onView }) {
  const stripHtml = (html) => {
    const tmp = document.createElement("div");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
  };

  const preview = stripHtml(note.content).slice(0, 120) + (note.content.length > 120 ? "..." : "");
  const updatedDate = new Date(note.updatedAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  // Category color mapping
  const categoryColors = {
    "Programming": "#2563eb",
    "Database": "#8b5cf6",
    "AI/ML": "#10b981",
    "Interview Prep": "#f59e0b",
    "Personal": "#ec4899",
    "Web Development": "#0ea5e9",
    "Computer Science": "#6366f1",
    "Cloud": "#0891b2",
    "Default": "#64748b",
  };
  const categoryColor = categoryColors[note.category] || categoryColors["Default"];

  return (
    <div className={`note-card ${note.pinned ? "pinned" : ""}`}>
      {/* ─── PIN BADGE ─── */}
      {note.pinned && (
        <div className="note-card-pin-badge">
          <FaThumbtack /> Pinned
        </div>
      )}

      {/* ─── HEADER ─── */}
      <div className="note-card-header">
        <h3 className="note-card-title">{note.title}</h3>
        <div className="note-card-actions">
          <button onClick={() => onPin(note._id)} className="note-action-btn" title="Pin">
            {note.pinned ? <FaThumbtack className="active" /> : <FaThumbtack />}
          </button>
          <button onClick={() => onFavorite(note._id)} className="note-action-btn" title="Favorite">
            {note.favorite ? <FaStar className="active" /> : <FaRegStar />}
          </button>
        </div>
      </div>

      {/* ─── CATEGORY ─── */}
      <div className="note-card-category" style={{ backgroundColor: categoryColor + "20", color: categoryColor }}>
        {note.category}
      </div>

      {/* ─── PREVIEW ─── */}
      <div className="note-card-preview">{preview}</div>

      {/* ─── TAGS ─── */}
      {note.tags && note.tags.length > 0 && (
        <div className="note-card-tags">
          {note.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="note-tag">#{tag}</span>
          ))}
          {note.tags.length > 3 && <span className="note-tag-more">+{note.tags.length - 3}</span>}
        </div>
      )}

      {/* ─── FOOTER ─── */}
      <div className="note-card-footer">
        <span className="note-card-date">
          <FaClock /> {updatedDate}
        </span>
        <div className="note-card-actions-bottom">
          <button onClick={onView} className="note-action-btn" title="View"><FaEye /></button>
          <button onClick={onEdit} className="note-action-btn" title="Edit"><FaEdit /></button>
          <button onClick={() => onDuplicate(note._id)} className="note-action-btn" title="Duplicate"><FaCopy /></button>
          <button onClick={() => onDelete(note._id)} className="note-action-btn delete" title="Delete"><FaTrash /></button>
        </div>
      </div>
    </div>
  );
}

export default NoteCard;