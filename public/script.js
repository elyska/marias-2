/***********lizat az kdyz je stul prazdnej********** x
 * ********zobrazit hlasky az se uklidi stul******** x
 * *********zobrazit score az se uklidi stul******** x
 * ***************trumf sedma*********************** x
 * **********dodržovat pravida********************** x
 * *********nekoukat si do karet******************** x
 * ***************prelozit************************** x
 */


var socket = io();

var turn = 1;
var playerNumber;

socket.on("init", handleInit);

socket.on("set up", setUpFront);
socket.on("turn", takeTurns);
socket.on("round winner", setTurns);
socket.on("last from deck", getLastCards);
socket.on("hlaska", displayHlaska);
socket.on("score", displayScore);

socket.on('gameCode', handleGameCode);
socket.on('unknownCode', handleUnknownGame);
socket.on('tooManyPlayers', handleTooManyPlayers);


socket.on("player one played", updatePlayerTwo);
socket.on("player two played", updatePlayerOne);
socket.on("take cards", takeCards);
socket.on("update cards on table", updateCardsOnTable);


socket.on("change trumf", changeTrumf);


const gameScreen = document.getElementById('gameScreen');
const initialScreen = document.getElementById('initialScreen');
const newGameBtn = document.getElementById('newGameButton');
const joinGameBtn = document.getElementById('joinGameButton');
const gameCodeInput = document.getElementById('gameCodeInput');

newGameBtn.addEventListener('click', newGame);
joinGameBtn.addEventListener('click', joinGame);


function changeTrumf(data){
    //console.log(data);
    if(data.playerNumber === 0 && playerNumber === 0){
        //zmenit horni radu
        $("#player-cards").children().eq(data.index).css("background-image", 'url(assets/'
            + data.suit + '_' + data.value + '.jpg)');
    }
    else if(data.playerNumber === 1 && playerNumber === 1){
        //zmenit dolni radu
        $("#player-cards-2").children().eq(data.index).css("background-image", 'url(assets/'
            + data.suit + '_' + data.value + '.jpg)');
    }
    //zmenit trumf
    $("#trumf").css("background-image", 'url(assets/' + data.suit + '_sedma.jpg)');
}

function handleUnknownGame(){
    reset();
    alert("Neznámý kód");
}

function handleTooManyPlayers(){
    reset();
    alert("Tato hra je již rozehraná");
}

function reset(){
    playerNumber = null;
    gameCodeInput.value = "";
    initialScreen.style.display = "block";
    gameScreen.style.display = "none";
}

function handleGameCode(gameCode){
    $("#code").text('Herní kód: ' + gameCode);
}

function handleInit(number){
    playerNumber = number;
}

function newGame(){
    socket.emit('newGame');
    init();
}

function joinGame(){
    const code = gameCodeInput.value;
    socket.emit('joinGame', code);
    init();
}

function init(){
    initialScreen.style.display = "none";
    gameScreen.style.display = "block";
}

function displayScore(scores){
    $("#table").append('<p id="game-over">Konec hry<br><br>Hráč 1: ' + scores[0] + '<br>Hráč 2: ' + scores[1] + '</p>');
}

function displayHlaska(hlasky){
    if(hlasky[0].length !== 0){
        $("#hlasky-1").empty();
        for(const hlaska of hlasky[0]){
            $("#hlasky-1").append('<div class="karta" style="background-image: url(assets/'
                + hlaska.suit + '_' + hlaska.value + '.jpg)"></div>');
        }
    }
    if(hlasky[1].length !== 0){
        $("#hlasky-2").empty();
        for(const hlaska of hlasky[1]){
            $("#hlasky-2").append('<div class="karta" style="background-image: url(assets/'
                + hlaska.suit + '_' + hlaska.value + '.jpg)"></div>');
        }
    }
}

function getLastCards(newCards){
    $("#vylozena-karta-1").css("background-image", "");
    $("#vylozena-karta-2").css("background-image", "");
    getNewCards(newCards);
    $(".right").remove();
}

