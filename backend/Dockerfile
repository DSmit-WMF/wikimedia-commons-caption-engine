FROM node:22-alpine AS base
WORKDIR /app

FROM base AS dev
COPY package.json ./
RUN npm install
COPY . .
EXPOSE 3002
CMD ["npm", "run", "dev"]

FROM base AS deps
COPY package.json ./
RUN npm install

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM base AS runner
ENV NODE_ENV=production
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./
RUN npm install --omit=dev
EXPOSE 3002
CMD ["node", "dist/index.js"]
