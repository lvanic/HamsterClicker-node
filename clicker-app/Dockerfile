# Build the frontend
FROM node:22.11

RUN npm install -g serve

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci --no-audit

COPY . .

RUN npm run build

EXPOSE 3000
CMD ["serve", "-s", "/app/build"]