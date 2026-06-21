# Gunakan Node.js versi terbaru yang stabil
FROM node:22-alpine AS base

# 1. Install dependencies hanya jika diperlukan
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

# 2. Build ulang source code aplikasi
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Key di-pass dari .env.local saat docker build, tidak hardcode di sini
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG QRIS_MERCHANT_PAYLOAD
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV QRIS_MERCHANT_PAYLOAD=$QRIS_MERCHANT_PAYLOAD
RUN npm run build

# 3. Production runner
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ARG QRIS_MERCHANT_PAYLOAD
ENV QRIS_MERCHANT_PAYLOAD=$QRIS_MERCHANT_PAYLOAD
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000

CMD ["node", "server.js"]
