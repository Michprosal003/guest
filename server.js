const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8081 });

let rooms = {};

wss.on('connection', (ws, req) => {
    // Obtener el ID de la sala de la URL
    const roomId = req.url.substring(1);

    // Crear una nueva sala si no existe
    if (!rooms[roomId]) {
        rooms[roomId] = { players: [], board: Array(9).fill(null) };
    }

    const room = rooms[roomId];
    const player = { ws, character: null };

    // Añadir el jugador a la sala
    room.players.push(player);

    // Asignar personajes cuando hay dos jugadores
    if (room.players.length === 2) {
        const [player1, player2] = room.players;
        
        // Asignar personajes
        player1.character = 'X';
        player2.character = 'O';

        // Enviar mensajes a ambos jugadores con la información de los personajes
        player1.ws.send(JSON.stringify({ type: 'message', text: `Tu personaje es X. El otro jugador es O.` }));
        player2.ws.send(JSON.stringify({ type: 'message', text: `Tu personaje es O. El otro jugador es X.` }));
    }

    ws.on('message', (message) => {
        const data = JSON.parse(message);

        if (data.type === 'join') {
            // Asignar personaje cuando un jugador se une
            player.character = data.character;
            if (room.players.length === 2) {
                room.players.forEach(p => {
                    if (p.ws !== ws) {
                        p.ws.send(JSON.stringify({ type: 'message', text: `El otro jugador es ${player.character}` }));
                    }
                });
            }
        } else if (data.type === 'move') {
            // Registrar el movimiento en el tablero
            room.board[data.index] = data.character;

            // Enviar el movimiento a ambos jugadores
            room.players.forEach(p => p.ws.send(JSON.stringify({ type: 'move', index: data.index, character: data.character })));

            // Verificar si hay un ganador o un empate
            const winner = checkWinner(room.board);
            if (winner) {
                if (winner === 'Draw') {
                    room.players.forEach(p => p.ws.send(JSON.stringify({ type: 'message', text: 'El juego ha terminado en empate.' })));
                } else {
                    room.players.forEach(p => {
                        if (p.character === winner) {
                            p.ws.send(JSON.stringify({ type: 'message', text: `¡${winner} ha ganado!` }));
                        } else {
                            p.ws.send(JSON.stringify({ type: 'message', text: `${winner} ha ganado, ¡tú has perdido!` }));
                        }
                    });
                }
                // Reiniciar el tablero para un nuevo juego
                room.board = Array(9).fill(null);
            }
        }
    });

    // Limpiar jugadores desconectados
    ws.on('close', () => {
        room.players = room.players.filter(p => p.ws !== ws);
        if (room.players.length === 0) {
            delete rooms[roomId];
        }
    });
});

function checkWinner(board) {
    const winningCombos = [
        [0, 1, 2],
        [3, 4, 5],
        [6, 7, 8],
        [0, 3, 6],
        [1, 4, 7],
        [2, 5, 8],
        [0, 4, 8],
        [2, 4, 6],
    ];

    for (const [a, b, c] of winningCombos) {
        if (board[a] && board[a] === board[b] && board[a] === board[c]) {
            return board[a];
        }
    }

    return board.includes(null) ? null : 'Draw';
}

console.log('WebSocket server is running on ws://localhost:8081');
