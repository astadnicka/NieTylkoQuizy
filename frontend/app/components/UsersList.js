'use client';

import { useEffect, useState } from 'react';
import { useKeycloak } from '@react-keycloak/web';

export default function UsersList() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { keycloak } = useKeycloak();

  useEffect(() => {
    if (!keycloak.authenticated) {
      setLoading(false);
      setError("Musisz być zalogowany, aby zobaczyć listę użytkowników");
      return;
    }

    const fetchUsers = async () => {
      try {
        console.log("Token dostępny:", !!keycloak.token);
        
        const response = await fetch('http://localhost:5002/api/users/', {
          headers: {
            'Authorization': `Bearer ${keycloak.token}`
          }
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Błąd HTTP ${response.status}: ${errorText}`);
          throw new Error(`Błąd ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        setUsers(data);
        setError(null);
      } catch (err) {
        console.error('Błąd pobierania użytkowników:', err);
        setError(`Nie udało się pobrać listy użytkowników: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [keycloak.authenticated, keycloak.token]);

  if (loading) return <p className="text-center py-4">Ładowanie użytkowników...</p>;
  if (error) return <p className="text-center py-4 text-red-500">Błąd: {error}</p>;

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white border border-gray-200">
        <thead className="bg-gray-100">
          <tr>
            {/* Pokaż nagłówki kolumn zależnie od roli */}
            <th className="py-2 px-4 border-b">ID</th>
            <th className="py-2 px-4 border-b">Nazwa użytkownika</th>
            <th className="py-2 px-4 border-b">Email</th>
            <th className="py-2 px-4 border-b">Imię</th>
            <th className="py-2 px-4 border-b">Nazwisko</th>
            <th className="py-2 px-4 border-b">Status</th>
          </tr>
        </thead>
        <tbody>
          {users.map(user => (
            <tr key={user.id || user.username} className="hover:bg-gray-50">
              {/* Pokaż komórki tabeli zależnie od roli */}
              <td className="py-2 px-4 border-b">{user.id}</td>
              <td className="py-2 px-4 border-b">{user.username}</td>
              <td className="py-2 px-4 border-b">{user.email}</td>
              <td className="py-2 px-4 border-b">{user.first_name}</td>
              <td className="py-2 px-4 border-b">{user.last_name}</td>
              <td className="py-2 px-4 border-b">
                <span className={`px-2 py-1 rounded-full text-xs ${
                  user.enabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {user.enabled ? 'Aktywny' : 'Nieaktywny'}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}