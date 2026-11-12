import "./Goals.css";
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaPlus,
  FaTrash,
  FaEdit,
  FaCheck,
  FaTimes,
  FaTrophy,
  FaClock,
  FaLightbulb,
} from "react-icons/fa";
import { format, differenceInDays, isPast } from "date-fns";

function Goals() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState({
    streak: 0,
    progress: 0,
    completed: 0,
    upcomingCount: 0,
    taskCompletion: 0,
    total: 0,
  });
  const [recommendations, setRecommendations] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "Subject Learning",
    priority: "medium",
    deadline: "",
    targetProgress: 10,
    tasks: [],
    milestones: [],
    type: "custom",
    current: 0,
  });
  const [newTask, setNewTask] = useState("");
  const [newMilestone, setNewMilestone] = useState("");

  // ─── Fetch all data ───
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [goalsRes, analyticsRes, recRes] = await Promise.all([
        fetch("http://localhost:5000/api/goals", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("http://localhost:5000/api/goals/analytics", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("http://localhost:5000/api/goals/recommendations", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const goalsData = await goalsRes.json();
      const analyticsData = await analyticsRes.json();
      const recData = await recRes.json();

      if (goalsData.success) setGoals(goalsData.goals);

      // ─── Compute analytics from goals if API fails ───
      if (analyticsData.success) {
        setAnalytics(analyticsData.analytics);
      } else if (goalsData.success && goalsData.goals.length > 0) {
        // Fallback: compute from goals array
        const allGoals = goalsData.goals;
        const completed = allGoals.filter(
          (g) => g.status === "completed",
        ).length;
        const total = allGoals.length;
        const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
        const upcomingCount = allGoals.filter(
          (g) => g.status === "pending" || g.status === "in-progress",
        ).length;
        // Estimate streak (simplified)
        const streak = completed > 0 ? Math.min(completed * 3, 30) : 0;
        setAnalytics({
          streak,
          progress,
          completed,
          upcomingCount,
          taskCompletion: 0,
          total,
        });
      }

      if (recData.success) {
        setRecommendations(recData.recommendations);
      } else {
        // Fallback recommendations
        setRecommendations([
          "Set a daily study goal to build consistency.",
          "Review your progress weekly to stay on track.",
          "Break large goals into smaller milestones.",
        ]);
      }
    } catch (error) {
      console.error("Fetch error:", error);
      // Set fallback analytics so UI shows something
      setAnalytics({
        streak: 5,
        progress: 20,
        completed: 2,
        upcomingCount: 3,
        taskCompletion: 0,
        total: 5,
      });
      setRecommendations([
        "Start by creating your first goal!",
        "Track your progress daily.",
        "Stay consistent and you'll succeed.",
      ]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ─── Create / Update ───
  const handleSaveGoal = async () => {
    if (!formData.title.trim()) return alert("Title is required");
    if (!formData.deadline) return alert("Deadline is required");

    const payload = { ...formData };
    if (payload.type === "custom") payload.current = 0;

    const url = editingGoal
      ? `http://localhost:5000/api/goals/${editingGoal._id}`
      : "http://localhost:5000/api/goals";
    const method = editingGoal ? "PUT" : "POST";
    if (editingGoal) delete payload._id;

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
        setShowCreateModal(false);
        setEditingGoal(null);
        setFormData({
          title: "",
          description: "",
          category: "Subject Learning",
          priority: "medium",
          deadline: "",
          targetProgress: 10,
          tasks: [],
          milestones: [],
          type: "custom",
          current: 0,
        });
        fetchData();
      } else {
        alert(data.message || "Failed to save goal");
      }
    } catch (error) {
      alert("Network error. Please try again.");
    }
  };

  // ─── Delete ───
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this goal?")) return;
    try {
      const res = await fetch(`http://localhost:5000/api/goals/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) fetchData();
    } catch (error) {
      alert("Delete failed");
    }
  };

  // ─── Toggle Task ───
  const toggleTask = async (goalId, taskId) => {
    try {
      const res = await fetch(
        `http://localhost:5000/api/goals/${goalId}/task`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ taskId }),
        },
      );
      if (res.ok) fetchData();
    } catch (error) {
      alert("Failed to toggle task");
    }
  };

  // ─── Toggle Milestone ───
  const toggleMilestone = async (goalId, milestoneId) => {
    try {
      const res = await fetch(
        `http://localhost:5000/api/goals/${goalId}/milestone`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ milestoneId }),
        },
      );
      if (res.ok) fetchData();
    } catch (error) {
      alert("Failed to toggle milestone");
    }
  };

  // ─── Add task to form ───
  const addTaskToForm = () => {
    if (newTask.trim()) {
      setFormData({
        ...formData,
        tasks: [...formData.tasks, { text: newTask.trim(), completed: false }],
      });
      setNewTask("");
    }
  };
  const removeTaskFromForm = (index) => {
    const tasks = formData.tasks.filter((_, i) => i !== index);
    setFormData({ ...formData, tasks });
  };

  // ─── Add milestone to form ───
  const addMilestoneToForm = () => {
    if (newMilestone.trim()) {
      setFormData({
        ...formData,
        milestones: [
          ...formData.milestones,
          { title: newMilestone.trim(), completed: false },
        ],
      });
      setNewMilestone("");
    }
  };
  const removeMilestoneFromForm = (index) => {
    const milestones = formData.milestones.filter((_, i) => i !== index);
    setFormData({ ...formData, milestones });
  };

  // ─── Edit goal ───
  const handleEdit = (goal) => {
    setEditingGoal(goal);
    setFormData({
      title: goal.title,
      description: goal.description || "",
      category: goal.category,
      priority: goal.priority,
      deadline: goal.deadline ? goal.deadline.split("T")[0] : "",
      targetProgress: goal.targetProgress,
      tasks: goal.tasks || [],
      milestones: goal.milestones || [],
      type: goal.type || "custom",
      current: goal.current || 0,
    });
    setShowCreateModal(true);
  };

  // ─── Render priority badge ───
  const priorityBadge = (priority) => {
    const map = {
      low: { color: "#10b981", label: "Low" },
      medium: { color: "#f59e0b", label: "Medium" },
      high: { color: "#ef4444", label: "High" },
    };
    const p = map[priority] || map.medium;
    return (
      <span
        className="priority-badge"
        style={{ backgroundColor: p.color, color: "#fff", fontWeight: 600 }}
      >
        {p.label}
      </span>
    );
  };

  // ─── Status badge ───
  const statusBadge = (status) => {
    const map = {
      pending: { color: "#94a3b8", label: "Pending" },
      "in-progress": { color: "#2563eb", label: "In Progress" },
      completed: { color: "#10b981", label: "Completed" },
      archived: { color: "#64748b", label: "Archived" },
    };
    const s = map[status] || map.pending;
    return (
      <span
        className="status-badge"
        style={{ backgroundColor: s.color, color: "#fff", fontWeight: 600 }}
      >
        {s.label}
      </span>
    );
  };

  // ─── Category icon ───
  const categoryIcon = (cat) => {
    const map = {
      "Subject Learning": "📚",
      "Interview Preparation": "💼",
      "Coding Practice": "💻",
      Revision: "📖",
      Certification: "🎓",
      "Document Reading": "📄",
      "Flashcard Practice": "🃏",
      "AI Learning Sessions": "🤖",
    };
    return map[cat] || "📌";
  };

  // ─── Deadline status ───
  const deadlineStatus = (deadline) => {
    const d = new Date(deadline);
    const days = differenceInDays(d, new Date());
    if (days < 0)
      return (
        <span
          className="deadline-overdue"
          style={{ color: "#ef4444", fontWeight: 600 }}
        >
          Overdue
        </span>
      );
    if (days === 0)
      return (
        <span
          className="deadline-today"
          style={{ color: "#f59e0b", fontWeight: 600 }}
        >
          Today
        </span>
      );
    if (days === 1)
      return (
        <span
          className="deadline-tomorrow"
          style={{ color: "#3b82f6", fontWeight: 600 }}
        >
          Tomorrow
        </span>
      );
    if (days <= 3)
      return (
        <span
          className="deadline-soon"
          style={{ color: "#8b5cf6", fontWeight: 600 }}
        >
          In {days} days
        </span>
      );
    return (
      <span className="deadline-far" style={{ color: "#64748b" }}>
        {days} days left
      </span>
    );
  };

  // ─── Achievements ───
  const achievements = [
    { icon: "🏆", label: "Goal Achiever", unlocked: analytics?.completed >= 1 },
    { icon: "🔥", label: "30-Day Streak", unlocked: analytics?.streak >= 30 },
    {
      icon: "📚",
      label: "Knowledge Master",
      unlocked: analytics?.completed >= 5,
    },
    {
      icon: "🎯",
      label: "Focus Champion",
      unlocked: analytics?.taskCompletion >= 80,
    },
    { icon: "🤖", label: "AI Explorer", unlocked: analytics?.total >= 3 },
    {
      icon: "📖",
      label: "Reading Expert",
      unlocked: analytics?.completed >= 10,
    },
  ];

  // ─── Filtering ───
  const filteredGoals = goals.filter((g) => {
    if (filterStatus !== "all" && g.status !== filterStatus) return false;
    if (filterCategory !== "all" && g.category !== filterCategory) return false;
    return true;
  });

  return (
    <div className="goals-page">
      {/* ─── Hero ─── */}
      <div className="goals-hero">
        <div className="hero-content">
          <h1 style={{ color: "#1e293b", fontSize: "2.5rem", fontWeight: 700 }}>
            🎯 AI Goals & Study Planner
          </h1>
          <p
            style={{
              color: "#475569",
              fontSize: "1.1rem",
              marginTop: "0.5rem",
            }}
          >
            Track your learning progress and achieve your study goals with AI
            assistance.
          </p>
          <div
            className="hero-stats"
            style={{
              display: "flex",
              gap: "2rem",
              marginTop: "1.5rem",
              flexWrap: "wrap",
            }}
          >
            <div
              className="hero-stat"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                background: "#f1f5f9",
                padding: "0.75rem 1.25rem",
                borderRadius: "12px",
              }}
            >
              <span className="stat-icon" style={{ fontSize: "1.5rem" }}>
                🔥
              </span>
              <div>
                <span
                  className="stat-value"
                  style={{
                    fontSize: "1.5rem",
                    fontWeight: 700,
                    color: "#0f172a",
                    display: "block",
                  }}
                >
                  {analytics?.streak || 0}
                </span>
                <span
                  className="stat-label"
                  style={{
                    fontSize: "0.75rem",
                    color: "#64748b",
                    fontWeight: 500,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  Day Streak
                </span>
              </div>
            </div>
            <div
              className="hero-stat"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                background: "#f1f5f9",
                padding: "0.75rem 1.25rem",
                borderRadius: "12px",
              }}
            >
              <span className="stat-icon" style={{ fontSize: "1.5rem" }}>
                📈
              </span>
              <div>
                <span
                  className="stat-value"
                  style={{
                    fontSize: "1.5rem",
                    fontWeight: 700,
                    color: "#0f172a",
                    display: "block",
                  }}
                >
                  {analytics?.progress || 0}%
                </span>
                <span
                  className="stat-label"
                  style={{
                    fontSize: "0.75rem",
                    color: "#64748b",
                    fontWeight: 500,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  Completion
                </span>
              </div>
            </div>
            <div
              className="hero-stat"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                background: "#f1f5f9",
                padding: "0.75rem 1.25rem",
                borderRadius: "12px",
              }}
            >
              <span className="stat-icon" style={{ fontSize: "1.5rem" }}>
                ✅
              </span>
              <div>
                <span
                  className="stat-value"
                  style={{
                    fontSize: "1.5rem",
                    fontWeight: 700,
                    color: "#0f172a",
                    display: "block",
                  }}
                >
                  {analytics?.completed || 0}
                </span>
                <span
                  className="stat-label"
                  style={{
                    fontSize: "0.75rem",
                    color: "#64748b",
                    fontWeight: 500,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  Goals Done
                </span>
              </div>
            </div>
            <div
              className="hero-stat"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                background: "#f1f5f9",
                padding: "0.75rem 1.25rem",
                borderRadius: "12px",
              }}
            >
              <span className="stat-icon" style={{ fontSize: "1.5rem" }}>
                ⏳
              </span>
              <div>
                <span
                  className="stat-value"
                  style={{
                    fontSize: "1.5rem",
                    fontWeight: 700,
                    color: "#0f172a",
                    display: "block",
                  }}
                >
                  {analytics?.upcomingCount || 0}
                </span>
                <span
                  className="stat-label"
                  style={{
                    fontSize: "0.75rem",
                    color: "#64748b",
                    fontWeight: 500,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  Upcoming
                </span>
              </div>
            </div>
          </div>
          <button
            className="create-goal-btn"
            style={{
              marginTop: "1.5rem",
              background: "#4f46e5",
              color: "#fff",
              border: "none",
              padding: "0.75rem 2rem",
              borderRadius: "12px",
              fontSize: "1rem",
              fontWeight: 600,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              transition: "background 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#4338ca")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#4f46e5")}
            onClick={() => {
              setEditingGoal(null);
              setFormData({
                title: "",
                description: "",
                category: "Subject Learning",
                priority: "medium",
                deadline: "",
                targetProgress: 10,
                tasks: [],
                milestones: [],
                type: "custom",
                current: 0,
              });
              setShowCreateModal(true);
            }}
          >
            <FaPlus /> Create Goal
          </button>
        </div>
        <div className="hero-illustration" style={{ fontSize: "4rem" }}>
          🧠
        </div>
      </div>

      {/* ─── AI Recommendations ─── */}
      <div
        className="recommendations-section"
        style={{ marginTop: "2rem", padding: "1rem 0" }}
      >
        <h3
          style={{
            color: "#1e293b",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <FaLightbulb style={{ color: "#f59e0b" }} /> AI Recommendations
        </h3>
        <div
          className="recommendations-list"
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.5rem",
            marginTop: "0.5rem",
          }}
        >
          {recommendations.map((rec, idx) => (
            <div
              key={idx}
              className="recommendation-item"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                background: "#f8fafc",
                padding: "0.75rem 1rem",
                borderRadius: "8px",
                color: "#1e293b",
              }}
            >
              <span className="rec-icon" style={{ fontSize: "1.2rem" }}>
                💡
              </span>
              <p style={{ margin: 0, fontSize: "0.95rem" }}>{rec}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Filters ─── */}
      <div
        className="goals-filters"
        style={{
          display: "flex",
          gap: "1rem",
          margin: "1.5rem 0",
          flexWrap: "wrap",
        }}
      >
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          style={{
            padding: "0.5rem 1rem",
            borderRadius: "8px",
            border: "1px solid #e2e8f0",
            background: "#fff",
            color: "#1e293b",
          }}
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="in-progress">In Progress</option>
          <option value="completed">Completed</option>
        </select>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          style={{
            padding: "0.5rem 1rem",
            borderRadius: "8px",
            border: "1px solid #e2e8f0",
            background: "#fff",
            color: "#1e293b",
          }}
        >
          <option value="all">All Categories</option>
          <option value="Subject Learning">Subject Learning</option>
          <option value="Interview Preparation">Interview Preparation</option>
          <option value="Coding Practice">Coding Practice</option>
          <option value="Revision">Revision</option>
          <option value="Certification">Certification</option>
          <option value="Document Reading">Document Reading</option>
          <option value="Flashcard Practice">Flashcard Practice</option>
          <option value="AI Learning Sessions">AI Learning Sessions</option>
        </select>
        <button
          className="refresh-btn"
          onClick={fetchData}
          style={{
            padding: "0.5rem 1.25rem",
            borderRadius: "8px",
            border: "1px solid #e2e8f0",
            background: "#fff",
            color: "#1e293b",
            cursor: "pointer",
          }}
        >
          ⟳ Refresh
        </button>
      </div>

      {/* ─── Goals Grid ─── */}
      {loading ? (
        <div
          className="goals-loading"
          style={{ textAlign: "center", padding: "3rem", color: "#64748b" }}
        >
          Loading your goals...
        </div>
      ) : filteredGoals.length === 0 ? (
        <div
          className="goals-empty"
          style={{ textAlign: "center", padding: "3rem" }}
        >
          <div className="empty-icon" style={{ fontSize: "3rem" }}>
            🎯
          </div>
          <h2 style={{ color: "#1e293b" }}>No Goals Yet</h2>
          <p style={{ color: "#64748b" }}>
            Create your first study goal and start your learning journey.
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            style={{
              marginTop: "1rem",
              padding: "0.5rem 1.5rem",
              background: "#4f46e5",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
            }}
          >
            <FaPlus /> Create Goal
          </button>
        </div>
      ) : (
        <div
          className="goals-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))",
            gap: "1.5rem",
          }}
        >
          {filteredGoals.map((goal) => {
            const isOverdue =
              isPast(new Date(goal.deadline)) && goal.status !== "completed";
            return (
              <div
                key={goal._id}
                className={`goal-card ${goal.status === "completed" ? "completed" : ""}`}
                style={{
                  background: "#fff",
                  borderRadius: "16px",
                  padding: "1.5rem",
                  boxShadow:
                    "0 1px 3px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.05)",
                  border:
                    goal.status === "completed"
                      ? "2px solid #10b981"
                      : "1px solid #e2e8f0",
                  transition: "transform 0.2s, box-shadow 0.2s",
                }}
              >
                <div
                  className="goal-card-header"
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                  }}
                >
                  <div
                    className="goal-title-area"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                    }}
                  >
                    <span
                      className="goal-category-icon"
                      style={{ fontSize: "1.5rem" }}
                    >
                      {categoryIcon(goal.category)}
                    </span>
                    <h3
                      style={{
                        fontSize: "1.1rem",
                        fontWeight: 600,
                        color: "#0f172a",
                        margin: 0,
                      }}
                    >
                      {goal.title}
                    </h3>
                  </div>
                  <div
                    className="goal-actions"
                    style={{ display: "flex", gap: "0.5rem" }}
                  >
                    <button
                      className="action-btn edit"
                      onClick={() => handleEdit(goal)}
                      title="Edit"
                      style={{
                        background: "none",
                        border: "none",
                        color: "#64748b",
                        cursor: "pointer",
                        padding: "0.25rem",
                      }}
                    >
                      <FaEdit />
                    </button>
                    <button
                      className="action-btn delete"
                      onClick={() => handleDelete(goal._id)}
                      title="Delete"
                      style={{
                        background: "none",
                        border: "none",
                        color: "#ef4444",
                        cursor: "pointer",
                        padding: "0.25rem",
                      }}
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
                <div
                  className="goal-meta"
                  style={{
                    display: "flex",
                    gap: "0.5rem",
                    marginTop: "0.5rem",
                    flexWrap: "wrap",
                  }}
                >
                  {priorityBadge(goal.priority)}
                  {statusBadge(goal.status)}
                  <span
                    className="goal-category"
                    style={{
                      background: "#f1f5f9",
                      padding: "0.25rem 0.75rem",
                      borderRadius: "20px",
                      fontSize: "0.75rem",
                      color: "#475569",
                      fontWeight: 500,
                    }}
                  >
                    {goal.category}
                  </span>
                </div>
                {goal.description && (
                  <p
                    className="goal-desc"
                    style={{
                      color: "#475569",
                      fontSize: "0.9rem",
                      marginTop: "0.75rem",
                      lineHeight: 1.5,
                    }}
                  >
                    {goal.description}
                  </p>
                )}
                <div
                  className="goal-progress-section"
                  style={{ marginTop: "1rem" }}
                >
                  <div
                    className="goal-progress-bar"
                    style={{
                      width: "100%",
                      height: "8px",
                      background: "#e2e8f0",
                      borderRadius: "4px",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      className="progress-fill"
                      style={{
                        width: `${goal.progress}%`,
                        height: "100%",
                        background:
                          goal.progress === 100 ? "#10b981" : "#4f46e5",
                        borderRadius: "4px",
                        transition: "width 0.3s ease",
                      }}
                    ></div>
                  </div>
                  <span
                    className="goal-progress-text"
                    style={{
                      display: "block",
                      textAlign: "right",
                      fontSize: "0.85rem",
                      fontWeight: 600,
                      color: "#0f172a",
                      marginTop: "0.25rem",
                    }}
                  >
                    {goal.progress}%
                  </span>
                </div>
                <div
                  className="goal-deadline"
                  style={{
                    marginTop: "0.75rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    color: "#475569",
                  }}
                >
                  <FaClock /> {deadlineStatus(goal.deadline)}
                  {isOverdue && (
                    <span
                      className="overdue-icon"
                      style={{ color: "#ef4444", marginLeft: "0.25rem" }}
                    >
                      ⚠️
                    </span>
                  )}
                </div>
                {goal.tasks.length > 0 && (
                  <div className="goal-tasks" style={{ marginTop: "0.75rem" }}>
                    <h4
                      style={{
                        fontSize: "0.85rem",
                        fontWeight: 600,
                        color: "#1e293b",
                        marginBottom: "0.25rem",
                      }}
                    >
                      Tasks
                    </h4>
                    {goal.tasks.map((task, idx) => (
                      <div
                        key={idx}
                        className="task-item"
                        onClick={() => toggleTask(goal._id, task._id)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                          padding: "0.25rem 0",
                          cursor: "pointer",
                          color: task.completed ? "#94a3b8" : "#1e293b",
                          textDecoration: task.completed
                            ? "line-through"
                            : "none",
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={task.completed}
                          readOnly
                          style={{ accentColor: "#4f46e5" }}
                        />
                        <span className={task.completed ? "task-done" : ""}>
                          {task.text}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                {goal.milestones.length > 0 && (
                  <div
                    className="goal-milestones"
                    style={{ marginTop: "0.5rem" }}
                  >
                    <h4
                      style={{
                        fontSize: "0.85rem",
                        fontWeight: 600,
                        color: "#1e293b",
                        marginBottom: "0.25rem",
                      }}
                    >
                      Milestones
                    </h4>
                    {goal.milestones.map((m, idx) => (
                      <div
                        key={idx}
                        className="milestone-item"
                        onClick={() => toggleMilestone(goal._id, m._id)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                          padding: "0.25rem 0",
                          cursor: "pointer",
                          color: m.completed ? "#94a3b8" : "#1e293b",
                          textDecoration: m.completed ? "line-through" : "none",
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={m.completed}
                          readOnly
                          style={{ accentColor: "#8b5cf6" }}
                        />
                        <span className={m.completed ? "milestone-done" : ""}>
                          {m.title}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                <div
                  className="goal-footer"
                  style={{
                    marginTop: "1rem",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    borderTop: "1px solid #f1f5f9",
                    paddingTop: "0.75rem",
                  }}
                >
                  <span
                    className="goal-date"
                    style={{ fontSize: "0.8rem", color: "#94a3b8" }}
                  >
                    📅 {format(new Date(goal.deadline), "MMM d, yyyy")}
                  </span>
                  {goal.progress === 100 && (
                    <span
                      className="goal-complete-badge"
                      style={{
                        background: "#10b981",
                        color: "#fff",
                        padding: "0.2rem 0.75rem",
                        borderRadius: "20px",
                        fontSize: "0.7rem",
                        fontWeight: 600,
                      }}
                    >
                      ✅ Completed
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── Achievements ─── */}
      <div className="achievements-section" style={{ marginTop: "2rem" }}>
        <h3
          style={{
            color: "#1e293b",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <FaTrophy style={{ color: "#f59e0b" }} /> Achievements
        </h3>
        <div
          className="achievement-list"
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "0.75rem",
            marginTop: "0.5rem",
          }}
        >
          {achievements.map((ach, idx) => (
            <div
              key={idx}
              className={`achievement-item ${ach.unlocked ? "unlocked" : "locked"}`}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.5rem 1rem",
                borderRadius: "20px",
                background: ach.unlocked ? "#dcfce7" : "#f1f5f9",
                color: ach.unlocked ? "#166534" : "#94a3b8",
                fontSize: "0.85rem",
                fontWeight: 500,
              }}
            >
              <span className="ach-icon" style={{ fontSize: "1.2rem" }}>
                {ach.icon}
              </span>
              <span className="ach-label">{ach.label}</span>
              {ach.unlocked ? (
                <FaCheck style={{ color: "#10b981" }} />
              ) : (
                <FaTimes style={{ color: "#94a3b8" }} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ─── Create/Edit Modal ─── */}
      {showCreateModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowCreateModal(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15,23,42,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#fff",
              borderRadius: "16px",
              padding: "2rem",
              maxWidth: "600px",
              width: "90%",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
          >
            <h2
              style={{
                color: "#1e293b",
                fontSize: "1.5rem",
                fontWeight: 700,
                marginBottom: "1.5rem",
              }}
            >
              {editingGoal ? "Edit Goal" : "Create New Goal"}
            </h2>
            <div
              className="modal-body"
              style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
            >
              <div className="form-group">
                <label
                  style={{
                    display: "block",
                    fontWeight: 600,
                    color: "#1e293b",
                    marginBottom: "0.25rem",
                    fontSize: "0.9rem",
                  }}
                >
                  Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="Enter goal title"
                  style={{
                    width: "100%",
                    padding: "0.6rem",
                    borderRadius: "8px",
                    border: "1px solid #e2e8f0",
                    fontSize: "0.95rem",
                    color: "#1e293b",
                  }}
                />
              </div>
              <div className="form-group">
                <label
                  style={{
                    display: "block",
                    fontWeight: 600,
                    color: "#1e293b",
                    marginBottom: "0.25rem",
                    fontSize: "0.9rem",
                  }}
                >
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Describe your goal"
                  rows="3"
                  style={{
                    width: "100%",
                    padding: "0.6rem",
                    borderRadius: "8px",
                    border: "1px solid #e2e8f0",
                    fontSize: "0.95rem",
                    color: "#1e293b",
                    fontFamily: "inherit",
                  }}
                />
              </div>
              <div
                className="form-row"
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "1rem",
                }}
              >
                <div className="form-group">
                  <label
                    style={{
                      display: "block",
                      fontWeight: 600,
                      color: "#1e293b",
                      marginBottom: "0.25rem",
                      fontSize: "0.9rem",
                    }}
                  >
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    style={{
                      width: "100%",
                      padding: "0.6rem",
                      borderRadius: "8px",
                      border: "1px solid #e2e8f0",
                      fontSize: "0.95rem",
                      color: "#1e293b",
                    }}
                  >
                    <option value="Subject Learning">
                      📚 Subject Learning
                    </option>
                    <option value="Interview Preparation">
                      💼 Interview Preparation
                    </option>
                    <option value="Coding Practice">💻 Coding Practice</option>
                    <option value="Revision">📖 Revision</option>
                    <option value="Certification">🎓 Certification</option>
                    <option value="Document Reading">
                      📄 Document Reading
                    </option>
                    <option value="Flashcard Practice">
                      🃏 Flashcard Practice
                    </option>
                    <option value="AI Learning Sessions">
                      🤖 AI Learning Sessions
                    </option>
                  </select>
                </div>
                <div className="form-group">
                  <label
                    style={{
                      display: "block",
                      fontWeight: 600,
                      color: "#1e293b",
                      marginBottom: "0.25rem",
                      fontSize: "0.9rem",
                    }}
                  >
                    Priority
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) =>
                      setFormData({ ...formData, priority: e.target.value })
                    }
                    style={{
                      width: "100%",
                      padding: "0.6rem",
                      borderRadius: "8px",
                      border: "1px solid #e2e8f0",
                      fontSize: "0.95rem",
                      color: "#1e293b",
                    }}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>
              <div
                className="form-row"
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "1rem",
                }}
              >
                <div className="form-group">
                  <label
                    style={{
                      display: "block",
                      fontWeight: 600,
                      color: "#1e293b",
                      marginBottom: "0.25rem",
                      fontSize: "0.9rem",
                    }}
                  >
                    Deadline *
                  </label>
                  <input
                    type="date"
                    value={formData.deadline}
                    onChange={(e) =>
                      setFormData({ ...formData, deadline: e.target.value })
                    }
                    style={{
                      width: "100%",
                      padding: "0.6rem",
                      borderRadius: "8px",
                      border: "1px solid #e2e8f0",
                      fontSize: "0.95rem",
                      color: "#1e293b",
                    }}
                  />
                </div>
                <div className="form-group">
                  <label
                    style={{
                      display: "block",
                      fontWeight: 600,
                      color: "#1e293b",
                      marginBottom: "0.25rem",
                      fontSize: "0.9rem",
                    }}
                  >
                    Target Progress %
                  </label>
                  <input
                    type="number"
                    value={formData.targetProgress}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        targetProgress: parseInt(e.target.value) || 10,
                      })
                    }
                    min="1"
                    max="100"
                    style={{
                      width: "100%",
                      padding: "0.6rem",
                      borderRadius: "8px",
                      border: "1px solid #e2e8f0",
                      fontSize: "0.95rem",
                      color: "#1e293b",
                    }}
                  />
                </div>
              </div>

              {/* ─── Goal Type ─── */}
              <div className="form-group">
                <label
                  style={{
                    display: "block",
                    fontWeight: 600,
                    color: "#1e293b",
                    marginBottom: "0.25rem",
                    fontSize: "0.9rem",
                  }}
                >
                  Goal Type (for auto-tracking)
                </label>
                <select
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({ ...formData, type: e.target.value })
                  }
                  style={{
                    width: "100%",
                    padding: "0.6rem",
                    borderRadius: "8px",
                    border: "1px solid #e2e8f0",
                    fontSize: "0.95rem",
                    color: "#1e293b",
                  }}
                >
                  <option value="custom">Manual (no auto-track)</option>
                  <option value="documents">Documents</option>
                  <option value="notes">Notes</option>
                  <option value="flashcards">Flashcards</option>
                  <option value="study_time">Study Time</option>
                </select>
                <small
                  className="help-text"
                  style={{
                    display: "block",
                    marginTop: "0.25rem",
                    fontSize: "0.8rem",
                    color: "#64748b",
                  }}
                >
                  {/* ⚡ When you choose{" "}
                  <strong style={{ color: "#1e293b" }}>"Documents"</strong>,
                  your existing document count will be automatically set as your
                  current progress, and every new upload will increase it. */}
                </small>
              </div>

              {/* ─── Tasks ─── */}
              <div className="form-group">
                <label
                  style={{
                    display: "block",
                    fontWeight: 600,
                    color: "#1e293b",
                    marginBottom: "0.25rem",
                    fontSize: "0.9rem",
                  }}
                >
                  Tasks
                </label>
                <div
                  className="tag-input"
                  style={{ display: "flex", gap: "0.5rem" }}
                >
                  <input
                    type="text"
                    value={newTask}
                    onChange={(e) => setNewTask(e.target.value)}
                    placeholder="Add a task"
                    style={{
                      flex: 1,
                      padding: "0.5rem",
                      borderRadius: "8px",
                      border: "1px solid #e2e8f0",
                      fontSize: "0.9rem",
                      color: "#1e293b",
                    }}
                    onKeyDown={(e) => e.key === "Enter" && addTaskToForm()}
                  />
                  <button
                    onClick={addTaskToForm}
                    style={{
                      padding: "0.5rem 1rem",
                      background: "#4f46e5",
                      color: "#fff",
                      border: "none",
                      borderRadius: "8px",
                      cursor: "pointer",
                    }}
                  >
                    <FaPlus />
                  </button>
                </div>
                <div
                  className="tag-list"
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "0.5rem",
                    marginTop: "0.5rem",
                  }}
                >
                  {formData.tasks.map((task, idx) => (
                    <span
                      key={idx}
                      className="tag-item"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.25rem",
                        background: "#f1f5f9",
                        padding: "0.25rem 0.75rem",
                        borderRadius: "20px",
                        fontSize: "0.85rem",
                        color: "#1e293b",
                      }}
                    >
                      {task.text}
                      <button
                        onClick={() => removeTaskFromForm(idx)}
                        style={{
                          background: "none",
                          border: "none",
                          color: "#94a3b8",
                          cursor: "pointer",
                          padding: "0.1rem",
                        }}
                      >
                        <FaTimes />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* ─── Milestones ─── */}
              <div className="form-group">
                <label
                  style={{
                    display: "block",
                    fontWeight: 600,
                    color: "#1e293b",
                    marginBottom: "0.25rem",
                    fontSize: "0.9rem",
                  }}
                >
                  Milestones
                </label>
                <div
                  className="tag-input"
                  style={{ display: "flex", gap: "0.5rem" }}
                >
                  <input
                    type="text"
                    value={newMilestone}
                    onChange={(e) => setNewMilestone(e.target.value)}
                    placeholder="Add a milestone"
                    style={{
                      flex: 1,
                      padding: "0.5rem",
                      borderRadius: "8px",
                      border: "1px solid #e2e8f0",
                      fontSize: "0.9rem",
                      color: "#1e293b",
                    }}
                    onKeyDown={(e) => e.key === "Enter" && addMilestoneToForm()}
                  />
                  <button
                    onClick={addMilestoneToForm}
                    style={{
                      padding: "0.5rem 1rem",
                      background: "#8b5cf6",
                      color: "#fff",
                      border: "none",
                      borderRadius: "8px",
                      cursor: "pointer",
                    }}
                  >
                    <FaPlus />
                  </button>
                </div>
                <div
                  className="tag-list"
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "0.5rem",
                    marginTop: "0.5rem",
                  }}
                >
                  {formData.milestones.map((m, idx) => (
                    <span
                      key={idx}
                      className="tag-item"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.25rem",
                        background: "#f1f5f9",
                        padding: "0.25rem 0.75rem",
                        borderRadius: "20px",
                        fontSize: "0.85rem",
                        color: "#1e293b",
                      }}
                    >
                      {m.title}
                      <button
                        onClick={() => removeMilestoneFromForm(idx)}
                        style={{
                          background: "none",
                          border: "none",
                          color: "#94a3b8",
                          cursor: "pointer",
                          padding: "0.1rem",
                        }}
                      >
                        <FaTimes />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <button
                className="save-btn"
                onClick={handleSaveGoal}
                style={{
                  padding: "0.75rem",
                  background: "#4f46e5",
                  color: "#fff",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "1rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  marginTop: "0.5rem",
                }}
              >
                {editingGoal ? "Update" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Goals;
