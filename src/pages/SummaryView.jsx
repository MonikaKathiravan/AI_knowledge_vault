import "./SummaryView.css";
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FaArrowLeft, FaCopy, FaDownload, FaTrash, FaStar, FaRegStar } from "react-icons/fa";

function SummaryView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSummary();
  }, [id]);

  const fetchSummary = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/summary/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setSummary(data.summary);
    } catch (error) {
      console.error("Error fetching summary:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (summary) {
      navigator.clipboard.writeText(summary.summaryText);
      alert("Copied!");
    }
  };

  const handleDownload = () => {
    if (summary) {
      const blob = new Blob([summary.summaryText], { type: "text/plain" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `${summary.summaryTitle || "summary"}.txt`;
      link.click();
    }
  };

  const toggleFavorite = async () => {
    if (!summary) return;
    const res = await fetch(`http://localhost:5000/api/summary/favorite/${summary._id}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (data.success) setSummary(data.summary);
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this summary?")) return;
    await fetch(`http://localhost:5000/api/summary/${summary._id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    navigate("/ai-summaries");
  };

  if (loading) return <div className="summary-view-loading">Loading...</div>;
  if (!summary) return <div className="summary-view-error">Summary not found</div>;

  return (
    <div className="summary-view-page">
      <div className="summary-view-card">
        <div className="summary-view-header">
          <button className="summary-view-back" onClick={() => navigate("/ai-summaries")}>
            <FaArrowLeft /> Back
          </button>
          <h1>{summary.summaryTitle}</h1>
          <div className="summary-view-actions">
            <button onClick={toggleFavorite} title="Favorite">
              {summary.isFavorite ? <FaStar className="active" /> : <FaRegStar />}
            </button>
            <button onClick={handleCopy}><FaCopy /> Copy</button>
            <button onClick={handleDownload}><FaDownload /> Download</button>
            <button className="delete" onClick={handleDelete}><FaTrash /> Delete</button>
          </div>
        </div>
        <div className="summary-view-meta">
          <span>Type: {summary.summaryType}</span>
          <span>Source: {summary.documentId?.displayName || summary.noteId?.title || "Unknown"}</span>
          <span>Created: {new Date(summary.createdAt).toLocaleString()}</span>
        </div>
        <div className="summary-view-content">
          {summary.summaryText.split("\n").map((line, i) => (
            <p key={i}>{line}</p>
          ))}
        </div>
        <div className="summary-view-stats">
          <span>Original words: {summary.originalWordCount}</span>
          <span>Summary words: {summary.summaryWordCount}</span>
          <span>Reading time: {summary.readingTimeMinutes} min</span>
          <span>Compression: {((1 - summary.summaryWordCount / summary.originalWordCount) * 100).toFixed(0)}%</span>
        </div>
      </div>
    </div>
  );
}

export default SummaryView;