'use client';

import QuizzesList from '../components/QuizzesList';

export default function AllQuizzesPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4 text-center">Wszystkie Quizy</h1>
      <QuizzesList />
    </div>
  );
}
