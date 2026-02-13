import React, { useState } from 'react';
import './ImageGenerator.css';
import LoadingSpinner from './LoadingSpinner';

const API_BASE_URL = 'http://localhost:5000';

const ImageGenerator = () => {
  const [formData, setFormData] = useState({
    prompt: '',
    level: ' ',
    numberOfQuestions: ' ' // Varsayılan soru sayısı
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [exercise, setExercise] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const [userAnswers, setUserAnswers] = useState({});
  const [score, setScore] = useState(0);

  const levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
  const questionOptions = ['1','2', '3', '4', '5']; // Soru sayısı seçenekleri

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setExercise(null);
    setShowResults(false);
    setUserAnswers({});

    try {
      // Paralel olarak hem görsel hem soru oluştur
      const [imageResponse, questionsResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/api/generate-image`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ prompt: formData.prompt }),
        }),
        fetch(`${API_BASE_URL}/api/generate-questions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        })
      ]);

      if (!imageResponse.ok || !questionsResponse.ok) {
        const imageError = await imageResponse.json().catch(() => ({}));
        const questionsError = await questionsResponse.json().catch(() => ({}));
        throw new Error(imageError.error || questionsError.error || 'Generation failed');
      }

      const [imageData, questionsData] = await Promise.all([
        imageResponse.json(),
        questionsResponse.json()
      ]);

      setExercise({
        imageUrl: imageData.imageUrl,
        questions: questionsData.questions
      });
    } catch (err) {
      console.error('Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelect = (questionIndex, answer) => {
    if (showResults) return;
    setUserAnswers(prev => ({
      ...prev,
      [questionIndex]: answer
    }));
  };

  const checkAnswers = () => {
    let newScore = 0;
    exercise.questions.forEach((question, index) => {
      if (userAnswers[index] === question.correctAnswer) {
        newScore++;
      }
    });
    setScore(newScore);
    setShowResults(true);
  };

  return (
    <div className="image-generator-container">
      {/* Exercise yokken sadece form görünür */}
      {!exercise ? (
        <div className="form-container">
          <h2>Image Generator</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Image Description</label>
              <textarea
                value={formData.prompt}
                onChange={(e) => setFormData(prev => ({ ...prev, prompt: e.target.value }))}
                placeholder="Describe the image you want to generate..."
                required
              />
            </div>
            <div className="form-group">
              <label>English Level</label>
              <select
                value={formData.level}
                onChange={(e) => setFormData(prev => ({ ...prev, level: e.target.value }))}
                required
              >
                {levels.map(level => (
                  <option key={level} value={level}>{level}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Number of Questions</label>
              <select
                value={formData.numberOfQuestions}
                onChange={(e) => setFormData(prev => ({ ...prev, numberOfQuestions: e.target.value }))}
                required
              >
                {questionOptions.map(num => (
                  <option key={num} value={num}>{num} Questions</option>
                ))}
              </select>
            </div>
            <button 
              type="submit" 
              className="generate-btn"
              disabled={loading}
            >
              {loading ? 'Generating...' : 'Generate Exercise'}
            </button>
          </form>
          {error && <div className="error">{error}</div>}
          {loading && <div className="loading">Generating exercise...</div>}
        </div>
      ) : (
        <>
          {/* Sol Sütun - Görsel Oluşturma */}
          <div className="left-column">
            <div className="form-container">
              <h2>Image Generator</h2>
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Image Description</label>
                  <textarea
                    value={formData.prompt}
                    onChange={(e) => setFormData(prev => ({ ...prev, prompt: e.target.value }))}
                    placeholder="Describe the image you want to generate..."
                    required
                  />
                </div>
                <div className="form-group">
                  <label>English Level</label>
                  <select
                    value={formData.level}
                    onChange={(e) => setFormData(prev => ({ ...prev, level: e.target.value }))}
                    required
                  >
                    {levels.map(level => (
                      <option key={level} value={level}>{level}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Number of Questions</label>
                  <select
                    value={formData.numberOfQuestions}
                    onChange={(e) => setFormData(prev => ({ ...prev, numberOfQuestions: e.target.value }))}
                    required
                  >
                    {questionOptions.map(num => (
                      <option key={num} value={num}>{num} Questions</option>
                    ))}
                  </select>
                </div>
                <button 
                  type="submit" 
                  className="generate-btn"
                  disabled={loading}
                >
                  {loading ? 'Generating...' : 'Generate Exercise'}
                </button>
              </form>
            </div>
            <div className="generated-image-container">
              <img src={exercise.imageUrl} alt="Generated" className="generated-image" />
            </div>
          </div>

          {/* Sağ Sütun - Sorular */}
          <div className="right-column">
            <div className="questions-section">
              <h2>Exercise Questions</h2>
              <div className="questions-container">
                {exercise.questions.map((question, qIndex) => (
                  <div key={qIndex} className="question">
                    <p className="question-text">{qIndex + 1}. {question.text}</p>
                    <div className="options">
                      {question.options.map((option, oIndex) => (
                        <button
                          key={oIndex}
                          className={`option-btn ${
                            userAnswers[qIndex] === option ? 'selected' : ''
                          } ${
                            showResults
                              ? option === question.correctAnswer
                                ? 'correct'
                                : userAnswers[qIndex] === option
                                ? 'incorrect'
                                : ''
                              : ''
                          }`}
                          onClick={() => handleAnswerSelect(qIndex, option)}
                          disabled={showResults}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {!showResults && Object.keys(userAnswers).length === exercise.questions.length && (
                <button 
                  className="check-answers-btn"
                  onClick={checkAnswers}
                >
                  Check Answers
                </button>
              )}

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
          </div>
        </>
      )}
    </div>
  );
};

export default ImageGenerator; 