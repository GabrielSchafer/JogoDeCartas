const socket = io(); // Conecta ao servidor

let salaAtual;
let numeroCartaMonte = 0;
let userName;

function verificaRodada(){
    //se for a sua vez de jogar habilita o botão
    //Teremos um array de 4 rotacoes, na primeira rodada o jogador da posicao 0 no array irá jogar, após ele jogar a carta vai ter uma iteracao no array, após a ultima posicao no array ele irá resetar a iterador e assim segue a rodada. essa function vai retornar ao jogador se é a vez dele com um boolean, cada jogador vai ter o numero da sua posicao e toda rotacao vai comparar a posicao com o numero no array, esse array vai receber os jogadores para poder desabilitar o botao do usuario correto.
}

function habilitaJogarCarta(){
    // Precisamos da classe usuario com os atributos corretos
    if(verificaRodada()){
        //usuario.disable()=false;
    }
    else{
        //usuario.disable()=true;
    }


}

// Oatualiza o número de jogadores
socket.on('atualizaJogadores', (data) => {
    const salaDiv = document.getElementById("numeroJogadores"); //
    salaDiv.textContent = "Número de jogadores: " +`${data.numeroJogadores}/${data.maxJogadores}`;
});

//  mensagem de entrada e saída
socket.on('mensagem', (msg) => {
    console.log(msg); 
    alert(msg); 
});

// Função para entrar em uma sala
function entrarSala(sala) {

    userName = prompt("Por favor, insira seu nome:");
    
    if (!userName) {
        alert("Você precisa inserir um nome para entrar na sala.");
        return; // Se o nome não for fornecido, sai da função
    }

        salaAtual = sala; // Salva a sala atual
        socket.emit('entrarSala', {sala, userName}); // Envia o evento ao servidor

        // Muda da tela inicial para a tela do jogo
        document.getElementById("telaInicial").classList.add("hidden");
        //document.getElementById("fila").classList.remove("hidden");
        document.getElementById("telaJogo").classList.remove("hidden");

        // Atualiza a tela com o nome do usuário e sala
        document.getElementById("nomeUsuario").innerText = `Usuário: ${userName}`;
        document.getElementById("salaAtual").innerText = `Sala: ${sala}`;

        console.log(`Entrou na ${sala} como ${userName}`);
}

// Função ao clicar no botão "Bater"
function bater() {
    console.log("Bateu na mesa!");
    socket.emit('bater', { userName, sala: salaAtual });
}

function escolherCarta(){
    console.log("Jogou a carta");
    socket.emit('mandarMonte')
    socket.emit('jogar', { userName, sala: salaAtual });
}
// Listener para a resposta do servidor sobre quem bateu
socket.on('bateu', (data) => {
    if (data.jogador === 'Você') {
        alert('Você bateu na mesa!');
    } else {
        alert(`${data.jogador} bateu na mesa!`);
    }
});
socket.on('jogar', (data) => {
    if (data.jogador === 'Você') {
        alert('Você jogou a carta!');
    } else {
        alert(`${data.jogador} jogou a carta!`);
    }
});

//atualiza o monte
socket.on('mandaMonte', (data) => {
    let element = document.getElementById("numeroMonte");
    element.textContent = 'Monte: ' + data.monteCartas;
})
