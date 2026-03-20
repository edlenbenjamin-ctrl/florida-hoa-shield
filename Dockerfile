FROM node:20

WORKDIR /app

COPY package*.json ./

RUN npm install

# Pre-download MongoDB binary (used by mongodb-memory-server fallback)
ENV MONGOMS_PREFER_GLOBAL_PATH=1
RUN node -e " \
  const { MongoMemoryServer } = require('mongodb-memory-server'); \
  MongoMemoryServer.create() \
    .then(s => s.stop()) \
    .then(() => console.log('MongoDB binary cached')) \
    .catch(e => console.warn('MongoDB binary pre-download skipped:', e.message)); \
" || true

COPY . .

EXPOSE 3001

CMD ["node", "server/index.js"]
