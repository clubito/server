import logger from "@logger";
import { Socket } from "socket.io";

export const chatServer = (socket: Socket) : void => {
    logger.debug("New client connected");
    socket.on("message", msg => {
        logger.debug(`CLIENT MESSAGE: ${msg}`);
        socket.emit("hello", "Hello from server");
    });
};