function getNewCards(newCards){
    console.log(newCards);
    if(playerNumber === 0){
        $("#player-cards").append('<div class="karta" style="background-image: url(assets/'
            + newCards[0].suit + '_' + newCards[0].value + '.jpg)"></div>');
        $("#player-cards-2").append('<div class="karta" style="background-image: url(assets/rub.jpg)"></div>');
    }
    else if(playerNumber === 1){
        $("#player-cards").append('<div class="karta" style="background-image: url(assets/rub.jpg)"></div>');
        $("#player-cards-2").append('<div class="karta" style="background-image: url(assets/'
            + newCards[1].suit + '_' + newCards[1].value + '.jpg)"></div>');
    }
    /*$("#player-cards").append('<div class="karta" style="background-image: url(assets/'
        + newCards[0].suit + '_' + newCards[0].value + '.jpg)"></div>');
    $("#player-cards-2").append('<div class="karta" style="background-image: url(assets/'
        + newCards[1].suit + '_' + newCards[1].value + '.jpg)"></div>');*/

}

function setTurns(winner){
    turn = winner;
}

function takeCards(){
    $(".left").unbind().click(function (){
        if($("#vylozena-karta-1").css("background-image") !== "none"
            && $("#vylozena-karta-2").css("background-image") !== "none" && turn === playerNumber + 1){
            socket.emit("cards taken");
            console.log("cards taken emitted");
        }
    });
}

function updateCardsOnTable(newCards){
    $("#vylozena-karta-1").css("background-image", "");
    $("#vylozena-karta-2").css("background-image", "");

    //add player's deck if it does not exist yet
    if(turn === 1 && $('#deck-1').children().length === 0) {
        $('#deck-1').append('<div class="karta deck"></div>');
    }
    else if(turn === 2 && $('#deck-2').children().length === 0) {
        $('#deck-2').append('<div class="karta deck"></div>');
    }
    if(newCards !== 0){
        getNewCards(newCards);
    }
}

function updatePlayerTwo(data){
    //if(playerNumber === 1){
        //$("#vylozena-karta-1").css("background-image", $("#player-cards").children().eq(index).css("background-image"));
        $("#vylozena-karta-1").css("background-image", 'url(assets/' + data.suit + '_' + data.value + '.jpg)');
        $("#player-cards").children().eq(data.cardIndex).remove();
        turn = 2;
    //}
}

function updatePlayerOne(data){
    //if(playerNumber === 0){
        $("#vylozena-karta-2").css("background-image", 'url(assets/' + data.suit + '_' + data.value + '.jpg)');
        $("#player-cards-2").children().eq(data.cardIndex).remove();
        turn = 1;
    //}
}

function takeTurns(){
    $(document).on("click", "#player-cards .karta", function () {
        if (playerNumber === 0 && turn === 1 && $("#vylozena-karta-1").css("background-image") === "none") {
            let index = $(this).index(); //playerNumber === 0 &&
            socket.emit("card", index);
            //$(this).remove();
            //$("#vylozena-karta-1").css("background-image", $(this).css("background-image"));
            //turn = 2;
        }
    });

    $(document).on("click", "#player-cards-2 .karta", function () {
        if (playerNumber === 1 && turn === 2 && $("#vylozena-karta-2").css("background-image") === "none") {
            let index = $(this).index(); //playerNumber === 1 &&
            socket.emit("card 2", index);
            //$(this).remove();
            //$("#vylozena-karta-2").css("background-image", $(this).css("background-image"));
            //turn = 1;
        }
    });

    $(document).on("click", "#trumf", function () {
        console.log("trumf clicked by player " + playerNumber);
        socket.emit("trumf clicked", playerNumber);
    });
}

function setUpFront(state){
    let playerOne = state.playerOne;
    let playerTwo = state.playerTwo;
    let trumf = state.trumf;

    //give out cards
    for (let i = 0; i < 8; i++) {
        if(playerNumber === 0){
            $("#player-cards").append('<div class="karta" style="background-image: url(assets/'
                + playerOne.cards[i].suit + '_' + playerOne.cards[i].value + '.jpg)"></div>');
            $("#player-cards-2").append('<div class="karta" style="background-image: url(assets/rub.jpg)"></div>')
        }
        else if(playerNumber === 1){
            $("#player-cards").append('<div class="karta" style="background-image: url(assets/rub.jpg)"></div>')
            $("#player-cards-2").append('<div class="karta" style="background-image: url(assets/'
                + playerTwo.cards[i].suit + '_' + playerTwo.cards[i].value + '.jpg)"></div>');
        }

    }

    //set trumf
    $(".right").prepend('<div class="karta" id="trumf" style="background-image: url(assets/'
        + trumf.suit + '_' + trumf.value + '.jpg)"></div>');
}
