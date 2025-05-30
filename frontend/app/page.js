'use client';

import { useKeycloak } from '@react-keycloak/web';
import Link from 'next/link';
import QuizzesList from './components/QuizzesList';

export default function HomePage() {
  const { keycloak, initialized } = useKeycloak();

  if (!initialized) return <p>Ładowanie...</p>;

  return (
    <div className="p-6">
      <nav className="flex justify-end mb-6">
        {keycloak.authenticated ? (
          <button onClick={() => keycloak.logout()}>Wyloguj</button>
        ) : (
          <button onClick={() => keycloak.login()}>Zaloguj</button>
        )}
      </nav>

      <h1 className="text-2xl font-bold mb-4 text-center">Najnowsze Quizy</h1>
      <QuizzesList limit={3} />

      <div className="mt-6 text-center">
        <Link href="/quizzes" className="text-blue-600 underline">Zobacz wszystkie quizy</Link>
      </div>
    </div>
  );
}
