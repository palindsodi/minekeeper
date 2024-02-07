/*
p5.multiplayer - HOST

This 'host' sketch is intended to be run in desktop browsers. 
It connects to a node server via socket.io, from which it receives
rerouted input data from all connected 'clients'.

Navigate to the project's 'public' directory.
Run http-server -c-1 to start server. This will default to port 8080.
Run http-server -c-1 -p80 to start server on open port 80.

*/

////////////
// Global variables here. ---->
// <----

const serverIp = 'minekeeper.palindromicsodium.repl.co';
const serverPort = '8080';
const local = false;   // true if running locally, false
// if running on remote server

// <----



let playerGoing = 1;
let mode = 0;
let nowMoving = 0;
let nowMovingOrigin = 0;
let turn = [0, 0, 0];
let w = 40;
let width = 600;
let height = 600;
let cols = 15;
let rows = 11;
let grid;
let totalMines = 10;
let gameover = false;


function make2DArray(cols, rows) {
  let arr = new Array(cols);
  for (let i = 0; i < arr.length; i++) {
    arr[i] = new Array(rows);
    for (let j = 0; j < arr[i].length; j++) {
      arr[i][j] = { mine: false, revealed: false, flagged: false, neighborCount: 0, flaggedByPlayer: 0 };
    }
  }
  return arr;
}


function placeMines() {
  let options = [];
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      options.push([i, j]);
    }
  }
  for (let n = 0; n < totalMines; n++) {
    let index = Math.floor(random(options.length));
    let choice = options[index];
    let i = choice[0];
    let j = choice[1];
    options.splice(index, 1);
    grid[i][j].mine = true;
  }
}

function countNeighbors() {
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      grid[i][j].neighborCount = countAdjMines(i, j);
    }
  }
}

function countAdjMines(x, y) {
  let count = 0;
  for (let i = -1; i <= 1; i++) {
    for (let j = -1; j <= 1; j++) {
      let col = x + i;
      let row = y + j;
      if (col >= 0 && col < cols && row >= 0 && row < rows) {
        if (grid[col][row].mine) {
          count++;
        }
      }
    }
  }
  return count;
}


function recurse(x, y) {
  if (x >= 0 && x < cols && y >= 0 && y < rows && !grid[x][y].revealed && !grid[x][y].mine) {
    grid[x][y].revealed = true;
    grid[x][y].flagged = false;

    grid[x][y].flaggedByPlayer = 0;
    if (grid[x][y].neighborCount === 0) {
      for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
          recurse(x + i, y + j);
        }
      }
    }

  }
  refreshGrid(grid);

}

function setStuff() {
  turn = [0, 0, 0];
  refreshTurn(turn);
  mode = 0;
  refreshMode(mode);
  playerGoing = 1;
  refreshPlayerGoing(playerGoing);
  gameover = false;
  refreshGameover(gameover);
  cols = 15;
  rows = 11;
  grid = make2DArray(cols, rows);
  placeMines();
  countNeighbors();

  refreshGrid(grid);
  console.log(grid);


  // reveal area around a random square at the start of the game
  let startX = 0;
  let startY = 0;
  while (grid[startX][startY].mine) { // ensure starting square does not contain a mine
    startX = Math.floor(random(cols));
    startY = Math.floor(random(rows));
  }
  revealAreaAround(startX, startY);
}


function revealAreaAround(x, y) {
  let maxDepth = 2;
  console.log('ra');
  for (let i = -maxDepth; i <= maxDepth; i++) {
    for (let j = -maxDepth; j <= maxDepth; j++) {
      recurse(x + i, y + j);
    }
  }
}


function checkWinCondition() {
  //console.log(rows);
  let allMinesFlagged = true;
  let allSafeSquaresRevealed = true;
  let totalFlagged = 0;

  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      if (grid[i][j].mine && !grid[i][j].flagged) allMinesFlagged = false;
      if (!grid[i][j].mine && !grid[i][j].revealed) allSafeSquaresRevealed = false;
      if (grid[i][j].flagged) totalFlagged++;
    }
  }

  return allMinesFlagged && allSafeSquaresRevealed && totalFlagged == totalMines;
}

function playerWithMoreMines() {
  let player1Mines = 0;
  let player2Mines = 0;

  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      if (grid[i][j].mine && grid[i][j].flaggedByPlayer == 1) player1Mines++;
      else if (grid[i][j].mine && grid[i][j].flaggedByPlayer == 2) player2Mines++;
    }
  }

  if (player1Mines > player2Mines) return 1;
  else return 2;
}

function gameOver() {
  gameover = true;
  refreshGameover(gameover);
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      grid[i][j].revealed = true;
    }
  }
}


function preload() {
  setupHost();
}

function setup() {
  createCanvas(600, 600);
  grid = make2DArray(cols, rows);
  placeMines();
  countNeighbors();




  // Host/Game setup here. ---->

  // <----
}

///// ALL THE REFRESHERS

function refreshPlayerGoing(newPlayerGoing) {
  const playerGoingData = {
    roomId: roomId,
    playerGoing: newPlayerGoing,
    type: 'playerGoing'
  };
  socket.emit('sendData', playerGoingData);
}

