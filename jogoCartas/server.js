const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const salas = {
    'Sala 1': { numero: 0, max: 4 },

};

const usuarios = {}; 

app.use(express.static('public'));

io.on('connection', (socket) => {
    console.log('Usuário conectado:', socket.id);

    socket.on('entrarSala', ({ sala, usuarioNome }) => {
        socket.join(sala);
        salas[sala].numero += 1;

        // Armazena o usuário no objeto `usuarios`
        usuarios[socket.id] = { nome: usuarioNome, sala };

        // Notifica os outros usuários na sala
        socket.to(sala).emit('mensagem', `${usuarioNome} entrou na sala!`);
        
        // Atualiza todos os usuários sobre o número de jogadores
        io.to(sala).emit('atualizaJogadores', { sala, numeroJogadores: salas[sala].numero, maxJogadores: salas[sala].max });
    });

    socket.on('bater', (data) => {
        console.log(`${data.usuarioNome} bateu!`); 

        socket.emit('bateu', { jogador: 'Você' });

        socket.to(data.sala).emit('bateu', { jogador: data.usuarioNome });
    });

    socket.on('jogar', (data) => {
        console.log(`${data.usuarioNome} jogou a carta!`);

        socket.emit('jogar', { jogador: 'Você' });

        socket.to(data.sala).emit('jogar', { jogador: data.usuarioNome });
    });

    socket.on('disconnect', () => {
        const usuario = usuarios[socket.id];
        if (usuario) {
            const { nome, sala } = usuario; // Desestrutura o nome e a sala
            salas[sala].numero -= 1; // Reduz o número de jogadores na sala
            console.log(`Usuário desconectado: ${nome}`);
            
            // Notifica os outros usuários que um usuário saiu
            socket.to(sala).emit('mensagem', `${nome} saiu da sala.`);
            
            // Atualiza todos os usuários sobre o número de jogadores
            io.to(sala).emit('atualizaJogadores', { sala, numeroJogadores: salas[sala].numero, maxJogadores: salas[sala].max });
            
            // Remove o usuário do objeto `usuarios`
            delete usuarios[socket.id]; 
        }
        console.log('Usuário desconectado:', socket.id);
    });
});

server.listen(3000, () => {
    console.log('Servidor rodando na porta 3000');
});
