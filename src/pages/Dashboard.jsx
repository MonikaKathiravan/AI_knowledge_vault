import "./Dashboard.css";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect, useCallback } from "react";
import {
  FaBell,
  FaMoon,
  FaSun,
  FaUpload,
  FaPlus,
  FaRobot,
  FaUserCircle,
} from "react-icons/fa";

function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [darkMode, setDarkMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [stats, setStats] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [recentDocs, setRecentDocs] = useState([]);
  const [totalStorage, setTotalStorage] = useState(0);
  const [progressData, setProgressData] = useState([
    { label: "Documents Read", value: 0 },
    { label: "AI Summaries", value: 0 },
    { label: "Flashcards Reviewed", value: 0 },
  ]);

  // 🆕 Upcoming tasks from goals
  const [upcomingTasks, setUpcomingTasks] = useState([]);

  const [notifications, setNotifications] = useState([
    {
      id: 1,
      text: "Welcome to AI Knowledge Vault!",
      time: "Just now",
      read: false,
    },
    {
      id: 2,
      text: "Start by uploading your first document",
      time: "Just now",
      read: false,
    },
  ]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // ─── SIDEBAR CONFIGURATION (with emojis) ──────────────
  const sidebarSections = [
    {
      title: "MAIN",
      items: [{ label: "Dashboard", emoji: "📊", path: "/dashboard" }],
    },
    {
      title: "KNOWLEDGE",
      items: [
        { label: "Documents", emoji: "📂", path: "/documents" },
        { label: "Notes", emoji: "📝", path: "/notes" },
        { label: "AI Summaries", emoji: "🧠", path: "/ai-summaries" },
        { label: "Flashcards", emoji: "📚", path: "/flashcards" },
      ],
    },
    {
      title: "AI TOOLS",
      items: [
        { label: "AI Chat", emoji: "🤖", path: "/chat" },
        { label: "Smart Search", emoji: "🔍", path: "/smart-search" },
      ],
    },
    {
      title: "PERSONAL",
      items: [
        { label: "Favorites", emoji: "⭐", path: "/favorites" },
        { label: "Analytics", emoji: "📈", path: "/analytics" },
        { label: "Goals", emoji: "🎯", path: "/goals" },
      ],
    },
    {
      title: "ACCOUNT",
      items: [
        { label: "Profile", emoji: "👤", path: "/profile" },
        { label: "Settings", emoji: "⚙️", path: "/settings" },
      ],
    },
  ];

  // ─── FETCH USER DATA ──────────────────────────────────
  const fetchUserData = useCallback(async () => {
    try {
      const storedUser = localStorage.getItem("user");
      if (!storedUser) {
        navigate("/login");
        return;
      }
      const user = JSON.parse(storedUser);
      setUserData(user);

      const token = localStorage.getItem("token");

      // ─── 1. Documents ───
      const docRes = await fetch("http://localhost:5000/api/documents", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const docData = await docRes.json();
      const docs = docData.success ? docData.documents : [];
      const docCount = docs.length;

      // ─── 2. Notes ───
      const notesRes = await fetch("http://localhost:5000/api/notes", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const notesData = await notesRes.json();
      const notes = notesData.success ? notesData.notes : [];
      const noteCount = notes.length;

      // ─── 3. AI Summaries ───
      const summaryRes = await fetch("http://localhost:5000/api/summary/user", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const summaryData = await summaryRes.json();
      const summaries = summaryData.success ? summaryData.summaries : [];
      const summaryCount = summaries.length;

      // ─── 4. Flashcards Stats ───
      let flashcardCount = 0;
      let learnedCount = 0;
      try {
        const flashRes = await fetch(
          "http://localhost:5000/api/flashcards/stats",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const flashData = await flashRes.json();
        if (flashData.success) {
          flashcardCount = flashData.stats.total || 0;
          learnedCount = flashData.stats.learned || 0;
        }
      } catch (err) {
        console.log("Flashcards not available yet");
      }

      // ─── 5. AI Chats ───
      let chatCount = 0;
      try {
        const chatRes = await fetch(
          "http://localhost:5000/api/chat/conversations",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const chatData = await chatRes.json();
        if (chatData.success) {
          chatCount = chatData.conversations
            ? chatData.conversations.length
            : 0;
        }
      } catch (err) {
        console.log("Chats not available yet");
      }

      // ─── 6. Favorites Stats ───
      let favoriteCount = 0;
      try {
        const favRes = await fetch(
          "http://localhost:5000/api/favorites/stats",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const favData = await favRes.json();
        if (favData.success) {
          favoriteCount = favData.stats.total || 0;
        }
      } catch (err) {
        console.log("Favorites not available yet");
      }

      // ─── 7. 🆕 Goals (for upcoming tasks) ───
      let upcoming = [];
      try {
        const goalsRes = await fetch("http://localhost:5000/api/goals", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const goalsData = await goalsRes.json();
        if (goalsData.success) {
          const goals = goalsData.goals;
          upcoming = goals
            .filter(g => g.status !== 'completed' && g.status !== 'archived')
            .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
            .slice(0, 5)
            .map(g => ({
              _id: g._id,
              title: g.title,
              deadline: g.deadline,
              priority: g.priority,
              progress: g.progress || 0,
            }));
        }
      } catch (err) {
        console.log("Goals not available yet");
      }
      setUpcomingTasks(upcoming);

      // ─── Calculate storage ───
      let totalBytes = 0;
      docs.forEach((doc) => {
        const size = Number(doc.fileSize);
        if (!isNaN(size) && size > 0) {
          totalBytes += size;
        }
      });
      const totalGB = totalBytes / 1024 ** 3;
      setTotalStorage(totalGB);

      // ─── Stats ───
      setStats([
        { label: "Documents Uploaded", value: docCount, icon: "📂" },
        { label: "Notes Created", value: noteCount, icon: "📝" },
        { label: "AI Summaries", value: summaryCount, icon: "🧠" },
        { label: "Flashcards", value: flashcardCount, icon: "📚" },
        { label: "AI Chats", value: chatCount, icon: "🤖" },
        { label: "Favorites", value: favoriteCount, icon: "⭐" },
      ]);

      // ─── Learning Progress ───
      const docGoal = 20;
      const summaryGoal = 20;
      const flashcardGoal = 50;

      setProgressData([
        {
          label: "Documents Read",
          value: Math.min(Math.round((docCount / docGoal) * 100), 100),
        },
        {
          label: "AI Summaries",
          value: Math.min(Math.round((summaryCount / summaryGoal) * 100), 100),
        },
        {
          label: "Flashcards Reviewed",
          value: Math.min(
            Math.round((learnedCount / flashcardGoal) * 100),
            100
          ),
        },
      ]);

      // ─── Recent Activity ───
      const activities = [];
      docs.slice(0, 2).forEach((doc) => {
        activities.push({
          id: `doc-${doc._id}`,
          text: `Uploaded document: ${doc.displayName}`,
          time: new Date(doc.uploadDate).toLocaleString(),
          icon: "📂",
        });
      });
      notes.slice(0, 2).forEach((note) => {
        activities.push({
          id: `note-${note._id}`,
          text: `Created note: ${note.title}`,
          time: new Date(note.createdAt).toLocaleString(),
          icon: "📝",
        });
      });
      activities.sort((a, b) => new Date(b.time) - new Date(a.time));
      const recent = activities.slice(0, 3);
      if (recent.length > 0) {
        setRecentActivity(recent);
      } else {
        setRecentActivity([
          {
            id: 1,
            text: "Welcome to AI Knowledge Vault!",
            time: "Just now",
            icon: "🤖",
          },
        ]);
      }

      // ─── Recent Documents ───
      const recentDocsList = docs.slice(0, 4).map((doc) => ({
        name: doc.displayName,
        icon: "📂",
        size: (doc.fileSize / 1024 / 1024).toFixed(2) + " MB",
        id: doc._id,
      }));
      setRecentDocs(recentDocsList);
    } catch (error) {
      console.error("Error fetching user data:", error);
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData, location.pathname]);

  // ─── HANDLERS ──────────────────────────────────────────
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.body.classList.toggle("dark-mode");
  };

  const markAsRead = (id) => {
    setNotifications(
      notifications.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  // ─── BUILD COUNT MAP FOR TOOLTIPS ────────────────────
  const countMap = {};
  stats.forEach((stat) => {
    const key = stat.label.replace(/ Uploaded| Created| AI /g, "").trim();
    countMap[key] = stat.value;
  });

  const getCountForItem = (label) => {
    if (countMap[label]) return countMap[label];
    const found = stats.find((s) => s.label.includes(label));
    return found ? found.value : null;
  };

  const quickActions = [
    {
      label: "Upload Document",
      icon: <FaUpload />,
      color: "#2563eb",
      path: "/documents",
    },
    {
      label: "Create Note",
      icon: <FaPlus />,
      color: "#0ea5e9",
      path: "/notes/create",
    },
    {
      label: "Generate AI Summary",
      icon: <FaRobot />,
      color: "#8b5cf6",
      path: "/documents",
    },
    {
      label: "Generate Flashcards",
      icon: "📚",
      color: "#f59e0b",
      path: "/flashcards",
    },
    {
      label: "Ask AI",
      icon: "🤖",
      color: "#10b981",
      path: "/chat",
    },
    {
      label: "Search Knowledge",
      icon: "🔍",
      color: "#ef4444",
      path: "/smart-search",
    },
  ];

  const aiExamples = [
    "Summarize my Operating System notes",
    "Create flashcards from Java.pdf",
    "Explain Binary Search",
    "Find all notes about DBMS",
  ];

  const unreadCount = notifications.filter((n) => !n.read).length;
  const storageUsedGB = totalStorage;
  const storageLimitGB = 10;
  const storagePercent = Math.min((storageUsedGB / storageLimitGB) * 100, 100);

  // ─── Helper to format days left ──────────────────────
  const getDaysLeft = (deadline) => {
    const now = new Date();
    const end = new Date(deadline);
    const diff = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
    if (diff < 0) return "Overdue";
    if (diff === 0) return "Today";
    if (diff === 1) return "Tomorrow";
    return `${diff} days left`;
  };

  if (loading) {
    return (
      <div className="dash-loading">
        <div className="dash-loading-spinner">Loading...</div>
      </div>
    );
  }

  return (
    <div className={`dash-container ${darkMode ? "dash-dark" : ""}`}>
      {/* ─── SIDEBAR ─── */}
      <aside className="dash-sidebar">
        <div className="dash-sidebar-brand">
          <span className="dash-brand-icon">🧠</span>
          <span className="dash-brand-text">AI Knowledge Vault</span>
        </div>
        <nav className="dash-sidebar-nav">
          {sidebarSections.map((section, idx) => (
            <div key={idx} className="dash-sidebar-section">
              <div
                className="dash-sidebar-section-title"
                style={{
                  fontWeight: "bold",
                  textTransform: "uppercase",
                  fontSize: "0.7rem",
                  letterSpacing: "0.05em",
                  opacity: 0.7,
                  marginTop: "1rem",
                  marginBottom: "0.25rem",
                }}
              >
                {section.title}
              </div>
              <ul>
                {section.items.map((item, i) => {
                  const isActive = location.pathname === item.path;
                  let tooltip = item.label;
                  const count = getCountForItem(item.label);
                  if (count !== null && count !== undefined) {
                    tooltip += `: ${count}`;
                  }
                  return (
                    <li
                      key={i}
                      className={`dash-nav-item ${isActive ? "active" : ""}`}
                    >
                      <Link to={item.path} title={tooltip}>
                        <span className="dash-nav-emoji">{item.emoji}</span>
                        <span>{item.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
          {/* Logout */}
          <div className="dash-sidebar-section dash-logout-section">
            <ul>
              <li className="dash-nav-item dash-logout">
                <button onClick={handleLogout} title="Logout">
                  <span className="dash-nav-emoji">🚪</span>
                  <span>Logout</span>
                </button>
              </li>
            </ul>
          </div>
        </nav>
      </aside>

      <main className="dash-main">
        {/* Top Bar */}
        <header className="dash-topbar">
          <div className="dash-topbar-left">
            <h2>
              Welcome Back,{" "}
              {userData?.firstName || userData?.username || "User"}! 👋
            </h2>
          </div>
          <div className="dash-topbar-right">
            <div className="dash-search-bar">
              <span className="dash-search-icon">🔍</span>
              <input
                type="text"
                placeholder="Search your knowledge..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="dash-topbar-actions">
              <div className="dash-notification-wrapper">
                <button
                  className="dash-notification-btn"
                  onClick={() => setShowNotifications(!showNotifications)}
                >
                  <FaBell />
                  {unreadCount > 0 && (
                    <span className="dash-notification-badge">
                      {unreadCount}
                    </span>
                  )}
                </button>
                {showNotifications && (
                  <div className="dash-notification-dropdown">
                    <div className="dash-notification-header">
                      <span>Notifications</span>
                      <button
                        className="dash-mark-all"
                        onClick={() =>
                          setNotifications(
                            notifications.map((n) => ({ ...n, read: true }))
                          )
                        }
                      >
                        Mark all read
                      </button>
                    </div>
                    <ul className="dash-notification-list">
                      {notifications.length === 0 ? (
                        <li className="dash-notification-item">
                          No notifications
                        </li>
                      ) : (
                        notifications.map((n) => (
                          <li
                            key={n.id}
                            className={`dash-notification-item ${n.read ? "dash-read" : "dash-unread"}`}
                            onClick={() => markAsRead(n.id)}
                          >
                            <p>{n.text}</p>
                            <span>{n.time}</span>
                          </li>
                        ))
                      )}
                    </ul>
                  </div>
                )}
              </div>
              <button className="dash-dark-toggle" onClick={toggleDarkMode}>
                {darkMode ? <FaSun /> : <FaMoon />}
              </button>
              <div className="dash-user-profile">
                <FaUserCircle className="dash-user-icon" />
                <span>
                  {userData?.firstName || userData?.username || "User"}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Welcome Banner */}
        <section className="dash-welcome-banner">
          <div className="dash-welcome-text">
            <h1>Hello {userData?.firstName || "User"} 👋</h1>
            <p>Welcome to AI Knowledge Vault</p>
            <p className="dash-welcome-sub">
              Organize • Learn • Remember • Search
            </p>
            <div className="dash-motivation">
              <span>✨ Today's Motivation:</span>
              <p>"Small learning every day leads to big success."</p>
            </div>
          </div>
          <div className="dash-welcome-emoji">🚀</div>
        </section>

        {/* Stats */}
        <section className="dash-stats">
          {stats.map((stat, index) => (
            <div className="dash-stat-card" key={index}>
              <div className="dash-stat-icon">{stat.icon}</div>
              <div className="dash-stat-info">
                <h3>{stat.value}</h3>
                <p>{stat.label}</p>
              </div>
            </div>
          ))}
        </section>

        {/* Quick Actions */}
        <section className="dash-quick-actions">
          <h3>Quick Actions</h3>
          <div className="dash-quick-grid">
            {quickActions.map((action, idx) => (
              <button
                key={idx}
                className="dash-quick-btn"
                style={{ backgroundColor: action.color }}
                onClick={() => navigate(action.path)}
              >
                <span className="dash-quick-icon">{action.icon}</span>{" "}
                {action.label}
              </button>
            ))}
          </div>
        </section>

        {/* Main Grid */}
        <div className="dash-grid-2col">
          <div className="dash-col-left">
            {/* Recent Activity */}
            <section className="dash-card">
              <h3>Recent Activity</h3>
              {recentActivity.length === 0 ? (
                <p
                  style={{
                    opacity: 0.6,
                    textAlign: "center",
                    padding: "20px 0",
                  }}
                >
                  No recent activity yet.
                </p>
              ) : (
                <ul className="dash-activity-list">
                  {recentActivity.map((item) => (
                    <li key={item.id} className="dash-activity-item">
                      <span className="dash-activity-icon">{item.icon}</span>
                      <div>
                        <p>{item.text}</p>
                        <span>{item.time}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* AI Assistant */}
            <section className="dash-card dash-ai-assistant">
              <div className="dash-ai-header">
                <span className="dash-ai-icon">🤖</span>
                <h3>AI Assistant</h3>
              </div>
              <p className="dash-ai-question">
                "What would you like to do today?"
              </p>
              <div className="dash-ai-input-wrapper">
                <input type="text" placeholder="Ask Anything" />
                <button className="dash-ai-send">Send</button>
              </div>
              <div className="dash-ai-examples">
                <p>Examples:</p>
                <ul>
                  {aiExamples.map((ex, idx) => (
                    <li key={idx}>{ex}</li>
                  ))}
                </ul>
              </div>
            </section>

            {/* Learning Progress */}
            <section className="dash-card">
              <h3>Learning Progress</h3>
              {progressData.map((item, idx) => (
                <div className="dash-progress-item" key={idx}>
                  <div className="dash-progress-label">
                    <span>{item.label}</span>
                    <span>{item.value}%</span>
                  </div>
                  <div className="dash-progress-bar">
                    <div
                      className="dash-progress-fill"
                      style={{ width: `${item.value}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </section>
          </div>

          <div className="dash-col-right">
            {/* Recent Documents */}
            <section className="dash-card">
              <h3>Recent Documents</h3>
              {recentDocs.length === 0 ? (
                <p
                  style={{
                    opacity: 0.6,
                    textAlign: "center",
                    padding: "20px 0",
                  }}
                >
                  No documents uploaded yet.
                  <br />
                  <button
                    className="dash-upload-btn"
                    style={{ marginTop: 10 }}
                    onClick={() => navigate("/documents")}
                  >
                    <span className="dash-upload-icon">📤</span> Upload your first
                    document
                  </button>
                </p>
              ) : (
                <ul className="dash-doc-list">
                  {recentDocs.map((doc, idx) => (
                    <li key={idx} className="dash-doc-item">
                      <span className="dash-doc-icon">{doc.icon}</span>
                      <div>
                        <p>{doc.name}</p>
                        <span>{doc.size}</span>
                      </div>
                      <button
                        className="dash-doc-open"
                        onClick={() => navigate("/documents")}
                      >
                        Open
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* ─── 🆕 Upcoming Tasks (from Goals) ─── */}
            <section className="dash-card">
              <h3>📅 Upcoming Tasks</h3>
              {upcomingTasks.length === 0 ? (
                <p style={{ opacity: 0.6, textAlign: "center", padding: "10px 0" }}>
                  No upcoming tasks. <br />
                  <span style={{ fontSize: "0.8rem" }}>
                    Create a goal to start tracking!
                  </span>
                </p>
              ) : (
                <ul className="dash-deadline-list">
                  {upcomingTasks.map((task) => {
                    const priorityClass = task.priority?.toLowerCase() || "medium";
                    return (
                      <li
                        key={task._id}
                        className="dash-deadline-item"
                        onClick={() => navigate("/goals")}
                        style={{ cursor: "pointer" }}
                      >
                        <div>
                          <p style={{ fontWeight: 500, margin: 0 }}>
                            {task.title}
                          </p>
                          <span style={{ fontSize: "0.8rem", color: "#64748b" }}>
                            {getDaysLeft(task.deadline)}
                          </span>
                          {task.progress > 0 && (
                            <span style={{ marginLeft: "0.5rem", fontSize: "0.7rem", color: "#4f46e5" }}>
                              {task.progress}% done
                            </span>
                          )}
                        </div>
                        <span
                          className={`dash-priority-${priorityClass}`}
                          style={{
                            fontSize: "0.7rem",
                            fontWeight: 600,
                            textTransform: "uppercase",
                            padding: "2px 8px",
                            borderRadius: "12px",
                            background:
                              priorityClass === "high"
                                ? "#fee2e2"
                                : priorityClass === "medium"
                                ? "#fef3c7"
                                : "#d1fae5",
                            color:
                              priorityClass === "high"
                                ? "#dc2626"
                                : priorityClass === "medium"
                                ? "#d97706"
                                : "#059669",
                          }}
                        >
                          {task.priority || "Medium"}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
              {upcomingTasks.length > 0 && (
                <div style={{ marginTop: "0.5rem", textAlign: "right" }}>
                  <button
                    className="dash-view-all"
                    onClick={() => navigate("/goals")}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#4f46e5",
                      fontWeight: 500,
                      cursor: "pointer",
                      fontSize: "0.85rem",
                    }}
                  >
                    View All Goals →
                  </button>
                </div>
              )}
            </section>

            {/* Profile Card */}
            <section className="dash-card dash-profile-card">
              <div className="dash-profile-header">
                <span className="dash-profile-avatar">👩‍🎓</span>
                <div>
                  <h4>
                    {userData?.firstName || "User"} {userData?.lastName || ""}
                  </h4>
                  <p>{userData?.email || "No email"}</p>
                  <p>{userData?.college || "College not set"}</p>
                  <p>{userData?.department || "Department not set"}</p>
                </div>
              </div>
              <button className="dash-edit-profile">Edit Profile</button>
            </section>

            {/* Cloud Storage */}
            <section className="dash-card">
              <h3>Cloud Storage</h3>
              <div className="dash-storage">
                <div className="dash-storage-bar">
                  <div
                    className="dash-storage-fill"
                    style={{ width: `${storagePercent}%` }}
                  ></div>
                </div>
                <div className="dash-storage-info">
                  <span>
                    {storageUsedGB.toFixed(2)} GB / {storageLimitGB} GB Used
                  </span>
                  <span className="dash-storage-percent">
                    {storagePercent.toFixed(0)}%
                  </span>
                </div>
              </div>
            </section>
          </div>
        </div>

        <footer className="dash-footer">
          <p>AI Knowledge Vault — Version 1.0</p>
          <p>© 2026 All Rights Reserved</p>
        </footer>
      </main>
    </div>
  );
}

export default Dashboard;