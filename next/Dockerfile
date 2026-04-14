FROM node:24.14.1

WORKDIR /next

COPY package*.json /next/
RUN npm install

COPY . .

EXPOSE 3000