import "./Profile.css";
import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaCamera,
  FaEdit,
  FaSave,
  FaTimes,
  FaTrash,
  FaSignOutAlt,
  FaLock,
  FaCheck,
  FaFire,
  FaBrain,
  FaGlobe,
  FaMoon,
  FaSun,
  FaCloudUploadAlt,
  FaCloudDownloadAlt,
  FaDatabase,
  FaDownload,
} from "react-icons/fa";

function Profile() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const fileInputRef = useRef(null);

  // ─── State ────────────────────────────────────────────────────
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    documents: 0,
    notes: 0,
    summaries: 0,
    flashcards: 0,
    chats: 0,
    searches: 0,
    favorites: 0,
    studyHours: 0,
  });
  const [goals, setGoals] = useState([]);
  const [completedGoals, setCompletedGoals] = useState(0);
  const [activeGoals, setActiveGoals] = useState(0);
  const [progress, setProgress] = useState(0);
  const [knowledgeScore, setKnowledgeScore] = useState(0);
  const [xp, setXp] = useState(0);
  const [learningLevel, setLearningLevel] = useState("Beginner");
  const [streak, setStreak] = useState(0);
  const [badges, setBadges] = useState([]);
  const [favoriteTopics, setFavoriteTopics] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({});
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [showSecurity, setShowSecurity] = useState(false);
  const [activeSection, setActiveSection] = useState("overview");
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [preferences, setPreferences] = useState({
    theme: "system",
    language: "en",
    emailNotifications: true,
    pushNotifications: true,
    reminderNotifications: true,
    aiSuggestions: true,
    autoSummary: false,
    smartRecommendations: true,
  });

  // ─── Fetch all data ──────────────────────────────────────────
  const fetchAllData = useCallback(async () => {
    try {
      setLoading(true);

      let userData = null;
      let userFromStorage = null;

      try {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          userFromStorage = JSON.parse(storedUser);
        }
      } catch (e) {
        console.warn("Could not parse user from localStorage", e);
      }

      try {
        const userRes = await fetch("http://localhost:5000/api/users/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await userRes.json();
        if (data.success) {
          userData = data.user;
        } else {
          throw new Error(data.message || "API returned error");
        }
      } catch (apiError) {
        console.warn("Falling back to localStorage user", apiError);
        if (userFromStorage) {
          userData = userFromStorage;
        } else {
          userData = {
            firstName: "User",
            lastName: "",
            username: "user",
            email: "user@example.com",
            role: "Student",
            college: "",
            department: "",
            skills: ["Java", "React", "Database", "AI"],
          };
        }
      }

      if (userData.dob) {
        const dateObj = new Date(userData.dob);
        if (!isNaN(dateObj)) {
          userData.dob = dateObj.toISOString().split("T")[0];
        }
      }

      setUser(userData);
      setFormData(userData);
      setPreferences(userData.preferences || preferences);

      let docCount = 0,
        noteCount = 0,
        summaryCount = 0,
        flashCount = 0,
        chatCount = 0,
        favCount = 0;

      try {
        const [docRes, notesRes, summaryRes, flashRes, chatRes, favRes] =
          await Promise.all([
            fetch("http://localhost:5000/api/documents", {
              headers: { Authorization: `Bearer ${token}` },
            }),
            fetch("http://localhost:5000/api/notes", {
              headers: { Authorization: `Bearer ${token}` },
            }),
            fetch("http://localhost:5000/api/summary/user", {
              headers: { Authorization: `Bearer ${token}` },
            }),
            fetch("http://localhost:5000/api/flashcards/stats", {
              headers: { Authorization: `Bearer ${token}` },
            }),
            fetch("http://localhost:5000/api/chat/conversations", {
              headers: { Authorization: `Bearer ${token}` },
            }),
            fetch("http://localhost:5000/api/favorites/stats", {
              headers: { Authorization: `Bearer ${token}` },
            }),
          ]);

        const docData = await docRes.json();
        const notesData = await notesRes.json();
        const summaryData = await summaryRes.json();
        const flashData = await flashRes.json();
        const chatData = await chatRes.json();
        const favData = await favRes.json();

        docCount = docData.success ? docData.documents.length : 0;
        noteCount = notesData.success ? notesData.notes.length : 0;
        summaryCount = summaryData.success ? summaryData.summaries.length : 0;
        flashCount = flashData.success ? flashData.stats.total : 0;
        chatCount = chatData.success ? chatData.conversations.length : 0;
        favCount = favData.success ? favData.stats.total : 0;
      } catch (statsError) {
        console.warn("Could not fetch stats, using zeros", statsError);
      }

      setStats({
        documents: docCount,
        notes: noteCount,
        summaries: summaryCount,
        flashcards: flashCount,
        chats: chatCount,
        searches: 0,
        favorites: favCount,
        studyHours: 0,
      });

      let allGoals = [];
      try {
        const goalsRes = await fetch("http://localhost:5000/api/goals", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const goalsData = await goalsRes.json();
        if (goalsData.success) {
          allGoals = goalsData.goals;
          setGoals(allGoals);
          const completed = allGoals.filter(
            (g) => g.status === "completed",
          ).length;
          const active = allGoals.filter(
            (g) => g.status !== "completed" && g.status !== "archived",
          ).length;
          setCompletedGoals(completed);
          setActiveGoals(active);
          const total = allGoals.length;
          const prog = total > 0 ? Math.round((completed / total) * 100) : 0;
          setProgress(prog);
        }
      } catch (goalsError) {
        console.warn("Could not fetch goals", goalsError);
      }

      const totalItems =
        docCount + noteCount + summaryCount + flashCount + chatCount + favCount;
      const score = Math.min(Math.round((totalItems / 20) * 10), 100);
      setKnowledgeScore(score);
      const xpValue = totalItems * 5 + completedGoals * 20;
      setXp(xpValue);
      const level =
        score >= 80 ? "Advanced" : score >= 50 ? "Intermediate" : "Beginner";
      setLearningLevel(level);

      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const recentCompleted = allGoals.filter(
        (g) => g.status === "completed" && new Date(g.updatedAt) > weekAgo,
      );
      setStreak(recentCompleted.length * 2);

      const badgeDefs = [
        { id: 1, name: "First Upload", icon: "📄", earned: docCount >= 1 },
        {
          id: 2,
          name: "Document Collector",
          icon: "📚",
          earned: docCount >= 10,
        },
        { id: 3, name: "Notes Creator", icon: "📝", earned: noteCount >= 5 },
        {
          id: 4,
          name: "Summary Master",
          icon: "🧠",
          earned: summaryCount >= 10,
        },
        {
          id: 5,
          name: "Flashcard Expert",
          icon: "🃏",
          earned: flashCount >= 20,
        },
        { id: 6, name: "AI Explorer", icon: "🤖", earned: chatCount >= 10 },
        { id: 7, name: "7-Day Streak", icon: "🔥", earned: streak >= 7 },
        { id: 8, name: "30-Day Streak", icon: "🔥", earned: streak >= 30 },
        {
          id: 9,
          name: "Goal Achiever",
          icon: "🎯",
          earned: completedGoals >= 5,
        },
        { id: 10, name: "Knowledge Master", icon: "📚", earned: score >= 80 },
      ];
      setBadges(badgeDefs);

      const skills = userData.skills || [
        "Java",
        "React",
        "Database",
        "AI",
        "Cyber Security",
        "Networking",
      ];
      setFavoriteTopics(skills);
      setRecentActivity([]);
    } catch (error) {
      console.error("Error fetching profile data:", error);
      if (!user) {
        setUser({
          firstName: "User",
          lastName: "",
          username: "user",
          email: "user@example.com",
          role: "Student",
        });
        setFormData({});
      }
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // ─── Handlers ─────────────────────────────────────────────────
  const handleEditToggle = () => {
    if (editing) {
      setFormData(user);
    }
    setEditing(!editing);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleArrayChange = (e, field) => {
    const values = e.target.value.split(",").map((s) => s.trim());
    setFormData({ ...formData, [field]: values });
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const res = await fetch("http://localhost:5000/api/users/me", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        setUser(data.user);
        setEditing(false);
        alert("Profile updated successfully!");
        fetchAllData();
      } else {
        alert("Update failed: " + data.message);
      }
    } catch (error) {
      alert("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const form = new FormData();
    form.append("avatar", file);
    try {
      const res = await fetch("http://localhost:5000/api/users/avatar", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      const data = await res.json();
      if (data.success) {
        setUser({ ...user, avatar: data.avatarUrl });
        setAvatarPreview(data.avatarUrl);
        alert("Avatar updated!");
        fetchAllData();
      } else {
        alert("Upload failed: " + data.message);
      }
    } catch (error) {
      alert("Network error during avatar upload.");
    }
  };

  const handleRemoveAvatar = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/users/avatar", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setUser({ ...user, avatar: null });
        setAvatarPreview(null);
        alert("Avatar removed.");
        fetchAllData();
      } else {
        alert("Remove failed: " + data.message);
      }
    } catch (error) {
      alert("Network error.");
    }
  };

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert("New passwords do not match!");
      return;
    }
    try {
      const res = await fetch(
        "http://localhost:5000/api/users/change-password",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            currentPassword: passwordData.currentPassword,
            newPassword: passwordData.newPassword,
          }),
        },
      );
      const data = await res.json();
      if (data.success) {
        alert("Password changed successfully!");
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
        setShowSecurity(false);
      } else {
        alert("Password change failed: " + data.message);
      }
    } catch (error) {
      alert("Network error.");
    }
  };

  const handleTwoFactorToggle = () => {
    setTwoFactorEnabled(!twoFactorEnabled);
    alert(
      `Two-factor ${!twoFactorEnabled ? "enabled" : "disabled"} (requires backend support)`,
    );
  };

  const handleLogoutAll = () => {
    if (window.confirm("Logout from all devices?")) {
      alert("Logged out from all devices (backend endpoint needed)");
    }
  };

  const handleDeactivateAccount = () => {
    if (window.confirm("Are you sure you want to deactivate your account?")) {
      alert("Account deactivated (backend endpoint needed)");
    }
  };

  const handleDeleteAccount = () => {
    if (window.confirm("This is permanent! Are you sure?")) {
      alert("Account deleted (backend endpoint needed)");
      navigate("/login");
    }
  };

  const handleExport = (type) => {
    alert(`Exporting ${type}... (backend endpoint needed)`);
  };

  const handleBackup = () => {
    alert("Backing up... (backend)");
  };
  const handleRestore = () => {
    alert("Restoring... (backend)");
  };

  const handlePreferenceChange = (key, value) => {
    setPreferences({ ...preferences, [key]: value });
  };

  const savePreferences = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/users/preferences", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(preferences),
      });
      const data = await res.json();
      if (data.success) {
        alert("Preferences saved!");
        fetchAllData();
      } else {
        alert("Failed to save preferences: " + data.message);
      }
    } catch (error) {
      alert("Network error.");
    }
  };

  // ─── Helpers ──────────────────────────────────────────────────
  const getInitials = (firstName, lastName) => {
    return (firstName?.[0] || "") + (lastName?.[0] || "");
  };

  if (loading) {
    return <div className="profile-loading">Loading profile...</div>;
  }

  if (!user) {
    return <div className="profile-error">Could not load profile.</div>;
  }

  return (
    <div className="profile-page">
      {/* ─── Header ──────────────────────────────────────────── */}
      <div className="profile-header glass">
        <div className="profile-avatar-wrapper">
          {avatarPreview || user.avatar ? (
            <img
              src={avatarPreview || user.avatar}
              alt="Profile"
              className="profile-avatar"
            />
          ) : (
            <div className="profile-avatar-placeholder">
              {getInitials(user.firstName, user.lastName)}
            </div>
          )}
          <button
            className="profile-avatar-edit"
            onClick={() => fileInputRef.current.click()}
          >
            <FaCamera />
          </button>
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            style={{ display: "none" }}
            onChange={handleAvatarUpload}
          />
          {user.avatar && (
            <button
              className="profile-avatar-remove"
              onClick={handleRemoveAvatar}
            >
              <FaTimes />
            </button>
          )}
        </div>

        <div className="profile-header-info">
          <h1>
            {user.firstName} {user.lastName}
          </h1>
          <p className="profile-username">@{user.username}</p>
          <div className="profile-badges">
            <span className="badge role">{user.role || "Student"}</span>
            <span className="badge level">{learningLevel}</span>
            <span className="badge streak">
              <FaFire /> {streak} day streak
            </span>
          </div>
          <p className="profile-email">{user.email}</p>
        </div>

        <div className="profile-score">
          <div className="circular-progress">
            <svg viewBox="0 0 120 120">
              <circle
                cx="60"
                cy="60"
                r="50"
                fill="none"
                stroke="#e2e8f0"
                strokeWidth="10"
              />
              <circle
                cx="60"
                cy="60"
                r="50"
                fill="none"
                stroke="#4f46e5"
                strokeWidth="10"
                strokeDasharray={`${2 * Math.PI * 50 * (knowledgeScore / 100)} ${2 * Math.PI * 50}`}
                strokeLinecap="round"
                transform="rotate(-90 60 60)"
              />
              <text
                x="60"
                y="66"
                textAnchor="middle"
                fontSize="22"
                fontWeight="bold"
                fill="#4f46e5"
              >
                {knowledgeScore}
              </text>
            </svg>
          </div>
          <p>Knowledge Score</p>
        </div>
      </div>

      {/* ─── Navigation Tabs ────────────────────────────────── */}
      <div className="profile-tabs">
        {[
          "overview",
          "personal",
          "academic",
          "security",
          "preferences",
          "danger",
        ].map((tab) => (
          <button
            key={tab}
            className={`tab-btn ${activeSection === tab ? "active" : ""}`}
            onClick={() => setActiveSection(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* ─── Content ────────────────────────────────────────── */}
      <div className="profile-content">
        {/* ─── Overview ─── */}
        {activeSection === "overview" && (
          <>
            <div className="profile-stats-grid">
              <div className="stat-card">
                <div className="stat-icon" style={{ background: "#3b82f6" }}>
                  📂
                </div>
                <div>
                  <h3>{stats.documents}</h3>
                  <p>Documents</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon" style={{ background: "#8b5cf6" }}>
                  📝
                </div>
                <div>
                  <h3>{stats.notes}</h3>
                  <p>Notes</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon" style={{ background: "#ec4899" }}>
                  🧠
                </div>
                <div>
                  <h3>{stats.summaries}</h3>
                  <p>AI Summaries</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon" style={{ background: "#f59e0b" }}>
                  📚
                </div>
                <div>
                  <h3>{stats.flashcards}</h3>
                  <p>Flashcards</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon" style={{ background: "#10b981" }}>
                  🤖
                </div>
                <div>
                  <h3>{stats.chats}</h3>
                  <p>AI Chats</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon" style={{ background: "#ef4444" }}>
                  🔍
                </div>
                <div>
                  <h3>{stats.searches}</h3>
                  <p>Searches</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon" style={{ background: "#fbbf24" }}>
                  ⭐
                </div>
                <div>
                  <h3>{stats.favorites}</h3>
                  <p>Favorites</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon" style={{ background: "#14b8a6" }}>
                  ⏱️
                </div>
                <div>
                  <h3>{stats.studyHours}h</h3>
                  <p>Study Hours</p>
                </div>
              </div>
            </div>

            <div className="profile-progress-row">
              <div className="progress-card">
                <h3>Learning Progress</h3>
                <div className="progress-circle">
                  <svg viewBox="0 0 120 120">
                    <circle
                      cx="60"
                      cy="60"
                      r="50"
                      fill="none"
                      stroke="#e2e8f0"
                      strokeWidth="10"
                    />
                    <circle
                      cx="60"
                      cy="60"
                      r="50"
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="10"
                      strokeDasharray={`${2 * Math.PI * 50 * (progress / 100)} ${2 * Math.PI * 50}`}
                      strokeLinecap="round"
                      transform="rotate(-90 60 60)"
                    />
                    <text
                      x="60"
                      y="66"
                      textAnchor="middle"
                      fontSize="22"
                      fontWeight="bold"
                      fill="#10b981"
                    >
                      {progress}%
                    </text>
                  </svg>
                </div>
                <p>Overall Progress</p>
                <div className="progress-details">
                  <span>🎯 {completedGoals} Goals Done</span>
                  <span>⏳ {activeGoals} Active</span>
                </div>
              </div>
              <div className="progress-card">
                <h3>Productivity Score</h3>
                <div className="productivity-score">
                  <span className="score-number">{knowledgeScore}</span>
                  <span className="score-label">/ 100</span>
                </div>
                <p>Based on your activity and goal completion</p>
              </div>
              <div className="progress-card">
                <h3>Learning XP</h3>
                <div className="xp-display">
                  <span className="xp-number">{xp}</span>
                  <span className="xp-label">XP</span>
                </div>
                <div className="xp-bar">
                  <div className="xp-fill" style={{ width: "70%" }}></div>
                </div>
                <p>Next level in {Math.max(100 - (xp % 100), 0)} XP</p>
              </div>
            </div>

            <div className="profile-badges-section">
              <h3>🏆 Achievements & Badges</h3>
              <div className="badges-grid">
                {badges.map((badge) => (
                  <div
                    key={badge.id}
                    className={`badge-item ${badge.earned ? "earned" : "locked"}`}
                  >
                    <span className="badge-icon">{badge.icon}</span>
                    <span className="badge-name">{badge.name}</span>
                    {badge.earned && <FaCheck className="badge-check" />}
                  </div>
                ))}
              </div>
            </div>

            <div className="profile-favorites">
              <h3>⭐ Favorite Topics</h3>
              <div className="favorites-chips">
                {favoriteTopics.map((topic) => (
                  <span key={topic} className="chip">
                    {topic}
                  </span>
                ))}
              </div>
            </div>

            <div className="profile-activity">
              <h3>🕒 Recent Activity</h3>
              <ul className="activity-timeline">
                {recentActivity.map((act, idx) => (
                  <li key={idx} className="activity-item">
                    <span className="activity-icon">{act.icon}</span>
                    <div>
                      <p>{act.action}</p>
                      <span className="activity-time">{act.time}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}

        {/* ─── Personal Information ─── */}
        {activeSection === "personal" && (
          <div className="profile-edit-section">
            <div className="section-header">
              <h2>Personal Information</h2>
              <button className="edit-btn" onClick={handleEditToggle}>
                {editing ? <FaTimes /> : <FaEdit />}{" "}
                {editing ? "Cancel" : "Edit"}
              </button>
            </div>
            <div className="edit-form">
              <div className="info-grid">
                <div className="info-row">
                  <span className="info-label">First Name</span>
                  {editing ? (
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName || ""}
                      onChange={handleChange}
                    />
                  ) : (
                    <span className="info-value">{formData.firstName || "—"}</span>
                  )}
                </div>
                <div className="info-row">
                  <span className="info-label">Last Name</span>
                  {editing ? (
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName || ""}
                      onChange={handleChange}
                    />
                  ) : (
                    <span className="info-value">{formData.lastName || "—"}</span>
                  )}
                </div>
                <div className="info-row">
                  <span className="info-label">Username</span>
                  {editing ? (
                    <input
                      type="text"
                      name="username"
                      value={formData.username || ""}
                      onChange={handleChange}
                    />
                  ) : (
                    <span className="info-value">{formData.username || "—"}</span>
                  )}
                </div>
                <div className="info-row">
                  <span className="info-label">Email</span>
                  {editing ? (
                    <input
                      type="email"
                      name="email"
                      value={formData.email || ""}
                      onChange={handleChange}
                    />
                  ) : (
                    <span className="info-value">{formData.email || "—"}</span>
                  )}
                </div>
                <div className="info-row">
                  <span className="info-label">Mobile Number</span>
                  {editing ? (
                    <input
                      type="text"
                      name="mobile"
                      value={formData.mobile || ""}
                      onChange={handleChange}
                    />
                  ) : (
                    <span className="info-value">{formData.mobile || "—"}</span>
                  )}
                </div>
                <div className="info-row">
                  <span className="info-label">Date of Birth</span>
                  {editing ? (
                    <input
                      type="date"
                      name="dob"
                      value={formData.dob || ""}
                      onChange={handleChange}
                    />
                  ) : (
                    <span className="info-value">
                      {formData.dob
                        ? new Date(formData.dob).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                          })
                        : "—"}
                    </span>
                  )}
                </div>
                <div className="info-row">
                  <span className="info-label">Gender</span>
                  {editing ? (
                    <select
                      name="gender"
                      value={formData.gender || ""}
                      onChange={handleChange}
                    >
                      <option value="">Select</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  ) : (
                    <span className="info-value">{formData.gender || "—"}</span>
                  )}
                </div>
                <div className="info-row">
                  <span className="info-label">Country</span>
                  {editing ? (
                    <input
                      type="text"
                      name="country"
                      value={formData.country || ""}
                      onChange={handleChange}
                    />
                  ) : (
                    <span className="info-value">{formData.country || "—"}</span>
                  )}
                </div>
                <div className="info-row full-width">
                  <span className="info-label">Bio / About Me</span>
                  {editing ? (
                    <textarea
                      name="bio"
                      value={formData.bio || ""}
                      onChange={handleChange}
                      rows="3"
                    />
                  ) : (
                    <span className="info-value">{formData.bio || "—"}</span>
                  )}
                </div>
              </div>
              {editing && (
                <div className="form-actions">
                  <button
                    className="save-btn"
                    onClick={handleSaveProfile}
                    disabled={saving}
                  >
                    <FaSave /> {saving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─── Academic Information ─── */}
        {activeSection === "academic" && (
          <div className="profile-edit-section">
            <h2>Academic Information</h2>
            <div className="edit-form">
              <div className="info-grid">
                <div className="info-row">
                  <span className="info-label">College / University</span>
                  {editing ? (
                    <input
                      type="text"
                      name="college"
                      value={formData.college || ""}
                      onChange={handleChange}
                      placeholder="Enter your college name"
                    />
                  ) : (
                    <span className="info-value">{formData.college || "—"}</span>
                  )}
                </div>
                <div className="info-row">
                  <span className="info-label">Department</span>
                  {editing ? (
                    <input
                      type="text"
                      name="department"
                      value={formData.department || ""}
                      onChange={handleChange}
                      placeholder="Enter your department"
                    />
                  ) : (
                    <span className="info-value">{formData.department || "—"}</span>
                  )}
                </div>
              </div>
              {editing && (
                <div className="form-actions">
                  <button
                    className="save-btn"
                    onClick={handleSaveProfile}
                    disabled={saving}
                  >
                    <FaSave /> {saving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─── Security ─── */}
        {activeSection === "security" && (
          <div className="profile-security">
            <h2 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#1e293b", marginBottom: "1.5rem" }}>
              🔒 Security Settings
            </h2>

            <div className="security-card">
              <div className="security-card-header">
                <div className="sec-icon lock">🔐</div>
                <h3>Change Password</h3>
              </div>
              <p className="sec-sub">Update your account password regularly to stay secure.</p>

              {showSecurity ? (
                <div className="password-form">
                  <div className="form-group">
                    <label>Current Password</label>
                    <input
                      type="password"
                      placeholder="Enter your current password"
                      value={passwordData.currentPassword}
                      onChange={(e) =>
                        setPasswordData({
                          ...passwordData,
                          currentPassword: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="form-group">
                    <label>New Password</label>
                    <input
                      type="password"
                      placeholder="Enter your new password"
                      value={passwordData.newPassword}
                      onChange={(e) =>
                        setPasswordData({
                          ...passwordData,
                          newPassword: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="form-group">
                    <label>Confirm New Password</label>
                    <input
                      type="password"
                      placeholder="Confirm your new password"
                      value={passwordData.confirmPassword}
                      onChange={(e) =>
                        setPasswordData({
                          ...passwordData,
                          confirmPassword: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="form-actions">
                    <button className="save-btn" onClick={handlePasswordChange}>
                      <FaLock /> Update Password
                    </button>
                    <button
                      className="cancel-btn"
                      onClick={() => {
                        setShowSecurity(false);
                        setPasswordData({
                          currentPassword: "",
                          newPassword: "",
                          confirmPassword: "",
                        });
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="security-actions">
                  <button className="btn-outline" onClick={() => setShowSecurity(true)}>
                    <FaEdit /> Change Password
                  </button>
                </div>
              )}
            </div>

            <div className="security-card">
              <div className="security-card-header">
                <div className="sec-icon shield">🛡️</div>
                <h3>Two-Factor Authentication</h3>
              </div>
              <p className="sec-sub">Add an extra layer of security to your account.</p>

              <div className="two-factor-row">
                <div className="two-factor-status">
                  <span className={`status-dot ${twoFactorEnabled ? "enabled" : "disabled"}`}></span>
                  <span className={`status-label ${twoFactorEnabled ? "enabled" : "disabled"}`}>
                    {twoFactorEnabled ? "Enabled" : "Disabled"}
                  </span>
                </div>
                <button className={`toggle-switch ${twoFactorEnabled ? "active" : ""}`} onClick={handleTwoFactorToggle}>
                  <span className="toggle-knob"></span>
                </button>
              </div>
            </div>

            <div className="security-card">
              <div className="security-card-header">
                <div className="sec-icon device">💻</div>
                <h3>Login Information</h3>
              </div>
              <p className="sec-sub">Manage your active sessions and devices.</p>

              <div className="login-info-grid">
                <div className="login-info-item">
                  <span className="info-label">Last Login</span>
                  <span className="info-value">{user.lastLogin || "Not available"}</span>
                </div>
                <div className="login-info-item">
                  <span className="info-label">Active Devices</span>
                  <span className="info-value">{user.activeDevices?.join(", ") || "Only this device"}</span>
                </div>
              </div>

              <div className="security-actions">
                <button className="btn-outline" onClick={handleLogoutAll}>
                  <FaSignOutAlt /> Logout from All Devices
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ─── Preferences ─── */}
        {activeSection === "preferences" && (
          <div className="profile-preferences">
            <h2 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#1e293b", marginBottom: "1.5rem" }}>
              ⚙️ Preferences
            </h2>

            <div className="pref-card">
              <div className="pref-card-header">
                <div className="pref-icon appearance">🎨</div>
                <h3>Appearance</h3>
              </div>
              <div className="pref-options">
                <button
                  className={`pref-btn ${preferences.theme === "light" ? "active" : ""}`}
                  onClick={() => handlePreferenceChange("theme", "light")}
                >
                  <FaSun /> Light
                </button>
                <button
                  className={`pref-btn ${preferences.theme === "dark" ? "active" : ""}`}
                  onClick={() => handlePreferenceChange("theme", "dark")}
                >
                  <FaMoon /> Dark
                </button>
                <button
                  className={`pref-btn ${preferences.theme === "system" ? "active" : ""}`}
                  onClick={() => handlePreferenceChange("theme", "system")}
                >
                  <FaGlobe /> System
                </button>
              </div>
            </div>

            <div className="pref-card">
              <div className="pref-card-header">
                <div className="pref-icon language">🌐</div>
                <h3>Language</h3>
              </div>
              <select
                value={preferences.language}
                onChange={(e) => handlePreferenceChange("language", e.target.value)}
              >
                <option value="en">English</option>
                <option value="ta">Tamil</option>
                <option value="hi">Hindi</option>
              </select>
            </div>

            <div className="pref-card">
              <div className="pref-card-header">
                <div className="pref-icon notification">🔔</div>
                <h3>Notifications</h3>
              </div>
              <div className="pref-toggle">
                <div className="toggle-row">
                  <span className="toggle-label">Email Notifications</span>
                  <button
                    className={`toggle-switch-sm ${preferences.emailNotifications ? "active" : ""}`}
                    onClick={() => handlePreferenceChange("emailNotifications", !preferences.emailNotifications)}
                  >
                    <span className="toggle-knob-sm"></span>
                  </button>
                </div>
                <div className="toggle-row">
                  <span className="toggle-label">Push Notifications</span>
                  <button
                    className={`toggle-switch-sm ${preferences.pushNotifications ? "active" : ""}`}
                    onClick={() => handlePreferenceChange("pushNotifications", !preferences.pushNotifications)}
                  >
                    <span className="toggle-knob-sm"></span>
                  </button>
                </div>
                <div className="toggle-row">
                  <span className="toggle-label">Reminder Notifications</span>
                  <button
                    className={`toggle-switch-sm ${preferences.reminderNotifications ? "active" : ""}`}
                    onClick={() => handlePreferenceChange("reminderNotifications", !preferences.reminderNotifications)}
                  >
                    <span className="toggle-knob-sm"></span>
                  </button>
                </div>
              </div>
            </div>

            <div className="pref-card">
              <div className="pref-card-header">
                <div className="pref-icon ai">🤖</div>
                <h3>AI Preferences</h3>
              </div>
              <div className="pref-toggle">
                <div className="toggle-row">
                  <span className="toggle-label">AI Suggestions</span>
                  <button
                    className={`toggle-switch-sm ${preferences.aiSuggestions ? "active" : ""}`}
                    onClick={() => handlePreferenceChange("aiSuggestions", !preferences.aiSuggestions)}
                  >
                    <span className="toggle-knob-sm"></span>
                  </button>
                </div>
                <div className="toggle-row">
                  <span className="toggle-label">Auto Summary</span>
                  <button
                    className={`toggle-switch-sm ${preferences.autoSummary ? "active" : ""}`}
                    onClick={() => handlePreferenceChange("autoSummary", !preferences.autoSummary)}
                  >
                    <span className="toggle-knob-sm"></span>
                  </button>
                </div>
                <div className="toggle-row">
                  <span className="toggle-label">Smart Recommendations</span>
                  <button
                    className={`toggle-switch-sm ${preferences.smartRecommendations ? "active" : ""}`}
                    onClick={() => handlePreferenceChange("smartRecommendations", !preferences.smartRecommendations)}
                  >
                    <span className="toggle-knob-sm"></span>
                  </button>
                </div>
              </div>
            </div>

            <div className="form-actions" style={{ marginTop: "1.5rem" }}>
              <button className="save-btn" onClick={savePreferences}>
                <FaSave /> Save Preferences
              </button>
            </div>
          </div>
        )}

        {/* ─── Danger Zone ─── */}
        {activeSection === "danger" && (
          <div className="profile-danger">
            <h2>🚨 Danger Zone</h2>
            <div className="danger-card">
              <h3>Deactivate Account</h3>
              <p>
                This will temporarily disable your account. You can reactivate
                it later.
              </p>
              <button className="danger-btn" onClick={handleDeactivateAccount}>
                Deactivate Account
              </button>
            </div>
            <div className="danger-card">
              <h3>Delete Account</h3>
              <p>
                This action is permanent and cannot be undone. All your data
                will be removed.
              </p>
              <button className="danger-btn" onClick={handleDeleteAccount}>
                <FaTrash /> Delete Account
              </button>
            </div>
            <div className="danger-card">
              <h3>Data Management</h3>
              <div className="data-actions">
                <button onClick={() => handleExport("Documents")}>
                  <FaDownload /> Export Documents
                </button>
                <button onClick={() => handleExport("Notes")}>
                  <FaDownload /> Export Notes
                </button>
                <button onClick={() => handleExport("Flashcards")}>
                  <FaDownload /> Export Flashcards
                </button>
                <button onClick={() => handleExport("Analytics")}>
                  <FaDownload /> Export Analytics
                </button>
                <button onClick={handleBackup}>
                  <FaCloudUploadAlt /> Backup Account
                </button>
                <button onClick={handleRestore}>
                  <FaCloudDownloadAlt /> Restore Backup
                </button>
              </div>
            </div>
            <div className="danger-card">
              <h3>Download Personal Data</h3>
              <button
                className="btn-outline"
                onClick={() => alert("Downloading personal data...")}
              >
                <FaDatabase /> Download All Data
              </button>
            </div>
            <div className="danger-card">
              <h3>Remove AI History</h3>
              <button
                className="btn-outline"
                onClick={() => alert("AI history cleared (backend needed)")}
              >
                <FaBrain /> Clear AI History
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Profile;