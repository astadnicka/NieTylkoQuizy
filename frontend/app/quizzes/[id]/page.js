'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

// Importy komponentów dla różnych kategorii
import QuizComponent from '../../components/QuizComponent';
import HoroscopeComponent from '../../components/HoroscopeComponent';
import PollComponent from '../../components/PollComponent';

export default function QuizPage() {
  const params = useParams();
  const quizId = params.id;
  
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const response = await fetch(`http://localhost:5001/quizzes/${quizId}`);
        if (!response.ok) {
          throw new Error('Quiz nie został znaleziony');
        }
        const data = await response.json();
        setQuiz(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (quizId) {
      fetchQuiz();
    }
  }, [quizId]);

  const renderQuizComponent = () => {
    if (!quiz) return null;

    const category = quiz.category.toLowerCase();

    switch (category) {
      case 'horoscope':
        return <HoroscopeComponent quiz={quiz} />;
      case 'poll':
        return <PollComponent quiz={quiz} />;
      case 'quiz':
      default:
        return <QuizComponent quiz={quiz} />;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Błąd</h1>
        <p className="text-gray-600">{error}</p>
        <button 
          onClick={() => window.history.back()}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Wróć
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {renderQuizComponent()}
    </div>
  );
}