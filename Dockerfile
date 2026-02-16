# Set version LTS Node.js
FROM node:24.13.1

WORKDIR /app

COPY package*.json .

RUN npm install

COPY . .