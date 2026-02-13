import React, { useState } from 'react';
import './AskQuestions.css';
import LoadingSpinner from '../components/LoadingSpinner';

const AskQuestions = () => {
  const [file, setFile] = useState(null);
  const [fileContent, setFileContent] = useState('');
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fileHash, setFileHash] = useState('');

  const handleFileChange = async (event) => {
    const selectedFile = event.target.files[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setFileContent('');
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await fetch('http://localhost:5000/api/process-document', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error('Failed to process file');
      }

      setFileContent(data.text);
      setFileHash(data.fileHash);

      if (data.fromCache) {
        console.log('📝 Using cached embeddings for this document');
      } else {
        console.log('📝 Creating new embeddings for this document');
      }

    } catch (err) {
      console.error('Error reading file:', err);
      setError('Failed to read file content');
    }
  };

  const handleQuestionSubmit = async () => {
    if (!question.trim()) {
      setError('Please enter a question');
      return;
    }

    if (!fileHash) {
      setError('Please upload a document first');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch('http://localhost:5000/api/ask-question', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question,
          fileHash
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Server error:', data);
        throw new Error(data.details || data.error || 'Failed to get answer');
      }

      setAnswer(data.answer);

    } catch (err) {
      console.error('Error asking question:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ask-questions-container">
      <div className="content">
        <h1>Ask Questions</h1>
        
        <div className="file-upload-section">
          <label className="file-input-label">
            <input
              type="file"
              accept=".txt,.pdf,.doc,.docx"
              onChange={handleFileChange}
              className="file-input"
            />
            <span className="upload-button">Upload Document</span>
          </label>
          {file && <div className="file-name">{file.name}</div>}
        </div>

        <div className="question-section">
          <div className="question-input-container">
            <div className="question-input-group">
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Enter your question about the text..."
                className="question-input"
                rows={3}
              />
              <button 
                className="ask-button"
                onClick={handleQuestionSubmit}
                disabled={!file || !question || loading}
              >
                {loading ? 'Getting Answer...' : 'Ask Question'}
              </button>
            </div>

            {loading && <LoadingSpinner />}
            {error && <div className="error-message">{error}</div>}

            {answer && (
              <div className="answer-section">
                <h4>Answer:</h4>
                <div className="answer-content">{answer}</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AskQuestions; 