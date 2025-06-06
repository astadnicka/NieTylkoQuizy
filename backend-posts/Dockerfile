FROM --platform=$BUILDPLATFORM python:3.10-slim AS builder

RUN apt-get update && apt-get install -y --no-install-recommends \
    default-libmysqlclient-dev \
    gcc \
    python3-dev \
    pkg-config \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY requirements.txt .

RUN pip install --no-cache-dir --target=/install -r requirements.txt \
    && pip install --no-cache-dir --target=/install flask watchdog

FROM --platform=$TARGETPLATFORM python:3.10-slim AS app

# Instalacja tylko wymaganych bibliotek runtime
RUN apt-get update && apt-get install -y --no-install-recommends \
    default-libmysqlclient-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY --from=builder /install /usr/local/lib/python3.10/site-packages/
COPY . .

EXPOSE 5000

CMD ["flask", "run", "--host=0.0.0.0", "--port", "5000"]