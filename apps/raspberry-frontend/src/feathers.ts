import feathers from "@feathersjs/client";
import socketio from "@feathersjs/socketio-client";
import io from "socket.io-client";

const APP_PORT = process.env["NODE_ENV"] === "production" ? 45691 : 3030;

const socket = io(`http://localhost:${APP_PORT}`);
const client = feathers();

client.configure(socketio(socket));

export const appUrl = `http://localhost:${APP_PORT}`;

export default client;
