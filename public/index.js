/*
p5.multiplayer - CLIENT

This 'client' sketch is intended to be run in either mobile or 
desktop browsers. It sends a basic joystick and button input data 
to a node server via socket.io. This data is then rerouted to a 
'host' sketch, which displays all connected 'clients'.

Navigate to the project's 'public' directory.
Run http-server -c-1 to start server. This will default to port 8080.
Run http-server -c-1 -p80 to start server on open port 80.

*/

////////////
// Network Settings
// const serverIp      = 'https://yourservername.herokuapp.com';
// const serverIp      = 'https://yourprojectname.glitch.me';



const serverIp = 'minekeeper.palindromicsodium.repl.co';
const serverPort = '8080';
const local = false;   // true if running locally, false
// if running on remote server

// Global variables here. ---->
let enterButton, instructions, instShowing, title, restartButton, screen, song, music, musicToggle, revealButton, flagButton, moveButton;

instShowing = 0;
screen = 0;
musicToggle = 0;

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


function preload() {

  setupClient();
  console.log('preload');
  song = loadSound("tempest.mp3");
  song.setVolume(0.3);
}


function setup() {
  console.log('setup');
  // Host/Game setup here. ---->
  createCanvas(600, 600);
  textAlign(CENTER);
  textSize(20);
  noStroke();

  textSize(10);
  music = new Sprite(300, height / 2 + 220, 100, 30);
  music.color = color(255, 255, 255, 100);
  music.collider = 'k';
  music.text = 'music: ▷';
  music.textColor = color(255);

  textSize(30);
  noStroke();

  enterButton = new Sprite(width / 2, height / 2, 100, 50);
  enterButton.color = color(20, 30, 70);
  enterButton.collider = 'k';
  enterButton.text = 'start';
  enterButton.textColor = color(255);

  textSize(10);
  instructions = new Sprite(300, 400, 100, 50);
  instructions.color = color(255, 255, 255, 100);
  instructions.collider = 'k';
  instructions.text = 'how to play';
  instructions.textColor = color(255);

  textSize(10);
  restartButton = new Sprite(-100, -100, 100, 50);
  restartButton.color = color(20, 30, 70);
  restartButton.collider = 'k';
  restartButton.text = 'restart';
  restartButton.textColor = color(255);

  textSize(10);
  revealButton = new Sprite(-100, -100, 100, 50);
  revealButton.color = color(20, 30, 70);
  revealButton.collider = 'k';
  revealButton.text = 'reveal mode';
  revealButton.textColor = color(255);

  flagButton = new Sprite(-100, -100, 100, 50);
  flagButton.color = color(20, 30, 70);
  flagButton.collider = 'k';
  flagButton.text = 'flag mode';
  flagButton.textColor = color(255);

  moveButton = new Sprite(-100, -100, 100, 50);
  moveButton.color = color(20, 30, 70);
  moveButton.collider = 'k';
  moveButton.text = 'move mine mode';
  moveButton.textColor = color(255);

  textSize(50);
  title = new Sprite(width / 2, height / 2 - 100, 400, 70);
  title.color = color(255, 255, 255);
  title.collider = 'k';
  title.text = 'minekeeper';
  title.textColor = color(0, 0, 0);

  textSize(10);
  textFont('Courier');
  fill(255);

  // <----
}


