import { Server as SocketIOServer } from "socket.io";
import registerSocketHandlers from "./handlers.js";
import { socketAuthMiddleware } from "../middlewares/socketAuthMiddleware.js";

import { type Server as HttpServer } from "node:http";

export default function createSocketServer(server: HttpServer): SocketIOServer {
    const io = new SocketIOServer(server);

    io.use(socketAuthMiddleware);

    registerSocketHandlers(io);

    return io;
}
