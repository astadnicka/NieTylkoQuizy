'use client';

export default function AdminPage() {
  return (
    <div className="text-center">
      <h1 className="text-3xl font-bold mb-4">Panel Administratora</h1>
      <p>Tylko użytkownicy z rolą <code>admin</code> mogą tu wejść.</p>
    </div>
  );
}
