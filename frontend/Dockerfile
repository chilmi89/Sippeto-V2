FROM node:24-alpine AS builder

WORKDIR /build

COPY package.json ./
RUN npm install

COPY . .

ENV NODE_ENV=production
RUN npm run build

FROM node:24-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /build/.next ./.next
COPY --from=builder /build/public ./public
COPY --from=builder /build/package.json ./package.json
COPY --from=builder /build/node_modules ./node_modules
COPY --from=builder /build/next.config.ts ./next.config.ts

EXPOSE 3000

CMD ["npm", "start"]
