import feathers from "@feathersjs/client";
import socketio from "@feathersjs/socketio-client";
import io from "socket.io-client";

const port = process.env.REACT_APP_SOCKET_PORT ?? 3030;

const socket = io(`http://localhost:${port}`);
const client = feathers();

client.configure(socketio(socket));

export default client;
export { port };
