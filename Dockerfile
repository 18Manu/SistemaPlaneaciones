# ==============================
# 1️⃣ Build del frontend
# ==============================
FROM node:20-alpine AS frontend-build

WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# ==============================
# 2️⃣ Backend
# ==============================
FROM node:20-alpine AS backend

WORKDIR /app/backend

COPY backend/package*.json ./
RUN npm ci

# Copiar todo el backend
COPY backend/ ./

# Copiar el build del frontend al backend (para servir estáticos)
COPY --from=frontend-build /app/frontend/dist ./public

# Exponer puerto
EXPOSE 4000

CMD ["node", "server.js"]
