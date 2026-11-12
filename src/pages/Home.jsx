import "./Home.css";
import { Link } from "react-router-dom";
import heroImage from "../assets/images/hero.png";
import { FaArrowRight } from "react-icons/fa";
import {
  FaBookOpen,
  FaRobot,
  FaSearch,
  FaBrain,
  FaCloud,
  FaComments,
} from "react-icons/fa";

function Home() {
  return (
    <div className="home-page">
      {/* ================= Navbar ================= */}
      <nav className="home-navbar">
        <div className="home-logo">
          <span>🧠</span> AI Knowledge Vault
        </div>

        <ul className="home-nav-links">
          <li>
            <a href="#home">Home</a>
          </li>
          <li>
            <a href="#features">Features</a>
          </li>
          <li>
            <a href="#how">How It Works</a>
          </li>
          <li>
            <a href="#contact">Contact</a>
          </li>
        </ul>

        <div className="home-nav-buttons">
          <Link to="/login">
            <button className="home-login-btn">Login</button>
          </Link>
          <Link to="/register">
            <button className="home-register-btn">Register</button>
          </Link>
        </div>
      </nav>

      {/* ================= Hero ================= */}
      <section className="home-hero" id="home">
        <div className="home-hero-left">
          <span className="home-tag">AI Powered Learning Platform</span>
          <h1>
            Your Personal
            <br />
            <span>AI Knowledge Vault</span>
          </h1>
          <p>
            Store notes, upload PDFs, chat with documents, generate AI summaries
            and flashcards, and build your own second brain.
          </p>

          <div className="home-hero-buttons">
            <Link to="/register">
              <button className="home-primary-btn">
                Get Started <FaArrowRight />
              </button>
            </Link>
            <Link to="/login">
              <button className="home-secondary-btn">Login</button>
            </Link>
          </div>

          <div className="home-users">
            <div className="home-circle home-red"></div>
            <div className="home-circle home-blue"></div>
            <div className="home-circle home-green"></div>
            <p>Trusted by 10,000+ Students</p>
          </div>
        </div>

        <div className="home-hero-right">
          <img src={heroImage} alt="AI Illustration" />
        </div>
      </section>

      {/* ================= Statistics ================= */}
      <section className="home-stats">
        <div className="home-stat-box">
          <h2>10K+</h2>
          <p>Registered Students</p>
        </div>
        <div className="home-stat-box">
          <h2>1M+</h2>
          <p>Notes Stored</p>
        </div>
        <div className="home-stat-box">
          <h2>98%</h2>
          <p>AI Accuracy</p>
        </div>
        <div className="home-stat-box">
          <h2>24/7</h2>
          <p>Cloud Access</p>
        </div>
      </section>

      {/* ================= Features ================= */}
      <section className="home-features" id="features">
        <h2 className="home-section-title">Everything You Need</h2>
        <p className="home-section-subtitle">
          Powerful AI tools to organize and improve your learning experience.
        </p>

        <div className="home-cards">
          <div className="home-card">
            <FaBookOpen className="home-feature-icon" />
            <h3>Smart Notes</h3>
            <p>Create, organize and manage notes effortlessly.</p>
          </div>
          <div className="home-card">
            <FaRobot className="home-feature-icon" />
            <h3>AI Summaries</h3>
            <p>Generate concise summaries in seconds.</p>
          </div>
          <div className="home-card">
            <FaBrain className="home-feature-icon" />
            <h3>Flashcards</h3>
            <p>Automatically create flashcards for revision.</p>
          </div>
          <div className="home-card">
            <FaSearch className="home-feature-icon" />
            <h3>Semantic Search</h3>
            <p>Search notes intelligently using AI.</p>
          </div>
          <div className="home-card">
            <FaComments className="home-feature-icon" />
            <h3>Document Chat</h3>
            <p>Ask questions directly from your uploaded PDFs.</p>
          </div>
          <div className="home-card">
            <FaCloud className="home-feature-icon" />
            <h3>Cloud Sync</h3>
            <p>Access your knowledge from anywhere.</p>
          </div>
        </div>
      </section>

      {/* ================= How It Works ================= */}
      <section className="home-how-it-works" id="how">
        <h2 className="home-section-title">How It Works</h2>
        <p className="home-section-subtitle">
          Start your AI learning journey in four simple steps.
        </p>

        <div className="home-steps">
          <div className="home-step">
            <div className="home-step-number">1</div>
            <h3>Create Account</h3>
            <p>Register your account securely and get started.</p>
          </div>
          <div className="home-step">
            <div className="home-step-number">2</div>
            <h3>Upload Notes</h3>
            <p>Upload notes, PDFs and study materials.</p>
          </div>
          <div className="home-step">
            <div className="home-step-number">3</div>
            <h3>AI Processing</h3>
            <p>Our AI analyzes your content automatically.</p>
          </div>
          <div className="home-step">
            <div className="home-step-number">4</div>
            <h3>Study Smarter</h3>
            <p>Chat with documents, generate summaries and flashcards.</p>
          </div>
        </div>
      </section>

      {/* ================= Testimonials ================= */}
      <section className="home-testimonials">
        <h2 className="home-section-title">What Students Say</h2>

        <div className="home-testimonial-container">
          <div className="home-testimonial">
            <p className="home-stars">⭐⭐⭐⭐⭐</p>
            <p>
              "AI Knowledge Vault has completely changed the way I study. The AI
              summaries save me hours every week."
            </p>
            <h4>— Monika, B.Tech Student</h4>
          </div>
          <div className="home-testimonial">
            <p className="home-stars">⭐⭐⭐⭐⭐</p>
            <p>
              "Uploading PDFs and chatting with documents makes exam preparation
              much easier."
            </p>
            <h4>— Rahul, Engineering Student</h4>
          </div>
          <div className="home-testimonial">
            <p className="home-stars">⭐⭐⭐⭐⭐</p>
            <p>
              "The flashcard feature is amazing. I can revise quickly before
              exams."
            </p>
            <h4>— Priya, Final Year Student</h4>
          </div>
        </div>
      </section>

      {/* ================= Call To Action ================= */}
      <section className="home-cta">
        <div className="home-cta-content">
          <h2>Ready to Build Your AI Second Brain?</h2>
          <p>
            Join thousands of students who are learning smarter with AI
            Knowledge Vault.
          </p>
          <Link to="/register">
            <button className="home-cta-btn">Create Free Account</button>
          </Link>
        </div>
      </section>

      {/* ================= Contact ================= */}
      <section className="home-contact" id="contact">
        <h2 className="home-section-title">Contact Us</h2>
        <p className="home-section-subtitle">
          Have questions? We'd love to hear from you.
        </p>

        <div className="home-contact-box">
          <div>
            <h3>📧 Email</h3>
            <p>aiknowledgevault@gmail.com</p>
          </div>
          <div>
            <h3>📞 Phone</h3>
            <p>+91 98765 43210</p>
          </div>
          <div>
            <h3>📍 Location</h3>
            <p>Chennai, Tamil Nadu, India</p>
          </div>
        </div>
      </section>

      {/* ================= Footer ================= */}
      <footer className="home-footer">
        <div className="home-footer-logo">🧠 AI Knowledge Vault</div>
        <p>Your Personal AI Knowledge Management System</p>
        <div className="home-footer-links">
          <a href="#home">Home</a>
          <a href="#features">Features</a>
          <a href="#how">How It Works</a>
          <a href="#contact">Contact</a>
        </div>
        <p className="home-copyright">
          © 2026 AI Knowledge Vault. All Rights Reserved.
        </p>
      </footer>
    </div>
  );
}

export default Home;
