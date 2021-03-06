FROM node:14.15.5

WORKDIR /usr/src/app

COPY package.json ./

RUN npm install

ADD . /usr/src/app

RUN npm run build

ENV NODE_ENV=production
ENV PORT=80
ARG MONGODB_URI=${MONGODB_URI}
ARG JWT_SECRET=${JWT_SECRET}
ARG AWS_KEY=${AWS_KEY}
ARG AWS_SECRET=${AWS_SECRET}
ARG BUCKET_NAME=${BUCKET_NAME}
ARG BUCKET_REGION=${BUCKET_REGION}
ARG SENDGRID_API_KEY=${SENDGRID_API_KEY}
ARG HOSTNAME=${HOSTNAME}

EXPOSE 80
CMD ["npm", "start"]