import "./Analytics.css";
import { useState, useEffect } from "react";
//import { useNavigate } from "react-router-dom";
import {
  FaFileAlt,
  FaStickyNote,
  FaBrain,
  FaBook,
  FaComments,
  FaStar,
  FaDownload,
  FaLightbulb,
  FaHistory,
  FaCheckCircle,
  FaPlus,
  FaSearch,
  FaChartLine,
  FaClock,
  FaRegCalendarCheck,
  FaRobot,
  FaLayerGroup,

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
  PointElement,
  LineElement,
  Filler,
  RadarController,
  RadialLinearScale,
} from "chart.js";
import { Bar, Line, Doughnut, Radar } from "react-chartjs-2";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  PointElement,
  LineElement,
  Filler,
  RadarController,
  RadialLinearScale,
);

function Analytics() {
 // const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  // ─── NEW COLOR PALETTE ──────────────────────────────────
  const chartColors = {
    indigo: "#4F46E5",
    purple: "#7C3AED",
    pink: "#EC4899",
    amber: "#F59E0B",
    emerald: "#10B981",
    rose: "#F43F5E",
    cyan: "#06B6D4",
    violet: "#8B5CF6",
    teal: "#14B8A6",
    orange: "#F97316",
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/analytics", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await res.json();
      if (result.success) {
        setData(result.data);
      } else {
        alert("Failed to load analytics");
      }
    } catch (error) {
      console.error("Analytics fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  // ─── MOCK DATA (unchanged) ──────────────────────────────
  const generateHeatmap = (days) => {
    const weeks = Math.ceil(days / 7);
    const grid = [];
    for (let w = 0; w < weeks; w++) {
      const row = [];
      for (let d = 0; d < 7; d++) {
        row.push(Math.floor(Math.random() * 5));
      }
      grid.push(row);
    }
    return grid;
  };

  const generateCalendar = (days) => {
    const startDay = new Date();
    startDay.setDate(startDay.getDate() - days);
    const events = [];
    for (let i = 0; i < days; i++) {
      const d = new Date(startDay);
      d.setDate(d.getDate() + i);
      events.push({
        date: d,
        count: Math.floor(Math.random() * 4),
        type: ["note", "doc", "chat", "flashcard"][Math.floor(Math.random() * 4)],
      });
    }
    return events;
  };

  const achievements = [
    { icon: "🏆", name: "Knowledge Explorer", current: 45, target: 50, unit: "docs" },
    { icon: "🥇", name: "Flashcard Master", current: 72, target: 100, unit: "cards" },
    { icon: "🚀", name: "AI Expert", current: 64, target: 100, unit: "queries" },
    { icon: "📚", name: "Study Streak", current: 15, target: 30, unit: "days" },
  ];

  const goals = [
    { id: 1, text: "Read 2 Documents", done: true },
    { id: 2, text: "Create 3 Notes", done: true },
    { id: 3, text: "Generate Flashcards", done: false },
    { id: 4, text: "Ask AI 5 Questions", done: false },
  ];

  const revisions = ["Java Collections", "Networking Basics", "React Hooks"];

  if (loading) {
    return <div className="analytics-loading">Loading analytics...</div>;
  }

  if (!data) {
    return <div className="analytics-error">Could not load analytics.</div>;
  }

  const {
    documentStats,
    noteStats,
    summaryStats,
    flashcardStats,
    chatStats,
    favoriteStats,
    knowledgeGrowth,
    mostUsedTopics,
    progress,
    aiUsage,
    studyTime,
    recentActivity,
  } = data;

  // ─── CHART DATA WITH NEW COLORS ──────────────────────────
  const growthLabels = knowledgeGrowth.labels.map(formatDate);
  const growthData = {
    labels: growthLabels,
    datasets: [
      {
        label: "Documents",
        data: knowledgeGrowth.docCounts,
        borderColor: chartColors.indigo,
        backgroundColor: "rgba(79, 70, 229, 0.1)",
        fill: true,
        tension: 0.4,
        pointBackgroundColor: chartColors.indigo,
        pointRadius: 3,
        borderWidth: 2,
      },
      {
        label: "Notes",
        data: knowledgeGrowth.noteCounts,
        borderColor: chartColors.purple,
        backgroundColor: "rgba(124, 58, 237, 0.1)",
        fill: true,
        tension: 0.4,
        pointBackgroundColor: chartColors.purple,
        pointRadius: 3,
        borderWidth: 2,
      },
      {
        label: "Flashcards",
        data: knowledgeGrowth.docCounts.map(() => Math.floor(Math.random() * 10) + 2),
        borderColor: chartColors.pink,
        backgroundColor: "rgba(236, 72, 153, 0.1)",
        fill: true,
        tension: 0.4,
        pointBackgroundColor: chartColors.pink,
        pointRadius: 3,
        borderWidth: 2,
      },
      {
        label: "Summaries",
        data: knowledgeGrowth.noteCounts.map(() => Math.floor(Math.random() * 8) + 1),
        borderColor: chartColors.cyan,
        backgroundColor: "rgba(6, 182, 212, 0.1)",
        fill: true,
        tension: 0.4,
        pointBackgroundColor: chartColors.cyan,
        pointRadius: 3,
        borderWidth: 2,
      },
    ],
  };

  const aiTrendLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const aiTrendData = {
    labels: aiTrendLabels,
    datasets: [
      {
        label: "Chats",
        data: aiTrendLabels.map(() => Math.floor(Math.random() * 15) + 5),
        borderColor: chartColors.indigo,
        backgroundColor: "rgba(79, 70, 229, 0.1)",
        fill: true,
        tension: 0.3,
        pointBackgroundColor: chartColors.indigo,
        pointRadius: 3,
        borderWidth: 2,
      },
      {
        label: "Summaries",
        data: aiTrendLabels.map(() => Math.floor(Math.random() * 10) + 2),
        borderColor: chartColors.purple,
        backgroundColor: "rgba(124, 58, 237, 0.1)",
        fill: true,
        tension: 0.3,
        pointBackgroundColor: chartColors.purple,
        pointRadius: 3,
        borderWidth: 2,
      },
      {
        label: "Searches",
        data: aiTrendLabels.map(() => Math.floor(Math.random() * 20) + 10),
        borderColor: chartColors.cyan,
        backgroundColor: "rgba(6, 182, 212, 0.1)",
        fill: true,
        tension: 0.3,
        pointBackgroundColor: chartColors.cyan,
        pointRadius: 3,
        borderWidth: 2,
      },
    ],
  };

  const favTypes = favoriteStats.byType || {};
  const favLabels = Object.keys(favTypes);
  const favValues = Object.values(favTypes);
  const donutColors = [
    chartColors.indigo,
    chartColors.purple,
    chartColors.pink,
    chartColors.amber,
    chartColors.emerald,
  ];

  const aiFeatures = ["Chat AI", "Summaries", "Flashcards", "Search", "Notes"];
  const aiFeatureData = [
    aiUsage.chats || 20,
    aiUsage.summaries || 10,
    aiUsage.flashcards || 15,
    aiUsage.searches || 8,
    noteStats.total || 12,
  ];
  const barColors = [
    chartColors.indigo,
    chartColors.purple,
    chartColors.pink,
    chartColors.amber,
    chartColors.emerald,
  ];

  const radarData = {
    labels: ["Documents", "Notes", "Flashcards", "Chats", "Summaries", "Searches"],
    datasets: [
      {
        label: "Your Activity",
        data: [
          documentStats.total,
          noteStats.total,
          flashcardStats.total,
          chatStats.total,
          summaryStats.total,
          aiUsage.searches || 5,
        ],
        backgroundColor: "rgba(79, 70, 229, 0.15)",
        borderColor: chartColors.indigo,
        pointBackgroundColor: chartColors.indigo,
        pointRadius: 4,
        borderWidth: 2,
        fill: true,
      },
    ],
  };

  const topicLabels = mostUsedTopics.map((t) => t.topic);
  const topicCounts = mostUsedTopics.map((t) => t.count);
  const heatmapData = generateHeatmap(28);
  const calendarEvents = generateCalendar(30);

  // stat icons backgrounds – map from label to gradient
  const getStatIconBg = (label) => {
    const map = {
      "Documents": "linear-gradient(135deg, #4F46E5, #7C3AED)",
      "Notes": "linear-gradient(135deg, #7C3AED, #EC4899)",
      "AI Summaries": "linear-gradient(135deg, #EC4899, #F59E0B)",
      "Flashcards": "linear-gradient(135deg, #F59E0B, #10B981)",
      "AI Chats": "linear-gradient(135deg, #10B981, #06B6D4)",
      "Searches": "linear-gradient(135deg, #06B6D4, #4F46E5)",
      "Favorites": "linear-gradient(135deg, #F43F5E, #F59E0B)",
      "Study Time": "linear-gradient(135deg, #8B5CF6, #14B8A6)",
    };
    return map[label] || "linear-gradient(135deg, #4F46E5, #7C3AED)";
  };

  return (
    <div className="analytics-page">
      {/* ═══ HEADER ═══ */}
      <div className="analytics-header">
        <div className="header-left">
          <h1>📊 Analytics Dashboard</h1>
          <p>Track your knowledge growth and AI usage</p>
        </div>
        <div className="analytics-actions">
          <span className="date-filter">📅 Last 30 Days</span>
          <button className="export-btn">
            <FaDownload /> Export Report
          </button>
        </div>
      </div>

      {/* ═══ OVERVIEW CARDS (with gradient icons) ═══ */}
      <div className="analytics-stats">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: getStatIconBg("Documents") }}><FaFileAlt /></div>
          <div><h3>{documentStats.total}</h3><p>Documents</p></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: getStatIconBg("Notes") }}><FaStickyNote /></div>
          <div><h3>{noteStats.total}</h3><p>Notes</p></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: getStatIconBg("AI Summaries") }}><FaBrain /></div>
          <div><h3>{summaryStats.total}</h3><p>AI Summaries</p></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: getStatIconBg("Flashcards") }}><FaBook /></div>
          <div><h3>{flashcardStats.total}</h3><p>Flashcards</p></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: getStatIconBg("AI Chats") }}><FaComments /></div>
          <div><h3>{chatStats.total}</h3><p>AI Chats</p></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: getStatIconBg("Searches") }}><FaSearch /></div>
          <div><h3>{aiUsage.searches || 12}</h3><p>Searches</p></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: getStatIconBg("Favorites") }}><FaStar /></div>
          <div><h3>{favoriteStats.total}</h3><p>Favorites</p></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: getStatIconBg("Study Time") }}><FaClock /></div>
          <div><h3>{studyTime.week || "14h"}</h3><p>Study Time</p></div>
        </div>
      </div>

      {/* ═══ PROGRESS & STUDY TIME ═══ */}
      <div className="analytics-progress-section">
        <div className="progress-card">
          <h3>📈 Learning Progress</h3>
          <div className="progress-ring">
            <svg viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="50" fill="none" stroke="#E5E7EB" strokeWidth="10" />
              <circle
                cx="60"
                cy="60"
                r="50"
                fill="none"
                stroke="#4F46E5"
                strokeWidth="10"
                strokeDasharray={`${2 * Math.PI * 50 * (progress / 100)} ${2 * Math.PI * 50}`}
                strokeLinecap="round"
                transform="rotate(-90 60 60)"
              />
              <text x="60" y="66" textAnchor="middle" fontSize="22" fontWeight="bold" fill="#4F46E5">
                {progress}%
              </text>
            </svg>
          </div>
          <p>Overall Knowledge Progress</p>
        </div>
        <div className="study-time-card">
          <h3>⏱️ Study Time</h3>
          <div className="study-time-grid">
            <div>
              <span>Today</span>
              <strong>{studyTime.today}</strong>
            </div>
            <div>
              <span>This Week</span>
              <strong>{studyTime.week}</strong>
            </div>
            <div>
              <span>This Month</span>
              <strong>{studyTime.month}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ CHARTS ROW 1: Knowledge Growth + AI Usage Trend ═══ */}
      <div className="analytics-charts-row">
        <div className="chart-card">
          <h3>📈 Knowledge Growth Timeline</h3>
          <Line
            data={growthData}
            options={{
              responsive: true,
              aspectRatio: 2.5,
              plugins: {
                legend: { position: "top", labels: { boxWidth: 12, padding: 10, font: { size: 11 } } },
              },
              scales: {
                x: { grid: { color: "#F3F4F6" }, ticks: { font: { size: 10 } } },
                y: { beginAtZero: true, grid: { color: "#F3F4F6" }, ticks: { font: { size: 10 } } },
              },
              elements: { point: { radius: 3, hoverRadius: 6 } },
            }}
          />
        </div>
        <div className="chart-card">
          <h3>🤖 AI Usage Trend</h3>
          <Line
            data={aiTrendData}
            options={{
              responsive: true,
              aspectRatio: 2.5,
              plugins: {
                legend: { position: "top", labels: { boxWidth: 12, padding: 10, font: { size: 11 } } },
              },
              scales: {
                x: { grid: { color: "#F3F4F6" }, ticks: { font: { size: 10 } } },
                y: { beginAtZero: true, grid: { color: "#F3F4F6" }, ticks: { font: { size: 10 } } },
              },
              elements: { point: { radius: 3, hoverRadius: 6 } },
            }}
          />
        </div>
      </div>

      {/* ═══ ROW 2: Heatmap + Calendar ═══ */}
      <div className="analytics-grid-row">
        <div className="chart-card">
          <h3>🔥 Learning Heatmap</h3>
          <div className="heatmap-grid">
            {heatmapData.map((week, wi) => (
              <div key={wi} className="heatmap-week">
                {week.map((day, di) => (
                  <div key={di} className={`heatmap-cell level-${day}`} title={`Day ${wi*7 + di + 1}: ${day} activities`}></div>
                ))}
              </div>
            ))}
          </div>
          <div className="heatmap-legend">
            <span>Less</span>
            <div className="legend-colors">
              <span className="lvl-0"></span>
              <span className="lvl-1"></span>
              <span className="lvl-2"></span>
              <span className="lvl-3"></span>
              <span className="lvl-4"></span>
            </div>
            <span>More</span>
          </div>
        </div>
        <div className="chart-card">
          <h3>📅 Productivity Calendar</h3>
          <div className="calendar-grid">
            {["M", "T", "W", "T", "F", "S", "S"].map(d => <div key={d} className="cal-header">{d}</div>)}
            {calendarEvents.slice(0, 28).map((evt, idx) => (
              <div key={idx} className={`cal-cell type-${evt.type}`} title={`${evt.date.toDateString()}: ${evt.count} activities`}>
                {evt.date.getDate()}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ═══ ROW 3: Topic Distribution + AI Feature Usage ═══ */}
      <div className="analytics-charts-row">
        <div className="chart-card">
          <h3>🧩 Knowledge Distribution</h3>
          <Doughnut
            data={{
              labels: favLabels,
              datasets: [{
                data: favValues,
                backgroundColor: donutColors,
                borderWidth: 2,
                borderColor: "#FFFFFF",
              }],
            }}
            options={{
              responsive: true,
              cutout: "60%",
              plugins: {
                legend: { position: "bottom", labels: { boxWidth: 12, padding: 10, font: { size: 11 } } },
              },
            }}
          />
        </div>
        <div className="chart-card">
          <h3>⚡ AI Feature Usage</h3>
          <Bar
            data={{
              labels: aiFeatures,
              datasets: [{
                label: "Usage Count",
                data: aiFeatureData,
                backgroundColor: barColors,
                borderRadius: 6,
              }],
            }}
            options={{
              indexAxis: "y",
              responsive: true,
              aspectRatio: 2,
              plugins: { legend: { display: false } },
              scales: {
                x: { grid: { color: "#F3F4F6" }, ticks: { font: { size: 10 } } },
                y: { grid: { display: false }, ticks: { font: { size: 11 } } },
              },
            }}
          />
        </div>
      </div>

      {/* ═══ ROW 4: Radar + Study Streak ═══ */}
      <div className="analytics-grid-row">
        <div className="chart-card">
          <h3>📊 Weekly Activity Balance</h3>
          <Radar
            data={radarData}
            options={{
              responsive: true,
              aspectRatio: 1.6,
              plugins: {
                legend: { position: "top", labels: { boxWidth: 12, padding: 10, font: { size: 11 } } },
              },
              scales: {
                r: {
                  angleLines: { color: "#E5E7EB" },
                  grid: { color: "#F3F4F6" },
                  pointLabels: { font: { size: 10 } },
                  ticks: { backdropColor: "transparent", font: { size: 9 } },
                  suggestedMin: 0,
                },
              },
              elements: { point: { radius: 3, hoverRadius: 6 } },
            }}
          />
        </div>
        <div className="chart-card streak-card">
          <h3>🔥 Study Streak</h3>
          <div className="streak-display">
            <div className="streak-item">
              <span className="streak-number">15</span>
              <span className="streak-label">Current Streak</span>
            </div>
            <div className="streak-divider"></div>
            <div className="streak-item">
              <span className="streak-number">42</span>
              <span className="streak-label">Best Streak</span>
            </div>
          </div>
          <div className="streak-calendar">
            {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
              <div key={i} className={`streak-day ${i < 5 ? 'active' : ''}`}>{d}</div>
            ))}
          </div>
        </div>
      </div>

      {/* ═══ ROW 5: Top Topics + Smart AI Insights ═══ */}
      <div className="analytics-grid-row">
        <div className="chart-card">
          <h3>🏷️ Top Learning Topics</h3>
          <div className="topics-list">
            {topicLabels.slice(0, 6).map((topic, idx) => (
              <div key={idx} className="topic-item">
                <span className="topic-name">{topic}</span>
                <div className="topic-bar-bg">
                  <div
                    className="topic-bar-fill"
                    style={{
                      width: `${(topicCounts[idx] / Math.max(...topicCounts)) * 100}%`,
                      background: [chartColors.indigo, chartColors.purple, chartColors.pink, chartColors.amber, chartColors.emerald, chartColors.cyan][idx % 6],
                    }}
                  ></div>
                </div>
                <span className="topic-count">{topicCounts[idx]}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="chart-card insights-card">
          <h3>🧠 Smart AI Insights</h3>
          <div className="insights-list">
            <div className="insight-item">
              <FaRobot className="insight-icon" />
              <span>You haven't revised <strong>Java</strong> for 6 days. Review now.</span>
            </div>
            <div className="insight-item">
              <FaLightbulb className="insight-icon" />
              <span>You study mostly between <strong>7 PM – 10 PM</strong>.</span>
            </div>
            <div className="insight-item">
              <FaChartLine className="insight-icon" />
              <span>You are <strong>18%</strong> more productive this week.</span>
            </div>
            <div className="insight-item">
              <FaRegCalendarCheck className="insight-icon" />
              <span>Generate <strong>12</strong> more flashcards to finish your target.</span>
            </div>
            <div className="insight-item">
              <FaLayerGroup className="insight-icon" />
              <span>Weak topics: <strong>Database, OS, Networking</strong>.</span>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ ROW 6: Recent Activity + Goals ═══ */}
      <div className="analytics-grid-row">
        <div className="chart-card">
          <h3>🕒 Recent Activity</h3>
          <div className="activity-timeline">
            {recentActivity.slice(0, 4).map((act, idx) => (
              <div key={idx} className="activity-item">
                <span className="activity-icon">{act.icon || "📄"}</span>
                <div className="activity-details">
                  <p>{act.text}</p>
                  <span className="activity-time">{new Date(act.time).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="chart-card goals-card">
          <h3>🎯 Daily Goals</h3>
          <div className="goals-list">
            {goals.map(goal => (
              <div key={goal.id} className={`goal-item ${goal.done ? 'done' : ''}`}>
                <FaCheckCircle className="goal-check" />
                <span>{goal.text}</span>
              </div>
            ))}
          </div>
          <div className="goal-progress-ring">
            <Doughnut
              data={{
                labels: ["Completed", "Remaining"],
                datasets: [{
                  data: [goals.filter(g => g.done).length, goals.filter(g => !g.done).length],
                  backgroundColor: [chartColors.emerald, "#E5E7EB"],
                  borderWidth: 0,
                }],
              }}
              options={{ cutout: "75%", plugins: { legend: { display: false } } }}
            />
            <div className="goal-center-text">
              {Math.round((goals.filter(g => g.done).length / goals.length) * 100)}%
            </div>
          </div>
        </div>
      </div>

      {/* ═══ ACHIEVEMENTS & UPCOMING REVISIONS ═══ */}
      <div className="analytics-footer-grid">
        <div className="chart-card achievements-card">
          <h3>🏅 Achievements</h3>
          <div className="achievements-grid">
            {achievements.map((ach, idx) => (
              <div key={idx} className="achievement-item">
                <span className="ach-icon">{ach.icon}</span>
                <div className="ach-details">
                  <span className="ach-name">{ach.name}</span>
                  <div className="ach-bar">
                    <div className="ach-fill" style={{ width: `${(ach.current / ach.target) * 100}%` }}></div>
                  </div>
                  <span className="ach-progress">{ach.current}/{ach.target} {ach.unit}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="chart-card revisions-card">
          <h3>📆 Upcoming Revisions</h3>
          <ul className="revisions-list">
            {revisions.map((rev, idx) => (
              <li key={idx}><FaHistory /> {rev}</li>
            ))}
          </ul>
          <div className="quick-actions">
            <button className="qa-btn"><FaPlus /> Upload</button>
            <button className="qa-btn"><FaStickyNote /> New Note</button>
            <button className="qa-btn"><FaComments /> Ask AI</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Analytics;