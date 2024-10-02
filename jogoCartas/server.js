
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const salas = {
    'Sala 1': { numero: 0, max: 4 },
};



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

function distribuirCartas(cartas,usuario) {

    for (let j = 0; j < 26;j++){
        usuario.baralhoUsuario.push(cartas.pop())
        console.log('distribuindo as cartas')
    }
}


function User(userName,sala){
    this.name = userName;
    this.baralhoUsuario = [];
    this.sala = sala;
}


function retornaUltimaCartaMonte(monte){
    let ultimo =  monte.length - 1;

    return monte[ultimo]
}

function encerrarServidor() {
    io.close();
    server.close(() => {
        console.log('Servidor encerrado');
    });
}


const usuarios = {};

app.use(express.static('public'));

//criando o baralho
criaBaralho(baralho);
console.log(baralho.length)

let rodadas = 0;
const monteCartas= [];
io.on('connection', (socket) => {
    console.log('Usuário conectado:', socket.id);

    socket.on('entrarSala', ({ sala, userName }) => {

        socket.join(sala);
        salas[sala].numero += 1;
        // Armazena o usuário no objeto `usuarios`
        usuarios[socket.id] = new User(userName, salas[sala])

        /*for (const socketId in usuarios) {
            if (usuarios.hasOwnProperty(socketId)) {
                const usuario = usuarios[socketId];
                console.log(`Usuário com ID ${socketId}: ${usuario.name} (Sala ${usuario.sala})`);
            }
        }*/


        // Notifica os outros usuários na sala
        socket.to(sala).emit('mensagem', `${userName} entrou na sala!`);
        distribuirCartas(baralho,usuarios[socket.id]);
        for(let i = 0; i < usuarios[socket.id].baralhoUsuario.length;i++){
            console.log(usuarios[socket.id].baralhoUsuario[i].numeroCarta);
        }
        // Atualiza todos os usuários sobre o número de jogadores
        io.to(sala).emit('atualizaJogadores', { sala, numeroJogadores: salas[sala].numero, maxJogadores: salas[sala].max });
    });

    socket.on('bater', (data) => {
        const usuario = usuarios[socket.id]; // Obtém o objeto User do usuário que emitiu o evento
        const nomeUsuario = usuario.name;
        const salaUsuario = usuario.sala;
        const mensagemBater = ""
        let primeiroJogador = false;
        let usuariosArray = [];

        usuariosArray.push(usuario)

        if(usuariosArray.length <= 1){
            primeiroJogador = true;
        }

        let tempoBatida;
        if (retornaUltimaCartaMonte(monteCartas).numeroCarta == rodadas && usuariosArray.length == 4){} {
            for (let i = 0; i < usuariosArray.length; i++) {
                tempoBatida = i + 1;
                switch (tempoBatida) {
                    case 1:
                        console.log(usuariosArray[i].name + " foi o primeiro a bater e não compra nada");
                        mensagemBater.concat(usuariosArray[i].name + " foi o primeiro a bater e não compra nada <br>");
                        break;
                    case 2:
                        console.log(usuariosArray[i].name + " foi o segundo a bater e não compra nada");
                        mensagemBater.concat(usuariosArray[i].name + " foi o segundo a bater e não compra nada <br>");
                        break;
                    case 3:
                        console.log(usuariosArray[i].name + " foi o terceiro a bater e não compra nada");
                        mensagemBater.concat(usuariosArray[i].name + " foi o terceiro a bater e não compra nada <br>")
                        break;
                    case 4:
                        console.log(usuariosArray[i].name + " foi o último a bater e compra o monte");
                        mensagemBater.concat(usuariosArray[i].name + " foi o ultimo a bater e compra o monte <br>")
                        usuariosArray[i].baralhoUsuario.push(...monte);
                        monte = [];
                        console.log(monte.length + " número do monte")
                        break;
                    default:
                        console.log("ERRO 01");
                }
            }
            rodadas = 0;
        }
        if (retornaUltimaCartaMonte(monteCartas) != rodadas && primeiroJogador) {
            console.log(usuariosArray[0].name + " bateu errado e compra o monte")
            monte = [];
            console.log(monte.length + " número do monte")
            mensagemBater.concat(usuariosArray[0].name + " bateu errado e compra o monte");
            rodadas = 0;
        }

        console.log(`${nomeUsuario} bateu!`);

        socket.emit('bateu', {jogador: 'Você'});
        socket.to(data.sala).emit('bateu', {jogador: nomeUsuario});
        socket.emit('bateu', {mensagemBater: mensagemBater});

    });

    socket.on('jogar', (data) => {
        const usuario = usuarios[socket.id];
        if(rodadas == 13){
            rodadas = 0;
        }
        console.log(`${usuario.name} jogou a carta!`);
        rodadas++;
        //adiciona uma carta no monte
        monteCartas.push(usuario.baralhoUsuario.pop())
        socket.emit('jogar', { jogador: 'Você' , rodadas : rodadas});

        const numeroCartas = usuario.baralhoUsuario.length

        io.emit('cartasUser',{ numeroCartas: numeroCartas, userName: usuario.name});

        socket.to(data.sala).emit('jogar', { jogador: usuario.name, rodadas : rodadas});

        if(usuario.baralhoUsuario.length == 0){
            let mensagemFinal = usuario.name + " Ganhou o jogo"
            io.to(data.sala).emit('finalizarJogo', {mensagemFinal : mensagemFinal})
            encerrarServidor()
        }

    });
    socket.on(`atualizarMonte`, (data) => {
        //enviando a mensagem de volta para o servidor
        io.to(data.sala).emit(`monteAtualizado`,{ monteCarta: retornaUltimaCartaMonte(monteCartas), tamanhoMonte: monteCartas.length} )
        console.log(retornaUltimaCartaMonte(monteCartas))
    } )

    socket.on('disconnect', () => {
        const usuario = usuarios[socket.id];
        if (usuario) {
            const { nome, sala } = usuario; // Desestrutura o nome e a sala
            salas[sala].numero -= 1; // Reduz o número de jogadores na sala
            console.log(`Usuário desconectado:` + usuario.name);

            // Notifica os outros usuários que um usuário saiu
            io.to(sala).emit('mensagem', usuario.name + ` saiu da sala.`);

            // Atualiza todos os usuários sobre o número de jogadores
            io.to(sala).emit('atualizaJogadores', { sala, numeroJogadores: salas[sala].numero, maxJogadores: salas[sala].max });

            // Remove o usuário do objeto `usuarios`
            delete usuarios[socket.id];
        }
        console.log('Usuário desconectado:', socket.id);
    });

    socket.on('baralho', (data) =>{
        const user = usuario[socket.id]
    })

    socket.on('liberaJogo', ({sala}) =>{
        let libera;
        console.log(sala);
        console.log(salas[sala].numero);
        if(salas[sala].numero == salas[sala].max){
            libera = true
        }else if(salas[sala].numero < salas[sala].max){
            libera = false;
        }
        io.to(sala).emit('liberaJogo', { libera : libera} )
        if(libera){
            io.to(sala).emit('mudarTelaJogo')
        }
    })

});

server.listen(3000, () => {
    console.log('Servidor rodando na porta 3000');
});
