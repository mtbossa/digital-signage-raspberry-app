FROM node:16

ENV API_URL="localhost:80"
ENV PORT=4508
ENV NODE_ENV="production"

RUN mkdir /intus
RUN mkdir /app /public /config

COPY apps/raspberry-server/build /intus/app
COPY apps/raspberry-frontend/build /intus/public
COPY apps/raspberry-server/config /intus/config

CMD ["node", "/intus/app/index.js"]

EXPOSE $PORT