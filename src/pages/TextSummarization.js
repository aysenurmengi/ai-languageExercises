import React, { useState } from 'react';
import './TextSummarization.css';
import LoadingSpinner from '../components/LoadingSpinner';

const TextSummarization = () => {
  const [file, setFile] = useState(null);
  const [fileContent, setFileContent] = useState('');
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [summaryOptions, setSummaryOptions] = useState({
    length: '300',
    style: 'standard'
  });
  const [fileHash, setFileHash] = useState(null);

  const handleFileChange = async (event) => {
    const selectedFile = event.target.files[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setFileContent('');
    setSummary('');
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
        const errorMessage = data.details || data.error || 'Failed to process file';
        console.error('Server error:', data);
        throw new Error(errorMessage);
      }

      setFileContent(data.text);
      setFileHash(data.fileHash);

      if (data.message === 'File already processed') {
        console.log('This file was previously processed');
      }

      if (data.fromCache) {
        console.log('Using cached embeddings for this file');
      }

    } catch (err) {
      console.error('Error reading file:', err);
      setError(err.message);
    }
  };

  const handleSubmit = async () => {
    if (!file) {
      setError('Please select a file first');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSummary('');

      const formData = new FormData();
      formData.append('file', file);

      console.log('Sending request to server...');

      const response = await fetch('http://localhost:5000/api/summarize', {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json'
        }
      });

      console.log('Response status:', response.status);

      const data = await response.json();
      console.log('Response data:', data);

      if (!response.ok) {
        throw new Error(data.error || data.details || 'Failed to generate summary');
      }

      if (!data.text || !data.summary) {
        throw new Error('Invalid response format from server');
      }

      setFileContent(data.text);
      setSummary(data.summary);

    } catch (err) {
      console.error('Error in handleSubmit:', err);
      if (err.name === 'TypeError' && err.message.includes('Failed to fetch')) {
        setError('Could not connect to server. Please check if the server is running.');
      } else {
        setError(err.message || 'An error occurred while processing your request');
      }
    } finally {
      setLoading(false);
    }
  };

  const readFileAsText = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (e) => reject(e);
      reader.readAsText(file);
    });
  };

  return (
    <div className="text-summarization-container">
      <div className="summarization-content">
        <h1>Text Summarization</h1>
        
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

        <div className="summarize-section">
          <div className="options-container">
            <div className="option-group">
              <label>Summary Length (words):</label>
              <select 
                value={summaryOptions.length}
                onChange={(e) => setSummaryOptions(prev => ({
                  ...prev,
                  length: e.target.value
                }))}
              >
                <option value="300">300 words</option>
                <option value="700">700 words</option>
                <option value="1200">1200 words</option>
              </select>
            </div>

            <div className="option-group">
              <label>Summary Style:</label>
              <select 
                value={summaryOptions.style}
                onChange={(e) => setSummaryOptions(prev => ({
                  ...prev,
                  style: e.target.value
                }))}
              >
                <option value="standard">Standard</option>
                <option value="academic">Academic</option>
                <option value="simple">Simple</option>
              </select>
            </div>
          </div>

          <button 
            className="summarize-btn"
            onClick={handleSubmit}
            disabled={!file || loading}
          >
            {loading ? 'Summarizing...' : 'Generate Summary'}
          </button>

          {loading && (
            <div className="loading-container">
              <div className="loading-spinner">
                <div className="spinner-ring"></div>
                <div className="spinner-ring"></div>
                <div className="spinner-ring"></div>
              </div>
              <p className="loading-text">Generating summary...</p>
            </div>
          )}
          {error && <div className="error-message">{error}</div>}

          {summary && (
            <div className="results-section">
              <div className="summary-section">
                <h3>Summary</h3>
                <div className="summary-content">{summary}</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TextSummarization; 