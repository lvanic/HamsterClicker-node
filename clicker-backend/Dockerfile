FROM node:22.13

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install
COPY . ./

EXPOSE 3001
CMD npm run start:dev