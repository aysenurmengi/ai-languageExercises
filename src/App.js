import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import './App.css';
import ExerciseForm from './components/ExerciseForm';
import WordMatching from './components/WordMatching';
import LoadingSpinner from './components/LoadingSpinner';
import geminiService from './services/geminiService';
import Home from './pages/Home';
import MultipleChoice from './components/MultipleChoice';
import MatchingActivity from './components/MatchingActivity';
import VocabularyActivities from './pages/VocabularyActivities';
import GrammarActivities from './pages/GrammarActivities';
import SentenceCorrection from './components/SentenceCorrection';
import TensePractice from './components/TensePractice';
import GrammarMatching from './components/GrammarMatching';
import DialogueCompletion from './components/DialogueCompletion';
import ClozeTest from './components/ClozeTest';
import ClozeTestForm from './components/ClozeTestForm';
import ImageGenerator from './components/ImageGenerator';
import TextSummarization from './pages/TextSummarization';
import AskQuestions from './pages/AskQuestions';

// Content wrapper component'i
const ContentWrapper = ({ exerciseType, ExerciseComponent, FormComponent }) => {
  const location = useLocation();
  const [showExercise, setShowExercise] = useState(false);
  const [exerciseData, setExerciseData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Route değiştiğinde state'i sıfırla
  useEffect(() => {
    setShowExercise(false);
    setExerciseData(null);
    setError(null);
    setLoading(false);
  }, [location.pathname]);

  const handleGenerate = async (newFormData, exerciseType) => {
    try {
      setShowExercise(false);
      setExerciseData(null);
      setError(null);
      setLoading(true);

      const data = await geminiService.generateExercise(newFormData, exerciseType);
      
      setExerciseData(data);
      setShowExercise(true);
    } catch (error) {
      console.error('Failed to generate exercise:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="content-wrapper">
      {FormComponent ? (
        <FormComponent 
          onGenerate={(formData) => handleGenerate(formData, exerciseType)} 
          disabled={loading}
        />
      ) : (
        <ExerciseForm 
          onGenerate={(formData) => handleGenerate(formData, exerciseType)} 
          disabled={loading}
        />
      )}
      {loading && <LoadingSpinner />}
      {error && <div className="error">{error}</div>}
      {showExercise && !loading && <ExerciseComponent exercise={exerciseData} />}
    </div>
  );
};

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/vocabulary" element={<VocabularyActivities />} />
          <Route path="/grammar" element={<GrammarActivities />} />
          
          <Route 
            path="/word-matching" 
            element={
              <ContentWrapper 
                exerciseType="wordMatching" 
                ExerciseComponent={WordMatching} 
              />
            } 
          />
          
          <Route 
            path="/multiple-choice" 
            element={
              <ContentWrapper 
                exerciseType="multipleChoice" 
                ExerciseComponent={MultipleChoice} 
              />
            } 
          />
          
          <Route 
            path="/matching-activity" 
            element={
              <ContentWrapper 
                exerciseType="matchingActivity" 
                ExerciseComponent={MatchingActivity} 
              />
            } 
          />
          
          <Route 
            path="/sentence-correction" 
            element={
              <ContentWrapper 
                exerciseType="sentenceCorrection" 
                ExerciseComponent={SentenceCorrection} 
              />
            } 
          />
          
          <Route 
            path="/tense-practice" 
            element={
              <ContentWrapper 
                exerciseType="tensePractice" 
                ExerciseComponent={TensePractice} 
              />
            } 
          />
          
          <Route 
            path="/grammar-matching" 
            element={
              <ContentWrapper 
                exerciseType="grammarMatching" 
                ExerciseComponent={GrammarMatching} 
              />
            } 
          />
          
          <Route 
            path="/dialogue-completion" 
            element={
              <ContentWrapper 
                exerciseType="dialogueCompletion" 
                ExerciseComponent={DialogueCompletion} 
              />
            } 
          />
          
          <Route 
            path="/cloze-test" 
            element={
              <ContentWrapper 
                exerciseType="clozeTest" 
                ExerciseComponent={ClozeTest}
                FormComponent={ClozeTestForm}
              />
            } 
          />
          <Route path="/image-generator" element={<ImageGenerator />} />
          <Route path="/text-summarization" element={<TextSummarization />} />
          <Route path="/ask-questions" element={<AskQuestions />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App; 