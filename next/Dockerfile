FROM node:26.13.1

WORKDIR /next

COPY package*.json /next/
RUN npm install

COPY . .

EXPOSE 3000