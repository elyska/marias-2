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

//var states = {};
var state;
//var clientRooms = {};

io.on('connection', (client) => {
    console.log('a user connected');
/*
    client.on('newGame', handleNewGame);
    client.on('joinGame', handleJoinGame);
*/
    setUp();
    play();
/*
    function handleJoinGame(roomName){
        console.log(roomName);
        const room = io.sockets.adapter.rooms.get(roomName);
        console.log(io.sockets.adapter.rooms);
        //console.log(room.size);
        /*
        let allUsers;
        if (room) {
            allUsers = room.sockets;
            console.log(allUsers);
        }*/
    /*    let numClients = 0;
        if (room) {
            numClients = room.size;

        }
        console.log(numClients);
        /*
                let numClients = 0;
                if (allUsers) {
                    numClients = Object.keys(allUsers).length;
                    console.log(numClients);
                }
        */
    /*    if (numClients === 0) {
            client.emit('unknownCode');
            return;
        } else if (numClients > 1) {
            client.emit('tooManyPlayers');
            return;
        }


        clientRooms[client.id] = roomName;

        client.join(roomName);
        client.number = 2;
        setUp();

        play();
    }

    function handleNewGame(){
        let roomName = makeid(5);
        clientRooms[client.id] = roomName;
        client.emit('gameCode', roomName);

        //state.set("roomName", createNewState());
        states[roomName] = createNewState();
        state = states[roomName];
        console.log(state);
        client.join(roomName);
        client.number = 1;
        setUp();
    }*/

    function play(){
        client.emit("turn");
        client.on("card", getCardOne);
        client.on("card 2", getCardTwo);
        client.on("cards taken", handleCardsTaken);
    }

    function setUp(){
        state = createNewState();
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
        console.log(settings);
        client.emit("set up", settings);
    }

    function getCardOne(index){
        state.players[0].turn = false;
        state.players[1].turn = true;

        state.players[0].currentCard = state.players[0].cards[index];
        state.currentCards.push(state.players[0].currentCard);
        state.players[0].cards.splice(index, 1);

        //hlaska(0);
        console.log(state.players[0].hlasky);
    }

    function getCardTwo(index){
        state.players[1].turn = false;
        state.players[0].turn = true;

        state.players[1].currentCard = state.players[1].cards[index];
        state.currentCards.push(state.players[1].currentCard);
        state.players[1].cards.splice(index, 1);

        //hlaska(1);
        console.log(state.players[1].hlasky);
    }

    function handleCardsTaken(){
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
                console.log("player one");
                console.log(state.players[0].deck);
                client.emit("round winner",1);
            }
            if(higherCard.suit === state.players[1].currentCard.suit && higherCard.value === state.players[1].currentCard.value){
                state.players[0].turn = false;
                state.players[1].turn = true;
                state.players[1].deck = state.players[1].deck.concat(cards);
                console.log("player 2");
                console.log(state.players[1].deck);
                client.emit("round winner",2);
            }
            hlaska(0);
            hlaska(1);
            state.currentCards = [];

            getFromDeck();

            //game over
            if(state.players[0].cards.length === 0 && state.players[0].cards.length === 0){
                calculateScore(0);
                calculateScore(1);
                client.emit("score", [state.players[0].score, state.players[1].score]);
            }
        }
    }

    function calculateScore(index){
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
            console.log("stych " + index);
            state.players[index].score += 10;
        }
        console.log(index);
        console.log(state.players[index].score);
    }

    function getFromDeck(){
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
            client.emit("take from deck", [cardOne, cardTwo]);
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
            client.emit("last from deck", [cardOne, cardTwo]);
        }
    }

    function hlaska(index){
        if(state.players[index].currentCard.value === "svrsek"){
            for(const card of state.players[index].cards){
                if(card.value === "kral" && card.suit === state.players[index].currentCard.suit){ //king of same colour in hand
                    if(state.deck.cards.length === 0 && state.players[index].currentCard.suit === state.trumf.suit){ //trumf
                        state.players[index].hlasky[40].push(state.players[index].currentCard);
                        client.emit("hlaska", {player: index, card: state.players[index].currentCard});
                    }
                    else if(card.value === "kral" && card.suit === state.players[index].currentCard.suit){
                        state.players[index].hlasky[20].push(state.players[index].currentCard);
                        client.emit("hlaska", {player: index, card: state.players[index].currentCard});
                    }
                }
            }
        }
    }
});


server.listen(process.env.PORT||3000, () => {
    console.log('listening on *:3000');
});