function showScreen0() {
  // bg
  background(color(20, 30, 70));
  textSize(40);

  // show stuff
  enterButton.pos = { x: width / 2, y: height / 2 };
  title.pos = { x: width / 2, y: height / 2 - 100 };

  textSize(10);
  fill(255);
  text("Your lobby ID: " + roomId, 300, 40)
    ;
  text("Send the URL in your search bar to anyone to invite them to the lobby.", 300, 60)
    ;
  text("music composed by AW", 300, 560);



  if (instShowing == 1) {
    enterButton.pos = { x: width / 2, y: -1000 };
    title.pos = { x: width / 2, y: -1000 };
    textSize(10);
    background(0, 0, 0);
    fill(255);
    text("You can reveal one square, place one flag, and move one mine per turn.\nTo do any of these things, click the appropriate mode button at the bottom of the screen.\nRevealing squares and placing flags works the same as traditional minesweeper.\nIf you reveal a square with a mine under it, you lose.\nTo move a mine, click any square you think has a mine under it, \nthen click another square to transfer the mine.\nIf the destination square already has a mine, you lose.\n\nWin if your opponent steps on a mine \nor if, when both of you have revealed all of the safe squares and flagged all of the mines, \nyou have more accurate flags placed.\n", width / 2, height / 2 - 100);
    textSize(10);
    fill(255, 255, 255);
  }
}


function showScreen1() {
  background(color(60, 100, 180));
  drawGrid();

  fill(0);
  textSize(10);
  text("turn actions completed: \n" + "reveal: " + turn[0] + "/1\n" + "flag: " + turn[1] + "/1\n" + "move mine: " + turn[2] + "/1\n", 100, 490);
  text("player going now: " + playerGoing, 100, 530);

  // if game over
  if (gameover) {
    textSize(40);
    fill(0);
    background(244, 244, 244);
    if (nowMoving == 0) {
      text("Player " + (3 - playerGoing) + " wins.", width / 2, height / 2 - 50);
    }
    else {
      text("Player " + playerGoing + " wins.", width / 2, height / 2 - 50);
    }
    textSize(20);
    text("Click restart to play again.", width / 2, height / 2);
    restartButton.pos = { x: width / 2, y: height / 2 + 50 };
  }

  // manage turns
  if (turn[0] == 1 && turn[1] == 1 && turn[2] == 1) {
    if (playerGoing == 1) {
      playerGoing = 2;
      refreshPlayerGoing(playerGoing);
    } else {
      playerGoing = 1;
      refreshPlayerGoing(playerGoing);
    }
    turn[0] = 0;
    turn[1] = 0;
    turn[2] = 0;
    drawGrid();
  }
}


function drawGrid() {

  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      let x = i * w;
      let y = j * w;
      stroke(0);
      noFill();
      rect(x, y, w, w);

      // reveal stuff
      if (grid[i][j].revealed) {
        if (grid[i][j].mine) {
          fill(180);
          ellipse(x + w / 2, y + w / 2, w * 0.5);
        } else {
          fill(230);
          rect(x, y, w, w);
          if (grid[i][j].neighborCount > 0) {
            textAlign(CENTER, CENTER);
            fill(0);
            textSize(20);
            text(grid[i][j].neighborCount, x + w / 2, y + w / 2);
          }
        }
      }

      // flag stuff
      if (grid[i][j].flagged) {
        if (grid[i][j].flaggedByPlayer == 1) {
          fill(200, 0, 0);
          rect(x, y, w, w);
        }
        if (grid[i][j].flaggedByPlayer == 2) {
          fill(0, 200, 0);
          rect(x, y, w, w);
        }
      }

    }
  }
}

