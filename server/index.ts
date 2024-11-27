import express, {Express, Request, Response} from "express";
import http from "http";
import {Server as SocketIOServer, Socket} from "socket.io";
import * as Y from "yjs";
import {Awareness} from "y-protocols/awareness";
import dotenv from "dotenv";
import cors from "cors";
import logger from "./utils/logger";
import {getFullYDocUpdateBuild, saveYDocUpdateToDB} from "./services/ydoc.service";

dotenv.config();
const allowedOrigins = [
  "http://localhost:5173",
  process.env.CLIENT_URL || "",
];

const app: Express = express();
const httpServer: http.Server = http.createServer(app);
const yDoc = new Y.Doc();
const yDocDBPersistInterval = parseInt(process.env.Y_DOC_DB_PERSIST_INTERVAL || "0");
let yDocUpdateCounter = 0;

app.use(
  cors({
    origin: allowedOrigins,
  })
);

app.get("/", (req: Request, res: Response) => {
  res.send("Hello World!");
});

const io: SocketIOServer = new SocketIOServer(httpServer, {
  connectionStateRecovery: {},
  cors: {
    origin: allowedOrigins,
  },
});

// Initialize Awareness protocol
const awareness = new Awareness(yDoc);
let connections = 0;
/**
 * Send the initial document state to connected client.
 * @param socket
 */
const emitInitializeDocument = async (socket: Socket) => {
  try {
    if (connections >= 2) {
      logger.info(`Sending the initial document state from memory to the client with socket id ${socket.id}`);
      socket.emit("initialize-document", Y.encodeStateAsUpdate(yDoc));
    } else {
      logger.info(`Sending the initial document state from database to the client with socket id ${socket.id}`);
      const builtDocument = await getFullYDocUpdateBuild("todoList-1");
      socket.emit("initialize-document", builtDocument);
    }
  } catch (e: any) {
    logger.error(`An error occurred while sending the initial document state to the client with socket id ${socket.id}`, {
      stack: e.stack,
    });
  }
};

/**
 * Send the initial awareness state to connected client.
 * @param socket
 */
const emitInitialAwareness = (socket: Socket) => {
  logger.info(`Sending the initial awareness state to the client with socket id ${socket.id}`);
  socket.emit("initial-awareness", awareness.getStates());
};

io.on("connection", (socket) => {
  connections++;
  logger.info(`A user connected with socket id ${socket.id}`);

  emitInitializeDocument(socket);
  emitInitialAwareness(socket);

  socket.on("update-awareness", (state) => {
    logger.info(`Awareness update received from socket id ${socket.id}`);
    awareness.setLocalStateField(socket.id, state);
  });

  socket.on("client-update", async (update: Uint8Array, username: string) => {
    try {
      yDocUpdateCounter++;
      logger.info(`A user sent an update with socket id ${socket.id} and username ${username}`);
      Y.applyUpdate(yDoc, update);
      socket.broadcast.emit("sync-update", update);
      if (yDocUpdateCounter >= yDocDBPersistInterval) {
        await saveYDocUpdateToDB("todoList-1", update);
        yDocUpdateCounter = 0;
      }
    } catch (e: any) {
      logger.error(`An error occurred while client update with socket id ${socket.id}`, {
        stack: e.stack,
      });
    }
  });

  socket.on("disconnect", async () => {
    connections--;
    try {
      // removeAwarenessStates(awareness, [socket.id], null);
      logger.info(`A user disconnected with socket id ${socket.id}`);
      if (connections === 0) {
        await saveYDocUpdateToDB("todoList-1", Y.encodeStateAsUpdate(yDoc));
      }
      yDoc.destroy();
    } catch (e: any) {
      logger.error(`An error occurred while disconnecting with socket id ${socket.id}`, {
        stack: e.stack,
      });
    }
  });

  socket.on("error", (err) => {
    logger.error(`An error occurred with socket id ${socket.id}`, {
      stack: err.stack,
    });
  });
});

httpServer.listen(process.env.PORT || 3000, () => {
  logger.info(`Server is running on port ${process.env.PORT || 3000}`);
});
