import React, { useState, useEffect } from 'react';
import './TensePractice.css';

const TensePractice = ({ exercise: initialExercise }) => {
  const [exercise, setExercise] = useState(initialExercise);
  const [answers, setAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);

  useEffect(() => {
    if (initialExercise) {
      setExercise(initialExercise);
      setAnswers({});
      setShowResults(false);
      setScore(0);
    }
  }, [initialExercise]);

  // Placeholder component - will be implemented later
  return (
    <div className="tense-practice-container">
      <h1>Tense Practice</h1>
      <p>This feature is coming soon...</p>
    </div>
  );
};

export default TensePractice; 