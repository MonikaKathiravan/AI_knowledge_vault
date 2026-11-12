import "./Quiz.css";
import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaArrowLeft,
  FaTrophy,
  FaChartLine,
  FaClock,
  FaBrain,
  FaBookmark,
  FaRegBookmark,
  FaLightbulb,
  FaMagic,
  FaFire,
  FaStar,
  FaMedal,
  FaInfoCircle,
  FaDownload,
  FaPlus,
  FaMinus,
} from "react-icons/fa";

function Quiz() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  // ─── State ────────────────────────────────────────────────────
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [answered, setAnswered] = useState(false);
const [isCorrect, setIsCorrect] = useState(false);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [totalCorrect, setTotalCorrect] = useState(0);
  const [totalWrong, setTotalWrong] = useState(0);
  const [totalSkipped, setTotalSkipped] = useState(0);
  const [startTime, setStartTime] = useState(null);
  const [timeTaken, setTimeTaken] = useState(0);
  const [questionStatus, setQuestionStatus] = useState([]);
  const [bookmarks, setBookmarks] = useState(new Set());
  const [confidence, setConfidence] = useState(null);
  const [showConfidence, setShowConfidence] = useState(false);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [eliminated, setEliminated] = useState([]);
  const [xp, setXp] = useState(0);
  const [achievements, setAchievements] = useState([]);
  const [timer, setTimer] = useState(0);
  const [timerInterval, setTimerInterval] = useState(null);
  const [timePerQuestion, setTimePerQuestion] = useState([]);
  const [learningMode, setLearningMode] = useState(true);
  const [finished, setFinished] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [hintText, setHintText] = useState("");
  const [explanationText, setExplanationText] = useState("");
  const [showPalette, setShowPalette] = useState(false);
  const [confetti, setConfetti] = useState(false);
  const [achievementPopup, setAchievementPopup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [questionStartTime, setQuestionStartTime] = useState(null);

  const navigateTo = useNavigate();
  const audioRef = useRef(null);

  // ─── Fetch flashcards and build quiz ────────────────────────
  const fetchCards = useCallback(async () => {
    try {
      const res = await fetch("http://localhost:5000/api/flashcards", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success && data.flashcards.length > 0) {
        const cards = data.flashcards;
        const quiz = cards.map((card, idx) => {
          // Build distractors as before
          const otherAnswers = cards
            .filter((c, i) => i !== idx)
            .map(c => c.answer)
            .filter(ans => ans && ans.trim() !== "");
          const shuffled = otherAnswers.sort(() => Math.random() - 0.5);
          const distractors = [];
          const seen = new Set();
          for (let ans of shuffled) {
            if (!seen.has(ans) && ans !== card.answer) {
              seen.add(ans);
              distractors.push(ans);
              if (distractors.length === 3) break;
            }
          }
          while (distractors.length < 3) {
            const fallbacks = ["None of the above", "All of the above", "It depends"];
            const fallback = fallbacks[distractors.length % fallbacks.length];
            if (!distractors.includes(fallback) && fallback !== card.answer) {
              distractors.push(fallback);
            } else {
              break;
            }
          }
          const options = [card.answer, ...distractors].sort(() => Math.random() - 0.5);
          // Determine difficulty from card (if not present, random)
          const difficulty = card.difficulty || ["Beginner", "Intermediate", "Advanced"][Math.floor(Math.random() * 3)];
          // Tags: extract keywords from question
          const tags = card.category ? [card.category] : ["General"];
          return {
            question: card.question,
            correct: card.answer,
            options,
            difficulty,
            tags,
            hint: `Think about the core concept of ${card.question.split(' ').slice(0, 3).join(' ')}...`,
            explanation: `The correct answer is "${card.answer}". ${card.question} is best answered by understanding the fundamental difference between the options.`,
          };
        });
        setQuestions(quiz);
        const initialStatus = quiz.map(() => ({
          answered: false,
          correct: false,
          bookmarked: false,
          skipped: false,
          confidence: null,
        }));
        setQuestionStatus(initialStatus);
        setStartTime(Date.now());
        setQuestionStartTime(Date.now());
        startTimer();
      } else {
        setQuestions([]);
      }
    } catch (error) {
      console.error("Error fetching flashcards:", error);
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchCards();
    return () => {
      if (timerInterval) clearInterval(timerInterval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Timer ────────────────────────────────────────────────────
  const startTimer = () => {
    if (timerInterval) clearInterval(timerInterval);
    const interval = setInterval(() => {
      setTimer(prev => prev + 1);
    }, 1000);
    setTimerInterval(interval);
  };

  const stopTimer = () => {
    if (timerInterval) {
      clearInterval(timerInterval);
      setTimerInterval(null);
    }
  };

  // ─── Answer handling ─────────────────────────────────────────
  const handleAnswer = (option) => {
    if (answered) return;
    setSelectedOption(option);
    setAnswered(true);
    const correct = option === questions[currentIndex].correct;
    setIsCorrect(correct);
    const now = Date.now();
    const timeSpent = (now - questionStartTime) / 1000;
    setTimePerQuestion(prev => [...prev, timeSpent]);

    // Update status
    const newStatus = [...questionStatus];
    newStatus[currentIndex].answered = true;
    newStatus[currentIndex].correct = correct;
    setQuestionStatus(newStatus);

    // Score and streak
    if (correct) {
      setScore(prev => prev + 1);
      setTotalCorrect(prev => prev + 1);
      setStreak(prev => prev + 1);
      if (streak + 1 > maxStreak) setMaxStreak(streak + 1);
      // XP
      const xpGain = 10 + (streak > 5 ? 5 : 0);
      setXp(prev => prev + xpGain);
      // Confetti on correct
      setConfetti(true);
      setTimeout(() => setConfetti(false), 1500);
      // Check achievements
      checkAchievements();
    } else {
      setTotalWrong(prev => prev + 1);
      setStreak(0);
    }

    // Show confidence meter after answering? Actually we show before answering.
    // But we can show feedback now.
    // After answer, we can show explanation if in learning mode.
    if (learningMode) {
      setShowExplanation(true);
      setExplanationText(questions[currentIndex].explanation);
    }
  };

  // ─── Confidence ──────────────────────────────────────────────
  const handleConfidence = (level) => {
    const newStatus = [...questionStatus];
    newStatus[currentIndex].confidence = level;
    setQuestionStatus(newStatus);
    setConfidence(level);
    setShowConfidence(false);
  };

  // ─── Bookmark ─────────────────────────────────────────────────
  const toggleBookmark = () => {
    const newBookmarks = new Set(bookmarks);
    if (newBookmarks.has(currentIndex)) {
      newBookmarks.delete(currentIndex);
    } else {
      newBookmarks.add(currentIndex);
    }
    setBookmarks(newBookmarks);
    const newStatus = [...questionStatus];
    newStatus[currentIndex].bookmarked = !newStatus[currentIndex].bookmarked;
    setQuestionStatus(newStatus);
  };

  // ─── Eliminate Options ───────────────────────────────────────
  const eliminateOptions = () => {
    if (eliminated.length > 0) return;
    const q = questions[currentIndex];
    const wrongOptions = q.options.filter(opt => opt !== q.correct);
    // Pick two random wrong options
    const shuffled = wrongOptions.sort(() => Math.random() - 0.5);
    const toEliminate = shuffled.slice(0, 2);
    // Map indices
    const indices = toEliminate.map(opt => q.options.indexOf(opt));
    setEliminated(indices);
  };

  // ─── Hint ─────────────────────────────────────────────────────
  const showHintHandler = () => {
    setHintsUsed(prev => prev + 1);
    setShowHint(true);
    setHintText(questions[currentIndex].hint);
  };

  // ─── Navigation ──────────────────────────────────────────────
  const goToNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      resetQuestion();
    } else {
      // Finish quiz
      finishQuiz();
    }
  };

  const goToPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      resetQuestion();
    }
  };

  const goToQuestion = (index) => {
    if (index >= 0 && index < questions.length) {
      setCurrentIndex(index);
      resetQuestion();
    }
  };

  const resetQuestion = () => {
    setSelectedOption(null);
    setAnswered(false);
    setIsCorrect(false);
    setConfidence(null);
    setShowConfidence(false);
    setShowExplanation(false);
    setShowHint(false);
    setEliminated([]);
    setShowHint(false);
    setQuestionStartTime(Date.now());
  };

  // ─── Skip ─────────────────────────────────────────────────────
  const skipQuestion = () => {
    if (answered) return;
    setTotalSkipped(prev => prev + 1);
    const newStatus = [...questionStatus];
    newStatus[currentIndex].skipped = true;
    setQuestionStatus(newStatus);
    goToNext();
  };

  // ─── Finish ──────────────────────────────────────────────────
  const finishQuiz = () => {
    stopTimer();
    setFinished(true);
    const totalTime = (Date.now() - startTime) / 1000;
    setTimeTaken(totalTime);
  };

  // ─── Achievements ─────────────────────────────────────────────
  const checkAchievements = () => {
    const newAchievements = [];
    if (totalCorrect + totalWrong >= 5 && !achievements.includes("First 5 Questions")) {
      newAchievements.push("First 5 Questions");
    }
    if (streak >= 5 && !achievements.includes("5‑Question Streak")) {
      newAchievements.push("5‑Question Streak");
    }
    if (score >= 10 && !achievements.includes("Score 10")) {
      newAchievements.push("Score 10");
    }
    if (newAchievements.length > 0) {
      setAchievements(prev => [...prev, ...newAchievements]);
      setAchievementPopup(newAchievements.join(", "));
      setTimeout(() => setAchievementPopup(null), 4000);
    }
  };

  // ─── Download Report ─────────────────────────────────────────
  const downloadReport = () => {
    const report = {
      score,
      total: questions.length,
      accuracy: Math.round((totalCorrect / (totalCorrect + totalWrong + totalSkipped)) * 100),
      averageTime: timePerQuestion.reduce((a, b) => a + b, 0) / timePerQuestion.length || 0,
      maxStreak,
      xp,
      achievements,
    };
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'quiz_report.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  // ─── Render helpers ──────────────────────────────────────────
  const getDifficultyColor = (diff) => {
    const map = { Beginner: "#10B981", Intermediate: "#F59E0B", Advanced: "#EF4444" };
    return map[diff] || "#64748B";
  };

  const getDifficultyEmoji = (diff) => {
    const map = { Beginner: "🟢", Intermediate: "🟡", Advanced: "🔴" };
    return map[diff] || "⚪";
  };

  const getQuestionStatusClass = (idx) => {
    if (idx === currentIndex) return "current";
    if (bookmarks.has(idx)) return "bookmarked";
    if (questionStatus[idx]?.answered) {
      return questionStatus[idx].correct ? "correct" : "wrong";
    }
    if (questionStatus[idx]?.skipped) return "skipped";
    return "unanswered";
  };

  // ─── If no questions ─────────────────────────────────────────
  if (loading) {
    return <div className="quiz-loading">Loading your quiz...</div>;
  }

  if (questions.length === 0) {
    return (
      <div className="quiz-empty">
        <h2>📚 No Flashcards Found</h2>
        <p>Create some flashcards first to start a quiz!</p>
        <button onClick={() => navigate("/flashcards")}>Go to Flashcards</button>
      </div>
    );
  }

  // ─── Finished screen ─────────────────────────────────────────
  if (finished) {
    const totalAttempted = totalCorrect + totalWrong + totalSkipped;
    const accuracy = totalAttempted > 0 ? Math.round((totalCorrect / totalAttempted) * 100) : 0;
    const avgTime = timePerQuestion.length > 0 ? (timePerQuestion.reduce((a, b) => a + b, 0) / timePerQuestion.length).toFixed(1) : 0;
    let emoji = "😊";
    let message = "Good effort!";
    if (accuracy >= 80) { emoji = "🏆"; message = "Excellent! You're a genius!"; }
    else if (accuracy >= 60) { emoji = "🌟"; message = "Well done! Keep learning!"; }
    else if (accuracy >= 40) { emoji = "💪"; message = "Keep practicing, you'll get there!"; }
    else { emoji = "📖"; message = "Review your flashcards and try again!"; }

    return (
      <div className="quiz-result">
        <div className="result-card">
          <div className="result-emoji">{emoji}</div>
          <h2>Quiz Complete!</h2>
          <div className="result-score">
            <span className="score-number">{score}</span>
            <span className="score-total"> / {questions.length}</span>
          </div>
          <div className="result-percent" style={{ color: accuracy >= 70 ? "#10B981" : accuracy >= 50 ? "#F59E0B" : "#EF4444" }}>
            {accuracy}%
          </div>
          <p>{message}</p>
          <div className="result-stats-grid">
            <div><FaClock /> <span>Time</span> <strong>{Math.round(timeTaken)}s</strong></div>
            <div><FaChartLine /> <span>Accuracy</span> <strong>{accuracy}%</strong></div>
            <div><FaFire /> <span>Best Streak</span> <strong>{maxStreak}</strong></div>
            <div><FaStar /> <span>XP Earned</span> <strong>{xp}</strong></div>
            <div><FaBrain /> <span>Avg Time/Q</span> <strong>{avgTime}s</strong></div>
            <div><FaMedal /> <span>Achievements</span> <strong>{achievements.length}</strong></div>
          </div>
          <div className="result-breakdown">
            <span style={{ color: "#10B981" }}>✅ {totalCorrect} correct</span>
            <span style={{ color: "#EF4444" }}>❌ {totalWrong} wrong</span>
            <span style={{ color: "#94A3B8" }}>⏭️ {totalSkipped} skipped</span>
          </div>
          <div className="result-actions">
            <button onClick={() => navigate("/flashcards")} className="btn-primary">
              <FaArrowLeft /> Back
            </button>
            <button onClick={() => { window.location.reload(); }} className="btn-secondary">
              <FaBrain /> Retry Quiz
            </button>
            <button onClick={downloadReport} className="btn-secondary">
              <FaDownload /> Report
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Main quiz render ────────────────────────────────────────
  const q = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;
  const isLast = currentIndex === questions.length - 1;

  return (
    <div className="quiz-page">
      {/* ─── Header ──────────────────────────────────────────────── */}
      <div className="quiz-header">
        <div className="header-left">
          <button className="back-btn" onClick={() => navigate("/flashcards")}>
            <FaArrowLeft /> Back
          </button>
          <div className="header-info">
            <span className="quiz-title">📚 Java Collections Quiz</span>
            <div className="difficulty-badge" style={{ backgroundColor: getDifficultyColor(q.difficulty) + "20", color: getDifficultyColor(q.difficulty) }}>
              {getDifficultyEmoji(q.difficulty)} {q.difficulty}
            </div>
            <div className="tags">
              {q.tags.map((tag, i) => (
                <span key={i} className="tag">#{tag}</span>
              ))}
            </div>
          </div>
        </div>
        <div className="header-right">
          <div className="stats">
            <span><FaStar /> {score}</span>
            <span><FaFire /> {streak}</span>
            <span><FaClock /> {Math.floor(timer / 60)}:{String(timer % 60).padStart(2, '0')}</span>
          </div>
          <button className="bookmark-btn" onClick={toggleBookmark}>
            {bookmarks.has(currentIndex) ? <FaBookmark /> : <FaRegBookmark />}
          </button>
          <div className="mode-toggle">
            <span>🎓</span>
            <label className="switch">
              <input type="checkbox" checked={!learningMode} onChange={() => setLearningMode(!learningMode)} />
              <span className="slider round"></span>
            </label>
            <span>📝</span>
          </div>
        </div>
      </div>

      {/* ─── Progress Bar ───────────────────────────────────────── */}
      <div className="quiz-progress-bar">
        <div className="progress-fill" style={{ width: `${progress}%` }}></div>
        <span>{currentIndex + 1} / {questions.length}</span>
      </div>

      {/* ─── Question ───────────────────────────────────────────── */}
      <div className="quiz-question">
        <h3>{q.question}</h3>
      </div>

      {/* ─── Options ────────────────────────────────────────────── */}
      <div className="quiz-options">
        {q.options.map((opt, idx) => {
          const isEliminated = eliminated.includes(idx);
          let className = "quiz-option";
          if (isEliminated) className += " eliminated";
          if (answered) {
            if (opt === q.correct) className += " correct";
            else if (selectedOption === opt) className += " wrong";
            else className += " disabled";
          }
          return (
            <button
              key={idx}
              className={className}
              onClick={() => handleAnswer(opt)}
              disabled={answered || isEliminated}
            >
              <span className="option-letter">{String.fromCharCode(65 + idx)}</span>
              {opt}
            </button>
          );
        })}
      </div>

      {/* ─── Action Buttons ─────────────────────────────────────── */}
      <div className="quiz-actions">
        <div className="action-group">
          <button className="action-btn" onClick={showHintHandler} disabled={showHint}>
            <FaLightbulb /> Hint
          </button>
          <button className="action-btn" onClick={() => setShowExplanation(!showExplanation)} disabled={!answered}>
            <FaInfoCircle /> Explain
          </button>
          <button className="action-btn" onClick={eliminateOptions} disabled={eliminated.length > 0 || answered}>
            <FaMagic /> Eliminate 2
          </button>
          <button className="action-btn" onClick={skipQuestion} disabled={answered}>
            <FaMinus /> Skip
          </button>
        </div>
        <div className="action-group">
          <button className="action-btn" onClick={goToPrevious} disabled={currentIndex === 0}>
            Previous
          </button>
          <button className="action-btn" onClick={() => setShowPalette(true)}>
            <FaPlus /> Palette
          </button>
          <button className="action-btn" onClick={goToNext} disabled={!answered && !isLast}>
            {isLast ? "Finish" : "Next"}
          </button>
        </div>
      </div>

      {/* ─── Hint / Explanation ────────────────────────────────── */}
      {showHint && (
        <div className="info-box hint-box">
          <FaLightbulb /> <strong>Hint:</strong> {hintText}
        </div>
      )}
      {showExplanation && answered && (
        <div className="info-box explanation-box">
          <FaInfoCircle /> <strong>Explanation:</strong> {explanationText}
        </div>
      )}

      {/* ─── Confidence Meter (pre-answer) ────────────────────── */}
      {!answered && (
        <div className="confidence-meter">
          <p>How confident are you?</p>
          <div className="confidence-buttons">
            <button onClick={() => { setConfidence(4); handleConfidence(4); }}>😊 Very</button>
            <button onClick={() => { setConfidence(3); handleConfidence(3); }}>🙂 Confident</button>
            <button onClick={() => { setConfidence(2); handleConfidence(2); }}>😐 Not Sure</button>
            <button onClick={() => { setConfidence(1); handleConfidence(1); }}>😟 Guessing</button>
          </div>
        </div>
      )}

      {/* ─── Achievement Popup ────────────────────────────────── */}
      {achievementPopup && (
        <div className="achievement-popup">
          <FaTrophy /> <strong>Achievement Unlocked!</strong> {achievementPopup}
        </div>
      )}

      {/* ─── Confetti (correct answer) ────────────────────────── */}
      {confetti && (
        <div className="confetti-container">
          <span>🎉</span><span>🎊</span><span>✨</span><span>🌟</span>
        </div>
      )}

      {/* ─── Question Palette Modal ───────────────────────────── */}
      {showPalette && (
        <div className="palette-overlay" onClick={() => setShowPalette(false)}>
          <div className="palette-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Question Palette</h3>
            <div className="palette-grid">
              {questions.map((_, idx) => (
                <button
                  key={idx}
                  className={`palette-item ${getQuestionStatusClass(idx)}`}
                  onClick={() => { goToQuestion(idx); setShowPalette(false); }}
                >
                  {idx + 1}
                </button>
              ))}
            </div>
            <div className="palette-legend">
              <span><span className="legend-dot current"></span> Current</span>
              <span><span className="legend-dot correct"></span> Correct</span>
              <span><span className="legend-dot wrong"></span> Wrong</span>
              <span><span className="legend-dot bookmarked"></span> Bookmarked</span>
              <span><span className="legend-dot skipped"></span> Skipped</span>
              <span><span className="legend-dot unanswered"></span> Unanswered</span>
            </div>
            <button className="close-palette" onClick={() => setShowPalette(false)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Quiz;