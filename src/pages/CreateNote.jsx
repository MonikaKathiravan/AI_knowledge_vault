import "./CreateNote.css";
import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import {
  FaSave,
  FaTimes,
  FaBold,
  FaItalic,
  FaUnderline,
  FaListUl,
  FaListOl,
  FaQuoteLeft,
  FaCode,
//   FaHeading,
//   FaFont,
  FaArrowLeft,
} from "react-icons/fa";

function CreateNote() {
  const { id } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Uncategorized");
  const [tags, setTags] = useState("");
  const [favorite, setFavorite] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [characterCount, setCharacterCount] = useState(0);
  const [readingTime, setReadingTime] = useState(0);
  const [paragraphCount, setParagraphCount] = useState(0);
  const [autoSave, setAutoSave] = useState(false);
  const [content, setContent] = useState("");
  const autoSaveTimeout = useRef(null);

  // ─── Tiptap Editor ───
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: "Write your thoughts here...",
      }),
    ],
    content: "",
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      setContent(html);
    },
  });

  // ─── Fetch Note (edit mode) ───
  const fetchNote = useCallback(async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/notes/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        const note = data.note;
        setTitle(note.title);
        setContent(note.content);
        if (editor) {
          editor.commands.setContent(note.content);
        }
        setCategory(note.category);
        setTags(note.tags.join(", "));
        setFavorite(note.favorite);
        setPinned(note.pinned);
      }
    } catch (error) {
      console.error("Error fetching note:", error);
    }
  }, [id, token, editor]);

  useEffect(() => {
    if (id) {
      fetchNote();
    }
  }, [id, fetchNote]);

  // ─── Auto‑save ───
  const handleSave = useCallback(
    async (isAuto = false) => {
      if (!title.trim()) {
        if (!isAuto) alert("Title is required");
        return;
      }
      setLoading(true);
      const payload = {
        title,
        content,
        category,
        tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
        favorite,
        pinned,
      };
      const url = id
        ? `http://localhost:5000/api/notes/${id}`
        : "http://localhost:5000/api/notes";
      const method = id ? "PUT" : "POST";
      try {
        const res = await fetch(url, {
          method,
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (data.success) {
          if (!isAuto) {
            alert(id ? "Note updated!" : "Note created!");
            navigate("/notes");
          } else {
            setAutoSave(true);
            setTimeout(() => setAutoSave(false), 1500);
          }
        } else {
          alert(data.message || "Failed to save");
        }
      } catch (error) {
        console.error("Save error:", error);
        alert("Network error while saving");
      } finally {
        setLoading(false);
      }
    },
    [title, content, category, tags, favorite, pinned, id, token, navigate]
  );

  // ─── Auto‑save trigger ───
  useEffect(() => {
    if (id) {
      clearTimeout(autoSaveTimeout.current);
      autoSaveTimeout.current = setTimeout(() => {
        if (title || content) {
          handleSave(true);
        }
      }, 3000);
    }
    return () => clearTimeout(autoSaveTimeout.current);
  }, [title, content, category, tags, favorite, pinned, id, handleSave]);

  // ─── Stats ───
  useEffect(() => {
    const plainText = content.replace(/<[^>]+>/g, "");
    const words = plainText.match(/\S+/g)?.length || 0;
    const chars = plainText.length;
    const paragraphs = plainText.split(/\n+/).filter((p) => p.trim()).length;
    setWordCount(words);
    setCharacterCount(chars);
    setReadingTime(Math.ceil(words / 200));
    setParagraphCount(paragraphs);
  }, [content]);

  // ─── Toolbar handlers ───
  const toggleBold = () => editor?.chain().focus().toggleBold().run();
  const toggleItalic = () => editor?.chain().focus().toggleItalic().run();
  const toggleUnderline = () => editor?.chain().focus().toggleUnderline().run();
  const toggleBulletList = () => editor?.chain().focus().toggleBulletList().run();
  const toggleOrderedList = () => editor?.chain().focus().toggleOrderedList().run();
  const toggleBlockquote = () => editor?.chain().focus().toggleBlockquote().run();
  const toggleCodeBlock = () => editor?.chain().focus().toggleCodeBlock().run();

  const setHeading = (level) => {
    editor?.chain().focus().toggleHeading({ level }).run();
  };

  // ─── Get active heading level ───
  const getActiveHeading = () => {
    if (!editor) return "Normal";
    if (editor.isActive("heading", { level: 1 })) return "H1";
    if (editor.isActive("heading", { level: 2 })) return "H2";
    if (editor.isActive("heading", { level: 3 })) return "H3";
    return "Normal";
  };

  return (
    <div className="create-note-page">
      <div className="create-note-card">
        {/* ─── HEADER ─── */}
        <div className="create-note-header">
          <div className="create-note-header-left">
            <button className="create-note-back" onClick={() => navigate("/notes")}>
              <FaArrowLeft />
            </button>
            <div>
              <h1>{id ? "Edit Note" : "Create New Note"}</h1>
              <p className="create-note-subtitle">
                Capture your thoughts. Organize your knowledge. Grow every day.
              </p>
            </div>
          </div>
          <div className="create-note-actions">
            {autoSave && <span className="auto-save-indicator">💾 Auto-saved</span>}
            <button
              className="create-note-cancel"
              onClick={() => navigate("/notes")}
            >
              <FaTimes /> Cancel
            </button>
            <button
              className="create-note-save"
              onClick={() => handleSave(false)}
              disabled={loading}
            >
              <FaSave /> {id ? "Update" : "Save"}
            </button>
          </div>
        </div>

        {/* ─── META FIELDS ─── */}
        <div className="create-note-meta">
          <input
            type="text"
            placeholder="Enter an amazing title..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="note-title-input"
          />
          <div className="note-meta-row">
            <div className="note-meta-group">
              <label>Category</label>
              <input
                type="text"
                placeholder="Select category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              />
            </div>
            <div className="note-meta-group">
              <label>Tags</label>
              <input
                type="text"
                placeholder="Add tags (comma separated)"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
              />
            </div>
            <div className="note-meta-group note-checkboxes">
              <label className="note-checkbox">
                <input
                  type="checkbox"
                  checked={favorite}
                  onChange={() => setFavorite(!favorite)}
                />
                ⭐ Favorite
              </label>
              <label className="note-checkbox">
                <input
                  type="checkbox"
                  checked={pinned}
                  onChange={() => setPinned(!pinned)}
                />
                📌 Pin
              </label>
            </div>
          </div>
        </div>

        {/* ─── TOOLBAR ─── */}
        <div className="note-editor-wrapper">
          <div className="tiptap-toolbar">
            {/* Heading dropdown */}
            <div className="tiptap-toolbar-group">
              <select
                className="tiptap-heading-select"
                value={getActiveHeading()}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === "Normal") {
                    editor?.chain().focus().setParagraph().run();
                  } else {
                    setHeading(parseInt(val.replace("H", "")));
                  }
                }}
              >
                <option value="Normal">Normal</option>
                <option value="H1">H1</option>
                <option value="H2">H2</option>
                <option value="H3">H3</option>
              </select>
            </div>

            <div className="tiptap-toolbar-divider" />

            {/* Formatting */}
            <div className="tiptap-toolbar-group">
              <button
                onClick={toggleBold}
                className={`tiptap-toolbar-btn ${editor?.isActive("bold") ? "is-active" : ""}`}
                title="Bold"
              >
                <FaBold />
              </button>
              <button
                onClick={toggleItalic}
                className={`tiptap-toolbar-btn ${editor?.isActive("italic") ? "is-active" : ""}`}
                title="Italic"
              >
                <FaItalic />
              </button>
              <button
                onClick={toggleUnderline}
                className={`tiptap-toolbar-btn ${editor?.isActive("underline") ? "is-active" : ""}`}
                title="Underline"
              >
                <FaUnderline />
              </button>
            </div>

            <div className="tiptap-toolbar-divider" />

            {/* Lists */}
            <div className="tiptap-toolbar-group">
              <button
                onClick={toggleBulletList}
                className={`tiptap-toolbar-btn ${editor?.isActive("bulletList") ? "is-active" : ""}`}
                title="Bullet List"
              >
                <FaListUl />
              </button>
              <button
                onClick={toggleOrderedList}
                className={`tiptap-toolbar-btn ${editor?.isActive("orderedList") ? "is-active" : ""}`}
                title="Numbered List"
              >
                <FaListOl />
              </button>
            </div>

            <div className="tiptap-toolbar-divider" />

            {/* Extras */}
            <div className="tiptap-toolbar-group">
              <button
                onClick={toggleBlockquote}
                className={`tiptap-toolbar-btn ${editor?.isActive("blockquote") ? "is-active" : ""}`}
                title="Quote"
              >
                <FaQuoteLeft />
              </button>
              <button
                onClick={toggleCodeBlock}
                className={`tiptap-toolbar-btn ${editor?.isActive("codeBlock") ? "is-active" : ""}`}
                title="Code Block"
              >
                <FaCode />
              </button>
            </div>
          </div>

          {/* ─── EDITOR ─── */}
          <EditorContent editor={editor} className="tiptap-editor" />
        </div>

        {/* ─── STATS ─── */}
        <div className="note-stats">
          <span>📝 Words: {wordCount}</span>
          <span>📄 Characters: {characterCount}</span>
          <span>⏱️ Reading Time: {readingTime} min</span>
          <span>📑 Paragraphs: {paragraphCount}</span>
        </div>
      </div>
    </div>
  );
}

export default CreateNote;