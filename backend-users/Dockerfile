FROM --platform=$BUILDPLATFORM python:3.11-slim AS builder

WORKDIR /app
COPY requirements.txt .

RUN pip install --no-cache-dir --target=/install -r requirements.txt

FROM --platform=$TARGETPLATFORM python:3.11-slim AS app

ARG PORT=5002
ARG APP_MODULE=app:app

ENV PORT=${PORT}
ENV APP_MODULE=${APP_MODULE}

WORKDIR /app

COPY --from=builder /install /usr/local/lib/python3.11/site-packages/
COPY . .

EXPOSE ${PORT}

CMD ["sh", "-c", "uvicorn $APP_MODULE --host 0.0.0.0 --port $PORT"]
