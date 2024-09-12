const express = require('express');
const socket = require('dgram')
const http = require('http');
const {Server} = require('socket.io');

const app = express()
const server = http.createServer(app);

const io = new Server(server);


app.get('/', (req,res)=>{
    res.sendFile(__dirname + '/index.html')
});


let esperandoUsuario = null;

io.on('connection', (socket)=>{
    console.log('um usuario se conectou')

    socket.on('set username', (username) => {
        socket.username = username

        // quem conecntou na sala
        console.log(`${username} entrou na sala.`)

        if(esperandoUsuario){
            socket.partner = esperandoUsuario;
            esperandoUsuario.partner = socket;

            esperandoUsuario.emit('chat start', `Falando com: ${socket.username}`);
            socket.emit('chat start', `Falando com ${esperandoUsuario.username}`);
            
            esperandoUsuario = null;
        }else{
            // se nao tem ngm esperando, colocar ele como proximo a esperar
            esperandoUsuario = socket;
            socket.emit('waiting', 'Aguardando por um usuario para papear')
        }
    });

    socket.on('chat message', (msg) =>{
        if(socket.partner){
                socket.partner.emit('chat message', `${socket.username}: ${msg}`)
            }
            
    });


    socket.on('manual desconect', () =>{
        if(socket.partner){
            socket.partner.emit('chat end', `${socket.username} desconectou`);
            socket.partner.partner = null;
            socket.partner = null;
        }
        socket.emit('chat end', 'Voce desconectou');
    });

    socket.on('disconectou', ()=>{
        console.log('usuario se desconectou');
        if(socket.partner){
            socket.partner.emit('chat end', `${socket.username} desconectou`)
        }
        if(esperandoUsuario == socket){
            esperandoUsuario == null;
        }
    });
});

server.listen(3000, ()=>{
    console.log('Servidor na porta http://localhost:3000')
});