import React, { useState, useEffect } from 'react';
import './SentenceTransformation.css';

const SentenceTransformation = ({ exercise: initialExercise }) => {
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
      
      const initialAnswers = initialExercise.questions.reduce((acc, _, index) => {
        acc[`question${index + 1}`] = '';
        return acc;
      }, {});
      
      setAnswers(initialAnswers);
      setShowAnswers(false);
      setShowResults(false);
      setScore(0);
    }
  }, [initialExercise]);

  const handleOptionSelect = (questionIndex, option) => {
    if (showResults) return;
    
    setAnswers(prev => ({
      ...prev,
      [`question${questionIndex + 1}`]: option
    }));
  };

  const handleSubmit = () => {
    if (!exercise) return;

    let newScore = 0;
    exercise.questions.forEach((question, index) => {
      if (answers[`question${index + 1}`] === question.correctAnswer) {
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
  if (!exercise?.questions) {
    return <div className="error">Please generate an exercise first.</div>;
  }

  return (
    <div className="exercise-container">
      <div className="exercise-header">
        <h1>Sentence Transformation</h1>
        <p className="exercise-description">
          Choose the correct transformation for each sentence.
        </p>
      </div>

      <div className="questions-container">
        {exercise.questions.map((question, index) => (
          <div key={index} className="question-item">
            <div className="question-text">
              <span className="question-number">{index + 1}.</span>
              <p className="original-sentence">{question.originalSentence}</p>
            </div>
            
            <div className="options-container">
              {question.options.map((option, optionIndex) => (
                <button
                  key={optionIndex}
                  className={`option-btn ${
                    answers[`question${index + 1}`] === option ? 'selected' : ''
                  } ${
                    showResults
                      ? option === question.correctAnswer
                        ? 'correct'
                        : answers[`question${index + 1}`] === option
                        ? 'incorrect'
                        : ''
                      : ''
                  }`}
                  onClick={() => handleOptionSelect(index, option)}
                  disabled={showResults}
                >
                  {option}
                </button>
              ))}
            </div>

            {showAnswers && (
              <div className="correct-answer">
                Correct answer: {question.correctAnswer}
              </div>
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
          <p>Your Score: <span className={score === exercise.questions.length ? 'perfect-score' : ''}>
            {score}/{exercise.questions.length}
          </span></p>
          {score === exercise.questions.length && (
            <p className="perfect-message">Perfect! You got all answers correct! 🎉</p>
          )}
        </div>
      )}
    </div>
  );
};

export default SentenceTransformation; 