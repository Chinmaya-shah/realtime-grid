FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
RUN touch database.db && chown -R node:node /app
USER node
EXPOSE 7860
ENV PORT=7860
CMD ["node", "server.js"]
