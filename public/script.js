var socket = io();

var turn;

socket.on("set up", setUpFront);
socket.on("turn", takeTurns);
socket.on("round winner", setTurns);
socket.on("take from deck", getNewCards);
socket.on("last from deck", getLastCards);
socket.on("hlaska", displayHlaska);
socket.on("score", displayScore);

/*
socket.on('gameCode', handleGameCode);
socket.on('unknownCode', handleUnknownGame);
socket.on('tooManyPlayers', handleTooManyPlayers);

const gameScreen = document.getElementById('game');
const initialScreen = document.getElementById('initialScreen');
const newGameBtn = document.getElementById('newGameButton');
const joinGameBtn = document.getElementById('joinGameButton');
const gameCodeInput = document.getElementById('gameCodeInput');
const gameCodeDisplay = document.getElementById('gameCodeDisplay');

newGameBtn.addEventListener('click', newGame);
joinGameBtn.addEventListener('click', joinGame);

function handleUnknownGame(){
    reset();
    alert("Unknown game code");
}

function handleTooManyPlayers(){
    reset();
    alert("This game is already in progress");
}

function reset(){
    //playerNumber = null;
    gameCodeInput.value = "";
    gameCodeDisplay.innerText = "";
    initialScreen.style.display = "block";
    gameScreen.style.display = "none";
}

function handleGameCode(gameCode){
    gameCodeDisplay.innerText = gameCode;
}

function newGame(){
    socket.emit('newGame');
    setUpFront();
}

function joinGame(){
    const code = gameCodeInput.value;
    socket.emit('joinGame', code);
    setUpFront();
}
*/
function displayScore(scores){
    $("#table").append('<p id="game-over">Game Over<br><br>Player 1: ' + scores[0] + '<br>Player 2: ' + scores[1] + '</p>');
}

function displayHlaska(data){
    console.log(data);
    if(data.player == 0){
        $("#hlasky-1").append('<div class="karta" style="background-image: url(assets/'
            + data.card.suit + '_' + data.card.value + '.jpg)"></div>');
    }
    else if(data.player == 1){
        $("#hlasky-2").append('<div class="karta" style="background-image: url(assets/'
            + data.card.suit + '_' + data.card.value + '.jpg)"></div>');
    }
}

function getLastCards(newCards){
    getNewCards(newCards);
    $(".right").remove();
}

function getNewCards(newCards){
    $("#player-cards").append('<div class="karta" style="background-image: url(assets/'
        + newCards[0].suit + '_' + newCards[0].value + '.jpg)"></div>');
    $("#player-cards-2").append('<div class="karta" style="background-image: url(assets/'
        + newCards[1].suit + '_' + newCards[1].value + '.jpg)"></div>');
}

function setTurns(winner){
    turn = winner;

    //add player's deck
    if(turn === 1 && $('#deck-1').children().length === 0) {
        $('#deck-1').append('<div class="karta deck"></div>');
    }
    else if(turn === 2 && $('#deck-2').children().length === 0) {
        $('#deck-2').append('<div class="karta deck"></div>');
    }
}

$(".left").click(function (){
    if($("#vylozena-karta-1").css("background-image") !== "none"
        && $("#vylozena-karta-2").css("background-image") !== "none"){
        $("#vylozena-karta-1").css("background-image", "");
        $("#vylozena-karta-2").css("background-image", "");
        socket.emit("cards taken");
    }
});

function takeTurns(){
    $(document).on("click", "#player-cards .karta", function () {
        if (turn == 1 && $("#vylozena-karta-1").css("background-image") === "none") {
            let index = $(this).index();
            $(this).remove();
            $("#vylozena-karta-1").css("background-image", $(this).css("background-image"));
            turn = 2;
            socket.emit("card", index);
        }
    });

    $(document).on("click", "#player-cards-2 .karta", function () {
        if (turn == 2 && $("#vylozena-karta-2").css("background-image") === "none") {
            let index = $(this).index();
            $(this).remove();
            $("#vylozena-karta-2").css("background-image", $(this).css("background-image"));
            turn = 1;
            socket.emit("card 2", index);
        }
    });
}

function setUpFront(state){
    /*initialScreen.style.display = "none";
    gameScreen.style.display = "block";*/
    let playerOne = state.playerOne;
    let playerTwo = state.playerTwo;
    let trumf = state.trumf;
    turn = 1;
    //give out cards
    for (let i = 0; i < 8; i++) {
        $("#player-cards").append('<div class="karta" style="background-image: url(assets/'
            + playerOne.cards[i].suit + '_' + playerOne.cards[i].value + '.jpg)"></div>');
        $("#player-cards-2").append('<div class="karta" style="background-image: url(assets/'
            + playerTwo.cards[i].suit + '_' + playerTwo.cards[i].value + '.jpg)"></div>');
    }

    //set trumf
    $(".right").prepend('<div class="karta" id="trumf" style="background-image: url(assets/'
        + trumf.suit + '_' + trumf.value + '.jpg)"></div>');
}