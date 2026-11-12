import "./Flashcards.css";
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaPlus,
  FaSearch,
  FaStar,
  FaRegStar,
  FaBook,
  FaBrain,
  FaVolumeUp,
  FaVolumeMute,
  FaArrowLeft,
  FaArrowRight,
  FaCheck,
  FaFire,
  FaGem,
} from "react-icons/fa";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
} from "chart.js";
import { Doughnut, Bar } from "react-chartjs-2";
import FlashcardCard from "../components/FlashcardCard";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
);

function Flashcards() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const [flashcards, setFlashcards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState({
    category: "",
    tag: "",
    favorite: false,
    difficult: false,
    learned: false,
  });
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [generateType, setGenerateType] = useState("document");
  const [sourceId, setSourceId] = useState("");
  const [documents, setDocuments] = useState([]);
  const [notes, setNotes] = useState([]);
  const [summaries, setSummaries] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    learned: 0,
    favorite: 0,
    difficult: 0,
    remaining: 0,
  });
  const [xp, setXp] = useState(0);
  const [level, setLevel] = useState(1);
  const [streak, setStreak] = useState(0);
  const [showStudyMode, setShowStudyMode] = useState(false);
  const [studyIndex, setStudyIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);

  useEffect(() => {
    if (window.speechSynthesis) setVoiceSupported(true);
  }, []);

  const fetchFlashcards = useCallback(async () => {
    try {
      let url = "http://localhost:5000/api/flashcards?";
      const params = new URLSearchParams();
      if (filter.category) params.append("category", filter.category);
      if (filter.tag) params.append("tag", filter.tag);
      if (filter.favorite) params.append("favorite", "true");
      if (filter.difficult) params.append("difficult", "true");
      if (filter.learned) params.append("learned", "true");
      url += params.toString();
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setFlashcards(data.flashcards);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [token, filter]);

  const fetchStats = useCallback(async () => {
    const res = await fetch("http://localhost:5000/api/flashcards/stats", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (data.success) setStats(data.stats);
  }, [token]);

  const fetchSources = useCallback(async () => {
    const [docRes, noteRes, sumRes] = await Promise.all([
      fetch("http://localhost:5000/api/documents", {
        headers: { Authorization: `Bearer ${token}` },
      }),
      fetch("http://localhost:5000/api/notes", {
        headers: { Authorization: `Bearer ${token}` },
      }),
      fetch("http://localhost:5000/api/summary/user", {
        headers: { Authorization: `Bearer ${token}` },
      }),
    ]);
    const docData = await docRes.json();
    const noteData = await noteRes.json();
    const sumData = await sumRes.json();
    if (docData.success) setDocuments(docData.documents);
    if (noteData.success) setNotes(noteData.notes);
    if (sumData.success) setSummaries(sumData.summaries);
  }, [token]);

  useEffect(() => {
    fetchFlashcards();
    fetchStats();
    fetchSources();
    const savedXp = localStorage.getItem("flashcardXp");
    if (savedXp) setXp(parseInt(savedXp));
    const savedLevel = localStorage.getItem("flashcardLevel");
    if (savedLevel) setLevel(parseInt(savedLevel));
    const savedStreak = localStorage.getItem("flashcardStreak");
    if (savedStreak) setStreak(parseInt(savedStreak));
  }, [fetchFlashcards, fetchStats, fetchSources]);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      let endpoint = "";
      let payload = {};
      if (generateType === "document") {
        endpoint = "document";
        payload = { documentId: sourceId };
      } else if (generateType === "note") {
        endpoint = "note";
        payload = { noteId: sourceId };
      } else {
        endpoint = "summary";
        payload = { summaryId: sourceId };
      }
      const res = await fetch(
        `http://localhost:5000/api/flashcards/generate/${endpoint}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        },
      );
      const data = await res.json();
      if (data.success) {
        alert(`${data.count} flashcards generated`);
        setShowGenerateModal(false);
        fetchFlashcards();
        fetchStats();
        const newXp = xp + data.count * 10;
        setXp(newXp);
        localStorage.setItem("flashcardXp", newXp);
        const newLevel = Math.floor(newXp / 1000) + 1;
        if (newLevel > level) {
          setLevel(newLevel);
          localStorage.setItem("flashcardLevel", newLevel);
        }
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setGenerating(false);
    }
  };

  const startStudy = () => {
    if (flashcards.length === 0) return alert("No flashcards to study!");
    setShowStudyMode(true);
    setStudyIndex(0);
    setFlipped(false);
  };

  const nextCard = () => {
    if (studyIndex < flashcards.length - 1) {
      setStudyIndex(studyIndex + 1);
      setFlipped(false);
      const newStreak = streak + 1;
      setStreak(newStreak);
      localStorage.setItem("flashcardStreak", newStreak);
    }
  };

  const prevCard = () => {
    if (studyIndex > 0) {
      setStudyIndex(studyIndex - 1);
      setFlipped(false);
    }
  };

  // ─── Toggle Favorite (Unified) ───
  const toggleFavorite = async (id) => {
    try {
      // Find the current flashcard
      const card = flashcards.find((c) => c._id === id);
      if (!card) return;

      const current = card.favorite;

      // Step 1: Update the flashcard's own `favorite` flag
      const cardRes = await fetch(
        `http://localhost:5000/api/flashcards/${id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ favorite: !current }),
        },
      );
      if (!cardRes.ok) throw new Error("Failed to update flashcard favorite");

      // Step 2: Sync with the unified favorites collection
      if (!current) {
        // Add to favorites
        const favRes = await fetch("http://localhost:5000/api/favorites", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ itemType: "flashcard", itemId: id }),
        });
        if (!favRes.ok) throw new Error("Failed to add to favorites");
      } else {
        // Remove from favorites: find the favorite ID first
        const checkRes = await fetch(
          `http://localhost:5000/api/favorites/check?itemType=flashcard&itemId=${id}`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        const checkData = await checkRes.json();
        if (checkData.success && checkData.favorite) {
          const delRes = await fetch(
            `http://localhost:5000/api/favorites/${checkData.favorite._id}`,
            {
              method: "DELETE",
              headers: { Authorization: `Bearer ${token}` },
            },
          );
          if (!delRes.ok) throw new Error("Failed to remove from favorites");
        }
      }

      // Update local state only after both operations succeed
      setFlashcards(
        flashcards.map((c) =>
          c._id === id ? { ...c, favorite: !current } : c,
        ),
      );
    } catch (err) {
      console.error("Favorite error:", err);
      alert("Failed to update favorite. Please try again.");
    }
  };

  const speak = (text) => {
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

  // ─── Charts data ───
  const categoryData = flashcards.reduce((acc, c) => {
    acc[c.category] = (acc[c.category] || 0) + 1;
    return acc;
  }, {});
  const categoryLabels = Object.keys(categoryData);
  const categoryValues = Object.values(categoryData);
  const dailyData = {
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    datasets: [
      {
        label: "Cards Learned",
        data: [5, 12, 8, 15, 10, 20, 18],
        backgroundColor: [
          "#4F46E5",
          "#7C3AED",
          "#EC4899",
          "#F59E0B",
          "#10B981",
          "#3B82F6",
          "#8B5CF6",
        ],
        borderRadius: 4,
      },
    ],
  };

  const total = flashcards.length;
  const learnedCount = stats.learned || 0;
  const progress = total > 0 ? Math.round((learnedCount / total) * 100) : 0;

  return (
    <div className="flashcards-page">
      {/* ─── Hero ─── */}
      <div className="flashcards-hero">
        <div className="hero-content">
          <h1>📚 Flashcards</h1>
          <p>Generate • Practice • Memorize • Quiz Yourself</p>
          <div className="hero-buttons">
            <button
              className="hero-btn primary"
              onClick={() => setShowGenerateModal(true)}
            >
              <FaPlus /> Generate
            </button>
            <button className="hero-btn secondary" onClick={startStudy}>
              <FaBook /> Study
            </button>
          </div>
          <div className="hero-stats-row">
            <span className="hero-stat">
              <FaBook /> {total} total
            </span>
            <span className="hero-stat">
              <FaCheck /> {learnedCount} learned
            </span>
            <span className="hero-stat">
              <FaFire /> {streak} day streak
            </span>
            <span className="hero-stat">
              <FaGem /> {xp} XP
            </span>
          </div>
          <div className="hero-progress">
            <span>Progress</span>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <span>{progress}%</span>
          </div>
        </div>
        <div className="hero-illustration">🧠</div>
      </div>

      {/* ─── Stats ─── */}
      <div className="flashcards-stats">
        <div className="stat-card">
          <span className="stat-icon">📄</span>
          <div>
            <h3>{stats.total}</h3>
            <p>Total</p>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">✅</span>
          <div>
            <h3>{stats.learned}</h3>
            <p>Learned</p>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">⏳</span>
          <div>
            <h3>{stats.remaining}</h3>
            <p>Remaining</p>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">⭐</span>
          <div>
            <h3>{stats.favorite}</h3>
            <p>Favorites</p>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">💪</span>
          <div>
            <h3>{stats.difficult}</h3>
            <p>Difficult</p>
          </div>
        </div>
      </div>

      {/* ─── Charts ─── */}
      {flashcards.length > 0 && (
        <div className="chart-section">
          <div className="chart-box">
            <h4>📂 Categories</h4>
            <div className="chart-wrapper">
              <Doughnut
                data={{
                  labels: categoryLabels,
                  datasets: [
                    {
                      data: categoryValues,
                      backgroundColor: [
                        "#4F46E5",
                        "#7C3AED",
                        "#EC4899",
                        "#F59E0B",
                        "#10B981",
                        "#EF4444",
                      ],
                      borderWidth: 2,
                      borderColor: "white",
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: true,
                  plugins: {
                    legend: {
                      position: "bottom",
                      labels: { boxWidth: 12, padding: 8, font: { size: 11 } },
                    },
                  },
                  cutout: "60%",
                }}
                width={180}
                height={180}
              />
            </div>
          </div>
          <div className="chart-box">
            <h4>📊 Weekly Activity</h4>
            <div className="chart-wrapper">
              <Bar
                data={dailyData}
                options={{
                  responsive: true,
                  maintainAspectRatio: true,
                  plugins: { legend: { display: false } },
                  scales: {
                    y: {
                      beginAtZero: true,
                      grid: { display: false },
                      ticks: { font: { size: 10 } },
                    },
                    x: {
                      grid: { display: false },
                      ticks: { font: { size: 10 } },
                    },
                  },
                }}
                width={240}
                height={150}
              />
            </div>
            <p className="chart-note">*Demo data</p>
          </div>
        </div>
      )}

      {/* ─── AI Insights ─── */}
      <div className="ai-insights">
        <h3>
          <FaBrain /> AI Study Insights
        </h3>
        <div className="insight-grid">
          <div className="insight-card weak">
            <strong>Weak Topic</strong> HashMap
          </div>
          <div className="insight-card strong">
            <strong>Strong Topic</strong> ArrayList
          </div>
          <div className="insight-card recommendation">
            <strong>Recommendation</strong> Practice Collections
          </div>
        </div>
      </div>

      {/* ─── Toolbar ─── */}
      <div className="flashcards-toolbar">
        <div className="search-box">
          <FaSearch />
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filters">
          <input
            type="text"
            placeholder="Category"
            value={filter.category}
            onChange={(e) => setFilter({ ...filter, category: e.target.value })}
          />
          <input
            type="text"
            placeholder="Tag"
            value={filter.tag}
            onChange={(e) => setFilter({ ...filter, tag: e.target.value })}
          />
          <label>
            <input
              type="checkbox"
              checked={filter.favorite}
              onChange={() =>
                setFilter({ ...filter, favorite: !filter.favorite })
              }
            />{" "}
            Favorites
          </label>
          <label>
            <input
              type="checkbox"
              checked={filter.difficult}
              onChange={() =>
                setFilter({ ...filter, difficult: !filter.difficult })
              }
            />{" "}
            Difficult
          </label>
          <label>
            <input
              type="checkbox"
              checked={filter.learned}
              onChange={() =>
                setFilter({ ...filter, learned: !filter.learned })
              }
            />{" "}
            Learned
          </label>
        </div>
        <button className="study-btn" onClick={startStudy}>
          <FaBook /> Study
        </button>
      </div>

      {/* ─── Grid ─── */}
      {loading ? (
        <div className="loading">Loading...</div>
      ) : flashcards.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🧠</div>
          <h2>No Flashcards</h2>
          <p>Generate from documents, notes, or summaries.</p>
          <button onClick={() => setShowGenerateModal(true)}>
            <FaPlus /> Generate
          </button>
        </div>
      ) : (
        <div className="flashcards-grid">
          {flashcards.map((card) => (
            <div key={card._id} className="flashcard-wrapper">
              <FlashcardCard
                card={card}
                onUpdate={fetchFlashcards}
                onStats={fetchStats}
              />
              <div className="card-actions">
                <button
                  onClick={() => speak(card.question + " " + card.answer)}
                  title="Listen"
                >
                  {speaking ? <FaVolumeMute /> : <FaVolumeUp />}
                </button>
                <button
                  onClick={() => toggleFavorite(card._id)}
                  title="Favorite"
                >
                  {card.favorite ? (
                    <FaStar className="active" />
                  ) : (
                    <FaRegStar />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─── Study Modal ─── */}
      {showStudyMode && (
        <div className="modal-overlay" onClick={() => setShowStudyMode(false)}>
          <div
            className="modal-content study-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <h2>Study Mode</h2>
            <div className="study-progress">
              {studyIndex + 1} / {flashcards.length}
            </div>
            <div className="study-card" onClick={() => setFlipped(!flipped)}>
              <div className={`study-inner ${flipped ? "flipped" : ""}`}>
                <div className="study-front">
                  <h3>Question</h3>
                  <p>{flashcards[studyIndex].question}</p>
                </div>
                <div className="study-back">
                  <h3>Answer</h3>
                  <p>{flashcards[studyIndex].answer}</p>
                </div>
              </div>
            </div>
            <div className="study-nav">
              <button onClick={prevCard}>
                <FaArrowLeft />
              </button>
              <button onClick={() => setFlipped(!flipped)}>Flip</button>
              <button onClick={nextCard}>
                <FaArrowRight />
              </button>
            </div>
            <div className="shortcuts-hint">Space: Flip | ← → Next/Prev</div>
          </div>
        </div>
      )}

      {/* ─── Generate Modal ─── */}
      {showGenerateModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowGenerateModal(false)}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Generate Flashcards</h2>
            <div className="modal-body">
              <label>Source</label>
              <select
                value={generateType}
                onChange={(e) => setGenerateType(e.target.value)}
              >
                <option value="document">Document</option>
                <option value="note">Note</option>
                <option value="summary">AI Summary</option>
              </select>
              <label>Select {generateType}</label>
              <select
                value={sourceId}
                onChange={(e) => setSourceId(e.target.value)}
              >
                <option value="">Select...</option>
                {generateType === "document" &&
                  documents.map((d) => (
                    <option key={d._id} value={d._id}>
                      {d.displayName}
                    </option>
                  ))}
                {generateType === "note" &&
                  notes.map((n) => (
                    <option key={n._id} value={n._id}>
                      {n.title}
                    </option>
                  ))}
                {generateType === "summary" &&
                  summaries.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.summaryTitle}
                    </option>
                  ))}
              </select>
              <button
                className="generate-btn"
                onClick={handleGenerate}
                disabled={generating || !sourceId}
              >
                {generating ? "Generating..." : "Generate"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Flashcards;
