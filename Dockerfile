FROM node:14.15.5

WORKDIR /usr/src/app

COPY package.json ./

RUN npm install

ADD . /usr/src/app

RUN npm run build

ENV NODE_ENV production

ENV PORT 80

EXPOSE 80

CMD ["npm", "start"]