'use client';

import { useEffect, useState } from 'react';

export default function MockPoll({ quiz }) {
  const [answered, setAnswered] = useState({});
  const [results, setResults] = useState({});

  const STORAGE_KEY = `mock_poll_${quiz.id}`;

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setAnswered(JSON.parse(stored));
    }
  }, [quiz.id]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(answered));
  }, [answered]);

  const mockPercentages = (optionsLength) => {
    const values = Array.from({ length: optionsLength }, () => Math.random());
    const sum = values.reduce((a, b) => a + b, 0);
    return values.map(v => Math.round((v / sum) * 100));
  };

  const handleClick = (questionId, optionId, options) => {
    if (answered[questionId]) return;

    const percentages = mockPercentages(options.length);

    const result = {};
    options.forEach((opt, idx) => {
      result[opt.id] = percentages[idx];
    });

    setResults(prev => ({
      ...prev,
      [questionId]: result
    }));

    setAnswered(prev => ({
      ...prev,
      [questionId]: optionId
    }));
  };

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6 text-center">{quiz.title}</h1>

      {quiz.questions.map((question) => {
        const userAnswer = answered[question.id];
        const resultForQuestion = results[question.id] || {};

        return (
          <div key={question.id} className="mb-8 p-4 border border-gray-300 rounded-md">
            <h2 className="font-semibold mb-4">{question.text}</h2>

            {question.options.map((option) => {
              const isClicked = userAnswer === option.id;
              const percent = resultForQuestion[option.id];

              return (
                <div
                  key={option.id}
                  onClick={() => handleClick(question.id, option.id, question.options)}
                  className={`p-3 border rounded-md mb-2 cursor-pointer transition-colors ${
                    isClicked
                      ? 'bg-green-100 border-green-500'
                      : userAnswer
                      ? 'bg-white border-gray-300 text-gray-600 cursor-default'
                      : 'hover:bg-gray-50 border-gray-300'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span>{option.text}</span>
                    {userAnswer && (
                      <span className="text-sm text-gray-600">{percent}%</span>
                    )}
                  </div>

                  {userAnswer && (
                    <div className="w-full h-2 bg-gray-200 rounded-full mt-1">
                      <div
                        className="h-2 bg-green-500 rounded-full"
                        style={{ width: `${percent}%` }}
                      ></div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
