import React, { useState, useEffect } from 'react';
import './ClozeTest.css';

const ClozeTest = ({ exercise: initialExercise }) => {
  const [exercise, setExercise] = useState(initialExercise);
  const [answers, setAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);
  const [showAnswers, setShowAnswers] = useState(false);

  useEffect(() => {
    if (initialExercise) {
      setExercise(initialExercise);
      setAnswers({});
      setShowResults(false);
      setShowAnswers(false);
      setScore(0);
    }
  }, [initialExercise]);

  const handleAnswerChange = (questionIndex, value) => {
    setAnswers(prev => ({
      ...prev,
      [questionIndex]: value
    }));
  };

  const handleSubmit = () => {
    if (!exercise) return;

    let newScore = 0;
    Object.entries(answers).forEach(([index, answer]) => {
      if (answer.toLowerCase() === exercise.questions[index].correctAnswer.toLowerCase()) {
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

  // Metni boşluklarla birlikte oluştur
  const renderText = () => {
    const text = exercise.text || '';
    const questions = exercise.questions || [];
    
    return text.split('_____').map((part, index) => (
      <React.Fragment key={index}>
        {part}
        {index < questions.length && (
          <span className="blank">({index + 1})</span>
        )}
      </React.Fragment>
    ));
  };

  return (
    <div className="cloze-test-container">
      <div className="exercise-header">
        <h1>{exercise.title || 'Cloze Test'}</h1>
        <p className="task-description">Complete the sentences below by using the words provided to fill in the blanks.</p>
      </div>

      <div className="text-container">
        <div className="passage">
          {renderText()}
        </div>

        <div className="questions-container">
          {exercise.questions.map((question, index) => (
            <div key={index} className="question-item">
              <div className="question-number">{index + 1}.</div>
              <div className="options">
                {question.options.map((option, optIndex) => (
                  <button
                    key={optIndex}
                    className={`option-btn ${
                      answers[index] === option ? 'selected' : ''
                    } ${
                      showResults
                        ? option === question.correctAnswer
                          ? 'correct'
                          : answers[index] === option
                          ? 'incorrect'
                          : ''
                        : ''
                    }`}
                    onClick={() => handleAnswerChange(index, option)}
                    disabled={showResults}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="buttons">
        <button 
          onClick={handleSubmit} 
          disabled={showResults || Object.keys(answers).length !== exercise.questions.length}
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

export default ClozeTest; 