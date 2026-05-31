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
# Masukkan ENV Supabase Anda agar ikut ter-build (ganti dengan URL & KEY asli jika perlu)
ENV NEXT_PUBLIC_SUPABASE_URL="https://lvcuenqrzkeclrvvkdfx.supabase.co"
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx2Y3VlbnFyemtlY2xydnZrZGZ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0MTQwOTAsImV4cCI6MjA5MTk5MDA5MH0.jeOqruRDaYBuUGt0J6YTGqdqvftxCTj3XPqzCv9l22U"
RUN npm run build

# 3. Production runner
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000

CMD ["node", "server.js"]
