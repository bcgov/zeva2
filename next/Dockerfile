FROM node:26.13.1

WORKDIR /next

COPY package*.json /next/
RUN npm ci

COPY . .

EXPOSE 3000