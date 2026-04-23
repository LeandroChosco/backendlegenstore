FROM node:20-slim

WORKDIR /app

COPY package*.json ./
RUN npm ci

# Instalar Chromium bundled de Playwright con todas sus dependencias de sistema.
# Usa ~40% menos RAM que Google Chrome — crítico para 512MB.
RUN npx playwright install chromium --with-deps

COPY . .

# Las vars NEXT_PUBLIC_* se incrustan en el bundle durante el build,
# por eso necesitan estar disponibles en esta etapa (no solo en runtime)
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY

RUN npm run build

EXPOSE 3001
CMD ["npm", "start"]
