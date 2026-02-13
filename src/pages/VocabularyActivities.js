import React from 'react';
import { Link } from 'react-router-dom';
import './VocabularyActivities.css';

const VocabularyActivities = () => {
  return (
    <div className="vocabulary-container">
      <div className="header-section">
        <h1>Vocabulary Activities</h1>
        <p className="subtitle">Choose an activity type to practice vocabulary</p>
      </div>

      <div className="activities-grid">
        <Link to="/word-matching" className="activity-card">
          <div className="activity-icon">🎯</div>
          <h3>Fill in the Blanks</h3>
          <p>Complete sentences with appropriate words</p>
        </Link>

        <Link to="/multiple-choice" className="activity-card">
          <div className="activity-icon">🔄</div>
          <h3>Multiple Choice</h3>
          <p>Choose the correct word from options</p>
        </Link>

        <Link to="/matching-activity" className="activity-card">
          <div className="activity-icon">🔀</div>
          <h3>Word Matching</h3>
          <p>Match related words and phrases</p>
        </Link>
      </div>
    </div>
  );
};

export default VocabularyActivities; 