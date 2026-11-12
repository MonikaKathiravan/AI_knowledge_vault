import "./Practice.css";
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft, FaArrowRight, FaRandom, FaCheck } from "react-icons/fa";

function Practice() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const [cards, setCards] = useState([]);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const fetchCards = useCallback(async () => {
    const res = await fetch("http://localhost:5000/api/flashcards?learned=false", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (data.success) setCards(data.flashcards);
  }, [token]);

  useEffect(() => {
    fetchCards();
  }, [fetchCards]);

  const shuffle = () => {
    const shuffled = [...cards].sort(() => Math.random() - 0.5);
    setCards(shuffled);
    setIndex(0);
    setFlipped(false);
  };

  const next = () => {
    if (index < cards.length - 1) { setIndex(index + 1); setFlipped(false); }
  };
  const prev = () => {
    if (index > 0) { setIndex(index - 1); setFlipped(false); }
  };

  const markLearned = async () => {
    const card = cards[index];
    await fetch(`http://localhost:5000/api/flashcards/${card._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ learned: true }),
    });
    fetchCards();
    if (index < cards.length - 1) next();
    else navigate("/flashcards");
  };

  if (cards.length === 0) return <div className="practice-empty">No unlearned cards left!</div>;

  const card = cards[index];
  return (
    <div className="practice-page">
      <div className="practice-header">
        <button className="back-btn" onClick={() => navigate("/flashcards")}><FaArrowLeft /> Back</button>
        <h2>Practice Mode</h2>
        <div className="practice-controls">
          <button onClick={shuffle}><FaRandom /> Shuffle</button>
          <span>{index + 1} / {cards.length}</span>
        </div>
      </div>
      <div className="practice-card" onClick={() => setFlipped(!flipped)}>
        <div className={`practice-inner ${flipped ? "flipped" : ""}`}>
          <div className="practice-front">
            <h3>Question</h3>
            <p>{card.question}</p>
          </div>
          <div className="practice-back">
            <h3>Answer</h3>
            <p>{card.answer}</p>
          </div>
        </div>
      </div>
      <div className="practice-nav">
        <button onClick={prev} disabled={index === 0}><FaArrowLeft /></button>
        <button onClick={() => setFlipped(!flipped)}>Flip</button>
        <button onClick={markLearned} className="learn-btn"><FaCheck /> Learned</button>
        <button onClick={next} disabled={index === cards.length - 1}><FaArrowRight /></button>
      </div>
    </div>
  );
}

export default Practice;