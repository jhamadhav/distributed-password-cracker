FROM node:alpine

WORKDIR /usr/nodeapp

COPY ./package.json ./

EXPOSE 8000

RUN npm install

COPY ./ ./

CMD [ "npm", "start" ]
