var Deck = require('./deck');
const {CARD_VALUE_MAP} = require('./values');
const {createNewState, makeid} = require('./game');

const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

app.use(express.static(__dirname + '/public'));

var states = {};
var state;
var clientRooms = {};

io.on('connection', (client) => {
    console.log('a user connected');

    client.on('newGame', handleNewGame);
    client.on('joinGame', handleJoinGame);

function handleJoinGame(roomName){
    const room = io.sockets.adapter.rooms.get(roomName);

    let numClients = 0;
    if (room) {
        numClients = room.size;
    }

    if (numClients === 0) {
        client.emit('unknownCode');
        return;
    }
    else if (numClients > 1) {
        client.emit('tooManyPlayers');
        return;
    }

    clientRooms[client.id] = roomName;
    client.join(roomName);
    client.number = 1;
    client.emit('init', 1);

    setUp();
    play();
}

function handleNewGame(){
    let roomName = makeid(5);
    clientRooms[client.id] = roomName;
    client.emit('gameCode', roomName);

    states[roomName] = createNewState();

    client.join(roomName);
    client.number = 0;
    client.emit("init", 0);

    play();
}

function play(){
    client.emit("turn");
    client.on("card", getCardOne);
    client.on("card 2", getCardTwo);
    client.on("cards taken", cardsTaken);
    client.on("trumf clicked", trumfExchange);
}

function trumfExchange(playerNum){
    const roomName = clientRooms[client.id];
    let player = states[roomName].players[playerNum];
    let trumf = states[roomName].trumf;
    for (let i = 0; i < player.cards.length; i++) {
        if(player.cards[i].suit === trumf.suit && player.cards[i].value === "sedma"){
            player.cards[i].value = trumf.value;
            trumf.value = "sedma";
            //console.log(states[roomName].trumf);
            //console.log(states[roomName].players[playerNum].cards);
            io.sockets.in(roomName).emit("change trumf",
                {playerNumber: playerNum, index: i, suit: trumf.suit, value: player.cards[i].value});
            break;
        }
    }
}

function cardsTaken(){
    const roomName = clientRooms[client.id];

    //taking from deck on frontend
    if(states[roomName].players[0].cards.length === 8){
        let playerOneCards = states[roomName].players[0].cards;
        let cardOne = playerOneCards[playerOneCards.length - 1];
        let playerTwoCards = states[roomName].players[1].cards
        let cardTwo = playerTwoCards[playerTwoCards.length - 1];

        if(states[roomName].deck.cards.length !== 0){
            io.sockets.in(roomName).emit("update cards on table", [cardOne, cardTwo]);//, [cardOne, cardTwo]
        }
        else if(states[roomName].deck.cards.length === 0){
            io.sockets.in(roomName).emit("last from deck", [cardOne, cardTwo]);
        }
    }
    else{
        io.sockets.in(roomName).emit("update cards on table", 0);
    }

    //update hlasky on frontend
    let hlasky1 = states[roomName].players[0].hlasky[20].concat(states[roomName].players[0].hlasky[40]);
    let hlasky2 = states[roomName].players[1].hlasky[20].concat(states[roomName].players[1].hlasky[40]);
    io.sockets.in(roomName).emit("hlaska", [hlasky1, hlasky2]);

    //display score on frontend
    if(states[roomName].players[0].cards.length === 0 && states[roomName].players[0].cards.length === 0) {
        io.sockets.in(roomName).emit("score", [states[roomName].players[0].score, states[roomName].players[1].score]);
    }

}

function setUp(){
    const roomName = clientRooms[client.id];
    var state = states[roomName];
    //shuffle cards
    state.deck = new Deck();
    state.deck.shuffle();

    //give out cards
    for (let i = 0; i < 8; i++) {
        let topCard = state.deck.cards.pop();
        state.players[0].cards.push(topCard);
        topCard = state.deck.cards.pop();
        state.players[1].cards.push(topCard);
    }

    //set trumf
    state.trumf = state.deck.cards.pop();
    var settings = {"trumf": state.trumf, "playerOne": state.players[0], "playerTwo": state.players[1]};
    io.sockets.in(roomName).emit("set up", settings);
}

function getCardOne(index){
    //console.log("get card one called");
    const roomName = clientRooms[client.id];
    var state = states[roomName];

    //console.log(states[roomName].players[0].turn);
    if(cardApproved(0, index)){
        states[roomName].players[0].turn = false;
        states[roomName].players[1].turn = true;

        state.players[0].currentCard = state.players[0].cards[index];
        state.currentCards.push(state.players[0].currentCard);
        state.players[0].cards.splice(index, 1);

        io.sockets.in(roomName).emit("player one played",
            {cardIndex: index, suit: state.players[0].currentCard.suit, value: state.players[0].currentCard.value});
    }
    //console.log("emitted playerOneTurn called");
    //io.sockets.in(roomName).emit("update game", states[roomName]); //send only relevant data !!!

    if(states[roomName].currentCards.length === 2){
        roundWinner();
    }

    //hlaska(0);
}

function getCardTwo(index){
    //console.log("get card two called");
    const roomName = clientRooms[client.id];
    var state = states[roomName];

    if(cardApproved(1, index)) {
        state.players[1].turn = false;
        state.players[0].turn = true;

        state.players[1].currentCard = state.players[1].cards[index];
        state.currentCards.push(state.players[1].currentCard);
        state.players[1].cards.splice(index, 1);

        io.sockets.in(roomName).emit("player two played",
            {cardIndex: index, suit: state.players[1].currentCard.suit, value: state.players[1].currentCard.value});
    }
    //io.sockets.in(roomName).emit("update game", states[roomName]); //send only relevant data !!!

    if(states[roomName].currentCards.length === 2){
        roundWinner();
    }
}

function cardApproved(playerNum, cardIndex){
    const roomName = clientRooms[client.id];
    let state = states[roomName];
    let card = state.players[playerNum].cards[cardIndex];
    if(state.currentCards.length === 0){
        return true;
    }
    else if(card.suit === state.currentCards[0].suit){  //same colour
        if(CARD_VALUE_MAP.get(card.value) > CARD_VALUE_MAP.get(state.currentCards[0].value)){ //card is higher
            return true;
        }
        else{ //check if player does not have a card higher than the opponent's card
            for(const item of state.players[playerNum].cards){
                if(item.suit === state.currentCards[0].suit
                    && CARD_VALUE_MAP.get(item.value) > CARD_VALUE_MAP.get(state.currentCards[0].value)){ //card is higher
                    return false; //player has a higher card, do not approve
                }
            }
            return true; //player does not have a higher card, approve
        }
    }
    else if(card.suit !== state.currentCards[0].suit){ //different colour
        for(const item of state.players[playerNum].cards){
            if(item.suit === state.currentCards[0].suit){ //player has the same colour as the opponent's card
                return false;
            }
        }
        if(state.deck.cards.length === 0 && card.suit !== state.trumf.suit){ //deck is empty, player did not use trumf
            for(const item of state.players[playerNum].cards){
                if(item.suit === state.trumf.suit){ //player has trumf
                    return false;
                }
            }
        }
        return true;
    }
}

function roundWinner(){
    const roomName = clientRooms[client.id];
    var state = states[roomName];
    //find winner
    let cards = state.currentCards;
    let higherCard;
    if(cards.length == 2){
        if(cards[0].suit == cards[1].suit){ //same colour
            if(CARD_VALUE_MAP.get(cards[0].value) > CARD_VALUE_MAP.get(cards[1].value)){
                higherCard = cards[0];
            }
            else{
                higherCard = cards[1];
            }
        }
        else if(state.deck.cards.length > 0){ //different colour, with deck
            higherCard = cards[0];
        }
        else if(cards[1].suit == state.trumf.suit){ //second card is trumf colour
            higherCard = cards[1];
        }
        else { //first card is trumf OR deck is gone, none of the cards is trumf
            higherCard = cards[0];
        }

        if(higherCard.suit === state.players[0].currentCard.suit && higherCard.value === state.players[0].currentCard.value){
            state.players[0].turn = true;
            state.players[1].turn = false;
            state.players[0].deck = state.players[0].deck.concat(cards);
            io.sockets.in(roomName).emit("round winner",1);
        }
        if(higherCard.suit === state.players[1].currentCard.suit && higherCard.value === state.players[1].currentCard.value){
            state.players[0].turn = false;
            state.players[1].turn = true;
            state.players[1].deck = state.players[1].deck.concat(cards);
            io.sockets.in(roomName).emit("round winner",2);
        }
        io.sockets.in(roomName).emit("take cards");
        hlaska(0);
        hlaska(1);
        state.currentCards = [];
        getFromDeck();
        //game over
        if(state.players[0].cards.length === 0 && state.players[0].cards.length === 0){
            calculateScore(0);
            calculateScore(1);
            //io.sockets.in(roomName).emit("score", [state.players[0].score, state.players[1].score]);
        }
    }
}

function calculateScore(index){
    const roomName = clientRooms[client.id];
    var state = states[roomName];
    for(const card of state.players[index].deck){
        if(card.value === "eso" || card.value === "desitka"){
            state.players[index].score += 10;
        }
    }
    for(const hlaska of state.players[index].hlasky[20]){
        state.players[index].score += 20;
    }
    for(const hlaska of state.players[index].hlasky[40]){
        state.players[index].score += 40;
    }
    if(state.players[index].turn){
        state.players[index].score += 10;
    }
}

function getFromDeck(){
    const roomName = clientRooms[client.id];
    var state = states[roomName];
    let cardOne, cardTwo;
    if(state.deck.cards.length > 1){
        if(state.players[0].turn == true){
            cardOne = state.deck.cards.pop();
            state.players[0].cards.push(cardOne);
            cardTwo = state.deck.cards.pop();
            state.players[1].cards.push(cardTwo);
        }
        if(state.players[1].turn == true){
            cardTwo = state.deck.cards.pop();
            state.players[1].cards.push(cardTwo);
            cardOne = state.deck.cards.pop();
            state.players[0].cards.push(cardOne);
        }
        //io.sockets.in(roomName).emit("take from deck", [cardOne, cardTwo]);
    }
    else if(state.deck.cards.length == 1){
        if(state.players[0].turn){
            cardOne = state.deck.cards.pop();
            state.players[0].cards.push(cardOne);
            cardTwo = state.trumf;
            state.players[1].cards.push(cardTwo);
        }
        if(state.players[1].turn){
            cardTwo = state.deck.cards.pop();
            state.players[1].cards.push(cardTwo);
            cardOne = state.trumf;
            state.players[0].cards.push(cardOne);
        }
        //io.sockets.in(roomName).emit("last from deck", [cardOne, cardTwo]);
    }
}

function hlaska(index){
    const roomName = clientRooms[client.id];
    var state = states[roomName];
    if(state.players[index].currentCard.value === "svrsek"){
        for(const card of state.players[index].cards){
            if(card.value === "kral" && card.suit === state.players[index].currentCard.suit){ //king of same colour in hand
                if(state.deck.cards.length === 0 && state.players[index].currentCard.suit === state.trumf.suit){ //trumf
                    state.players[index].hlasky[40].push(state.players[index].currentCard);
                    //io.sockets.in(roomName).emit("hlaska", {player: index, card: state.players[index].currentCard});
                }
                else if(card.value === "kral" && card.suit === state.players[index].currentCard.suit){
                    state.players[index].hlasky[20].push(state.players[index].currentCard);
                    //io.sockets.in(roomName).emit("hlaska", {player: index, card: state.players[index].currentCard});
                }
            }
        }
    }
}
});


server.listen(process.env.PORT||3000, () => {
console.log('listening on *:3000');
});