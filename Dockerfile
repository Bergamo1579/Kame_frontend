# ==========================
# Build stage
# ==========================
FROM node:18-alpine AS builder
WORKDIR /app

# Instala dependências
COPY package.json package-lock.json ./
RUN npm ci --silent

# Copia o código fonte
COPY . .

# Define as variáveis de build (injetadas pelo docker-compose / Coolify)
ARG REACT_APP_API_URL
ARG REACT_APP_NAME
ARG REACT_APP_VERSION
ARG GENERATE_SOURCEMAP

ENV REACT_APP_API_URL=$REACT_APP_API_URL
ENV REACT_APP_NAME=$REACT_APP_NAME
ENV REACT_APP_VERSION=$REACT_APP_VERSION
ENV GENERATE_SOURCEMAP=$GENERATE_SOURCEMAP

# Build do React
RUN npm run build

# ==========================
# Production stage
# ==========================
FROM node:18-alpine AS runner
WORKDIR /app

# Copia build pronto e node_modules
COPY --from=builder /app/build ./build
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Serve + curl
RUN npm install -g serve && apk add --no-cache curl

HEALTHCHECK --interval=10s --timeout=3s --start-period=15s --retries=3 \
  CMD curl -f http://localhost:3001/ || exit 1

EXPOSE 3001

CMD ["serve", "-s", "build", "-l", "3001"]