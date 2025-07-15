# Build the frontend
FROM node:22.11

RUN npm install -g serve

WORKDIR /app

COPY package*.json /app/
RUN npm cache clean --force && npm install

COPY ./ /app/

RUN npm run build

EXPOSE 3000
CMD serve -s /app/build