function refreshMode(newMode) {
  const modeData = {
    roomId: roomId,
    mode: newMode,
    type: 'mode'
  };
  socket.emit('sendData', modeData);
}

function refreshNowMoving(newNowMoving) {
  const nowMovingData = {
    roomId: roomId,
    nowMoving: newNowMoving,
    type: 'nowMoving'
  };
  socket.emit('sendData', nowMovingData);
}

function refreshNowMovingOrigin(newNowMovingOrigin) {
  const nowMovingOriginData = {
    roomId: roomId,
    nowMovingOrigin: newNowMovingOrigin,
    type: 'nowMovingOrigin'
  };
  socket.emit('sendData', nowMovingOriginData);
}

function refreshTurn(newTurn) {
  const turnData = {
    roomId: roomId,
    turn: newTurn,
    type: 'turn'
  };
  socket.emit('sendData', turnData);
}

function refreshW(newW) {
  const wData = {
    roomId: roomId,
    w: newW,
    type: 'w'
  };
  socket.emit('sendData', wData);
}

function refreshWidth(newWidth) {
  const widthData = {
    roomId: roomId,
    width: newWidth,
    type: 'width'
  };
  socket.emit('sendData', widthData);
}

function refreshHeight(newHeight) {
  const heightData = {
    roomId: roomId,
    height: newHeight,
    type: 'height'
  };
  socket.emit('sendData', heightData);
}

function refreshCols(newCols) {
  const colsData = {
    roomId: roomId,
    cols: newCols,
    type: 'cols'
  };
  socket.emit('sendData', colsData);
}

function refreshRows(newRows) {
  const rowsData = {
    roomId: roomId,
    rows: newRows,
    type: 'rows'
  };
  socket.emit('sendData', rowsData);
}

function refreshGrid(newGrid) {
  const gridData = {
    roomId: roomId,
    grid: newGrid,
    type: 'grid'
  };
  socket.emit('sendData', gridData);
}

function refreshTotalMines(newTotalMines) {
  const totalMinesData = {
    roomId: roomId,
    totalMines: newTotalMines,
    type: 'totalMines'
  };
  socket.emit('sendData', totalMinesData);
}

function refreshGameover(newGameover) {
  const gameoverData = {
    roomId: roomId,
    gameover: newGameover,
    type: 'gameover'
  };
  socket.emit('sendData', gameoverData);
}


//// END REFRESHERS



function draw() {
  background(0);

  if (isHostConnected(display = true)) {
    // Host/Game draw here. --->


    // <----

    // Display server address

    displayAddress();
  }
}

function onClientConnect(data) {
  // Client connect logic here. --->
  console.log(data.id + ' has connected.');
  refreshGrid(grid);
  console.log(grid);


  // <----
}

function onClientDisconnect(data) {
  // Client disconnect logic here. --->
  console.log(data.id + ' has disconnected.');

  // <----
}


function onReceiveData(data) {
  // Input data processing here. --->
  if (data.type == 'click') {
    console.log('Transmitting click:', data);
    socket.emit('sendData', data);
  }

  if (data.type == 'playerGoing') {
    playerGoing = data.playerGoing;
  }
  if (data.type == 'mode') {
    mode = data.mode;
  }
  if (data.type == 'nowMoving') {
    nowMoving = data.nowMoving;
  }
  if (data.type == 'nowMovingOrigin') {
    nowMovingOrigin = data.nowMovingOrigin;
  }
  if (data.type == 'turn') {
    turn = data.turn;
  }
  if (data.type == 'w') {
    w = data.w;
  }
  if (data.type == 'width') {
    width = data.width;
  }
  if (data.type == 'height') {
    height = data.height;
  }
  if (data.type == 'cols') {
    cols = data.cols;
  }
  if (data.type == 'rows') {
    rows = data.rows;
  }
  if (data.type == 'grid') {
    if (data.grid != 0 && data.grid != [0][0]) {
      console.log(grid);
      console.log(data.grid);
      grid = data.grid;
    }

  }
  if (data.type == 'totalMines') {
    totalMines = data.totalMines;
  }
  if (data.type == 'gameover') {
    gameover = data.gameover;
  }


  else if (data.type === 'make2DArray') {
    make2DArray(data.cols, data.rows);
  } else if (data.type === 'placeMines') {
    placeMines();
  } else if (data.type === 'countNeighbors') {
    countNeighbors();
  } else if (data.type === 'countAdjMines') {
    countAdjMines(data.x, data.y);
  } else if (data.type === 'setStuff') {
    setStuff();
  } else if (data.type === 'revealAreaAround') {
    revealAreaAround(data.x, data.y);
  } else if (data.type === 'checkWinCondition') {
    checkWinCondition();
  } else if (data.type === 'recurse') {
    recurse(data.x, data.y);
  } else if (data.type === 'playerWithMoreMines') {
    playerWithMoreMines();
  } else if (data.type === 'gameOver') {
    gameOver();
  }

}
