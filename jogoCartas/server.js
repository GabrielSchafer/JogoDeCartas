const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const salas = {
    'Sala 1': { numero: 0, max: 4 },

};

let monteCartas= {};

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

function distribuirCartas(cartas,usuarios) {

    for (let i = 0; i < 1; i++) {
       for (let j = 0; j < 26;j++){
           usuarios[i].baralhoUsuario.push(cartas.pop())
       }
    }
}

function User(userName, id, baralhoUsuario){
    this.id = id;
    this.name = userName;
    this.baralhoUsuario = baralhoUsuario;
}

function adicionaMonte(carta,monte){
    monte.push(carta);
}

function retornaUltimaCartaMonte(monte){
    let ultimo =  monte.length - 1;

    return monte[ultimo]
}


let salaCheia;
const usuarios = {}; 

app.use(express.static('public'));

//criando o baralho
criaBaralho(baralho);
console.log(baralho.length)


io.on('connection', (socket) => {
    console.log('Usuário conectado:', socket.id);

    socket.on('entrarSala', ({ sala, userName }) => {
        socket.join(sala);
        salas[sala].numero += 1;

        // Armazena o usuário no objeto `usuarios`
        usuarios[socket.id] = { nome: userName, sala};
        if (salas[sala]=== 4) {
            io.emit('iniciarJogo');
            console.log('O jogo pode começar!');
        }
        // Notifica os outros usuários na sala
        socket.to(sala).emit('mensagem', `${userName} entrou na sala!`);
        
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

        socket.emit('mandarMonte', {monteCartas})
        monteCartas++;
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

    socket.on(`salaCheia`, () =>{
        if(salas[sala].numero >= salas[sala].max){

        }
    })

});

server.listen(3000, () => {
    console.log('Servidor rodando na porta 3000');
});
