'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

export default function QuizPage() {
  const { id } = useParams();
  const [quiz, setQuiz] = useState(null);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    fetch(`http://localhost:5001/quizzes/${id}`)
      .then((res) => res.json())
      .then((data) => setQuiz(data))
      .catch((err) => console.error('Błąd pobierania quizu:', err));
  }, [id]);

  const handleOptionClick = (questionId, optionId) => {
    if (selectedAnswers[questionId] !== undefined) return; 

    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: optionId,
    }));
  };

  const calculateScore = () => {
    if (!quiz) return 0;
    let correctCount = 0;
    quiz.questions.forEach((q) => {
      const selectedId = selectedAnswers[q.id];
      const correct = q.options.find((opt) => opt.is_correct);
      if (correct && selectedId === correct.id) {
        correctCount++;
      }
    });
    return correctCount;
  };

  if (!quiz) return <p>Ładowanie...</p>;

  const allAnswered = quiz.questions.length === Object.keys(selectedAnswers).length;

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">{quiz.title}</h1>
      {quiz.questions.map((question) => (
        <div key={question.id} className="mb-6">
          <h2 className="font-semibold mb-2">{question.text}</h2>
          <div className="flex flex-col gap-2">
            {question.options.map((option) => {
              const isSelected = selectedAnswers[question.id] === option.id;
              const isCorrect = option.is_correct;
              const wasAnswered = selectedAnswers[question.id] !== undefined;

              let bgColor = 'bg-white';
              if (wasAnswered) {
                if (isSelected && isCorrect) bgColor = 'bg-green-300';
                else if (isSelected && !isCorrect) bgColor = 'bg-red-300';
                else if (isCorrect) bgColor = 'bg-green-100';
              }

              return (
                <button
                  key={option.id}
                  onClick={() => handleOptionClick(question.id, option.id)}
                  className={`p-2 rounded border ${bgColor} cursor-pointer text-left`}
                >
                  {option.text}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {allAnswered && (
        <div className="mt-6 text-xl font-semibold text-center">
          Twój wynik: {calculateScore()} / {quiz.questions.length}
        </div>
      )}
    </div>
  );
}
