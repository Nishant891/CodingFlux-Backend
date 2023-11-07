const express = require("express");
const app = express();
const http = require("http");
const { Server } =  require("socket.io");
const Actions = require('./Actions');

const server = http.createServer(app);
const io = new Server(server);

const users = {};

const getAllConnectedClients = (roomId) => {
    return Array.from(io.sockets.adapter.rooms.get(roomId)).map((socketId) => {
        return {
            socketId,
            username: users[socketId]
        }
    })
}

io.on('connection', (socket) => {

    socket.on(Actions.JOIN, ({roomId, username}) => {
        const userName = username;
        console.log(socket.id);
        users[socket.id] = username;
        socket.join(roomId);
        const clients = getAllConnectedClients(roomId);
        clients.forEach(({socketId}) => {
            io.to(socketId).emit(Actions.JOINED, {
                clients,
                userName,
                socketId: socket.id
            })
        })
    })

    socket.on('disconnecting', () => {
        const rooms = [...socket.rooms];
        rooms.forEach((roomId) => {
            socket.in(roomId).emit(Actions.DISCONNECTED,{
                socketId : socket.id,
                username : users[socket.id]
            })
        });
        delete users[socket.id];
        socket.leave();
    })

    socket.on(Actions.CODE_CHANGE, ({ roomId, code, name }) => {
        socket.in(roomId).emit(Actions.CODE_CHANGE, { code : code, name });
    })

    socket.on(Actions.SYNC_CODE, ({roomId, code, socketId, name }) => {
        console.log(socketId);
        console.log(code);
        socket.to(socketId).emit(Actions.CODE_CHANGE, { code : code, name : name }); 
    })
})

const PORT = 5000;
server.listen(PORT, () => {console.log(`Alpha is online on ${PORT}`)});