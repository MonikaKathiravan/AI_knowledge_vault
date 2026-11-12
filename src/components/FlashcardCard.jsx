import "./FlashcardCard.css";
import { useState } from "react";
import { FaStar, FaRegStar, FaEdit, FaTrash, FaCheck, FaTimes } from "react-icons/fa";

function FlashcardCard({ card, onUpdate, onStats }) {
  const [flipped, setFlipped] = useState(false);
  const [editing, setEditing] = useState(false);
  const [question, setQuestion] = useState(card.question);
  const [answer, setAnswer] = useState(card.answer);
  const token = localStorage.getItem("token");

  const toggleFavorite = async () => {
    const res = await fetch(`http://localhost:5000/api/flashcards/${card._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ favorite: !card.favorite }),
    });
    if (res.ok) { onUpdate(); onStats(); }
  };

  const toggleLearned = async () => {
    const res = await fetch(`http://localhost:5000/api/flashcards/${card._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ learned: !card.learned }),
    });
    if (res.ok) { onUpdate(); onStats(); }
  };

  const toggleDifficult = async () => {
    const res = await fetch(`http://localhost:5000/api/flashcards/${card._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ difficult: !card.difficult }),
    });
    if (res.ok) { onUpdate(); onStats(); }
  };

  const deleteCard = async () => {
    if (!window.confirm("Delete this flashcard?")) return;
    await fetch(`http://localhost:5000/api/flashcards/${card._id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    onUpdate(); onStats();
  };

  const saveEdit = async () => {
    const res = await fetch(`http://localhost:5000/api/flashcards/${card._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ question, answer }),
    });
    if (res.ok) { setEditing(false); onUpdate(); }
  };

  return (
    <div className="flashcard-card">
      <div className="flashcard-inner" onClick={() => !editing && setFlipped(!flipped)}>
        <div className={`flashcard-front ${flipped ? "hidden" : ""}`}>
          <div className="card-label">Question</div>
          <p>{card.question}</p>
          <div className="card-tags">
            {card.tags.map(t => <span key={t}>#{t}</span>)}
          </div>
        </div>
        <div className={`flashcard-back ${flipped ? "" : "hidden"}`}>
          <div className="card-label">Answer</div>
          <p>{card.answer}</p>
          <div className="card-meta">
            <span>Category: {card.category}</span>
            {card.learned && <span>✅ Learned</span>}
            {card.difficult && <span>💪 Difficult</span>}
          </div>
        </div>
      </div>
      <div className="flashcard-actions">
        <button onClick={toggleFavorite}>{card.favorite ? <FaStar className="active" /> : <FaRegStar />}</button>
        <button onClick={toggleLearned} title="Mark Learned">{card.learned ? <FaCheck color="#10b981" /> : <FaTimes />}</button>
        <button onClick={toggleDifficult} title="Mark Difficult">{card.difficult ? "💪" : "💪"}</button>
        {editing ? (
          <>
            <button onClick={saveEdit}><FaCheck /></button>
            <button onClick={() => setEditing(false)}><FaTimes /></button>
          </>
        ) : (
          <button onClick={() => setEditing(true)}><FaEdit /></button>
        )}
        <button onClick={deleteCard}><FaTrash color="#dc2626" /></button>
      </div>
      {editing && (
        <div className="edit-modal">
          <input value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="Question" />
          <input value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder="Answer" />
        </div>
      )}
    </div>
  );
}

export default FlashcardCard;