'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useKeycloak } from '@react-keycloak/web';
import Link from 'next/link';

// Importy komponentów dla różnych kategorii
import QuizComponent from '../../components/QuizComponent';
import HoroscopeComponent from '../../components/HoroscopeComponent';
import PollComponent from '../../components/PollComponent';

export default function QuizPage() {
  const params = useParams();
  const quizId = params.id;
  const { keycloak } = useKeycloak();
  
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
        console.log('Dane z API:', data);
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

  // Sprawdź czy zalogowany użytkownik jest autorem quizu lub adminem
  const isAuthor = quiz?.created_by && keycloak?.authenticated && 
                  quiz.created_by === keycloak.tokenParsed?.sub;
  
  const isAdmin = keycloak?.authenticated && 
                  keycloak.tokenParsed?.realm_access?.roles.includes('admin');
  
  const canModify = isAuthor || isAdmin;

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
      {/* Nagłówek z tytułem i informacjami o autorze */}
      <div className="bg-white shadow-md p-6 mb-6">
        <div className="container mx-auto">
          <Link href="/" className="text-blue-500 hover:underline mb-4 inline-block">
            &larr; Powrót do strony głównej
          </Link>
          
          <h1 className="text-3xl font-bold mt-2 mb-3">{quiz.title}</h1>
          
          <div className="flex flex-wrap items-center text-gray-600 mb-4">
            {/* Informacja o kategorii */}
            <div className="mr-6 mb-2">
              <span className="font-semibold">Kategoria:</span> {quiz.category}
            </div>
            
            {/* Informacja o autorze */}
            {quiz.author_username && (
              <div className="mr-6 mb-2">
                <span className="font-semibold">Autor:</span> {quiz.author_username}
              </div>
            )}
            
            {/* Data utworzenia, jeśli dostępna */}
            {quiz.created_at && (
              <div className="mb-2">
                <span className="font-semibold">Utworzono:</span> {new Date(quiz.created_at).toLocaleDateString()}
              </div>
            )}
          </div>
          
          {/* Przyciski edycji/usuwania tylko dla autora lub admina */}
          {canModify && (
            <div className="flex space-x-3 mt-4">
              <Link 
                href={`/quizzes/${quizId}/edit`}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Edytuj quiz
              </Link>
              <button 
                onClick={async () => {
                  if (window.confirm('Czy na pewno chcesz usunąć ten quiz?')) {
                    try {
                      const response = await fetch(`http://localhost:5001/quizzes/${quizId}`, {
                        method: 'DELETE',
                        headers: {
                          'Authorization': `Bearer ${keycloak.token}`
                        }
                      });
                      
                      if (response.ok) {
                        window.location.href = '/';
                      } else {
                        alert('Nie udało się usunąć quizu');
                      }
                    } catch (err) {
                      console.error('Error deleting quiz:', err);
                      alert('Wystąpił błąd podczas usuwania quizu');
                    }
                  }
                }}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Usuń quiz
              </button>
            </div>
          )}
        </div>
      </div>
      
      {/* Zawartość quizu */}
      <div className="container mx-auto px-4 pb-12">
        {renderQuizComponent()}
      </div>
    </div>
  );
}