// triggers when mouse 
function pressMouse(moux, mouy) {
  console.log('moused' + moux + mouy);
  if (Math.abs(moux - restartButton.x) < 50 && Math.abs(mouy - restartButton.y) < 25) {
    restartButton.pos = { x: 525, y: 550 };
    gameover = false;
    refreshGameover(gameover);
    noStroke();
    setStuff();
    screen = 1;
  }
  // music mouse
  if (Math.abs(moux - music.x) < 50 && Math.abs(mouy - music.y) < 12) {
    if (musicToggle == 1) {
      musicToggle = 0;
      music.text = 'music: ▷';
    } else {
      musicToggle = 1;
      music.text = 'music: 🁢🁢';
    }
  }
  if (!gameover) {
    if (screen == 0) {
      // instruction button
      if (Math.abs(moux - instructions.x) < 50 && Math.abs(mouy - instructions.y) < 25) {
        if (instShowing == 1) instShowing = 0;
        else instShowing = 1;
      }
      // enter button
      if (Math.abs(moux - enterButton.x) < 50 && Math.abs(mouy - enterButton.y) < 25) {
        enterButton.pos = { x: -100, y: -100 };
        title.pos = { x: -100, y: -100 };
        instructions.pos = { x: -100, y: -100 };
        restartButton.pos = { x: 525, y: 550 };
        revealButton.pos = { x: 75, y: 570 };
        flagButton.pos = { x: 225, y: 570 };
        moveButton.pos = { x: 375, y: 570 };
        music.x = 375;
        setStuff();
        screen = 1;
      }

    }

    else if (screen >= 1) {


      // buttons and modes

      if (Math.abs(moux - revealButton.x) < 50 && Math.abs(mouy - revealButton.y) < 25) {
        mode = 0;
        refreshMode(mode);

      }
      if (Math.abs(moux - flagButton.x) < 50 && Math.abs(mouy - flagButton.y) < 25) {
        mode = 1;
        refreshMode(mode);

      }
      if (Math.abs(moux - moveButton.x) < 50 && Math.abs(mouy - moveButton.y) < 25) {
        mode = 2;
        refreshMode(mode);

      }


      let i = floor(moux / w);
      let j = floor(mouy / w);
      // reveal mode
      if (mode == 0) {
        if (turn[0] == 0) {
          if (grid[i][j].mine) {
            gameOver();
          } else {
            revealSquare(i, j);
            grid[i][j].flagged = false;
            grid[i][j].flaggedByPlayer = 0;
          }
        }
      }
      // flag mode
      if (mode == 1) {
        if (turn[1] == 0) { flagSquare(i, j); }
      }
      // move mine mode
      if (mode == 2) {
        if (turn[2] == 0) {
          // if a mine is clicked and not currently moving any mine
          if (grid[i][j].mine && nowMoving == 0) {
            // set the flag to indicate that we are moving a mine
            nowMoving = 1;
            refreshNowMoving(nowMoving);
            // store the original mine position
            nowMovingOrigin = { x: i, y: j };
            refreshNowMovingOrigin(nowMovingOrigin);
          } else if (nowMoving == 1) {
            // if we are already moving a mine, move it to the clicked position
            moveMine(nowMovingOrigin.x, nowMovingOrigin.y, i, j);
            // reset the moving flag to indicate we are not moving a mine anymore
            nowMoving = 0;
            refreshNowMoving(nowMoving);
            mode = 0;
            refreshMode(mode);
          }
        }
      }
    }
  }
}

// reveal a square
function revealSquare(x, y) {
  console.log('revealed', x, y);
  recurse(x, y);
  turn[0] = 1;
  console.log(grid[x][y].revealed);
  refreshGrid(grid);

}


// move a mine
function moveMine(originX, originY, targetX, targetY) {
  if (originX >= 0 && originX < cols && originY >= 0 && originY < rows) {
    if (targetX >= 0 && targetX < cols && targetY >= 0 && targetY < rows) {
      if (grid[targetX][targetY].mine) {
        // if there's already a mine in the target square, end the game
        gameOver();
      } else {
        // move the mine from the original square to the target square
        grid[targetX][targetY].mine = grid[originX][originY].mine;
        grid[originX][originY].mine = false;
      }
    }
  }
  turn[2] = 1;
  refreshGrid(grid);

}

// flag a square
function flagSquare(x, y) {
  if (!grid[x][y].revealed) {
    if (x >= 0 && x < cols && y >= 0 && y < rows && !grid[x][y].flagged) {
      grid[x][y].flagged = true;
      grid[x][y].flaggedByPlayer = playerGoing;  // mark the square as flagged by the current player
      turn[1] = 1;
    }
  }
  refreshGrid(grid);
}



