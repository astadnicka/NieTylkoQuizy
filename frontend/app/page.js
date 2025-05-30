'use client';

import { useKeycloak } from '@react-keycloak/web';

export default function HomePage() {
  const { keycloak, initialized } = useKeycloak();

  if (!initialized) return <p>Ładowanie...</p>;


  return (
    <div className="App">
      <header className="App-header">
        {keycloak.authenticated ? (
          <>
            <p>2322Wessldeece, {keycloak.tokenParsed?.preferred_username}!</p>
            <button onClick={() => keycloak.logout()}>Logout</button>
          </>
        ):(
          <>
          <p>KKKKSSSSWUDJJFSHUSFFHUJIOJIODS2er2dddAASSSSSSaaaaaasdasdhgfffgjhiuiuihjjidfffffffffffguiu asre not lddded iddn</p>
          <button onClick={() => keycloak.login()}>Login</button>
          </>
        )}
      </header>
    </div>
  );
}
