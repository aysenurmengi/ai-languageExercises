import React, { useState, useEffect } from 'react';
import './MultipleChoice.css';

const MultipleChoice = ({ exercise: initialExercise }) => {
  const [exercise, setExercise] = useState(initialExercise);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [showAnswers, setShowAnswers] = useState(false);
  const [score, setScore] = useState(0);

  useEffect(() => {
    if (initialExercise) {
      setExercise(initialExercise);
      setSelectedAnswers({});
      setShowResults(false);
      setShowAnswers(false);
      setScore(0);
    }
  }, [initialExercise]);

  const handleOptionSelect = (questionIndex, option) => {
    if (showResults) return;
    
    setSelectedAnswers(prev => ({
      ...prev,
      [questionIndex]: option
    }));
  };

  const handleSubmit = () => {
    if (!exercise) return;

    let newScore = 0;
    Object.entries(selectedAnswers).forEach(([questionIndex, selectedOption]) => {
      if (selectedOption === exercise.questions[questionIndex].correctAnswer) {
        newScore++;
      }
    });
    setScore(newScore);
    setShowResults(true);
  };

  const toggleAnswers = () => {
    setShowAnswers(!showAnswers);
  };

  if (!exercise?.questions) {
    return <div className="error">Please generate an exercise first.</div>;
  }

  return (
    <div className="multiple-choice-container">
      <div className="exercise-header">
        <h1>Multiple Choice Exercise</h1>
      </div>

      <div className="questions-container">
        {exercise.questions.map((question, index) => (
          <div key={index} className="question-item">
            <p className="question-text">
              <span className="question-number">{index + 1}.</span>
              {question.text}
            </p>
            <div className="options-grid">
              {question.options.map((option, optionIndex) => (
                <button
                  key={optionIndex}
                  className={`option-btn ${
                    selectedAnswers[index] === option ? 'selected' : ''
                  } ${
                    showResults
                      ? option === question.correctAnswer
                        ? 'correct'
                        : selectedAnswers[index] === option
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
          disabled={showResults || Object.keys(selectedAnswers).length !== exercise.questions.length}
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

export default MultipleChoice; 