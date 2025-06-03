# Dockerfile
FROM python:3.11-slim

# Ustawienie katalogu roboczego
WORKDIR /app

# Kopiuj wymagane pliki
COPY requirements.txt .

# Instalacja zależności
RUN pip install --no-cache-dir -r requirements.txt

# Kopiuj resztę projektu
COPY . .

# Ustawienie komendy startowej
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "5002"]
