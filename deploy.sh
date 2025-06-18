#!/bin/bash

# filepath: /mnt/c/Users/User/NieTylkoQuizy/deploy.sh
# Kolory dla lepszej czytelności
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== URUCHAMIANIE PROJEKTU NIETYLKOQUIZY NA KUBERNETES ===${NC}"

# Tworzymy namespace jeśli nie istnieje
echo -e "${YELLOW}Tworzenie namespace...${NC}"
kubectl get namespace nietylkoquizy > /dev/null 2>&1 || kubectl create namespace nietylkoquizy

# Tworzymy sekret
echo -e "${YELLOW}Tworzenie sekretów...${NC}"
kubectl apply -f - <<EOF
apiVersion: v1
kind: Secret
metadata:
  name: app-secrets
  namespace: nietylkoquizy
type: Opaque
data:
  mysql-root-password: cm9vdHBhc3N3b3Jk
  mysql-user-password: a2V5Y2xvYWs=
  keycloak-admin-password: YWRtaW4=
EOF

# Stosujemy ConfigMapy
echo -e "${YELLOW}Stosowanie ConfigMap...${NC}"
kubectl apply -f k8s/configmap/mysql-cm.yaml
kubectl apply -f k8s/configmap/app-config.yaml
kubectl apply -f k8s/configmap/keycloak-cm.yaml

# Stosujemy PersistentVolumeClaims
echo -e "${YELLOW}Stosowanie PersistentVolumeClaims...${NC}"
kubectl apply -f k8s/mysql/mysql-pvc.yaml
kubectl apply -f k8s/keycloak/keycloak-pvc.yaml

echo -e "${YELLOW}Czekam 5 sekund na utworzenie PVC...${NC}"
sleep 5

# Uruchamiamy podstawowe usługi
echo -e "${YELLOW}Uruchamianie MySQL...${NC}"
kubectl apply -f k8s/mysql/mysql-deployment.yaml
kubectl apply -f k8s/mysql/mysql-service.yaml

# Czekamy na uruchomienie MySQL
echo -e "${YELLOW}Czekam na uruchomienie MySQL (może potrwać kilka minut)...${NC}"
kubectl rollout status deployment/mysql -n nietylkoquizy --timeout=300s

# Uruchamiamy Keycloak
echo -e "${YELLOW}Uruchamianie Keycloak...${NC}"
kubectl apply -f k8s/keycloak/keycloak-deployment.yaml
kubectl apply -f k8s/keycloak/keycloak-service.yaml

# Czekamy na uruchomienie Keycloak
echo -e "${YELLOW}Czekam na uruchomienie Keycloak (może potrwać kilka minut)...${NC}"
kubectl rollout status deployment/keycloak -n nietylkoquizy --timeout=300s

# Uruchamiamy backend-posts
echo -e "${YELLOW}Uruchamianie backend-posts...${NC}"
kubectl apply -f k8s/backend/backend-posts-deployment.yaml
kubectl apply -f k8s/backend/backend-posts-service.yaml

# Uruchamiamy backend-users
echo -e "${YELLOW}Uruchamianie backend-users...${NC}"
kubectl apply -f k8s/backend/backend-users-deployment.yaml
kubectl apply -f k8s/backend/backend-users-service.yaml

# Uruchamiamy frontend
echo -e "${YELLOW}Uruchamianie frontend...${NC}"
kubectl apply -f k8s/frontend/frontend-deployment.yaml
kubectl apply -f k8s/frontend/frontend-service.yaml

# Uruchamiamy LoadBalancer
echo -e "${YELLOW}Konfiguracja LoadBalancer...${NC}"
kubectl apply -f k8s/loadbalancer/loadbalancer.yaml

# Uruchamiamy HPA
echo -e "${YELLOW}Konfiguracja HorizontalPodAutoscaler...${NC}"
kubectl apply -f k8s/hpa/hpa.yaml

# Czekamy na uruchomienie wszystkich usług
echo -e "${YELLOW}Czekam na uruchomienie wszystkich usług...${NC}"
kubectl rollout status deployment/backend-posts -n nietylkoquizy --timeout=180s
kubectl rollout status deployment/backend-users -n nietylkoquizy --timeout=180s
kubectl rollout status deployment/frontend -n nietylkoquizy --timeout=180s

# Wyświetlamy pody
echo -e "${YELLOW}Lista uruchomionych podów:${NC}"
kubectl get pods -n nietylkoquizy

# Funkcja do zabijania poprzednich procesów port-forward
kill_existing_port_forwards() {
  echo -e "${YELLOW}Zatrzymuję poprzednie procesy port-forward...${NC}"
  # Znajdź procesy port-forward i zabij je
  for port in 3000 5001 5002 8080; do
    pid=$(lsof -i:$port -t 2>/dev/null)
    if [ -n "$pid" ]; then
      echo -e "${YELLOW}Zatrzymuję proces na porcie $port (PID: $pid)${NC}"
      kill -9 $pid 2>/dev/null || true
    fi
  done
}

