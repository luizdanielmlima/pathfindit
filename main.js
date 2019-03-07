let matrix;
let pathCalc;
let gameGroup;
let pwGroup;
let wallsGroup;
let animDotsGroup;
const TILESIZE = 16;
let feedbackEl;
let title;
let btnRandom;
let titleAlternatives = [
  "John, find the well!",
  "C´mon man, move!",
  "John, be brave!",
  "Don´t be afraid John!",
  "Hey, you got this",
  "Keep trying dude!",
  "Don´t give up!"
];
let animDotsInterval;
let isAnimatingDots = false;
let numOfDots = 0;

window.onload = function() {
  // console.log("window.onload()");
  feedbackEl = document.getElementById("feedback");
  title = document.getElementById("title");
  btnRandom = document.getElementById("rnd-bt");
  btnRandom.addEventListener("click", getMatrixData);
  drawCanvasAndMap();
  drawHeroAndWell();
  getMatrixData();
};

function drawCanvasAndMap() {
  // console.log("drawCanvasAndMap()");
  let canvas = document.getElementById("myCanvas");
  paper.setup(canvas);

  let raster = new paper.Raster("mapa");
  raster.position = paper.view.center;
  gameGroup = new paper.Group();
}

function drawHeroAndWell() {
  // console.log("drawHeroAndWell()");
  let hero = new paper.Raster("hero");
  hero.name = "hero";
  hero.position = new paper.Point(TILESIZE / 2, TILESIZE / 2);
  gameGroup.addChild(hero);

  let well = new paper.Raster("well");
  well.name = "well";
  well.position = new paper.Point(
    TILESIZE * 40 - TILESIZE / 2,
    TILESIZE * 40 - TILESIZE / 2
  );
  gameGroup.addChild(well);
}

function setupGraphics() {
  // console.log("setupGraphics()");
  wallsGroup = new paper.Group();
  wallsGroup.name = "walls";
  pwGroup = new paper.Group();
  pwGroup.name = "wayfinding";
  animDotsGroup = new paper.Group();
  animDotsGroup.name = "animdots";
  gameGroup.addChild(wallsGroup);
  gameGroup.addChild(pwGroup);
  gameGroup.addChild(animDotsGroup);

  gameGroup.children["hero"].bringToFront();
  gameGroup.children["well"].bringToFront();

  paper.view.draw();
}

function getMatrixData() {
  // console.log("getMatrixData()");
  clearElements();
  fetch("data.json")
    .then(res => res.json())
    .then(data => {
      // console.log(data.matrix);
      matrix = data.matrix;
      setupGraphics();
      randomizeMatrix();
      setPathFinding();
    });
}

function clearElements() {
  feedbackEl.style.opacity = 0;
  stopDotsAnim();
  if (gameGroup) {
    let pwRef = gameGroup.children["wayfinding"];
    if (pwRef != undefined) {
      pwRef.remove();
    }
    let dotsRef = gameGroup.children["animdots"];
    if (dotsRef != undefined) {
      dotsRef.remove();
    }
    let wallsRef = gameGroup.children["walls"];
    if (wallsRef != undefined) {
      wallsRef.remove();
    }
  }
  let rn = Math.floor(Math.random() * titleAlternatives.length);
  title.innerHTML = titleAlternatives[rn];
}

function randomizeMatrix() {
  // console.log("randomizeMatrix()");
  for (var i = 0; i < 400; i++) {
    let randomX = Math.floor(Math.random() * matrix.length);
    let randomY = Math.floor(Math.random() * matrix.length);
    matrix[randomX][randomY] = 1;
  }
  matrix[0][0] = 0;
  matrix[0][1] = 0;
  matrix[1][0] = 0;
  matrix[38][39] = 0;
  matrix[39][38] = 0;
  matrix[39][39] = 0;
}

function setPathFinding() {
  // console.log("setPathFinding()");
  let grid = new PF.Grid(matrix);
  let gridBackup = grid.clone();
  let finder = new PF.AStarFinder();
  pathCalc = finder.findPath(0, 0, 39, 39, gridBackup);

  drawWalls();

  if (pathCalc.length > 0) {
    drawWayFinding(pathCalc);
  } else {
    //no path solution!
    title.innerHTML = "No soup for you !!";
    feedbackEl.style.opacity = 1;
  }
}

function drawWalls() {
  // console.log("drawWalls()");
  for (var i = 0; i < 40; i++) {
    for (var j = 0; j < 40; j++) {
      let tileID = i + "_" + j;
      let isWall = matrix[j][i] === 1 ? true : false;
      let tileType = isWall ? "wall" : "grass";
      let tile = new paper.Raster(tileType);
      let random = Math.floor(Math.random() * 5);
      let tileURL = isWall
        ? `./assets/tile_wall_0${random}.png`
        : `./assets/tile_grass_0${random}.png`;
      tile.source = tileURL;

      tile.name = tileID;
      tilePosX = TILESIZE * i + TILESIZE / 2;
      tilePosY = TILESIZE * j + TILESIZE / 2;
      tile.position = new paper.Point(tilePosX, tilePosY);
      wallsGroup.addChild(tile);
    }
  }
}

function stopDotsAnim() {
  // console.log("stopDotsAnim()");
  if (isAnimatingDots) {
    clearInterval(animDotsInterval);
    isAnimatingDots = false;
  }
}

function startDotsAnim() {
  // console.log("startDotsAnim()");
  isAnimatingDots = true;
  let animDotsRef = gameGroup.children["animdots"];
  if (animDotsRef != undefined) {
    var counter = 0;
    var counterLimit = numOfDots - 1;

    animDotsInterval = setInterval(function() {
      // console.log(`counter:${counter}`);
      animDotsRef.children[counter].opacity = 0.7;
      if (counter == counterLimit) {
        //last point, stop the animation!
        clearInterval(animDotsInterval);
      }
      counter++;
    }, 5);
  }
}

function drawWayFinding() {
  // console.log("drawWayFinding()");
  let WFpath = new paper.Path({
    strokeColor: "white",
    strokeWidth: 2,
    strokeCap: "round",
    opacity: 0
  });
  for (let i = 0; i < pathCalc.length; i++) {
    WFpath.add(
      TILESIZE * pathCalc[i][0] + TILESIZE / 2,
      TILESIZE * pathCalc[i][1] + TILESIZE / 2
    );
  }
  pwGroup.addChild(WFpath);

  // Creates the anim dots
  let length = WFpath.length;
  numOfDots = Math.round(length / 10);
  for (var i = 0; i <= numOfDots; i++) {
    let offset = (i / numOfDots) * length; //espaçamento entre dots
    let point = WFpath.getPointAt(offset);
    let animSpot = new paper.Path.Circle({
      center: point,
      radius: 3,
      fillColor: "black",
      opacity: 0.2
    });
    animDotsGroup.addChild(animSpot);
  }

  startDotsAnim();
}
