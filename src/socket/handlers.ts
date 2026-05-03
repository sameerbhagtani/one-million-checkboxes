import { type Server } from "socket.io";
import { toggleCheckbox } from "../app/checkbox/service.js";
import { checkboxTogglePayloadSchema } from "../app/checkbox/schema.js";
import { publishToggleEvent } from "../config/pubsub.js";

export default function registerSocketHandlers(io: Server) {
    io.on("connection", (socket) => {
        console.log(`New socket connected : ${socket.id}`);

        socket.on("client:toggled", async (payload: unknown) => {
            try {
                const parseResult =
                    checkboxTogglePayloadSchema.safeParse(payload);
                if (!parseResult.success) {
                    socket.emit("server:error", {
                        message: "Invalid toggle payload",
                    });
                    return;
                }

                const { id } = parseResult.data;
                await toggleCheckbox(id);

                await publishToggleEvent({ id, origin: socket.id });
            } catch (err) {
                console.error(err);
                socket.emit("server:error", {
                    message: "Unable to toggle checkbox",
                });
            }
        });
    });
}
