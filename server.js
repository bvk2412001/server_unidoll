import { createRequire } from "module";
const require = createRequire(import.meta.url);
import io from "./connect.js";
import { config } from "dotenv";
import { create } from "domain";
config({ path: "config.env" });
const { GoogleSpreadsheet } = require('google-spreadsheet');
const creds = require('./secret-key.json')
var mongoose = require('mongoose');




const roomChatSchema = new mongoose.Schema(
    {
        idMess: Number,
        fbId: String,
        sender: String,
        locale: String,
        photoURL: String,
        roomNo: String,
        like: Number,
        message: JSON,
    }
)



let clientNo = 0
let roomNo
let countRoom = 0
let listRoom = []
io.on("connection", (socket) => {

    socket.on('FEEDBACK_SERVER', async (data) => {
        console.log(data)
        try {
            const doc = new GoogleSpreadsheet("1684RnMiHqcGNDSxABYBAiVdTBFjpwK-1tIVzOEkV2yI");

            await doc.useServiceAccountAuth(creds)

            await doc.loadInfo();
            // socket.emit("FEEDBACK_SERVER", doc)
            const sheet = doc.sheetsByIndex[0]
            const HEADERS = ['game_name', 'user_locale', 'language', 'feedbackContent']
            await sheet.setHeaderRow(HEADERS)

            let newRow = { 'game_name': data.game_name, 'user_locale': data.user_locale, 'language': data.language, 'feedbackContent': data.feedbackContent }

            await sheet.addRow(newRow)
        }
        catch (ex) {

        }

    });

    socket.on("JOIN_ROOM_PK", (data) => {
        clientNo++
        if (clientNo % 2 != 0) {
            roomNo = countRoom
            socket.join(roomNo)
            io.to(roomNo).emit("JOIN_ROOM", "YOU ARE HOST")
            let room = {
                id: roomNo,
                hostIdFb: data,
                hostIdSocket: socket.id,
                playerIdFb: "",
                playerIdSocket: "",
                roomNo: roomNo,
                member: 1
            }
            listRoom.push(room)
        }
        else {
            let checkSameId = false
            listRoom.forEach(element => {
                if (element.id == roomNo) {
                    if (element.hostIdFb == data) {
                        socket.emit("ID_INVALID")
                        checkSameId = true
                    }
                }
            })

            if (checkSameId == false) {
                socket.join(roomNo)
                //random doll


                let randomDoll = Math.floor(Math.random() * 30)
                listRoom.forEach(element => {
                    if (element.id == roomNo) {
                        element.playerIdFb = data
                        element.playerIdSocket = socket.id
                        element.member = 2
                    }
                })

                io.to(roomNo).emit("FUll_ROOM", { roomNo: roomNo, randomDoll: randomDoll })
                countRoom++
            }
            else {
                clientNo--
            }

        }
    })


    socket.on("DATA_USER", (data) => {

        socket.to(data.roomNo).emit("DATA_USER", data)
    })

    socket.on("USER_READY", (data) => {

        socket.to(data.roomNo).emit("USER_READY", data)
    })

    socket.on("START_GAME", (data) => {

        io.to(data.roomNo).emit("START_GAME", data)
    })
    socket.on("TIME_OUT", (data) => {
        socket.to(data.roomNo).emit("TIME_OUT", data)
    })

    socket.on("ALL_DONE", (data) => {

        io.to(data.roomNo).emit("ALL_DONE")
        let index = -1
        for (let i = 0; i < listRoom.length; i++) {
            if (listRoom[i].id == data.roomNo) {
                index = i
            }
        }

        if (index != -1) {
            listRoom.splice(index, 1)
        }
    })

    socket.on("RECONNECT", (data) => {

        socket.join(data.roomNo)
        listRoom.forEach(element => {

            if (element.hostIdFb == data.fbId) {

                element.hostIdSocket = data.fbId
            }
            if (element.playerIdSocket == "") {

                element.playerIdSocket = socket.id
            }
        })
        socket.to(data.roomNo).emit("USER_RECONNECT")
    })

    socket.on("TIME_OUT_RECONNECT", (data) => {
        socket.to(data).emit("TIME_OUT_RECONNECT")
    })

    socket.on("disconnect", () => {
        let index = -1

        for (let i = 0; i < listRoom.length; i++) {

            if (listRoom[i].hostIdSocket == socket.id || listRoom[i].playerIdSocket == socket.id) {
                listRoom[i].member--
                if (listRoom[i].member == 1) {
                    io.to(listRoom[i].roomNo).emit("OTHER_USER_DISCONNECT")
                }
                if (listRoom[i].member == 0) {

                    index = i
                    if (clientNo % 2 == 1) {
                        clientNo--
                    }
                }
            }
        }

        if (index != -1) {

            listRoom.splice(index, 1)

        }
    })

    socket.on("OUT_APP", (data) => {
        socket.to(data).emit("OUT_APP")
    })

    socket.on("READY", (data) => {
        socket.to(data).emit("READY")
    })

    socket.on("ALL_READY", (data) => {
        io.to(data).emit("ALL_READY")
    })


    // chat
    socket.on("JOIN_ROOM_GLOBAL", (data) => {
        socket.join(data)
        const messages = mongoose.model(data, roomChatSchema)

        messages.find().then((data) => {
            socket.emit("ALL_MESS", data)
        }).catch((err) => {
        });

    })

    socket.on("SEND_MESSAGE", (data) => {
        var roomMessage = mongoose.model(data.roomNo, roomChatSchema)
        roomMessage.findOne({})
            .sort({ _id: -1 }) // Sắp xếp theo trường _id giảm dần
            .exec()
            .then(lastItem => {
                let newMess;
                if (lastItem == null) {
                    newMess = {
                        idMess: 1,
                        fbId: data.fbData.fbId,
                        sender: data.fbData.sender,
                        locale: data.fbData.locale,
                        photoURL: data.fbData.photoURL,
                        roomNo: data.roomNo,
                        message: JSON.stringify(data.message),
                    }
                }else{
                    newMess = {
                        idMess: lastItem.idMess + 1,
                        fbId: data.fbData.fbId,
                        sender: data.fbData.sender,
                        locale: data.fbData.locale,
                        photoURL: data.fbData.photoURL,
                        roomNo: data.roomNo,
                        like: 0,
                        message: JSON.stringify(data.message),
                    }
                }
                roomMessage.countDocuments({})
                    .then((count) => {
                        if (count > 50) {
                            roomMessage.findOneAndDelete({})
                                .then((deletedUser) => { })
                                .catch((err) => { });
                        }
                    })
                    .catch((err) => { });
                const createUser = async () => {
                    try {
                        const user = await roomMessage.create(newMess)
                    } catch (error) { }
                }
                createUser()
                socket.to(data.roomNo).emit("SEND_MESSAGE", newMess)
            })
            .catch(err => {
                console.error(err);
            });


    })

    socket.on("SEND_DOLL", (data) => { 
        console.log(data)
        var roomMessage = mongoose.model(data.roomNo, roomChatSchema)
        roomMessage.findOne({})
            .sort({ _id: -1 }) // Sắp xếp theo trường _id giảm dần
            .exec()
            .then(lastItem => {
                let newMess;
                if (lastItem == null) {
                    newMess = {
                        idMess: 1,
                        fbId: data.dataFb.fbId,
                        sender: data.dataFb.sender,
                        locale: data.dataFb.locale,
                        photoURL: data.dataFb.photoURL,
                        roomNo: data.roomNo,
                        like: 0,
                        message: JSON.stringify(data.data),
                    }
                }else{
                    newMess = {
                        idMess: lastItem.idMess + 1,
                        fbId: data.dataFb.fbId,
                        sender: data.dataFb.sender,
                        locale: data.dataFb.locale,
                        photoURL: data.dataFb.photoURL,
                        roomNo: data.roomNo,
                        like: 0,
                        message: JSON.stringify(data.data),
                    }
                }
                roomMessage.countDocuments({})
                    .then((count) => {
                        if (count > 50) {
                            roomMessage.findOneAndDelete({})
                                .then((deletedUser) => { })
                                .catch((err) => { });
                        }
                    })
                    .catch((err) => { });
                const createUser = async () => {
                    try {
                        const user = await roomMessage.create(newMess)
                    } catch (error) { }
                }
                createUser()
                io.to(data.roomNo).emit("SEND_DOLL", newMess)
            })
            .catch(err => {
                console.error(err);
            });
    })


    socket.on("LIKE_AVATAR", (data) => {
        console.log(data)
        var roomMessage = mongoose.model(data.roomNo, roomChatSchema)
        roomMessage.updateOne({ idMess: data.idMess }, { like: data.like })
        .then(result => {
          console.log(result);
        })
        .catch(error => {
        });

        io.to(data.roomNo).emit("LIKE_AVATAR", data)
    })

    socket.on("UN_LIKE_AVATAR", (data) => {
        console.log(data)
        var roomMessage = mongoose.model(data.roomNo, roomChatSchema)
        roomMessage.updateOne({ idMess: data.idMess }, { like: data.like })
        .then(result => {
          console.log(result);
        })
        .catch(error => {
        });

        io.to(data.roomNo).emit("UN_LIKE_AVATAR", data)
    })
})

