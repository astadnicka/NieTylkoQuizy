'use client';

import { useKeycloak } from '@react-keycloak/web';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLayout({ children }) {
  const { keycloak, initialized } = useKeycloak();
  const router = useRouter();

  useEffect(() => {
    if (initialized && (!keycloak.authenticated || !keycloak.tokenParsed?.realm_access?.roles.includes('admin'))) {
      router.push('/'); // redirect if not admin
    }
  }, [keycloak, initialized, router]);

  if (!initialized) return <p>Ładowanie...</p>;

  return (
    <>
      {keycloak.authenticated && keycloak.tokenParsed?.realm_access?.roles.includes('admin') && (
        <div className="p-6">
          {children}
        </div>
      )}
    </>
  );
}
