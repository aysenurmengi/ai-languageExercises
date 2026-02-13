import React, { useState, useEffect } from 'react';
import './MatchingActivity.css';

const MatchingActivity = ({ exercise: initialExercise }) => {
  const [exercise, setExercise] = useState(initialExercise);
  const [matches, setMatches] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [showAnswers, setShowAnswers] = useState(false);
  const [score, setScore] = useState(0);
  const [selectedLeft, setSelectedLeft] = useState(null);
  const [matchedLeftItems, setMatchedLeftItems] = useState(new Set());
  const [matchedRightItems, setMatchedRightItems] = useState(new Set());

  useEffect(() => {
    if (initialExercise) {
      // Sağ sütundaki öğeleri karıştır
      const shuffledRightItems = [...initialExercise.rightItems];
      const originalPairs = [...initialExercise.pairs];
      
      // Fisher-Yates shuffle algoritması
      for (let i = shuffledRightItems.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledRightItems[i], shuffledRightItems[j]] = [shuffledRightItems[j], shuffledRightItems[i]];
        [originalPairs[i], originalPairs[j]] = [originalPairs[j], originalPairs[i]];
      }

      // Karıştırılmış verilerle exercise'i güncelle
      setExercise({
        ...initialExercise,
        rightItems: shuffledRightItems,
        pairs: originalPairs
      });

      setMatches({});
      setShowResults(false);
      setShowAnswers(false);
      setScore(0);
      setSelectedLeft(null);
      setMatchedLeftItems(new Set());
      setMatchedRightItems(new Set());
    }
  }, [initialExercise]);

  const handleLeftClick = (id) => {
    if (matchedLeftItems.has(id) || showResults) return;
    
    setSelectedLeft(selectedLeft === id ? null : id);
  };

  const handleRightClick = (id) => {
    if (selectedLeft === null || matchedRightItems.has(id) || showResults) return;

    setMatches(prev => ({
      ...prev,
      [selectedLeft]: id
    }));
    
    setMatchedLeftItems(prev => new Set([...prev, selectedLeft]));
    setMatchedRightItems(prev => new Set([...prev, id]));
    
    setSelectedLeft(null);
  };

  const handleSubmit = () => {
    if (!exercise || Object.keys(matches).length !== exercise.leftItems.length) return;

    let newScore = 0;
    Object.entries(matches).forEach(([leftId, rightId]) => {
      const leftIndex = parseInt(leftId);
      const rightIndex = parseInt(rightId);
      
      if (rightIndex === exercise.pairs[leftIndex]) {
        newScore++;
      }
    });
    
    setScore(newScore);
    setShowResults(true);
  };

  const toggleAnswers = () => {
    setShowAnswers(!showAnswers);
  };

  if (!exercise?.leftItems || !exercise?.rightItems) {
    return <div className="error">Please generate an exercise first.</div>;
  }

  return (
    <div className="matching-activity-container">
      <div className="exercise-header">
        <h1>Matching Activity</h1>
      </div>

      <div className="matching-area">
        <div className="left-items">
          {exercise.leftItems.map((item, index) => (
            <button
              key={index}
              className={`item-btn left 
                ${selectedLeft === index ? 'selected' : ''} 
                ${matchedLeftItems.has(index) ? 'matched' : ''}
                ${showResults ? (matches[index] === exercise.pairs[index] ? 'correct' : 'incorrect') : ''}`
              }
              onClick={() => handleLeftClick(index)}
              disabled={showResults || matchedLeftItems.has(index)}
            >
              {item}
            </button>
          ))}
        </div>

        <div className="right-items">
          {exercise.rightItems.map((item, index) => (
            <button
              key={index}
              className={`item-btn right 
                ${matchedRightItems.has(index) ? 'matched' : ''}
                ${showResults ? (Object.entries(matches).find(([left, right]) => 
                  parseInt(right) === index && exercise.pairs[parseInt(left)] === index
                ) ? 'correct' : 'incorrect') : ''}`
              }
              onClick={() => handleRightClick(index)}
              disabled={showResults || matchedRightItems.has(index)}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      {showAnswers && (
        <div className="answers-list">
          <h3>Correct Matches:</h3>
          {exercise.leftItems.map((item, index) => (
            <div key={index} className="answer-pair">
              <span>{item}</span>
              <span>→</span>
              <span>{exercise.rightItems[exercise.pairs[index]]}</span>
            </div>
          ))}
        </div>
      )}

      <div className="buttons">
        <button 
          onClick={handleSubmit} 
          disabled={showResults || Object.keys(matches).length !== exercise.leftItems.length}
          className="check-btn"
        >
          Check Answers
        </button>
        <button 
          onClick={toggleAnswers}
          className="show-answers-btn"
        >
          {showAnswers ? 'Hide Answers' : 'Show Answers'}
        </button>
      </div>

      {showResults && (
        <div className="results">
          <h2>Results</h2>
          <p>Your Score: <span className={score === exercise.leftItems.length ? 'perfect-score' : ''}>
            {score}/{exercise.leftItems.length}
          </span></p>
          {score === exercise.leftItems.length && (
            <p className="perfect-message">Perfect! You got all matches correct! 🎉</p>
          )}
        </div>
      )}
    </div>
  );
};

export default MatchingActivity; 