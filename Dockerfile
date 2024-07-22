FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN addgroup -S appgroup && adduser -S appuser -G appgroup
RUN chown -R appuser:appgroup /app

EXPOSE 8000

ENV DATABASE_NAME="/app/dev.sqlite"
ENV DATABASE_USER="user"
ENV DATABASE_PASSWORD="password"

USER appuser

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 CMD curl -f http://localhost:8000/health || exit 1

CMD ["npm", "start"]