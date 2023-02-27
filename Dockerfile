FROM node:16

WORKDIR /usr/src/app

COPY ./package*.json /usr/src/app/

RUN cd /usr/src/app && \
    npm install && \
    npm cache clean --force

COPY ./ /usr/src/app/

RUN npm run build

EXPOSE 4000

CMD ["npm", "start"]
