import React, { useState, useEffect } from 'react';
import './WordMatching.css';

const WordMatching = ({ exercise: initialExercise }) => {
  const [exercise, setExercise] = useState(initialExercise);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const [showAnswers, setShowAnswers] = useState(false);
  const [score, setScore] = useState(0);

  useEffect(() => {
    if (initialExercise) {
      setLoading(false);
      setError(null);
      setExercise(initialExercise);
      
      const initialAnswers = initialExercise.wordMatching.questions.reduce((acc, _, index) => {
        acc[`blank${index + 1}`] = '';
        return acc;
      }, {});
      
      setAnswers(initialAnswers);
      setShowAnswers(false);
      setShowResults(false);
      setScore(0);
    }
  }, [initialExercise]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setAnswers(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = () => {
    if (!exercise) return;

    let newScore = 0;
    const correctAnswers = exercise.wordMatching.answers.map(a => a.value);
    Object.values(answers).forEach((answer, index) => {
      if (answer.toLowerCase() === correctAnswers[index].toLowerCase()) {
        newScore++;
      }
    });
    setScore(newScore);
    setShowResults(true);
  };

  const toggleAnswers = () => {
    setShowAnswers(!showAnswers);
  };

  if (loading) return <div className="loading">Loading exercise...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!exercise?.wordMatching?.questions || !exercise?.wordMatching?.answers) {
    return <div className="error">Please generate an exercise first.</div>;
  }

  return (
    <div className="exercise-container">
      <div className="exercise-header">
        <h1>Word Matching</h1>
        
        {/* Kelime Bankası */}
        <div className="word-bank">
          <h3>Word Bank:</h3>
          <div className="word-options">
            {exercise.wordMatching.answers.map((answer, index) => (
              <span key={index} className="word-option">{answer.value}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Questions */}
      <div className="questions-container">
        {exercise.wordMatching.questions.map((question, index) => (
          <div key={index} className="question-item">
            <p className="sentence">
              {index + 1}. {question.value}
            </p>
            <input
              type="text"
              name={`blank${index + 1}`}
              value={answers[`blank${index + 1}`] || ''}
              onChange={handleChange}
              disabled={showResults}
              className={showResults ? 
                (answers[`blank${index + 1}`].toLowerCase() === exercise.wordMatching.answers[index].value.toLowerCase() 
                  ? 'correct' 
                  : 'incorrect') 
                : ''}
            />
            {showAnswers && (
              <span className="correct-answer">
                Correct answer: {exercise.wordMatching.answers[index].value}
              </span>
            )}
          </div>
        ))}
      </div>

      <div className="buttons">
        <button 
          onClick={handleSubmit} 
          disabled={showResults}
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
          <p>Your Score: <span className={score === exercise.wordMatching.questions.length ? 'perfect-score' : ''}>
            {score}/{exercise.wordMatching.questions.length}
          </span></p>
          {score === exercise.wordMatching.questions.length && (
            <p className="perfect-message">Perfect! You got all answers correct! 🎉</p>
          )}
        </div>
      )}
    </div>
  );
};

export default WordMatching; 