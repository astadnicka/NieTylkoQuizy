'use client';

import { useKeycloak } from '@react-keycloak/web';
import UsersList from '../components/UsersList';
import Link from 'next/link';

export default function UsersPage() {
  const { keycloak, initialized } = useKeycloak();

  if (!initialized) return <p>Ładowanie...</p>;

  // Przekieruj niezalogowanych użytkowników
  if (!keycloak.authenticated) {
    return (
      <div className="p-6 text-center">
        <h1 className="text-2xl font-bold mb-4">Dostęp zabroniony</h1>
        <p className="mb-4">Musisz być zalogowany, aby zobaczyć listę użytkowników.</p>
        <button 
          onClick={() => keycloak.login()}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Zaloguj się
        </button>
        <div className="mt-4">
          <Link href="/" className="text-blue-600 underline">
            Powrót do strony głównej
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <nav className="mb-6">
        <Link href="/" className="text-blue-600 hover:underline">
          &larr; Powrót do strony głównej
        </Link>
      </nav>
      
      <h1 className="text-2xl font-bold mb-6 text-center">Lista Użytkowników</h1>
      
      <UsersList />
    </div>
  );
}