function draw() {


  if (isClientConnected(display = true)) {

    // Host/Game draw here. --->

    clear();


    // msuic
    if (musicToggle == 1 && !song.isPlaying()) {
      song.loop();
    }
    if (musicToggle == 0 && song.isPlaying()) {
      song.stop();
    }


    if (checkWinCondition()) {
      gameover = true;
      refreshGameover(gameover);
      playerGoing = playerWithMoreMines();
      refreshPlayerGoing(playerGoing);
    }

    if (screen == 0) {
      showScreen0();
    }
    if (screen == 1) {
      showScreen1();
    }


    if (mode == 0) {
      revealButton.color = color(50);
      flagButton.color = color(20, 30, 70);
      moveButton.color = color(20, 30, 70);
    }
    if (mode == 1) {
      revealButton.color = color(20, 30, 70);
      flagButton.color = color(50);
      moveButton.color = color(20, 30, 70);
    }
    if (mode == 2) {
      revealButton.color = color(20, 30, 70);
      flagButton.color = color(20, 30, 70);
      moveButton.color = color(50);
    }

  }
}


// Send mouse click coordinates to the host
function sendInteraction(x, y) {
  const interactionData = {
    roomId: roomId,
    x: x,
    y: y,
    type: 'click'
  };
  console.log('Sending interaction:', interactionData);
  socket.emit('sendData', interactionData);
}


function make2DArray(cols, rows) {
  const interactionData = {
    roomId: roomId,
    type: 'make2DArray',
    cols: cols,
    rows: rows
  };
  console.log('make2DArray', interactionData);
  socket.emit('sendData', interactionData);
}


function placeMines() {
  const interactionData = {
    roomId: roomId,
    type: 'placeMines'
  };
  console.log('placeMines', interactionData);
  socket.emit('sendData', interactionData);
}

function countNeighbors() {
  const interactionData = {
    roomId: roomId,
    type: 'countNeighbors'
  };
  console.log('countNeighbors', interactionData);
  socket.emit('sendData', interactionData);

}

function countAdjMines(x, y) {
  const interactionData = {
    roomId: roomId,
    type: 'countAdjMines',
    x: x,
    y: y
  };
  console.log('countAdjMines', interactionData);
  socket.emit('sendData', interactionData);

}


function setStuff() {
  const interactionData = {
    roomId: roomId,
    type: 'setStuff'
  };
  console.log('setStuff', interactionData);
  socket.emit('sendData', interactionData);

}


function revealAreaAround(x, y) {
  const interactionData = {
    roomId: roomId,
    type: 'revealAreaAround',
    x: x,
    y: y
  };
  console.log('revealAreaAround', interactionData);
  socket.emit('sendData', interactionData);

}

function recurse(x, y) {
  const interactionData = {
    roomId: roomId,
    type: 'recurse',
    x: x,
    y: y
  };
  console.log('recurse', interactionData);
  socket.emit('sendData', interactionData);

}


function checkWinCondition() {
  const interactionData = {
    roomId: roomId,
    type: 'checkWinCondition'
  };
  //console.log('checkWinCondition', interactionData);
  socket.emit('sendData', interactionData);

}

function playerWithMoreMines() {
  const interactionData = {
    roomId: roomId,
    type: 'playerWithMoreMines'
  };
  console.log('playerWithMoreMines', interactionData);
  socket.emit('sendData', interactionData);

}

function gameOver() {
  const interactionData = {
    roomId: roomId,
    type: 'gameOver'
  };
  console.log('gameOver', interactionData);
  socket.emit('sendData', interactionData);

}



//// ALL OF THE REFRESHERS

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

// Capture mouse click and send interaction to host
function mouseClicked() {
  sendInteraction(mouseX, mouseY);
}


// Messages can be sent from a host to all connected clients
function onReceiveData(data) {
  if (data.type == 'click') {
    pressMouse(data.x, data.y);
    console.log('Received click', data);
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


}
