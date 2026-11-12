import "./Register.css";
import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

import {
  FaUser,
  FaEnvelope,
  FaPhone,
  FaUniversity,
  FaGraduationCap,
  FaLock,
  FaEye,
  FaEyeSlash,
} from "react-icons/fa";

function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    mobile: "",
    college: "",
    department: "",
    year: "",
    role: "",
    goal: "",
    password: "",
    confirmPassword: "",
    terms: false,
    newsletter: true,
    aiSummary: true,
    flashcards: true,
    documentChat: false,
  });

  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // ─── Handle OAuth callback ──────────────────────────────────
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    if (token) {
      localStorage.setItem("token", token);
      // Optionally store user data if provided
      const user = params.get("user");
      if (user) {
        try {
          localStorage.setItem("user", user);
        } catch (e) {}
      }
      navigate("/dashboard");
    }
  }, [navigate]);

  // ─── Handle social login redirect ──────────────────────────
  const handleSocialLogin = (provider) => {
    // Redirect to backend OAuth endpoint
    window.location.href = `http://localhost:5000/api/auth/${provider}`;
  };

  // ─── Form handlers ──────────────────────────────────────────
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const validateForm = () => {
    let newErrors = {};

    if (!formData.firstName.trim())
      newErrors.firstName = "First Name is required";
    if (!formData.lastName.trim()) newErrors.lastName = "Last Name is required";
    if (!formData.username.trim()) newErrors.username = "Username is required";
    if (formData.username.length < 3)
      newErrors.username = "Username must be at least 3 characters";
    if (!formData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/))
      newErrors.email = "Enter a valid email address";
    if (!formData.mobile.match(/^[0-9]{10}$/))
      newErrors.mobile = "Enter a valid 10-digit mobile number";
    if (!formData.college.trim())
      newErrors.college = "College name is required";
    if (!formData.department.trim())
      newErrors.department = "Department is required";
    if (!formData.year) newErrors.year = "Select your year of study";

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }
    if (!formData.terms)
      newErrors.terms = "Please accept the Terms & Conditions";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const response = await fetch("http://localhost:5000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("token", data.token);
        alert("✅ Registration successful! Please login.");
        navigate("/login");
      } else {
        alert(data.message || "Registration failed");
      }
    } catch (error) {
      console.error("Network error:", error);
      alert("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page">
      {/* ============= LEFT PANEL ============= */}
      <div className="left-panel">
        <div className="overlay">
          <div className="logo-area">
            <h1>🧠 AI Knowledge Vault</h1>
            <p className="tagline">
              Intelligent Personal Knowledge Management Platform
            </p>
          </div>

          <h2>Build Your Personal AI Workspace</h2>
          <p>
            Organize everything you learn in one secure place. Upload documents,
            summarize notes, create flashcards, search intelligently and
            interact with your knowledge using Artificial Intelligence.
          </p>

          <div className="features">
            <div className="feature">
              <span>🤖</span>
              <div>
                <h4>AI Powered Summaries</h4>
                <p>Get instant AI-generated summaries of your documents</p>
              </div>
            </div>
            <div className="feature">
              <span>🧠</span>
              <div>
                <h4>Automatic Flashcards</h4>
                <p>Convert your notes into smart flashcards instantly</p>
              </div>
            </div>
            <div className="feature">
              <span>🔍</span>
              <div>
                <h4>Semantic Search Engine</h4>
                <p>Find anything in your knowledge base with AI search</p>
              </div>
            </div>
            <div className="feature">
              <span>☁️</span>
              <div>
                <h4>Secure Cloud Storage</h4>
                <p>Your data is encrypted and stored safely in the cloud</p>
              </div>
            </div>
          </div>

          <div className="stats">
            <div className="stat-card">
              <h2>10K+</h2>
              <p>Students</p>
            </div>
            <div className="stat-card">
              <h2>4.9</h2>
              <p>Rating</p>
            </div>
            <div className="stat-card">
              <h2>99%</h2>
              <p>Accuracy</p>
            </div>
          </div>

          <div className="review-card">
            <p>
              "AI Knowledge Vault completely changed the way I prepare for
              exams. Everything is organized, searchable and available
              instantly."
            </p>
            <h4>— Student Community</h4>
          </div>
        </div>
      </div>

      {/* ============= RIGHT PANEL ============= */}
      <div className="right-panel">
        <div className="register-card">
          <div className="register-header">
            <h2>Create Your Workspace</h2>
            <p>
              Welcome! Create your account and unlock your AI-powered learning
              experience.
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            {/* ----- Personal Information ----- */}
            <h3 className="section-title">Personal Information</h3>

            <div className="row">
              <div className="input-group">
                <label>First Name *</label>
                <div className="input-box">
                  <FaUser className="input-icon" />
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    placeholder="First Name"
                  />
                </div>
                {errors.firstName && (
                  <span className="error">{errors.firstName}</span>
                )}
              </div>

              <div className="input-group">
                <label>Last Name *</label>
                <div className="input-box">
                  <FaUser className="input-icon" />
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    placeholder="Last Name"
                  />
                </div>
                {errors.lastName && (
                  <span className="error">{errors.lastName}</span>
                )}
              </div>
            </div>

            <div className="input-group">
              <label>Username *</label>
              <div className="input-box">
                <FaUser className="input-icon" />
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="Choose a unique username"
                />
              </div>
              {errors.username && (
                <span className="error">{errors.username}</span>
              )}
            </div>

            <div className="input-group">
              <label>Email Address *</label>
              <div className="input-box">
                <FaEnvelope className="input-icon" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="example@gmail.com"
                />
              </div>
              {errors.email && <span className="error">{errors.email}</span>}
            </div>

            <div className="input-group">
              <label>Mobile Number *</label>
              <div className="input-box">
                <FaPhone className="input-icon" />
                <input
                  type="text"
                  name="mobile"
                  value={formData.mobile}
                  onChange={handleChange}
                  placeholder="+91 XXXXXXXXXX"
                />
              </div>
              {errors.mobile && <span className="error">{errors.mobile}</span>}
            </div>

            {/* ----- Academic Information ----- */}
            <h3 className="section-title">Academic Information</h3>

            <div className="input-group">
              <label>Institution / College *</label>
              <div className="input-box">
                <FaUniversity className="input-icon" />
                <input
                  type="text"
                  name="college"
                  value={formData.college}
                  onChange={handleChange}
                  placeholder="College Name"
                />
              </div>
              {errors.college && (
                <span className="error">{errors.college}</span>
              )}
            </div>

            <div className="row">
              <div className="input-group">
                <label>Department *</label>
                <div className="input-box">
                  <FaGraduationCap className="input-icon" />
                  <input
                    type="text"
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    placeholder="Department"
                  />
                </div>
                {errors.department && (
                  <span className="error">{errors.department}</span>
                )}
              </div>

              <div className="input-group">
                <label>Year *</label>
                <select
                  name="year"
                  value={formData.year}
                  onChange={handleChange}
                >
                  <option value="">Select</option>
                  <option value="1st Year">1st Year</option>
                  <option value="2nd Year">2nd Year</option>
                  <option value="3rd Year">3rd Year</option>
                  <option value="4th Year">4th Year</option>
                </select>
                {errors.year && <span className="error">{errors.year}</span>}
              </div>
            </div>

            <div className="row">
              <div className="input-group">
                <label>Role</label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                >
                  <option value="">Select Role</option>
                  <option value="Student">Student</option>
                  <option value="Faculty">Faculty</option>
                  <option value="Research Scholar">Research Scholar</option>
                </select>
              </div>

              <div className="input-group">
                <label>Learning Goal</label>
                <select
                  name="goal"
                  value={formData.goal}
                  onChange={handleChange}
                >
                  <option value="">Choose Goal</option>
                  <option value="Exam Preparation">Exam Preparation</option>
                  <option value="Competitive Programming">
                    Competitive Programming
                  </option>
                  <option value="Research Work">Research Work</option>
                  <option value="Daily Note Management">
                    Daily Note Management
                  </option>
                  <option value="Interview Preparation">
                    Interview Preparation
                  </option>
                </select>
              </div>
            </div>

            {/* ----- Security ----- */}
            <h3 className="section-title">Security</h3>

            <div className="input-group">
              <label>Create Password *</label>
              <div className="input-box">
                <FaLock className="input-icon" />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Create a strong password"
                />
                <span
                  className="eye-icon"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </span>
              </div>
              {errors.password && (
                <span className="error">{errors.password}</span>
              )}

              {formData.password && (
                <>
                  <div className="strength">
                    <div
                      className={
                        formData.password.length < 5
                          ? "weak"
                          : formData.password.length < 8
                            ? "medium"
                            : "strong"
                      }
                    ></div>
                  </div>

                  <div className="password-rules">
                    <p>Password should contain:</p>
                    <ul>
                      <li
                        className={formData.password.length >= 8 ? "valid" : ""}
                      >
                        ✔ Minimum 8 characters
                      </li>
                      <li
                        className={
                          /[A-Z]/.test(formData.password) ? "valid" : ""
                        }
                      >
                        ✔ One uppercase letter
                      </li>
                      <li
                        className={
                          /[0-9]/.test(formData.password) ? "valid" : ""
                        }
                      >
                        ✔ One number
                      </li>
                      <li
                        className={
                          /[!@#$%^&*(),.?":{}|<>]/.test(formData.password)
                            ? "valid"
                            : ""
                        }
                      >
                        ✔ One special character
                      </li>
                    </ul>
                  </div>
                </>
              )}
            </div>

            <div className="input-group">
              <label>Confirm Password *</label>
              <div className="input-box">
                <FaLock className="input-icon" />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm Password"
                />
                <span
                  className="eye-icon"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                </span>
              </div>
              {errors.confirmPassword && (
                <span className="error">{errors.confirmPassword}</span>
              )}
            </div>

            {/* ----- AI Preferences ----- */}
            <h3 className="section-title">AI Features You Want</h3>

            <div className="preferences">
              <label className="pref-item">
                <input
                  type="checkbox"
                  name="aiSummary"
                  checked={formData.aiSummary}
                  onChange={handleChange}
                />
                <span>AI Summary</span>
              </label>

              <label className="pref-item">
                <input
                  type="checkbox"
                  name="flashcards"
                  checked={formData.flashcards}
                  onChange={handleChange}
                />
                <span>Flashcard Generator</span>
              </label>

              <label className="pref-item">
                <input
                  type="checkbox"
                  name="documentChat"
                  checked={formData.documentChat}
                  onChange={handleChange}
                />
                <span>Chat with Documents</span>
              </label>
            </div>

            {/* ----- Terms & Newsletter ----- */}
            <h3 className="section-title">Almost Done</h3>

            <div className="agreement-card">
              <label className="checkbox-item">
                <input
                  type="checkbox"
                  name="terms"
                  checked={formData.terms}
                  onChange={handleChange}
                />
                <span>
                  I agree to the <a href="/">Terms of Service</a> and{" "}
                  <a href="/">Privacy Policy</a>.
                </span>
              </label>
              {errors.terms && <span className="error">{errors.terms}</span>}

              <label className="checkbox-item">
                <input
                  type="checkbox"
                  name="newsletter"
                  checked={formData.newsletter}
                  onChange={handleChange}
                />
                <span>
                  Keep me updated with new AI features, product releases and
                  learning tips.
                </span>
              </label>
            </div>

            <button type="submit" className="register-btn" disabled={loading}>
              {loading ? "⏳ Creating..." : "🚀 Create My AI Workspace"}
            </button>

            <div className="divider">
              <span>OR</span>
            </div>

            <div className="social-buttons">
              <button
                type="button"
                className="google-btn"
                onClick={() => handleSocialLogin("google")}
              >
                <img
                  src="https://cdn-icons-png.flaticon.com/512/2991/2991148.png"
                  alt="Google"
                />
                Continue with Google
              </button>

              <button
                type="button"
                className="github-btn"
                onClick={() => handleSocialLogin("github")}
              >
                <img
                  src="https://cdn-icons-png.flaticon.com/512/25/25231.png"
                  alt="GitHub"
                />
                GitHub
              </button>

              <button
                type="button"
                className="microsoft-btn"
                onClick={() => handleSocialLogin("microsoft")}
              >
                <img
                  src="https://cdn-icons-png.flaticon.com/512/732/732221.png"
                  alt="Microsoft"
                />
                Microsoft
              </button>
            </div>

            <div className="security-note">
              🔒 Your information is securely encrypted using industry-standard
              security.
            </div>

            <p className="login-text">
              Already have an account? <Link to="/login">Sign In</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Register;
