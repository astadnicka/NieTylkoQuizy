import Keycloak from 'keycloak-js';

const keycloak = new Keycloak({
  url: 'http://localhost:8080',
  realm: 'NieTylkoQuizy',
  clientId: 'NieTylkoQuizyClient',
});

export default keycloak;
