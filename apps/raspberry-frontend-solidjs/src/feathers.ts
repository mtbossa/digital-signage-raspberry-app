import feathers from "@feathersjs/client";
import socketio from "@feathersjs/socketio-client";
import io from "socket.io-client";

const port = 45691;

const socket = io(`http://localhost:${port}`);
const client = feathers();

client.configure(socketio(socket));

export default client;
export { port };
