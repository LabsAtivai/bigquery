# =========================
# 1) Build
# =========================
FROM node:20-alpine AS builder

WORKDIR /app

# deps
COPY package*.json ./
RUN npm ci

# build
COPY . .
RUN npm run build


# =========================
# 2) Runtime (produção)
# =========================
FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

# instala só deps de produção
COPY package*.json ./
RUN npm ci --omit=dev

# copia build
COPY --from=builder /app/dist ./dist

# (opcional) se você usa assets estáticos/configs específicos:
# COPY --from=builder /app/public ./public

# porta padrão do Nest
EXPOSE 3000

# start
CMD ["node", "dist/main.js"]