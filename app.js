// DOM
const gridElement = document.getElementById('grid');
const statusElement = document.getElementById('status');
const resetButton = document.getElementById('reset');
const timerElement = document.getElementById('timer');
const bombSlider = document.getElementById('bomb-slider');
const bombCountElement = document.getElementById('bomb-count');

// Variables de juego
const GRID_SIZE = 10; // Convertir esto a un slider ¿
let grid = [];
let gameOver = false;
let timer = 0;
let timerInterval;
let numMines = parseInt(bombSlider.value, 10); // slider para las bombas
let firstClick = true; // Variable para rastrear el primer clic

// Variables para el cronometro
let milliseconds = 0;
let seconds = 0;
let minutes = 0;

// Cambia el numero de bombas en pantalla (el numero) basado en el slider
bombSlider.addEventListener('input', () => {
    bombCountElement.textContent = bombSlider.value;
    numMines = parseInt(bombSlider.value, 10);
});

// Función que crea el grid
function createGrid() {
    // Resetea el grid, cronometro y estado de juego
    grid = [];
    gameOver = false;
    firstClick = true; // Reiniciar el estado de primer clic
    milliseconds = 0;
    seconds = 0;
    minutes = 0;
    statusElement.textContent = "Equipo NO";
    gridElement.innerHTML = '';
    timerElement.textContent = "Tiempo: 00:00:000";

    // Resetea el cronometro
    clearInterval(timerInterval);
    startTimer();

    // Crea el grid de 10x10
    for (let row = 0; row < GRID_SIZE; row++) {
        const rowArray = [];
        for (let col = 0; col < GRID_SIZE; col++) {
            const cell = document.createElement('button');
            cell.className = 'w-10 h-10 bg-gray-600';
            cell.dataset.row = row;
            cell.dataset.col = col;
            cell.addEventListener('click', handleCellClick);
            cell.addEventListener('contextmenu', handleRightClick);
            gridElement.appendChild(cell);
            rowArray.push({ mine: false, revealed: false, flagged: false, adjacentMines: 0 });
        }
        grid.push(rowArray);
    }
}

// Función que empieza el cronometro
function startTimer() {
    timerInterval = setInterval(() => {
        milliseconds += 10;
        if (milliseconds >= 1000) {
            milliseconds = 0;
            seconds++;
        }
        if (seconds >= 60) {
            seconds = 0;
            minutes++;
        }
        timerElement.textContent = `Tiempo: ${formatTime(minutes)}:${formatTime(seconds)}:${formatMilliseconds(milliseconds)}`;
    }, 10);
}

// Funcion para formatear bien el cronometro
function formatTime(time) {
    return time < 10 ? `0${time}` : time;
}

// Formato de milisegundos
function formatMilliseconds(ms) {
    return ms < 100 ? `0${ms}` : ms;
}

// Para el cronometro
function stopTimer() {
    clearInterval(timerInterval);
}

// Código de la función para poner las minas (con lógica de primer clic)
function placeMines(firstRow, firstCol) {
    let minesPlaced = 0;
    while (minesPlaced < numMines) {
        const row = Math.floor(Math.random() * GRID_SIZE);
        const col = Math.floor(Math.random() * GRID_SIZE);

        // Evita colocar una mina en la celda del primer clic
        if (row === firstRow && col === firstCol) {
            continue;
        }

        if (!grid[row][col].mine) {
            grid[row][col].mine = true;
            minesPlaced++;
        }
    }
}

// Función click izquierdo (revela una celda)
function handleCellClick(event) {
    if (gameOver) return;

    const row = parseInt(event.target.dataset.row, 10);
    const col = parseInt(event.target.dataset.col, 10);

    // Si es el primer clic, coloca las minas después del primer clic
    if (firstClick) {
        placeMines(row, col);  // Genera minas
        firstClick = false;    // Cambia el estado para evitar más llamadas a placeMines
    }

    revealCell(row, col);
}

// Función para revelar una celda
function revealCell(row, col) {
    const cell = grid[row][col];
    const cellElement = gridElement.children[row * GRID_SIZE + col];

    if (cell.revealed || cell.flagged) return;

    cell.revealed = true;
    cellElement.classList.add('bg-gray-300');

    if (cell.mine) {
        cellElement.textContent = '💣';
        gameOver = true;
        statusElement.textContent = "👎​";
        stopTimer();
        revealAllMines();
    } else {
        const adjacentMines = countAdjacentMines(row, col);
        if (adjacentMines > 0) {
            cellElement.textContent = adjacentMines;
        } else {
            revealAdjacentCells(row, col);
        }
        checkWinCondition();
    }
}

// Función que revela celdas adjacentes (si es que las hay)
function revealAdjacentCells(row, col) {
    for (let r = Math.max(0, row - 1); r <= Math.min(GRID_SIZE - 1, row + 1); r++) {
        for (let c = Math.max(0, col - 1); c <= Math.min(GRID_SIZE - 1, col + 1); c++) {
            revealCell(r, c);
        }
    }
}

// Función contador de minas adjacentes (el número que sale en cada celda que indica minas)
function countAdjacentMines(row, col) {
    let count = 0;
    for (let r = Math.max(0, row - 1); r <= Math.min(GRID_SIZE - 1, row + 1); r++) {
        for (let c = Math.max(0, col - 1); c <= Math.min(GRID_SIZE - 1, col + 1); c++) {
            if (grid[r][c].mine) count++;
        }
    }
    return count;
}

// Función que revela todas las minas cuando se acaba el juego
function revealAllMines() {
    for (let row = 0; row < GRID_SIZE; row++) {
        for (let col = 0; col < GRID_SIZE; col++) {
            if (grid[row][col].mine) {
                const cellElement = gridElement.children[row * GRID_SIZE + col];
                cellElement.textContent = '💣';
                cellElement.classList.add('bg-red-500');
            }
        }
    }
}

// Función click derecho (poner una bandera)
function handleRightClick(event) {
    event.preventDefault();
    if (gameOver) return;

    const row = parseInt(event.target.dataset.row, 10);
    const col = parseInt(event.target.dataset.col, 10);
    const cell = grid[row][col];

    if (!cell.revealed) {
        cell.flagged = !cell.flagged;
        event.target.textContent = cell.flagged ? '🚩' : '';
    }

    checkWinCondition();
}

// Función que checkea que las banderas hayan sido bien colocadas
function checkWinCondition() {
    let allMinesFlagged = true;
    let noExtraFlags = true;

    for (let row = 0; row < GRID_SIZE; row++) {
        for (let col = 0; col < GRID_SIZE; col++) {
            const cell = grid[row][col];

            if (cell.mine && !cell.flagged) {
                allMinesFlagged = false;
            }

            if (!cell.mine && cell.flagged) {
                noExtraFlags = false;
            }
        }
    }

    if (allMinesFlagged && noExtraFlags) {
        gameOver = true;
        statusElement.textContent = "👍​";
        stopTimer();
    }
}

// Resetear el juego
resetButton.addEventListener('click', createGrid);

// Empieza el juego cuando regargas la pagina
createGrid();
