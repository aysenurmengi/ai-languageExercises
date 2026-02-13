import React from 'react';
import { Link } from 'react-router-dom';
import './GrammarActivities.css';

const GrammarActivities = () => {
  return (
    <div className="grammar-container">
      <div className="header-section">
        <h1>Grammar Activities</h1>
        <p className="subtitle">Choose an activity type to practice grammar</p>
      </div>

      <div className="activities-grid">
        <Link to="/dialogue-completion" className="activity-card">
          <div className="activity-icon">💭</div>
          <h3>Dialogue Completion</h3>
          <p>Complete dialogues with appropriate expressions</p>
        </Link>

        <Link to="/cloze-test" className="activity-card">
          <div className="activity-icon">📝</div>
          <h3>Cloze Test</h3>
          <p>Fill in the gaps in texts with correct words</p>
        </Link>

      </div>
    </div>
  );
};

export default GrammarActivities; 