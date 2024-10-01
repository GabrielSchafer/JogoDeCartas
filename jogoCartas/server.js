const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const salas = {
    'Sala 1': { numero: 0, max: 4 },

};

let monteCartas = {};

function Carta(numeroCarta, imagemCarta){
    this.numeroCarta = numeroCarta;
    this.imagemCarta = imagemCarta;
}


//criando o baralho
const baralho = [];
function criaBaralho(baralho){
    for(let i = 0; i < 8;i++){
        for(let j = 0; j < 13;j++){
            let carta = new Carta(j,`${j}.png` );
            baralho.push(carta);
        }
    }
    //ao criar o baralho na mesma funçao eu irei embaralhar as cartas
    for(let i = 0; i < 10;i++){
        baralho.sort(() => Math.random() - 0.5);
    }

}

function distribuirCarta(i){

}

function User(userName, id, baralho){
    this.id = id;
    this.name = userName;
    this.baralho = baralho;
}

let salaCheia;
const usuarios = {};

app.use(express.static('public'));

//criando o baralho
criaBaralho(baralho);
console.log(baralho.length);

io.on('connection', (socket) => {
    console.log('Usuário conectado:', socket.id);

    socket.on('entrarSala', ({ sala, userName }) => {
        // O jogador pode entrar na sala
        socket.join(sala);
        salas[sala].numero += 1; // Incrementa o número de jogadores na sala

        // Armazena o usuário no objeto `usuarios`
        usuarios[socket.id] = { nome: userName, sala };

        // Notifica os outros usuários na sala
        socket.to(sala).emit('mensagem', `${userName} entrou na sala!`);

        // Envia a lista de usuários para todos na sala
        io.to(sala).emit('atualizaJogadores', {
            sala,
            numeroJogadores: salas[sala].numero,
            usuarios: Object.values(usuarios).filter(u => u.sala === sala)
        });
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
            const { nome, sala } = usuario;
            salas[sala].numero -= 1; // Reduz o número de jogadores na sala
            console.log(`Usuário desconectado: ${nome}`);
    
            // Notifica os outros usuários que um usuário saiu
            socket.to(sala).emit('mensagem', `${nome} saiu da sala.`);
    
            // Atualiza todos os usuários sobre o número de jogadores
            io.to(sala).emit('atualizaJogadores', {
                sala,
                numeroJogadores: salas[sala].numero,
                usuarios: Object.values(usuarios).filter(u => u.sala === sala)
            });
    
            delete usuarios[socket.id]; // Remove o usuário do objeto `usuarios`
        }
        console.log('Usuário desconectado:', socket.id);
    });
    
    socket.on(`salaCheia`, () =>{
        if(salas[sala].numero >= salas[sala].max){

        }
    })

});

server.listen(3000, () => {
    console.log('Servidor rodando na porta 3000');
});

