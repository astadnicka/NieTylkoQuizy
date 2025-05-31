'use client';

import { useState, useEffect } from 'react';

export default function QuizComponent({ quiz }) {
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [score, setScore] = useState(null);

  const handleAnswer = (questionId, optionId, isCorrect) => {
    if (selectedAnswers[questionId]) return; // Nie pozwalaj na zmianę odpowiedzi

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
                const isCorrect = option.is_correct;

                const isAnswered = !!selected;
                const correctSelected = isSelected && isCorrect;
                const incorrectSelected = isSelected && !isCorrect;

                return (
                  <button
                    key={option.id}
                    onClick={() => handleAnswer(question.id, option.id, option.is_correct)}
                    disabled={isAnswered}
                    className={`w-full text-left px-4 py-3 rounded-md border transition-all
                      ${
                        correctSelected
                          ? 'bg-green-100 border-green-500 text-green-800'
                          : incorrectSelected
                          ? 'bg-red-100 border-red-500 text-red-800'
                          : isAnswered
                          ? 'bg-gray-100 border-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-white border-gray-300 hover:bg-gray-50'
                      }`}
                  >
                    {option.text}
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
