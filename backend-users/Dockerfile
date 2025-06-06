FROM --platform=$BUILDPLATFORM python:3.11-slim AS builder

WORKDIR /app
COPY requirements.txt .

RUN pip install --no-cache-dir --target=/install -r requirements.txt

FROM --platform=$TARGETPLATFORM python:3.11-slim AS app

WORKDIR /app

COPY --from=builder /install /usr/local/lib/python3.11/site-packages/
COPY . .

EXPOSE 5002

CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "5002"]