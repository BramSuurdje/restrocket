FROM oven/bun:alpine

WORKDIR /app

COPY . .
COPY .env .env

RUN bun install
RUN bun run build

CMD ["bun", "run", "src/index.ts"]