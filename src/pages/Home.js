import React from 'react';
import { Link } from 'react-router-dom';
import './Home.css';

const Home = () => {
  return (
    <div className="home-container">
      <div className="hero-section">
        <h1>Exercise AI</h1>
        <p className="subtitle">Create personalized language exercises with AI</p>
      </div>
      
      <div className="features-grid">
        <Link to="/vocabulary" className="feature-card">
          <div className="feature-icon">📚</div>
          <h3>Vocabulary Activities</h3>
          <p>Practice vocabulary with different exercise types</p>
        </Link>

        <Link to="/grammar" className="feature-card">
          <div className="feature-icon">📝</div>
          <h3>Grammar Activities</h3>
          <p>Practice grammar with interactive exercises</p>
        </Link>

        <Link to="/text-summarization" className="feature-card">
          <div className="feature-icon">📋</div>
          <h3>Text Summarization</h3>
          <p>Generate summaries from any text</p>
        </Link>

        <Link to="/ask-questions" className="feature-card">
          <div className="feature-icon">❓</div>
          <h3>Ask Questions</h3>
          <p>Ask questions about any text and get AI-powered answers</p>
        </Link>

        <Link to="/image-generator" className="feature-card">
          <div className="feature-icon">🎨</div>
          <h3>Image Generator</h3>
          <p>Generate custom images using AI</p>
        </Link>
      </div>
    </div>
  );
};

export default Home;  