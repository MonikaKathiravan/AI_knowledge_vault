import "./Settings.css";
import { useState, useEffect, useCallback } from "react";
import {
  FaHome,
  FaPalette,
  FaRobot,
  FaBell,
  FaDatabase,
  FaCloudUploadAlt,
  FaLink,
  FaUniversalAccess,
  FaBook,
  FaInfoCircle,
  FaQuestionCircle,
  FaExclamationTriangle,
  FaSave,
  FaUndo,
  FaMoon,
  FaSun,
  FaGlobe,
  FaSearch,
  FaTrash,
  FaSignOutAlt,
  FaUserEdit,
  FaShieldAlt,
  FaClock,
  FaServer,
  FaCog,
  FaLanguage,
  FaCalendarAlt,
  FaFont,
  FaFileAlt,
  FaLightbulb,
  FaBrain,
  FaComments,
  FaUserCog,
  FaHistory,
  FaDownload,
  FaUpload,
  FaGithub,
  FaGoogle,
  FaLinkedin,
  FaMicrosoft,
  FaEye,
  FaEyeSlash,
  FaRegBell,
  FaRegCalendarCheck,
  FaThLarge,
  FaEnvelope,
  FaFlag,
  FaChartLine,
  FaTrophy,
  FaStar,
  FaKeyboard,
  FaStickyNote,
  FaTag,
} from "react-icons/fa";

