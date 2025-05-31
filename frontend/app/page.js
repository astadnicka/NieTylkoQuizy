'use client';

import { useKeycloak } from '@react-keycloak/web';
import Link from 'next/link';
import QuizzesList from './components/QuizzesList';

export default function HomePage() {
  const { keycloak, initialized } = useKeycloak();

  if (!initialized) return <p>Ładowanie...</p>;

  const isAdmin = keycloak?.authenticated && keycloak?.tokenParsed?.realm_access?.roles.includes('admin');

  return (
    <div className="p-6">
      <nav className="flex justify-between items-center mb-6">
        <div className="space-x-4">
          {isAdmin && (
            <Link href="/admin" className="text-blue-600 hover:underline">
              Panel Admina
            </Link>
          )}
        </div>
        <div>
          {keycloak.authenticated ? (
            <button onClick={() => keycloak.logout()}>Wyloguj</button>
          ) : (
            <button onClick={() => keycloak.login()}>Zaloguj</button>
          )}
        </div>
      </nav>

      <h1 className="text-2xl font-bold mb-4 text-center">Najnowsze Quizy</h1>
      <QuizzesList limit={3} />

      <div className="mt-6 text-center">
        <Link href="/quizzes" className="text-blue-600 underline">Zobacz wszystkie quizy</Link>
      </div>
    </div>
  );
}
