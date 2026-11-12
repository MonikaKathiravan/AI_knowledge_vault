import "./Summary.css";
import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  FaArrowLeft,
  FaCopy,
  FaDownload,
  FaSync,
  FaBrain,
  FaStar,
  // FaRegStar,
  // FaEye,
  FaClock,
  FaCompress,
  FaFileAlt,
} from "react-icons/fa";

function Summary() {
  const { documentId } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [summaryType, setSummaryType] = useState("medium");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [docName, setDocName] = useState("");
  const [stats, setStats] = useState(null);
  const [hasExisting, setHasExisting] = useState(false);

  // ─── Check for existing summary ───
  const fetchSummary = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(
        `http://localhost:5000/api/summary/${documentId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const data = await res.json();
      if (data.success) {
        setSummary(data.summary);
        setDocName(data.summary.documentId?.displayName || "Document");
        setHasExisting(true);
        setStats(null);
      } else {
        // No summary exists
        setSummary(null);
        setHasExisting(false);
        // Fetch document name from the documents endpoint
        await fetchDocumentName();
      }
    } catch (err) {
      setError("Could not load summary. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fetchDocumentName = async () => {
    try {
      const res = await fetch(
        `http://localhost:5000/api/documents/${documentId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const data = await res.json();
      if (data.success) {
        setDocName(data.document.displayName);
      }
    } catch (err) {
      console.error("Error fetching document name:", err);
    }
  };

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    fetchSummary();
  }, [documentId, token, navigate]);

  // ─── Generate Summary ───
  const generateSummary = async () => {
    setGenerating(true);
    setError("");
    try {
      const res = await fetch(`http://localhost:5000/api/summary/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ documentId, type: summaryType }),
      });
      const data = await res.json();
      if (data.success) {
        setSummary(data.summary);
        setDocName(data.summary.documentId?.displayName || "Document");
        setHasExisting(true);
        setStats(data.statistics);
      } else {
        setError(data.message || "Failed to generate summary");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  // ─── Regenerate Summary ───
  const regenerateSummary = async () => {
    setGenerating(true);
    setError("");
    try {
      const res = await fetch(`http://localhost:5000/api/summary/regenerate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ documentId, type: summaryType }),
      });
      const data = await res.json();
      if (data.success) {
        setSummary(data.summary);
        setStats(null);
      } else {
        setError(data.message || "Failed to regenerate summary");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  // ─── Copy Summary ───
  const copySummary = () => {
    if (summary && summary.summaryText) {
      navigator.clipboard.writeText(summary.summaryText);
      alert("Summary copied to clipboard!");
    }
  };

  // ─── Download as TXT ───
  const downloadSummary = () => {
    if (summary && summary.summaryText) {
      const blob = new Blob([summary.summaryText], { type: "text/plain" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `summary_${docName || "document"}.txt`;
      a.click();
      window.URL.revokeObjectURL(url);
    }
  };

  // ─── Render content ───
  const renderSummaryContent = () => {
    if (loading) {
      return <div className="summary-loading">Loading summary...</div>;
    }

    if (error) {
      return (
        <div className="summary-error">
          <p>{error}</p>
          <button className="summary-retry-btn" onClick={fetchSummary}>
            Retry
          </button>
        </div>
      );
    }

    if (!hasExisting && !summary) {
      return (
        <div className="summary-empty">
          <div className="summary-empty-icon">📄</div>
          <h3>No summary yet</h3>
          <p>
            Generate an AI summary for{" "}
            <strong>{docName || "this document"}</strong>.
          </p>
          <div className="summary-generate-area">
            <div className="summary-type-selector">
              <label>Summary Type:</label>
              <select
                value={summaryType}
                onChange={(e) => setSummaryType(e.target.value)}
                disabled={generating}
              >
                <option value="short">Short</option>
                <option value="medium">Medium</option>
                <option value="detailed">Detailed</option>
                <option value="bullet">Bullet Points</option>
                <option value="paragraph">Paragraph</option>
                <option value="academic">Academic</option>
                <option value="technical">Technical</option>
                <option value="beginner">Beginner Friendly</option>
              </select>
            </div>
            <button
              className="summary-generate-btn"
              onClick={generateSummary}
              disabled={generating}
            >
              {generating ? "Generating..." : "Generate Summary"}
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="summary-content">
        <div className="summary-header">
          <div className="summary-doc-info">
            <h2>{docName}</h2>
            <span className="summary-badge">AI Generated</span>
          </div>
          <div className="summary-actions-top">
            <div className="summary-type-selector">
              <label>Type:</label>
              <select
                value={summaryType}
                onChange={(e) => setSummaryType(e.target.value)}
                disabled={generating}
              >
                <option value="short">Short</option>
                <option value="medium">Medium</option>
                <option value="detailed">Detailed</option>
                <option value="bullet">Bullet Points</option>
                <option value="paragraph">Paragraph</option>
                <option value="academic">Academic</option>
                <option value="technical">Technical</option>
                <option value="beginner">Beginner Friendly</option>
              </select>
            </div>
            <button
              className="summary-regenerate-btn"
              onClick={regenerateSummary}
              disabled={generating}
            >
              <FaSync className={generating ? "spinning" : ""} /> Regenerate
            </button>
          </div>
        </div>

        {/* Summary Text */}
        <div className="summary-text">
          {summary.summaryText.split("\n").map((line, i) => (
            <p key={i}>{line}</p>
          ))}
        </div>

        {/* Key Points */}
        {summary.keyPoints && summary.keyPoints.length > 0 && (
          <div className="summary-keypoints">
            <h4>🔑 Key Points</h4>
            <ul>
              {summary.keyPoints.map((point, i) => (
                <li key={i}>{point}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Keywords */}
        {summary.keywords && summary.keywords.length > 0 && (
          <div className="summary-keywords">
            <h4>🏷️ Keywords</h4>
            <div className="keyword-chips">
              {summary.keywords.map((kw, i) => (
                <span key={i} className="keyword-chip">
                  {kw}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Statistics */}
        {(stats || summary.originalWordCount) && (
          <div className="summary-stats">
            <h4>📊 Statistics</h4>
            <div className="stats-grid">
              <div className="stat-item">
                <span className="stat-label">
                  <FaFileAlt /> Original Words
                </span>
                <span className="stat-value">
                  {summary.originalWordCount || 0}
                </span>
              </div>
              <div className="stat-item">
                <span className="stat-label">
                  <FaBrain /> Summary Words
                </span>
                <span className="stat-value">
                  {summary.summaryWordCount || 0}
                </span>
              </div>
              <div className="stat-item">
                <span className="stat-label">
                  <FaCompress /> Compression
                </span>
                <span className="stat-value">
                  {summary.compressionRatio
                    ? (summary.compressionRatio * 100).toFixed(0) + "%"
                    : "N/A"}
                </span>
              </div>
              <div className="stat-item">
                <span className="stat-label">
                  <FaClock /> Original Read Time
                </span>
                <span className="stat-value">
                  {Math.ceil((summary.originalWordCount || 0) / 200)} min
                </span>
              </div>
              <div className="stat-item">
                <span className="stat-label">
                  <FaClock /> Summary Read Time
                </span>
                <span className="stat-value">
                  {Math.ceil((summary.summaryWordCount || 0) / 200)} min
                </span>
              </div>
              <div className="stat-item">
                <span className="stat-label">
                  <FaStar /> Time Saved
                </span>
                <span className="stat-value">
                  {Math.ceil((summary.originalWordCount || 0) / 200) -
                    Math.ceil((summary.summaryWordCount || 0) / 200)}{" "}
                  min
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="summary-actions-bottom">
          <button className="summary-copy-btn" onClick={copySummary}>
            <FaCopy /> Copy
          </button>
          <button className="summary-download-btn" onClick={downloadSummary}>
            <FaDownload /> Download TXT
          </button>
          <Link to="/documents" className="summary-back-btn">
            <FaArrowLeft /> Back to Documents
          </Link>
        </div>
      </div>
    );
  };

  return (
    <div className="summary-page">
      <div className="summary-container">
        <div className="summary-breadcrumb">
          <Link to="/documents" className="summary-breadcrumb-link">
            <FaArrowLeft /> Documents
          </Link>
          <span className="summary-breadcrumb-sep">/</span>
          <span className="summary-breadcrumb-current">AI Summary</span>
        </div>
        {renderSummaryContent()}
      </div>
    </div>
  );
}

export default Summary;
