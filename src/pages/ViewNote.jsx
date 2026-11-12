import "./ViewNote.css";
import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FaArrowLeft, FaEdit, FaTrash, FaCopy, FaDownload } from "react-icons/fa";

function ViewNote() {
  const { id } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const [note, setNote] = useState(null);
  const [loading, setLoading] = useState(true);

  // ─── Fetch Note ───
  const fetchNote = useCallback(async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/notes/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setNote(data.note);
      } else {
        console.error("Failed to fetch note:", data.message);
      }
    } catch (error) {
      console.error("Error fetching note:", error);
    } finally {
      setLoading(false);
    }
  }, [id, token]);

  // ─── Load note on mount ───
  useEffect(() => {
    fetchNote();
  }, [fetchNote]);

  // ─── Delete ───
  const handleDelete = async () => {
    if (!window.confirm("Delete this note?")) return;
    try {
      const res = await fetch(`http://localhost:5000/api/notes/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        navigate("/notes");
      } else {
        alert("Failed to delete note");
      }
    } catch (error) {
      console.error("Delete error:", error);
      alert("Network error while deleting");
    }
  };

  // ─── Duplicate ───
  const handleDuplicate = async () => {
    if (!note) return;
    const newNote = { ...note, title: note.title + " (copy)" };
    delete newNote._id;
    delete newNote.createdAt;
    delete newNote.updatedAt;
    try {
      const res = await fetch("http://localhost:5000/api/notes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newNote),
      });
      if (res.ok) {
        navigate("/notes");
      } else {
        alert("Failed to duplicate note");
      }
    } catch (error) {
      console.error("Duplicate error:", error);
      alert("Network error while duplicating");
    }
  };

  // ─── Export as TXT ───
  const handleExport = () => {
    if (!note) return;
    const plainText = note.content.replace(/<[^>]+>/g, "");
    const content = `${note.title}\n\n${plainText}`;
    const blob = new Blob([content], { type: "text/plain" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${note.title}.txt`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  if (loading) return <div className="view-note-loading">Loading...</div>;
  if (!note) return <div className="view-note-error">Note not found</div>;

  return (
    <div className="view-note-page">
      <div className="view-note-header">
        <button className="view-note-back" onClick={() => navigate("/notes")}>
          <FaArrowLeft /> Back
        </button>
        <h1>{note.title}</h1>
        <div className="view-note-actions">
          <button onClick={handleDuplicate}><FaCopy /> Duplicate</button>
          <button onClick={handleExport}><FaDownload /> Export</button>
          <button onClick={() => navigate(`/notes/edit/${id}`)}><FaEdit /> Edit</button>
          <button className="delete" onClick={handleDelete}><FaTrash /> Delete</button>
        </div>
      </div>
      <div className="view-note-meta">
        <span>Category: {note.category}</span>
        <span>Tags: {note.tags.join(", ")}</span>
        <span>Updated: {new Date(note.updatedAt).toLocaleString()}</span>
        {note.favorite && <span>⭐ Favorite</span>}
        {note.pinned && <span>📌 Pinned</span>}
      </div>
      <div
        className="view-note-content"
        dangerouslySetInnerHTML={{ __html: note.content }}
      />
    </div>
  );
}

export default ViewNote;