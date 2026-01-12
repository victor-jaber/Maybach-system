FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

# instala as ferramentas que o build pode precisar (sem mexer no package.json)
RUN npm i -D tsx drizzle-kit

COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --omit=dev

# se você precisa delas em runtime (migrations/scripts), mantém aqui também
RUN npm i -D tsx drizzle-kit

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/shared ./shared
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /app/drizzle.config.json ./drizzle.config.json

EXPOSE 5000
CMD ["npm","run","start"]
