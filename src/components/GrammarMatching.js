import React, { useState, useEffect } from 'react';
import './GrammarMatching.css';

const GrammarMatching = ({ exercise: initialExercise }) => {
  const [exercise, setExercise] = useState(initialExercise);
  const [matches, setMatches] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);

  useEffect(() => {
    if (initialExercise) {
      setExercise(initialExercise);
      setMatches({});
      setShowResults(false);
      setScore(0);
    }
  }, [initialExercise]);

  // Placeholder component - will be implemented later
  return (
    <div className="grammar-matching-container">
      <h1>Grammar Matching</h1>
      <p>This feature is coming soon...</p>
    </div>
  );
};

export default GrammarMatching; 