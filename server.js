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
        if(clientNo % 2 != 0){
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
                roomNo: roomNo
            }
            listRoom.push(room)
        }
        else{
            socket.join(roomNo)
            //random doll
            let randomDoll = Math.floor(Math.random() * 15)
            listRoom.forEach(element => {
                if(element.id == roomNo){
                    element.playerIdFb = data
                    element.playerIdSocket = socket.id
                }
            })
          
            io.to(roomNo).emit("FUll_ROOM", {roomNo: roomNo, randomDoll: randomDoll})
            console.log(listRoom)
            countRoom++
        }
    })
   

    socket.on("DATA_USER", (data)=>{

        socket.to(data.roomNo).emit("DATA_USER", data)
    })

    socket.on("USER_READY", (data)=>{

        socket.to(data.roomNo).emit("USER_READY", data)
    })

    socket.on("START_GAME", (data)=>{

        io.to(data.roomNo).emit("START_GAME", data)
    })
    socket.on("TIME_OUT", (data) =>{
        socket.to(data.roomNo).emit("TIME_OUT", data)
    })

    socket.on("ALL_DONE", (data) =>{
        console.log(data)
        io.to(data.roomNo).emit("ALL_DONE")
        let index = -1
        for(let i = 0; i < listRoom.length; i++){
            if(listRoom[i].id == data.roomNo){
                index = i
            }
        }

        if(index != -1){
            listRoom.splice(index, 1)
            console.log(listRoom)
        }
    })

    socket.on("disconnect", ()=>{
        console.log("disconnect", socket.id)
        listRoom.forEach(element => {
            if(element.hostIdSocket == socket.id || element.playerIdSocket == socket.id){
                io.to(element.roomNo).emit("OTHER_USER_DISCONNECT")
            }
        })
    })
})

