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

//lets require/import the mongodb native drivers.

const mongoose = require('mongoose');
// const uri = 'mongodb+srv://hoantancong:abc12345@cluster0.sgdwgsv.mongodb.net/chatappdb?retryWrites=true&w=majority';
const uri = 'mongodb://khoakl241:khoa2412001@45.76.146.34:27017/server_chibi'
mongoose.connect(uri)
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function () {
  console.log('Connected to MongoDB!');
});
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