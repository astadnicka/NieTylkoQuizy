'use client';

import { useKeycloak } from '@react-keycloak/web';

export default function HomePage() {
  const { keycloak, initialized } = useKeycloak();

  if (!initialized) return <p>Ładowanie...</p>;

  // if (!keycloak.authenticated) {
  //   keycloak.login(); 
  //   return <p>Przekierowanie do logowania...</p>;
  // }

  return (
    <div className="App">
      <header className="App-header">
        {keycloak.authenticated ? (
          <>
            <p>Welcome, {keycloak.tokenParsed?.preferred_username}!</p>
            <button onClick={() => keycloak.logout()}>Logout</button>
          </>
        ):(
          <>
          <p>You are not logged in</p>
          <button onClick={() => keycloak.login()}>Login</button>
          </>
        )}
      </header>
    </div>
  );
}
