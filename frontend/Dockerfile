FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

# Kod będzie podmontowany przez volume, więc nie kopiujemy reszty

EXPOSE 3000

CMD ["npm", "run", "dev"]
