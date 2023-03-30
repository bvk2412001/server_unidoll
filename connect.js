
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
//const { Server } = require("socket.io");
import { Server } from "socket.io";

//cors
//const cors = require("cors");
import cors from "cors";

//init
const app = express();
app.use(
    cors({
        origin: "*",
        methods: ["GET", "POST"]
    })
);

const httpServer = createServer(app);
const io = new Server(httpServer, { /* options */ });

app.use(express.static(path.join(__dirname, "public")));

//start
httpServer.listen(PORT, () => {
    console.log(`Server is running at PORT: ${PORT}`);
});

export default io;