# Funkcja do uruchamiania port-forward w tle
start_port_forward() {
  service=$1
  local_port=$2
  remote_port=$3
  
  # Sprawdź, czy usługa istnieje
  if ! kubectl get svc $service -n nietylkoquizy >/dev/null 2>&1; then
    echo -e "${RED}Usługa $service nie istnieje w namespace nietylkoquizy!${NC}"
    return 1
  fi
  
  # Sprawdź, czy port jest już zajęty
  if lsof -i:$local_port -t >/dev/null 2>&1; then
    echo -e "${RED}Port $local_port jest już zajęty. Próbuję alternatywny port...${NC}"
    local_port=$((local_port + 10000))
    echo -e "${YELLOW}Używam alternatywnego portu $local_port dla $service${NC}"
  fi
  
  echo -e "${GREEN}Uruchamiam port-forward dla $service na porcie $local_port${NC}"
  # Użyj przekierowania błędów, aby zobaczyć potencjalne problemy
  kubectl port-forward svc/$service $local_port:$remote_port -n nietylkoquizy > /dev/null 2>&1 &
  PF_PID=$!
  sleep 2
  
  # Sprawdź, czy proces nadal działa
  if kill -0 $PF_PID 2>/dev/null; then
    echo -e "${GREEN}Port-forward dla $service działa na porcie $local_port (PID: $PF_PID)${NC}"
    return 0
  else
    echo -e "${RED}Nie udało się uruchomić port-forward dla $service na porcie $local_port${NC}"
    echo -e "${YELLOW}Sprawdzam szczegóły problemu...${NC}"
    kubectl port-forward svc/$service $local_port:$remote_port -n nietylkoquizy
    return 1
  fi
}

# Zatrzymaj istniejące procesy port-forward
kill_existing_port_forwards

# Uruchom port-forward dla wszystkich usług w tle
echo -e "${BLUE}Uruchamiam port-forward dla wszystkich usług w tle...${NC}"

# Zapisz PID skryptu
SCRIPT_PID=$$
echo $SCRIPT_PID > /tmp/nietylkoquizy_deploy.pid

# Uruchom każdy port-forward i zapisz jego status
start_port_forward "frontend" 3000 3000
frontend_status=$?

start_port_forward "backend-posts" 5001 5001
backend_posts_status=$?

start_port_forward "backend-users" 5002 5002
backend_users_status=$?

start_port_forward "keycloak" 8080 8080
keycloak_status=$?

# Wyświetl podsumowanie
echo -e "\n${BLUE}=== PODSUMOWANIE PORT-FORWARD ===${NC}"

if [ $frontend_status -eq 0 ]; then
  echo -e "${GREEN}Frontend: http://localhost:3000 ✓${NC}"
else
  echo -e "${RED}Frontend: Nie udało się uruchomić port-forward ✗${NC}"
fi

if [ $backend_posts_status -eq 0 ]; then
  echo -e "${GREEN}Backend Posts: http://localhost:5001 ✓${NC}"
else
  echo -e "${RED}Backend Posts: Nie udało się uruchomić port-forward ✗${NC}"
fi

if [ $backend_users_status -eq 0 ]; then
  echo -e "${GREEN}Backend Users: http://localhost:5002 ✓${NC}"
else
  echo -e "${RED}Backend Users: Nie udało się uruchomić port-forward ✗${NC}"
fi

if [ $keycloak_status -eq 0 ]; then
  echo -e "${GREEN}Keycloak: http://localhost:8080 ✓${NC}"
else
  echo -e "${RED}Keycloak: Nie udało się uruchomić port-forward ✗${NC}"
fi

echo -e "\n${GREEN}Projekt został pomyślnie uruchomiony!${NC}"
echo -e "${YELLOW}Port-forward działa w tle. Aby zatrzymać wszystkie port-forward, uruchom:${NC}"
echo -e "${BLUE}kill \$(ps aux | grep 'kubectl port-forward' | grep -v grep | awk '{print \$2}')${NC}"

echo -e "${RED}UWAGA: W przeglądarce musisz zmienić adresy w kodzie frontend (lokalna wersja)${NC}"
echo -e "${RED}z http://localhost:5001 na http://backend-posts:5001${NC}"
echo -e "${RED}z http://localhost:5002 na http://backend-users:5002${NC}"
echo -e "${RED}z http://localhost:8080 na http://keycloak:8080${NC}"

echo -e "\n${BLUE}Możesz teraz korzystać z aplikacji poprzez:${NC}"
echo -e "${GREEN}Frontend: http://localhost:3000${NC}"
echo -e "${GREEN}Backend Posts: http://localhost:5001${NC}"
echo -e "${GREEN}Backend Users: http://localhost:5002${NC}"
echo -e "${GREEN}Keycloak: http://localhost:8080${NC}"