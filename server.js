import io from "./connect.js";
import { config } from "dotenv";
config({ path: "config.env" });


let clientNo = 0
let roomNo
let countRoom = 0
let listRoom = []
io.on("connection", (socket) => {
    console.log(socket.id)

    socket.on("JOIN_ROOM_PK", (data) => {
        clientNo++
        if (clientNo % 2 != 0) {
            roomNo = countRoom
            socket.join(roomNo)
            console.log("FFFF")
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
                    if(element.hostIdFb == data){
                        socket.emit("ID_INVALID")
                        checkSameId = true
                    }
                }
            })

            if(checkSameId == false){
                socket.join(roomNo)
                //random doll
    
    
                let randomDoll = Math.floor(Math.random() * 15)
                listRoom.forEach(element => {
                    if (element.id == roomNo) {
                        element.playerIdFb = data
                        element.playerIdSocket = socket.id
                        element.member = 2
                    }
                })
    
                io.to(roomNo).emit("FUll_ROOM", { roomNo: roomNo, randomDoll: randomDoll })
                console.log(listRoom)
                countRoom++
            }
            else{
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
        console.log(data)
        io.to(data.roomNo).emit("ALL_DONE")
        let index = -1
        for (let i = 0; i < listRoom.length; i++) {
            if (listRoom[i].id == data.roomNo) {
                index = i
            }
        }

        if (index != -1) {
            console.log(listRoom.length)
            listRoom.splice(index, 1)
            console.log(listRoom.length)
        }
    })

    socket.on("RECONNECT", (data) => {
        console.log(data)
        socket.join(data.roomNo)
        listRoom.forEach(element => {

            if (element.hostIdFb == data.fbId) {
                console.log(element)
                element.hostIdSocket = data.fbId
            }
            if (element.playerIdSocket == "") {
                console.log(element)
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
        console.log("disconnect", socket.id)

        for (let i = 0; i < listRoom.length; i++) {

            if (listRoom[i].hostIdSocket == socket.id || listRoom[i].playerIdSocket == socket.id) {
                listRoom[i].member--
                if (listRoom[i].member == 1) {
                    io.to(listRoom[i].roomNo).emit("OTHER_USER_DISCONNECT")
                }
                if (listRoom[i].member == 0) {
                    index = i
                }
            }
        }

        if (index != -1) {
            console.log(listRoom.length)
            listRoom.splice(index, 1)
            console.log(listRoom.length)
        }
    })

    socket.on("OUT_APP", (data) =>{
        socket.to(data).emit("OUT_APP")
    })

    socket.on("READY", (data) => {
        console.log("ready")
        socket.to(data).emit("READY")
    })

    socket.on("ALL_READY", (data) => {
        io.to(data).emit("ALL_READY")
    })
})

