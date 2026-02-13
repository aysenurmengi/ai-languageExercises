import React, { useState, useEffect } from 'react';
import './DialogueCompletion.css';

const DialogueCompletion = ({ exercise: initialExercise }) => {
  const [exercise, setExercise] = useState(initialExercise);
  const [answers, setAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [showAnswers, setShowAnswers] = useState(false);
  const [score, setScore] = useState(0);

  useEffect(() => {
    if (initialExercise) {
      setExercise(initialExercise);
      setAnswers({});
      setShowResults(false);
      setShowAnswers(false);
      setScore(0);
    }
  }, [initialExercise]);

  const handleAnswerChange = (questionIndex, selectedOption) => {
    setAnswers(prev => ({
      ...prev,
      [questionIndex]: selectedOption
    }));
  };

  const handleSubmit = () => {
    if (!exercise?.questions) return;

    let newScore = 0;
    exercise.questions.forEach((question, index) => {
      if (answers[index] === question.correctAnswer) {
        newScore++;
      }
    });

    setScore(newScore);
    setShowResults(true);
  };

  const toggleAnswers = () => {
    setShowAnswers(!showAnswers);
  };

  // Exercise henüz yüklenmediyse veya hatalıysa
  if (!exercise || !exercise.questions || !Array.isArray(exercise.questions)) {
    return <div className="error">Please generate an exercise first.</div>;
  }

  return (
    <div className="dialogue-completion">
      <h2>{exercise.title || 'Dialogue Completion'}</h2>
      <div className="dialogue-container">
        {exercise.questions.map((question, index) => (
          <div key={index} className="dialogue-question">
            <div className="dialogue-context">
              {question.context}
            </div>
            <div className="dialogue-text">
              {question.dialogue.split('\n').map((line, lineIndex) => (
                <div key={lineIndex} className="dialogue-line">
                  {line.includes('_____') ? (
                    <>
                      {line.split('_____')[0]}
                      <span className="dialogue-gap">_____</span>
                      {line.split('_____')[1]}
                    </>
                  ) : (
                    line
                  )}
                </div>
              ))}
            </div>
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
            {showAnswers && (
              <div className="correct-answer">
                Correct answer: {question.correctAnswer}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="controls">
        <button
          className="submit-btn"
          onClick={handleSubmit}
          disabled={showResults || Object.keys(answers).length !== exercise.questions.length}
        >
          Check Answers
        </button>
        <button 
          className="show-answers-btn"
          onClick={toggleAnswers}
        >
          {showAnswers ? 'Hide Answers' : 'Show Answers'}
        </button>
      </div>

      {showResults && (
        <div className="results">
          <h3>Results</h3>
          <p>Your Score: {score}/{exercise.questions.length}</p>
          {score === exercise.questions.length && (
            <p className="perfect-score">Perfect! All answers are correct! 🎉</p>
          )}
        </div>
      )}
    </div>
  );
};

export default DialogueCompletion; 