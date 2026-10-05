FROM node:26.10.0

WORKDIR /next

COPY package*.json /next/
RUN npm install

COPY . .

EXPOSE 3000