function Settings() {
  // ─── State ────────────────────────────────────────────────────
  const [preferences, setPreferences] = useState({
    theme: "system",
    language: "en",
    timezone: "UTC",
    dateFormat: "MM/DD/YYYY",
    autoSaveInterval: 30,
    defaultHome: "dashboard",
    fontSize: "medium",
    sidebarCollapsed: false,
    compactView: false,
    layout: "grid",
  });
  const [aiSettings, setAiSettings] = useState({
    responseStyle: "balanced",
    creativityLevel: 0.7,
    aiLanguage: "en",
    summaryLength: "medium",
    flashcardDifficulty: "medium",
    chatPersonality: "helpful",
    autoSuggestions: true,
    aiMemory: true,
  });
  const [notificationSettings, setNotificationSettings] = useState({
    email: true,
    browser: true,
    goalReminders: true,
    studyReminders: true,
    flashcardReminders: true,
    dailyReminder: false,
    weeklyReport: true,
    achievements: true,
    newFeatures: true,
  });
  const [privacySettings, setPrivacySettings] = useState({
    profilePublic: true,
    hideStats: false,
    hideEmail: false,
    dataCollection: true,
    aiTrainingConsent: true,
    searchHistory: true,
    activityVisibility: true,
  });
  const [securitySettings, setSecuritySettings] = useState({
    twoFactor: false,
    sessionTimeout: 60,
    activeDevices: ["Chrome (Windows)", "Mobile App (Android)"],
    loginHistory: ["2026-07-15 10:30", "2026-07-14 22:15", "2026-07-13 18:00"],
  });
  const [storage, setStorage] = useState({
    total: 10,
    used: 0,
    documents: 0,
    notes: 0,
    summaries: 0,
    flashcards: 0,
    chats: 0,
  });
  const [backupSettings, setBackupSettings] = useState({
    autoBackup: true,
    backupFrequency: "weekly",
    lastBackup: null,
    backupHistory: [],
  });
  const [connectedAccounts, setConnectedAccounts] = useState([
    { name: "Google", icon: <FaGoogle />, connected: false },
    { name: "Microsoft", icon: <FaMicrosoft />, connected: false },
    { name: "GitHub", icon: <FaGithub />, connected: false },
    { name: "LinkedIn", icon: <FaLinkedin />, connected: false },
  ]);
  const [accessibilitySettings, setAccessibilitySettings] = useState({
    highContrast: false,
    largerText: false,
    keyboardNav: true,
    reducedMotion: false,
    screenReader: false,
    colorBlindFriendly: false,
  });
  const [learningPreferences, setLearningPreferences] = useState({
    preferredMethod: "notes",
    subjects: ["Java", "React", "AI"],
    reminderFrequency: "daily",
  });
  const [systemInfo] = useState({
    version: "1.0.0",
    lastUpdate: "2026-07-15",
    dbStatus: "Connected",
    aiStatus: "Operational",
    storageStatus: "Healthy",
    serverConnection: "Stable",
    apiStatus: "Online",
  });
  const [activeCategory, setActiveCategory] = useState("general");
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const token = localStorage.getItem("token");

  // ─── Apply theme, font size, sidebar, compact view ────────
  useEffect(() => {
    const applyTheme = (theme) => {
      const body = document.body;
      // Remove existing theme classes
      body.classList.remove("light-mode", "dark-mode");
      if (theme === "light") {
        body.classList.add("light-mode");
        document.documentElement.style.colorScheme = "light";
      } else if (theme === "dark") {
        body.classList.add("dark-mode");
        document.documentElement.style.colorScheme = "dark";
      } else {
        // system
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        body.classList.add(prefersDark ? "dark-mode" : "light-mode");
        document.documentElement.style.colorScheme = prefersDark ? "dark" : "light";
      }
    };

    const applyFontSize = (size) => {
      const root = document.documentElement;
      const sizes = { small: "14px", medium: "16px", large: "18px" };
      root.style.fontSize = sizes[size] || "16px";
    };

    const applySidebar = (collapsed) => {
      const sidebar = document.querySelector(".dash-sidebar");
      if (sidebar) {
        if (collapsed) sidebar.classList.add("collapsed");
        else sidebar.classList.remove("collapsed");
      }
    };

    const applyCompact = (compact) => {
      const main = document.querySelector(".dash-main");
      if (main) {
        if (compact) main.classList.add("compact");
        else main.classList.remove("compact");
      }
    };

    applyTheme(preferences.theme);
    applyFontSize(preferences.fontSize);
    applySidebar(preferences.sidebarCollapsed);
    applyCompact(preferences.compactView);
  }, [preferences.theme, preferences.fontSize, preferences.sidebarCollapsed, preferences.compactView]);

  // ─── Fetch real data ─────────────────────────────────────────
  const fetchSettings = useCallback(async () => {
    if (!token) return;
    try {
      const userRes = await fetch("http://localhost:5000/api/users/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!userRes.ok) throw new Error("Failed to fetch user");
      const userData = await userRes.json();
      if (userData.success) {
        const u = userData.user;
        if (u.preferences) {
          setPreferences((prev) => ({ ...prev, ...u.preferences }));
          if (u.preferences.aiSettings) setAiSettings(u.preferences.aiSettings);
          if (u.preferences.notificationSettings)
            setNotificationSettings(u.preferences.notificationSettings);
          if (u.preferences.privacySettings)
            setPrivacySettings(u.preferences.privacySettings);
          if (u.preferences.securitySettings) {
            setSecuritySettings((prev) => ({
              ...prev,
              twoFactor: u.preferences.securitySettings.twoFactor || false,
              sessionTimeout:
                u.preferences.securitySettings.sessionTimeout || 60,
            }));
          }
          if (u.preferences.accessibilitySettings)
            setAccessibilitySettings(u.preferences.accessibilitySettings);
          if (u.preferences.learningPreferences)
            setLearningPreferences(u.preferences.learningPreferences);
        }
      }

      const [docRes, notesRes, summaryRes, flashRes, chatRes] =
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
        ]);
      const docData = await docRes.json();
      const notesData = await notesRes.json();
      const summaryData = await summaryRes.json();
      const flashData = await flashRes.json();
      const chatData = await chatRes.json();

      const docCount = docData.success ? docData.documents.length : 0;
      const noteCount = notesData.success ? notesData.notes.length : 0;
      const summaryCount = summaryData.success
        ? summaryData.summaries.length
        : 0;
      const flashCount = flashData.success ? flashData.stats.total : 0;
      const chatCount = chatData.success ? chatData.conversations.length : 0;

      const totalItems =
        docCount + noteCount + summaryCount + flashCount + chatCount;
      const usedGB = (totalItems * 0.5) / 1024;
      setStorage({
        total: 10,
        used: Math.min(usedGB, 10),
        documents: docCount,
        notes: noteCount,
        summaries: summaryCount,
        flashcards: flashCount,
        chats: chatCount,
      });
    } catch (error) {
      console.warn("Settings fetch error, using defaults", error);
    }
  }, [token]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // ─── Handlers ───────────────────────────────────────────────
  const handleChange = (setter, value, key) => {
    setter((prev) => ({ ...prev, [key]: value }));
    setUnsavedChanges(true);
  };

  const handleSave = async () => {
    try {
      const updatedPrefs = {
        theme: preferences.theme,
        language: preferences.language,
        timezone: preferences.timezone,
        dateFormat: preferences.dateFormat,
        autoSaveInterval: preferences.autoSaveInterval,
        defaultHome: preferences.defaultHome,
        fontSize: preferences.fontSize,
        sidebarCollapsed: preferences.sidebarCollapsed,
        compactView: preferences.compactView,
        layout: preferences.layout,
        aiSettings,
        notificationSettings,
        privacySettings,
        securitySettings: {
          twoFactor: securitySettings.twoFactor,
          sessionTimeout: securitySettings.sessionTimeout,
        },
        accessibilitySettings,
        learningPreferences,
      };

      const res = await fetch("http://localhost:5000/api/users/me", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ preferences: updatedPrefs }),
      });
      const data = await res.json();
      if (data.success) {
        alert("Settings saved successfully!");
        setUnsavedChanges(false);
        fetchSettings();
      } else {
        alert("Failed to save: " + data.message);
      }
    } catch (error) {
      alert("Network error. Please try again.");
    }
  };

  const handleDiscard = () => {
    if (window.confirm("Discard all unsaved changes?")) {
      fetchSettings();
      setUnsavedChanges(false);
    }
  };

  // ─── Categories ─────────────────────────────────────────────
  const categories = [
    { id: "general", label: "General", icon: <FaCog />, color: "#4F46E5" },
    {
      id: "appearance",
      label: "Appearance",
      icon: <FaPalette />,
      color: "#EC4899",
    },
    { id: "ai", label: "AI Preferences", icon: <FaBrain />, color: "#8B5CF6" },
    {
      id: "notifications",
      label: "Notifications",
      icon: <FaBell />,
      color: "#F59E0B",
    },
    {
      id: "privacy",
      label: "Privacy & Security",
      icon: <FaShieldAlt />,
      color: "#EF4444",
    },
    { id: "storage", label: "Storage", icon: <FaDatabase />, color: "#14B8A6" },
    {
      id: "backup",
      label: "Backup & Export",
      icon: <FaCloudUploadAlt />,
      color: "#3B82F6",
    },
    {
      id: "connected",
      label: "Connected Accounts",
      icon: <FaLink />,
      color: "#10B981",
    },
    {
      id: "accessibility",
      label: "Accessibility",
      icon: <FaUniversalAccess />,
      color: "#8B5CF6",
    },
    {
      id: "learning",
      label: "Learning Preferences",
      icon: <FaBook />,
      color: "#F43F5E",
    },
    {
      id: "system",
      label: "System Information",
      icon: <FaServer />,
      color: "#64748B",
    },
    {
      id: "help",
      label: "Help & Support",
      icon: <FaQuestionCircle />,
      color: "#3B82F6",
    },
    { id: "about", label: "About", icon: <FaInfoCircle />, color: "#64748B" },
    {
      id: "danger",
      label: "Danger Zone",
      icon: <FaExclamationTriangle />,
      color: "#DC2626",
    },
  ];

  const filteredCategories = categories.filter((c) =>
    c.label.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // Map setting keys to icons for display
  const settingIcons = {
    language: <FaLanguage />,
    timezone: <FaClock />,
    dateFormat: <FaCalendarAlt />,
    autoSaveInterval: <FaSave />,
    defaultHome: <FaHome />,
    fontSize: <FaFont />,
    sidebarCollapsed: <FaFileAlt />,
    compactView: <FaEye />,
    layout: <FaThLarge />,
    responseStyle: <FaComments />,
    creativityLevel: <FaLightbulb />,
    aiLanguage: <FaLanguage />,
    summaryLength: <FaFileAlt />,
    flashcardDifficulty: <FaBook />,
    chatPersonality: <FaUserCog />,
    autoSuggestions: <FaRobot />,
    aiMemory: <FaBrain />,
    email: <FaEnvelope />,
    browser: <FaGlobe />,
    goalReminders: <FaFlag />,
    studyReminders: <FaClock />,
    flashcardReminders: <FaBook />,
    dailyReminder: <FaRegCalendarCheck />,
    weeklyReport: <FaChartLine />,
    achievements: <FaTrophy />,
    newFeatures: <FaStar />,
    profilePublic: <FaUserEdit />,
    hideStats: <FaEyeSlash />,
    hideEmail: <FaEnvelope />,
    dataCollection: <FaDatabase />,
    aiTrainingConsent: <FaBrain />,
    searchHistory: <FaHistory />,
    activityVisibility: <FaEye />,
    highContrast: <FaEye />,
    largerText: <FaFont />,
    keyboardNav: <FaKeyboard />,
    reducedMotion: <FaEyeSlash />,
    screenReader: <FaUniversalAccess />,
    colorBlindFriendly: <FaEye />,
  };

  // ─── Render ──────────────────────────────────────────────────
  return (
    <div className="settings-page">
      {/* Sidebar */}
      <aside className="settings-sidebar">
        <div className="settings-sidebar-header">
          <h2>⚙️ Settings</h2>
          <div className="settings-search">
            <FaSearch />
            <input
              type="text"
              placeholder="Search settings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <nav className="settings-nav">
          {filteredCategories.map((cat) => (
            <button
              key={cat.id}
              className={`settings-nav-item ${activeCategory === cat.id ? "active" : ""}`}
              onClick={() => setActiveCategory(cat.id)}
            >
              <span className="nav-icon" style={{ color: cat.color }}>
                {cat.icon}
              </span>
              <span>{cat.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* Content */}
      <main className="settings-content">
        {categories.map((cat) => (
          <div
            key={cat.id}
            className={`settings-section ${activeCategory === cat.id ? "active" : ""}`}
          >
            <div
              className="section-header"
              style={{ borderLeftColor: cat.color }}
            >
              <h2>
                {cat.icon} {cat.label}
              </h2>
            </div>
            <div className="settings-section-body">
              {/* ── General ── */}
              {cat.id === "general" && (
                <>
                  {[
                    "language",
                    "timezone",
                    "dateFormat",
                    "autoSaveInterval",
                    "defaultHome",
                  ].map((key) => {
                    const value = preferences[key];
                    const icon = settingIcons[key] || <FaCog />;
                    return (
                      <div className="setting-item" key={key}>
                        <div className="setting-item-left">
                          <span
                            className="setting-icon"
                            style={{ background: "#4F46E5" }}
                          >
                            {icon}
                          </span>
                          <label>
                            {key
                              .replace(/([A-Z])/g, " $1")
                              .replace(/^./, (str) => str.toUpperCase())}
                          </label>
                        </div>
                        {key === "language" && (
                          <select
                            value={value}
                            onChange={(e) =>
                              handleChange(setPreferences, e.target.value, key)
                            }
                          >
                            <option value="en">English</option>
                            <option value="ta">Tamil</option>
                            <option value="hi">Hindi</option>
                          </select>
                        )}
                        {key === "timezone" && (
                          <select
                            value={value}
                            onChange={(e) =>
                              handleChange(setPreferences, e.target.value, key)
                            }
                          >
                            <option value="UTC">UTC</option>
                            <option value="Asia/Kolkata">
                              Asia/Kolkata (IST)
                            </option>
                            <option value="America/New_York">
                              America/New_York (EST)
                            </option>
                          </select>
                        )}
                        {key === "dateFormat" && (
                          <select
                            value={value}
                            onChange={(e) =>
                              handleChange(setPreferences, e.target.value, key)
                            }
                          >
                            <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                            <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                            <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                          </select>
                        )}
                        {key === "autoSaveInterval" && (
                          <input
                            type="number"
                            value={value}
                            onChange={(e) =>
                              handleChange(
                                setPreferences,
                                parseInt(e.target.value) || 30,
                                key,
                              )
                            }
                          />
                        )}
                        {key === "defaultHome" && (
                          <select
                            value={value}
                            onChange={(e) =>
                              handleChange(setPreferences, e.target.value, key)
                            }
                          >
                            <option value="dashboard">Dashboard</option>
                            <option value="documents">Documents</option>
                            <option value="notes">Notes</option>
                            <option value="analytics">Analytics</option>
                          </select>
                        )}
                      </div>
                    );
                  })}
                </>
              )}

              {/* ── Appearance ── */}
              {cat.id === "appearance" && (
                <>
                  <div className="setting-item">
                    <div className="setting-item-left">
                      <span
                        className="setting-icon"
                        style={{ background: "#EC4899" }}
                      >
                        <FaPalette />
                      </span>
                      <label>Theme</label>
                    </div>
                    <div className="theme-selector">
                      <button
                        className={`theme-btn ${preferences.theme === "light" ? "active" : ""}`}
                        onClick={() =>
                          handleChange(setPreferences, "light", "theme")
                        }
                      >
                        <FaSun /> Light
                      </button>
                      <button
                        className={`theme-btn ${preferences.theme === "dark" ? "active" : ""}`}
                        onClick={() =>
                          handleChange(setPreferences, "dark", "theme")
                        }
                      >
                        <FaMoon /> Dark
                      </button>
                      <button
                        className={`theme-btn ${preferences.theme === "system" ? "active" : ""}`}
                        onClick={() =>
                          handleChange(setPreferences, "system", "theme")
                        }
                      >
                        <FaGlobe /> System
                      </button>
                    </div>
                  </div>

                  <div className="setting-item">
                    <div className="setting-item-left">
                      <span
                        className="setting-icon"
                        style={{ background: "#F59E0B" }}
                      >
                        <FaFont />
                      </span>
                      <label>Font Size</label>
                    </div>
                    <select
                      value={preferences.fontSize}
                      onChange={(e) =>
                        handleChange(setPreferences, e.target.value, "fontSize")
                      }
                    >
                      <option value="small">Small</option>
                      <option value="medium">Medium</option>
                      <option value="large">Large</option>
                    </select>
                  </div>

                  <div className="setting-item">
                    <div className="setting-item-left">
                      <span
                        className="setting-icon"
                        style={{ background: "#3B82F6" }}
                      >
                        <FaFileAlt />
                      </span>
                      <label>Sidebar Collapsed</label>
                    </div>
                    <button
                      className={`toggle-btn ${preferences.sidebarCollapsed ? "active" : ""}`}
                      onClick={() =>
                        handleChange(
                          setPreferences,
                          !preferences.sidebarCollapsed,
                          "sidebarCollapsed",
                        )
                      }
                    >
                      {preferences.sidebarCollapsed ? "Collapsed" : "Expanded"}
                    </button>
                  </div>

                  <div className="setting-item">
                    <div className="setting-item-left">
                      <span
                        className="setting-icon"
                        style={{ background: "#8B5CF6" }}
                      >
                        <FaEye />
                      </span>
                      <label>Compact View</label>
                    </div>
                    <button
                      className={`toggle-btn ${preferences.compactView ? "active" : ""}`}
                      onClick={() =>
                        handleChange(
                          setPreferences,
                          !preferences.compactView,
                          "compactView",
                        )
                      }
                    >
                      {preferences.compactView ? "On" : "Off"}
                    </button>
                  </div>

                  <div className="setting-item">
                    <div className="setting-item-left">
                      <span
                        className="setting-icon"
                        style={{ background: "#14B8A6" }}
                      >
                        <FaThLarge />
                      </span>
                      <label>Layout</label>
                    </div>
                    <select
                      value={preferences.layout}
                      onChange={(e) =>
                        handleChange(setPreferences, e.target.value, "layout")
                      }
                    >
                      <option value="grid">Grid</option>
                      <option value="list">List</option>
                    </select>
                  </div>
                </>
              )}

              {/* ── AI Preferences ── */}
              {cat.id === "ai" && (
                <>
                  {Object.entries(aiSettings).map(([key, value]) => {
                    const icon = settingIcons[key] || <FaRobot />;
                    const colorMap = {
                      responseStyle: "#8B5CF6",
                      creativityLevel: "#F59E0B",
                      aiLanguage: "#EC4899",
                      summaryLength: "#3B82F6",
                      flashcardDifficulty: "#14B8A6",
                      chatPersonality: "#F43F5E",
                      autoSuggestions: "#10B981",
                      aiMemory: "#8B5CF6",
                    };
                    return (
                      <div className="setting-item" key={key}>
                        <div className="setting-item-left">
                          <span
                            className="setting-icon"
                            style={{ background: colorMap[key] || "#4F46E5" }}
                          >
                            {icon}
                          </span>
                          <label>
                            {key
                              .replace(/([A-Z])/g, " $1")
                              .replace(/^./, (str) => str.toUpperCase())}
                          </label>
                        </div>
                        {key === "creativityLevel" && (
                          <>
                            <input
                              type="range"
                              min="0"
                              max="1"
                              step="0.1"
                              value={value}
                              onChange={(e) =>
                                handleChange(
                                  setAiSettings,
                                  parseFloat(e.target.value),
                                  key,
                                )
                              }
                            />
                            <span>{value}</span>
                          </>
                        )}
                        {key === "autoSuggestions" || key === "aiMemory" ? (
                          <button
                            className={`toggle-btn ${value ? "active" : ""}`}
                            onClick={() =>
                              handleChange(setAiSettings, !value, key)
                            }
                          >
                            {value ? "On" : "Off"}
                          </button>
                        ) : (
                          <select
                            value={value}
                            onChange={(e) =>
                              handleChange(setAiSettings, e.target.value, key)
                            }
                          >
                            {key === "responseStyle" && (
                              <>
                                <option value="concise">Concise</option>
                                <option value="balanced">Balanced</option>
                                <option value="detailed">Detailed</option>
                              </>
                            )}
                            {key === "aiLanguage" && (
                              <>
                                <option value="en">English</option>
                                <option value="ta">Tamil</option>
                                <option value="hi">Hindi</option>
                              </>
                            )}
                            {key === "summaryLength" && (
                              <>
                                <option value="short">Short</option>
                                <option value="medium">Medium</option>
                                <option value="long">Long</option>
                              </>
                            )}
                            {key === "flashcardDifficulty" && (
                              <>
                                <option value="easy">Easy</option>
                                <option value="medium">Medium</option>
                                <option value="hard">Hard</option>
                              </>
                            )}
                            {key === "chatPersonality" && (
                              <>
                                <option value="helpful">Helpful</option>
                                <option value="professional">
                                  Professional
                                </option>
                                <option value="casual">Casual</option>
                                <option value="socratic">Socratic</option>
                              </>
                            )}
                          </select>
                        )}
                      </div>
                    );
                  })}
                </>
              )}

              {/* ── Notifications ── */}
              {cat.id === "notifications" && (
                <>
                  {Object.entries(notificationSettings).map(([key, value]) => {
                    const icon = settingIcons[key] || <FaRegBell />;
                    const colorMap = {
                      email: "#3B82F6",
                      browser: "#8B5CF6",
                      goalReminders: "#F59E0B",
                      studyReminders: "#EC4899",
                      flashcardReminders: "#14B8A6",
                      dailyReminder: "#F43F5E",
                      weeklyReport: "#10B981",
                      achievements: "#F59E0B",
                      newFeatures: "#8B5CF6",
                    };
                    return (
                      <div className="setting-item" key={key}>
                        <div className="setting-item-left">
                          <span
                            className="setting-icon"
                            style={{ background: colorMap[key] || "#4F46E5" }}
                          >
                            {icon}
                          </span>
                          <label>
                            {key
                              .replace(/([A-Z])/g, " $1")
                              .replace(/^./, (str) => str.toUpperCase())}
                          </label>
                        </div>
                        <button
                          className={`toggle-btn ${value ? "active" : ""}`}
                          onClick={() =>
                            handleChange(setNotificationSettings, !value, key)
                          }
                        >
                          {value ? "On" : "Off"}
                        </button>
                      </div>
                    );
                  })}
                </>
              )}

              {/* ── Privacy & Security ── */}
              {cat.id === "privacy" && (
                <>
                  {Object.entries(privacySettings).map(([key, value]) => {
                    const icon = settingIcons[key] || <FaShieldAlt />;
                    const colorMap = {
                      profilePublic: "#10B981",
                      hideStats: "#EF4444",
                      hideEmail: "#3B82F6",
                      dataCollection: "#8B5CF6",
                      aiTrainingConsent: "#F59E0B",
                      searchHistory: "#F43F5E",
                      activityVisibility: "#14B8A6",
                    };
                    return (
                      <div className="setting-item" key={key}>
                        <div className="setting-item-left">
                          <span
                            className="setting-icon"
                            style={{ background: colorMap[key] || "#4F46E5" }}
                          >
                            {icon}
                          </span>
                          <label>
                            {key
                              .replace(/([A-Z])/g, " $1")
                              .replace(/^./, (str) => str.toUpperCase())}
                          </label>
                        </div>
                        <button
                          className={`toggle-btn ${value ? "active" : ""}`}
                          onClick={() =>
                            handleChange(setPrivacySettings, !value, key)
                          }
                        >
                          {value ? "On" : "Off"}
                        </button>
                      </div>
                    );
                  })}
                  <div className="setting-item">
                    <div className="setting-item-left">
                      <span
                        className="setting-icon"
                        style={{ background: "#EF4444" }}
                      >
                        <FaShieldAlt />
                      </span>
                      <label>Two-Factor Authentication</label>
                    </div>
                    <button
                      className={`toggle-btn ${securitySettings.twoFactor ? "active" : ""}`}
                      onClick={() =>
                        handleChange(
                          setSecuritySettings,
                          !securitySettings.twoFactor,
                          "twoFactor",
                        )
                      }
                    >
                      {securitySettings.twoFactor ? "Enabled" : "Disabled"}
                    </button>
                  </div>
                  <div className="setting-item">
                    <div className="setting-item-left">
                      <span
                        className="setting-icon"
                        style={{ background: "#8B5CF6" }}
                      >
                        <FaClock />
                      </span>
                      <label>Session Timeout (minutes)</label>
                    </div>
                    <input
                      type="number"
                      value={securitySettings.sessionTimeout}
                      onChange={(e) =>
                        handleChange(
                          setSecuritySettings,
                          parseInt(e.target.value) || 60,
                          "sessionTimeout",
                        )
                      }
                    />
                  </div>
                  <div className="setting-item">
                    <div className="setting-item-left">
                      <span
                        className="setting-icon"
                        style={{ background: "#14B8A6" }}
                      >
                        <FaServer />
                      </span>
                      <label>Active Devices</label>
                    </div>
                    <ul className="device-list">
                      {securitySettings.activeDevices.map((device, idx) => (
                        <li key={idx}>{device}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="setting-item">
                    <div className="setting-item-left">
                      <span
                        className="setting-icon"
                        style={{ background: "#F59E0B" }}
                      >
                        <FaHistory />
                      </span>
                      <label>Login History</label>
                    </div>
                    <ul className="login-history-list">
                      {securitySettings.loginHistory.map((log, idx) => (
                        <li key={idx}>{log}</li>
                      ))}
                    </ul>
                  </div>
                  <button
                    className="danger-btn"
                    onClick={() => alert("Logout all devices")}
                  >
                    <FaSignOutAlt /> Logout from All Devices
                  </button>
                </>
              )}

              {/* ── Storage ── */}
              {cat.id === "storage" && (
                <>
                  <div className="setting-item">
                    <div className="setting-item-left">
                      <span
                        className="setting-icon"
                        style={{ background: "#3B82F6" }}
                      >
                        <FaDatabase />
                      </span>
                      <label>Storage Usage</label>
                    </div>
                    <div className="storage-info">
                      <div className="storage-bar">
                        <div
                          className="storage-fill"
                          style={{
                            width: `${(storage.used / storage.total) * 100}%`,
                          }}
                        ></div>
                      </div>
                      <span>
                        {storage.used.toFixed(2)} GB / {storage.total} GB used
                      </span>
                    </div>
                  </div>
                  <div className="storage-stats-grid">
                    <div>
                      <FaFileAlt /> <span>Documents</span>{" "}
                      <strong>{storage.documents}</strong>
                    </div>
                    <div>
                      <FaStickyNote /> <span>Notes</span>{" "}
                      <strong>{storage.notes}</strong>
                    </div>
                    <div>
                      <FaBrain /> <span>Summaries</span>{" "}
                      <strong>{storage.summaries}</strong>
                    </div>
                    <div>
                      <FaBook /> <span>Flashcards</span>{" "}
                      <strong>{storage.flashcards}</strong>
                    </div>
                    <div>
                      <FaComments /> <span>Chats</span>{" "}
                      <strong>{storage.chats}</strong>
                    </div>
                  </div>
                  <button
                    className="action-btn"
                    onClick={() => alert("Clear cache")}
                  >
                    <FaTrash /> Clear Cache
                  </button>
                </>
              )}

              {/* ── Backup & Export ── */}
              {cat.id === "backup" && (
                <>
                  <div className="setting-item">
                    <div className="setting-item-left">
                      <span
                        className="setting-icon"
                        style={{ background: "#10B981" }}
                      >
                        <FaCloudUploadAlt />
                      </span>
                      <label>Automatic Weekly Backup</label>
                    </div>
                    <button
                      className={`toggle-btn ${backupSettings.autoBackup ? "active" : ""}`}
                      onClick={() =>
                        setBackupSettings({
                          ...backupSettings,
                          autoBackup: !backupSettings.autoBackup,
                        })
                      }
                    >
                      {backupSettings.autoBackup ? "Enabled" : "Disabled"}
                    </button>
                  </div>
                  <div className="setting-item">
                    <div className="setting-item-left">
                      <span
                        className="setting-icon"
                        style={{ background: "#3B82F6" }}
                      >
                        <FaClock />
                      </span>
                      <label>Backup Frequency</label>
                    </div>
                    <select
                      value={backupSettings.backupFrequency}
                      onChange={(e) =>
                        setBackupSettings({
                          ...backupSettings,
                          backupFrequency: e.target.value,
                        })
                      }
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>
                  <div className="setting-item">
                    <div className="setting-item-left">
                      <span
                        className="setting-icon"
                        style={{ background: "#F59E0B" }}
                      >
                        <FaHistory />
                      </span>
                      <label>Last Backup</label>
                    </div>
                    <span>{backupSettings.lastBackup || "Never"}</span>
                  </div>
                  <div className="backup-actions">
                    <button
                      className="action-btn"
                      onClick={() => alert("Backup now")}
                    >
                      <FaCloudUploadAlt /> Backup Now
                    </button>
                    <button
                      className="action-btn"
                      onClick={() => alert("Download backup")}
                    >
                      <FaDownload /> Download Backup
                    </button>
                    <button
                      className="action-btn"
                      onClick={() => alert("Restore backup")}
                    >
                      <FaUpload /> Restore Backup
                    </button>
                  </div>
                </>
              )}

              {/* ── Connected Accounts ── */}
              {cat.id === "connected" && (
                <>
                  {connectedAccounts.map((acc) => (
                    <div className="setting-item" key={acc.name}>
                      <div className="setting-item-left">
                        <span
                          className="setting-icon"
                          style={{ background: "#10B981" }}
                        >
                          {acc.icon}
                        </span>
                        <label>{acc.name}</label>
                      </div>
                      <button
                        className={`toggle-btn ${acc.connected ? "active" : ""}`}
                        onClick={() => {
                          const updated = connectedAccounts.map((a) =>
                            a.name === acc.name
                              ? { ...a, connected: !a.connected }
                              : a,
                          );
                          setConnectedAccounts(updated);
                          setUnsavedChanges(true);
                        }}
                      >
                        {acc.connected ? "Connected" : "Connect"}
                      </button>
                    </div>
                  ))}
                </>
              )}

              {/* ── Accessibility ── */}
              {cat.id === "accessibility" && (
                <>
                  {Object.entries(accessibilitySettings).map(([key, value]) => {
                    const icon = settingIcons[key] || <FaUniversalAccess />;
                    const colorMap = {
                      highContrast: "#EF4444",
                      largerText: "#F59E0B",
                      keyboardNav: "#3B82F6",
                      reducedMotion: "#8B5CF6",
                      screenReader: "#10B981",
                      colorBlindFriendly: "#EC4899",
                    };
                    return (
                      <div className="setting-item" key={key}>
                        <div className="setting-item-left">
                          <span
                            className="setting-icon"
                            style={{ background: colorMap[key] || "#4F46E5" }}
                          >
                            {icon}
                          </span>
                          <label>
                            {key
                              .replace(/([A-Z])/g, " $1")
                              .replace(/^./, (str) => str.toUpperCase())}
                          </label>
                        </div>
                        <button
                          className={`toggle-btn ${value ? "active" : ""}`}
                          onClick={() =>
                            handleChange(setAccessibilitySettings, !value, key)
                          }
                        >
                          {value ? "On" : "Off"}
                        </button>
                      </div>
                    );
                  })}
                </>
              )}

              {/* ── Learning Preferences ── */}
              {cat.id === "learning" && (
                <>
                  <div className="setting-item">
                    <div className="setting-item-left">
                      <span
                        className="setting-icon"
                        style={{ background: "#8B5CF6" }}
                      >
                        <FaBook />
                      </span>
                      <label>Preferred Learning Method</label>
                    </div>
                    <select
                      value={learningPreferences.preferredMethod}
                      onChange={(e) =>
                        handleChange(
                          setLearningPreferences,
                          e.target.value,
                          "preferredMethod",
                        )
                      }
                    >
                      <option value="notes">Notes</option>
                      <option value="flashcards">Flashcards</option>
                      <option value="chat">AI Chat</option>
                      <option value="summaries">Summaries</option>
                    </select>
                  </div>
                  <div className="setting-item">
                    <div className="setting-item-left">
                      <span
                        className="setting-icon"
                        style={{ background: "#F59E0B" }}
                      >
                        <FaTag />
                      </span>
                      <label>Preferred Subjects</label>
                    </div>
                    <input
                      type="text"
                      value={learningPreferences.subjects.join(", ")}
                      onChange={(e) =>
                        handleChange(
                          setLearningPreferences,
                          e.target.value.split(",").map((s) => s.trim()),
                          "subjects",
                        )
                      }
                    />
                  </div>
                  <div className="setting-item">
                    <div className="setting-item-left">
                      <span
                        className="setting-icon"
                        style={{ background: "#EC4899" }}
                      >
                        <FaRegCalendarCheck />
                      </span>
                      <label>Goal Reminder Frequency</label>
                    </div>
                    <select
                      value={learningPreferences.reminderFrequency}
                      onChange={(e) =>
                        handleChange(
                          setLearningPreferences,
                          e.target.value,
                          "reminderFrequency",
                        )
                      }
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>
                </>
              )}

              {/* ── System Information ── */}
              {cat.id === "system" && (
                <div className="system-info-grid">
                  {Object.entries(systemInfo).map(([key, value]) => {
                    const colorMap = {
                      version: "#4F46E5",
                      lastUpdate: "#3B82F6",
                      dbStatus: "#10B981",
                      aiStatus: "#8B5CF6",
                      storageStatus: "#14B8A6",
                      serverConnection: "#F59E0B",
                      apiStatus: "#EC4899",
                    };
                    return (
                      <div
                        className="system-info-item"
                        key={key}
                        style={{ borderLeftColor: colorMap[key] || "#4F46E5" }}
                      >
                        <span className="info-label">
                          {key
                            .replace(/([A-Z])/g, " $1")
                            .replace(/^./, (str) => str.toUpperCase())}
                        </span>
                        <span className="info-value">{value}</span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* ── Help & Support ── */}
              {cat.id === "help" && (
                <div className="help-actions">
                  <button
                    className="action-btn"
                    onClick={() => alert("Report a bug")}
                  >
                    🐛 Report a Bug
                  </button>
                  <button
                    className="action-btn"
                    onClick={() => alert("Suggest a feature")}
                  >
                    💡 Suggest a Feature
                  </button>
                  <button
                    className="action-btn"
                    onClick={() => alert("Contact support")}
                  >
                    📧 Contact Support
                  </button>
                  <button
                    className="action-btn"
                    onClick={() => alert("Rate the app")}
                  >
                    ⭐ Rate the Application
                  </button>
                  <button className="action-btn" onClick={() => alert("FAQ")}>
                    ❓ FAQs
                  </button>
                  <button
                    className="action-btn"
                    onClick={() => alert("Help Center")}
                  >
                    📚 Help Center
                  </button>
                </div>
              )}

              {/* ── About ── */}
              {cat.id === "about" && (
                <div className="about-content">
                  <h3>🧠 AI Knowledge Vault</h3>
                  <p>
                    <strong>Version:</strong> {systemInfo.version}
                  </p>
                  <p>
                    <strong>Last Update:</strong> {systemInfo.lastUpdate}
                  </p>
                  <p>
                    <strong>Description:</strong> AI-Powered Second Brain –
                    Organize, Learn, Remember, Search.
                  </p>
                  <p>
                    <strong>Developer:</strong> Sabaris A
                  </p>
                  <p>
                    <strong>Technologies:</strong> React, Node.js, Express,
                    MongoDB, AI (OpenAI API)
                  </p>
                  <p>
                    <a href="/privacy">Privacy Policy</a> |{" "}
                    <a href="/terms">Terms & Conditions</a>
                  </p>
                </div>
              )}

              {/* ── Danger Zone ── */}
              {cat.id === "danger" && (
                <div className="danger-zone">
                  {[
                    {
                      label: "Clear Search History",
                      icon: <FaTrash />,
                      action: () => alert("Search history cleared"),
                    },
                    {
                      label: "Clear AI Chat History",
                      icon: <FaTrash />,
                      action: () => alert("AI chat history cleared"),
                    },
                    {
                      label: "Delete All Notes",
                      icon: <FaTrash />,
                      action: () => alert("All notes deleted"),
                    },
                    {
                      label: "Delete All Documents",
                      icon: <FaTrash />,
                      action: () => alert("All documents deleted"),
                    },
                    {
                      label: "Reset Settings",
                      icon: <FaUndo />,
                      action: () => alert("Settings reset"),
                    },
                    {
                      label: "Deactivate Account",
                      icon: <FaSignOutAlt />,
                      action: () => alert("Account deactivated"),
                    },
                    {
                      label: "Delete Account Permanently",
                      icon: <FaExclamationTriangle />,
                      action: () => alert("Account deleted"),
                    },
                  ].map((item, idx) => (
                    <div className="danger-item" key={idx}>
                      <div className="danger-item-left">
                        <span
                          className="danger-icon"
                          style={{ color: "#DC2626" }}
                        >
                          {item.icon}
                        </span>
                        <h3>{item.label}</h3>
                      </div>
                      <button className="danger-btn" onClick={item.action}>
                        Execute
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {/* ─── Floating Save/Cancel ───────────────────────────── */}
        {unsavedChanges && (
          <div className="settings-actions">
            <button className="save-btn" onClick={handleSave}>
              <FaSave /> Save Changes
            </button>
            <button className="discard-btn" onClick={handleDiscard}>
              <FaUndo /> Discard
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

export default Settings;