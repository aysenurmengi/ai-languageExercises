import React, { useState } from 'react';
import ImageExerciseForm from '../components/ImageExerciseForm';
import ImageExercise from '../components/ImageExercise';
import LoadingSpinner from '../components/LoadingSpinner';
import geminiService from '../services/geminiService';
import './ImageActivities.css';

const ImageActivities = () => {
  const [exercise, setExercise] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleGenerate = async (formData) => {
    try {
      setLoading(true);
      setError(null);
      const response = await geminiService.generateExercise(formData, 'imageExercise');
      setExercise(response);
    } catch (error) {
      console.error('Error generating exercise:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="image-activities">
      <div className="content-wrapper">
        <div className="exercise-container">
          {loading ? (
            <LoadingSpinner />
          ) : error ? (
            <div className="error">{error}</div>
          ) : exercise ? (
            <ImageExercise exercise={exercise} />
          ) : (
            <div className="placeholder">
              <h2>Generate an exercise to get started</h2>
              <p>Use the form on the right to create a new image-based exercise.</p>
            </div>
          )}
        </div>
        <ImageExerciseForm 
          onGenerate={handleGenerate}
          disabled={loading}
        />
      </div>
    </div>
  );
};

export default ImageActivities; 