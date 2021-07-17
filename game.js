module.exports = {
    createNewState,
    makeid
}

function createNewState(){
    return {
        players: [
            {
                cards: [

                ],
                deck: [

                ],
                hlasky: {
                    20: [],
                    40: []
                },
                turn: true,
                currentCard: [],
                score: 0
            },
            {
                cards: [

                ],
                deck: [

                ],
                hlasky: {
                    20: [],
                    40: []
                },
                turn: false,
                currentCard: [],
                score: 0
            }
        ],
        deck: [],
        trumf: [],
        currentCards: [],
        roomName: ""
    };
}

function makeid(length) {
    var result = '';
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

