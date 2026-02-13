import React, { useState } from 'react';
import './ExerciseForm.css';

const ExerciseForm = ({ onGenerate, disabled }) => {
  const [formData, setFormData] = useState({
    title: '',
    numberOfQuestions: '',
    level: '',
    ageGroup: '',
    context: '',
    additionalRules: '',
    autoGenerate: false,
    questionFocus: [],
    listOfWords: ''
  });

  const [error, setError] = useState('');

  const levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'numberOfQuestions') {
      const num = parseInt(value);
      if (value === '') {
        setError('Number of questions is required');
      } else if (isNaN(num) || num < 1 || num > 20) {
        setError('Please enter a number between 1 and 20');
      } else {
        setError('');
      }
    }

    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    if (checked) {
      setFormData(prev => ({
        ...prev,
        questionFocus: [...prev.questionFocus, name]
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        questionFocus: prev.questionFocus.filter(item => item !== name)
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const num = parseInt(formData.numberOfQuestions);
    if (!formData.numberOfQuestions || isNaN(num) || num < 1 || num > 20) {
      setError('Please enter a valid number between 1 and 20');
      return;
    }
    
    onGenerate(formData);
  };

  return (
    <div className="exercise-form">
      <h2>Create Exercise</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Title</label>
          <input
            type="text"
            name="title"
            placeholder="Give this activity a title"
            value={formData.title}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Number of Questions *</label>
          <input
            type="number"
            name="numberOfQuestions"
            placeholder="Enter a number between 1-20"
            value={formData.numberOfQuestions}
            onChange={handleChange}
            min="1"
            max="20"
            required
          />
          {error && <span className="error-message">{error}</span>}
        </div>

        <div className="form-group">
          <label>Level *</label>
          <select 
            name="level" 
            value={formData.level}
            onChange={handleChange}
            required
          >
            <option value="">Select level</option>
            {levels.map(level => (
              <option key={level} value={level}>{level}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Question Focus</label>
          <div className="checkbox-group">
            <label>
              <input
                type="checkbox"
                name="descriptive"
                onChange={handleCheckboxChange}
              />
              Descriptive
            </label>
            <label>
              <input
                type="checkbox"
                name="functional"
                onChange={handleCheckboxChange}
              />
              Functional
            </label>
            <label>
              <input
                type="checkbox"
                name="synonym"
                onChange={handleCheckboxChange}
              />
              Synonym
            </label>
            <label>
              <input
                type="checkbox"
                name="antonym"
                onChange={handleCheckboxChange}
              />
              Antonym
            </label>
            <label>
              <input
                type="checkbox"
                name="vocabulary"
                onChange={handleCheckboxChange}
              />
              Vocabulary
            </label>
            <label>
              <input
                type="checkbox"
                name="grammar"
                onChange={handleCheckboxChange}
              />
              Grammar
            </label>
            <label>
              <input
                type="checkbox"
                name="collocation"
                onChange={handleCheckboxChange}
              />
              Collocation
            </label>
            <label>
              <input
                type="checkbox"
                name="phrasal"
                onChange={handleCheckboxChange}
              />
              Phrasal Verbs
            </label>
            <label>
              <input
                type="checkbox"
                name="idioms"
                onChange={handleCheckboxChange}
              />
              Idioms
            </label>
            <label>
              <input
                type="checkbox"
                name="preposition"
                onChange={handleCheckboxChange}
              />
              Prepositions
            </label>
            <label>
              <input
                type="checkbox"
                name="article"
                onChange={handleCheckboxChange}
              />
              Articles
            </label>
            <label>
              <input
                type="checkbox"
                name="tense"
                onChange={handleCheckboxChange}
              />
              Tenses
            </label>
          </div>
        </div>

        <div className="form-group">
          <label>List of Words</label>
          <textarea
            name="listOfWords"
            placeholder="Enter words separated by commas"
            value={formData.listOfWords}
            onChange={handleChange}
            disabled={formData.autoGenerate}
          />
        </div>
        


        <div className="form-group checkbox-single">
          <label>
            <input
              type="checkbox"
              name="autoGenerate"
              checked={formData.autoGenerate}
              onChange={(e) => {
                setFormData(prev => ({
                  ...prev,
                  autoGenerate: e.target.checked,
                  listOfWords: e.target.checked ? '' : prev.listOfWords,
                  additionalRules: e.target.checked ? '' : prev.additionalRules
                }));
              }}
            />
            Auto Generate
          </label>
        </div>


        <button 
          type="submit" 
          className="generate-btn"
          disabled={disabled}
        >
          {disabled ? 'Generating...' : 'Generate'}
        </button>
      </form>
    </div>
  );
};

export default ExerciseForm; 