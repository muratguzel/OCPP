# Web build for hosting at /mobile (e.g. app.sarjmodul.com/mobile)
FROM node:20-alpine AS builder

ARG WEB_BASE_URL=/mobile
ARG EXPO_PUBLIC_BACKEND_API_URL=https://app.sarjmodul.com
ARG EXPO_PUBLIC_OCPP_GATEWAY_URL=https://app.sarjmodul.com/gateway

ENV WEB_BASE_URL=$WEB_BASE_URL
ENV EXPO_PUBLIC_BACKEND_API_URL=$EXPO_PUBLIC_BACKEND_API_URL
ENV EXPO_PUBLIC_OCPP_GATEWAY_URL=$EXPO_PUBLIC_OCPP_GATEWAY_URL

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm exec expo export --platform web

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
