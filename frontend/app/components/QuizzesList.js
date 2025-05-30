'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function QuizzesList({ limit = null }) {
  const [quizzes, setQuizzes] = useState([]);

  useEffect(() => {
    const url = limit
      ? `http://localhost:5001/quizzes/?limit=${limit}`
      : 'http://localhost:5001/quizzes/';
    fetch(url)
      .then((res) => res.json())
      .then((data) => setQuizzes(data))
      .catch((err) => console.error('Błąd pobierania quizów:', err));
  }, [limit]);

  return (
    <div className="flex flex-col gap-4 items-center">
      {quizzes.map((quiz) => (
        <Link
          href={`/quizzes/${quiz.id}`}
          key={quiz.id}
          className="border p-4 rounded-md w-full max-w-md hover:bg-gray-100 transition"
        >
          {quiz.title}
        </Link>
      ))}
    </div>
  );
}
