import "./Login.css";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { FaEnvelope, FaLock, FaEye, FaEyeSlash } from "react-icons/fa";

function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    remember: false,
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // ========== HANDLE CHANGE ==========
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  // ========== VALIDATE FORM ==========
  const validateForm = () => {
    let newErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Enter a valid email";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ========== HANDLE SUBMIT ==========
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    setErrors({}); // clear previous general error

    try {
      const response = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Save token and user info
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        // Redirect to dashboard
        navigate("/dashboard");
      } else {
        // Show backend error message
        setErrors({ general: data.message || "Login failed" });
      }
    } catch (error) {
      console.error("Login error:", error);
      setErrors({ general: "Network error. Please check your connection." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page-container">
      {/* LEFT PANEL */}
      <div className="login-left-panel">
        <div className="login-logo">🧠 AI Knowledge Vault</div>
        <h1>Welcome Back!</h1>
        <p>
          Continue your learning journey with AI-powered note management, smart
          summaries, flashcards, and document chat—all in one secure platform.
        </p>
        <div className="login-feature-list">
          <div className="login-feature-card">📄 Smart Notes</div>
          <div className="login-feature-card">🤖 AI Summaries</div>
          <div className="login-feature-card">🧠 AI Flashcards</div>
          <div className="login-feature-card">💬 AI Chat with PDFs</div>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="login-right-panel">
        <div className="login-card">
          <h2>Login</h2>
          <p>Sign in to access your AI Knowledge Vault.</p>

          <form onSubmit={handleSubmit}>
            {/* Email */}
            <div className="login-input-group">
              <label>Email Address</label>
              <div className="login-input-box">
                <FaEnvelope className="login-input-icon" />
                <input
                  type="email"
                  name="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>
              {errors.email && (
                <span className="login-error">{errors.email}</span>
              )}
            </div>

            {/* Password */}
            <div className="login-input-group">
              <label>Password</label>
              <div className="login-input-box">
                <FaLock className="login-input-icon" />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                />
                <span
                  className="login-eye-icon"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </span>
              </div>
              {errors.password && (
                <span className="login-error">{errors.password}</span>
              )}
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="login-options">
              <label className="login-remember">
                <input
                  type="checkbox"
                  name="remember"
                  checked={formData.remember}
                  onChange={handleChange}
                />
                Remember Me
              </label>
              <Link to="#" className="login-forgot-password">
                Forgot Password?
              </Link>
            </div>

            {/* General error */}
            {errors.general && (
              <div className="login-error" style={{ marginBottom: 16 }}>
                {errors.general}
              </div>
            )}

            {/* Login Button */}
            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>

          {/* <div className="login-divider">
            <span>OR</span>
          </div> */}

          {/* Google Button */}
          {/* <button type="button" className="login-google-btn">
            <img
              src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
              alt="Google"
            />
            Continue with Google
          </button> */}

          <div className="login-security-box">
            🔒 Your data is securely encrypted and protected using
            industry-standard security practices.
          </div>

          <div className="login-bottom-text">
            <p>
              Don't have an account?
              <Link to="/register">Create Account</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
