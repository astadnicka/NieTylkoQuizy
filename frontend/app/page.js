'use client';

import { useKeycloak } from '@react-keycloak/web';
import Link from 'next/link';
import QuizzesList from './components/QuizzesList';

export default function HomePage() {
  const { keycloak, initialized } = useKeycloak();

  if (!initialized) return <p>Ładowanie...</p>;

  const isAdmin = keycloak?.authenticated && keycloak?.tokenParsed?.realm_access?.roles.includes('admin');

  const handleLogout = async () => {
    try {
      // Wyślij token do blacklisty
      if (keycloak.token) {
        await fetch('http://localhost:5002/api/users/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${keycloak.token}`
          }
        });
      }
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      // Wyloguj z Keycloak
      keycloak.logout();
    }
  };

  return (
    <div className="p-6">
      <nav className="flex justify-between items-center mb-6">
        <div className="space-x-4">
          {/* Link do quizów */}
          <Link href="/quizzes" className="text-blue-600 hover:underline">
            Quizzes
          </Link>

          {/* Link do użytkowników - tylko dla adminów */}
          {isAdmin && (
            <Link href="/users" className="text-blue-600 hover:underline">
              Users
            </Link>
          )}

          {/* Link do panelu admina - tylko dla adminów */}
          {isAdmin && (
            <Link href="/admin" className="text-blue-600 hover:underline">
              Admin Panel
            </Link>
          )}
        </div>

        <div>
          {keycloak.authenticated ? (
            <div className="flex items-center space-x-2">
              <span>
                Cześć,{' '}
                {keycloak.tokenParsed?.preferred_username || 'Użytkowniku'}!
              </span>
              <button
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-700 text-white py-1 px-3 rounded text-sm"
              >
                Wyloguj
              </button>
            </div>
          ) : (
            <button
              onClick={() => keycloak.login()}
              className="bg-blue-500 hover:bg-blue-700 text-white py-1 px-3 rounded"
            >
              Zaloguj
            </button>
          )}
        </div>

        <Link
          href="/create"
          className="bg-green-500 hover:bg-green-700 text-white py-1 px-3 rounded"
        >
          Utwórz quiz
        </Link>
      </nav>

      <h1 className="text-2xl font-bold mb-4 text-center">Najnowsze Quizy</h1>
      <QuizzesList limit={3} />

      <div className="mt-6 text-center">
        <Link href="/quizzes" className="text-blue-600 underline">
          Zobacz wszystkie quizy
        </Link>
      </div>
    </div>
  );
}
