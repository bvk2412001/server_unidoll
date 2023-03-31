import { createRequire } from "module";
const require = createRequire(import.meta.url);
import { config } from "dotenv";
config({ path: "config.env" });
import express from "express";
import { createServer } from "http";
import path from "path";
const PORT = process.env.PORT || 3000;

import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

//socket
import { Server } from "socket.io";


//init
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(express.static(path.join(__dirname, "public")));

//start
httpServer.listen(PORT, () => {
  console.log(`Server is running at PORT: ${PORT}`);
});

export default io;