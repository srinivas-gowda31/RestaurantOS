FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
COPY server.js ./
EXPOSE 3000
CMD ["node", "server.js"]
