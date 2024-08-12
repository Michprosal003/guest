const roomIdInput = document.getElementById('roomId');
const characterSelect = document.getElementById('character');
const startGameButton = document.getElementById('startGame');
const gameBoard = document.getElementById('gameBoard');
const messageDiv = document.getElementById('message');

let socket;
let currentPlayer;

startGameButton.addEventListener('click', () => {
    const roomId = roomIdInput.value;
    const character = characterSelect.value;

    if (roomId && character) {
        connectToServer(roomId, character);
    } else {
        alert('Por favor, ingrese Room ID y seleccione un personaje.');
    }
});

function connectToServer(roomId, character) {
    socket = new WebSocket(`ws://localhost:8081/${roomId}`);

    socket.onopen = () => {
        socket.send(JSON.stringify({ type: 'join', character: character }));
        currentPlayer = character;
        setupBoard();
    };

    socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'move') {
            handleMove(data.index, data.character);
        } else if (data.type === 'message') {
            messageDiv.textContent = data.text;
        }
    };

    socket.onerror = (error) => {
        console.error('WebSocket Error:', error);
    };

    gameBoard.addEventListener('click', (event) => {
        if (event.target.classList.contains('cell')) {
            const index = event.target.dataset.index;
            if (event.target.textContent === '') { // Ensure cell is empty
                socket.send(JSON.stringify({ type: 'move', index: index, character: currentPlayer }));
            }
        }
    });
}

function setupBoard() {
    gameBoard.innerHTML = '';
    for (let i = 0; i < 9; i++) {
        const cell = document.createElement('div');
        cell.classList.add('cell');
        cell.dataset.index = i;
        gameBoard.appendChild(cell);
    }
}

function handleMove(index, character) {
    const cell = gameBoard.querySelector(`.cell[data-index="${index}"]`);
    cell.textContent = character;
    cell.style.pointerEvents = 'none'; // Disable cell after move
}
