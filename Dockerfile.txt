# filepath: Dockerfile
FROM node:20
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 50513
CMD ["node", "src/server/server.cjs"]