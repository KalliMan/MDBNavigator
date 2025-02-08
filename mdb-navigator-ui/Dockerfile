FROM node:alpine AS build

# Create app directory
WORKDIR /app

RUN npm install -g vite

# Install app dependencies
COPY package.json .
COPY package-lock.json .

# Bundle app source
RUN npm install

COPY . .

EXPOSE 3000

CMD [ "npm", "run", "dev" ]
