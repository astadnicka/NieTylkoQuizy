'use client';

import { useState, useEffect } from 'react';
import { useKeycloak } from '@react-keycloak/web';

export default function QuizComponent({ quiz }) {
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [score, setScore] = useState(null);
  const { keycloak } = useKeycloak();
  const isAdmin = keycloak?.authenticated && 
                 keycloak.tokenParsed?.realm_access?.roles.includes('admin');

  // Sprawdzamy, czy dane zawierają pole is_correct (dostępne tylko dla adminów)
  const hasCorrectInfo = quiz.questions.length > 0 && 
                         quiz.questions[0].options.length > 0 && 
                         'is_correct' in quiz.questions[0].options[0];

  const handleAnswer = async (questionId, optionId) => {
    if (selectedAnswers[questionId]) return; // Nie pozwalaj na zmianę odpowiedzi

    // Różna logika dla admina (który widzi is_correct) i zwykłego użytkownika
    if (hasCorrectInfo) {
      // Admin lub użytkownik z informacją o poprawnych odpowiedziach
      const question = quiz.questions.find(q => q.id === questionId);
      const option = question.options.find(o => o.id === optionId);
      const isCorrect = option.is_correct;

      setSelectedAnswers(prev => {
        const updated = {
          ...prev,
          [questionId]: { optionId, isCorrect }
        };

        // Jeśli wszystkie pytania zostały odpowiedziane – oblicz wynik
        if (Object.keys(updated).length === quiz.questions.length) {
          const correctCount = Object.values(updated).filter(ans => ans.isCorrect).length;
          setScore(correctCount);
        }

        return updated;
      });
    } else {
      // Zwykły użytkownik - sprawdź odpowiedzi przez API
      setSelectedAnswers(prev => {
        const updated = { ...prev, [questionId]: { optionId } };
        
        // Jeśli to ostatnie pytanie, sprawdź wynik
        if (Object.keys(updated).length === quiz.questions.length) {
          checkAnswers(updated);
        }
        
        return updated;
      });
    }
  };

  // Funkcja do sprawdzania odpowiedzi dla zwykłego użytkownika
  const checkAnswers = async (answers) => {
    try {
      // Przygotuj dane do wysłania
      const answersToCheck = Object.entries(answers).map(([questionId, data]) => ({
        questionId: parseInt(questionId),
        optionId: data.optionId
      }));

      // Wywołaj API do sprawdzenia odpowiedzi
      const response = await fetch(`http://localhost:5001/quizzes/${quiz.id}/check`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(keycloak?.authenticated ? {'Authorization': `Bearer ${keycloak.token}`} : {})
        },
        body: JSON.stringify({ answers: answersToCheck })
      });

      if (response.ok) {
        const result = await response.json();
        setScore(result.correctAnswers);
        
        // Zaktualizuj selectedAnswers z informacją o poprawności
        const updatedAnswers = {...answers};
        result.details.forEach(detail => {
          if (updatedAnswers[detail.questionId]) {
            updatedAnswers[detail.questionId].isCorrect = detail.isCorrect;
          }
        });
        
        setSelectedAnswers(updatedAnswers);
      }
    } catch (error) {
      console.error('Błąd sprawdzania odpowiedzi:', error);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-center mb-6">{quiz.title}</h1>

      {quiz.questions.map((question) => {
        const selected = selectedAnswers[question.id];

        return (
          <div key={question.id} className="mb-8 p-4 border border-gray-300 rounded-md">
            <h2 className="text-lg font-semibold mb-4">{question.text}</h2>

            <div className="space-y-2">
              {question.options.map((option) => {
                const isSelected = selected?.optionId === option.id;
                const isAnswered = !!selected;
                
                // Style zależne od stanu odpowiedzi
                let buttonClass = "w-full text-left px-4 py-3 rounded-md border transition-all";
                
                if (isAnswered) {
                  // Jeśli odpowiedziano na to pytanie
                  if (isSelected) {
                    // Ta opcja została wybrana
                    if (selected.isCorrect !== undefined) {
                      // Znamy już wynik
                      buttonClass += selected.isCorrect 
                        ? " bg-green-100 border-green-500 text-green-800" 
                        : " bg-red-100 border-red-500 text-red-800";
                    } else {
                      // Jeszcze nie znamy wyniku
                      buttonClass += " bg-blue-100 border-blue-500 text-blue-800";
                    }
                  } else {
                    // Inna opcja została wybrana
                    buttonClass += " bg-gray-100 border-gray-300 text-gray-500 cursor-not-allowed";
                  }
                } else {
                  // Jeszcze nie odpowiedziano
                  buttonClass += " bg-white border-gray-300 hover:bg-gray-50";
                }
                
                // Dla admina możemy pokazać dodatkowe informacje
                if (isAdmin && option.is_correct) {
                  buttonClass += " relative";
                }

                return (
                  <button
                    key={option.id}
                    onClick={() => handleAnswer(question.id, option.id)}
                    disabled={isAnswered}
                    className={buttonClass}
                  >
                    {option.text}
                    
                    {/* Dla admina pokazujemy wskaźnik poprawnej odpowiedzi */}
                    {isAdmin && option.is_correct && (
                      <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-green-600">✓</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      {score !== null && (
        <div className="mt-10 text-center bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-green-600 mb-2">Wynik końcowy</h2>
          <p className="text-lg mb-4">
            Twój wynik: {score} / {quiz.questions.length}
          </p>
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div
              className="bg-green-500 h-4 rounded-full transition-all duration-500"
              style={{ width: `${(score / quiz.questions.length) * 100}%` }}
            ></div>
          </div>
        </div>
      )}
    </div>
  );
}
