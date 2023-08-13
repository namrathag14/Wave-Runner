// UI
let displayScore;
let score = 0;
let highScore = 0;
let gameStarted = false;
let startTime;
let isGameOver = false;
let topBar;
let firstStart = true;
let showInstructions = false;
let newGameWait = 0; // delay so that the player doesn't accidentally skip the game over screen entirely when they're smashing buttons

// Game pieces
let player;
let particleTime;
let playerIsParticle = false;
let cooldownTime;
let inCooldown = false;
let particles = [];
let numOfParticles = 10;

// Player wave form animation
let xspacing; // space in between dots
let waveWidth;
let theta = 0.0;
let amplitude;
let period;
let dx;
let yvalues;

// Wave form animation Start Screen
let xspacingStart;
let waveWidthStart;
let thetaStart = 0.0;
let amplitudeStart;
let periodStart;
let dxStart;
let yvaluesStart;

// Audio
let midiValues = [];
let pitch = []; // oscillators
let winningPitch;
let winningIndex;
let volRate = [];
let pitchVol = [];

function setup() {
  // Responsively scales canvas at a 16:9 ratio
  let w = windowWidth;
  let h = windowWidth * 9 / 16;
  if (h > windowHeight) {
    h = windowHeight;
    w = windowHeight * 16 / 9;
  }
  createCanvas(w, h);

  startTime = millis();
  topBar = new modeBar();
  player = new Player();
  for (let i = 0; i < numOfParticles; i++) {
    particles.push(new Particle(width + random(width / 20, width / 10), random(height / 8, height)));
  }

  // Audio initialization
  major(65);
  playChord();
  volRates();
}

function draw() {
  // Calculate the time elapsed since the game started
  let currentTime = millis() - startTime;

  // Calculate a time-based factor to control the speed increase
  // We will use the square root function to slow down the speed increase over time
  let timeFactor = sqrt(1.0 + currentTime / 5000); // Adjust the divisor (5000) to control the rate of increase

  // Limit the timeFactor to a maximum of 2.0 (to prevent gameplay from becoming too fast)
  timeFactor = min(timeFactor, 2.0);

  if (isGameOver) {
    return; // Stop the game loop
  }
  if (!gameStarted) {
    startScreen();
    return;
  }

  // If the game has started, execute the rest of the code
  background(0);
  topBar.display();
  player.display();
  player.move();
  for (let i = 0; i < numOfParticles; i++) {
    particles[i].display();
    particles[i].move(timeFactor); // Pass the timeFactor to control the speed
    // Decreases score by 20 every particle collision, ensures no negative score
    if (particles[i].detectsOverlap()) {
      particles[i].collide();
      if (playerIsParticle) {
        if (score < 20) {
          score = 0;
        } else {
          score -= 20;
        }
      } else {
        gameOver();
      }
    }
  }
  keepScore();
}

function windowResized() {
  responsiveResize();
}

function responsiveResize() {
  let w = windowWidth;
  let h = windowWidth*9/16;
  if(h > windowHeight) {
    h = windowHeight;
    w = windowHeight*16/9;
  }  
  resizeCanvas(w, h);
}

function gameOver() {
    if(highScore < score) {
    highScore = score;
  }
  isGameOver = true;
  newGameWait = frameCount + 60*1; //1 second wait time
  textAlign(CENTER, CENTER);
  push();
  stroke(0);
  strokeWeight(width/400);
  textSize(width/10);
  text("GAME OVER", width / 2, height / 2.1);
  textSize(width/25);
   text("HIGH SCORE: " + highScore, width / 2, height - height / 2.55);
  textSize(width/50);
  text("PRESS SPACE TO RESTART", width / 2, height - height / 3.1);
  text("PRESS X FOR INSTRUCTIONS", width - width / 6, height - height / 12);
  pop();
  //shuts sound off
   for (let i = 0; i < pitch.length; i++) {
    pitch[i].amp(0);
  }
}

function startScreen() {
  if(showInstructions) {
    instructions();
  } else {
  // Draw the start screen
  background(0);
  startAnimation();
  textAlign(CENTER, CENTER);
  fill(255);
  textSize(width/30);
  text("PRESS ANY KEY TO START", width / 2, height - height / 3);
    textSize(width/9);
  text("WaveRunner", width / 2, height / 2.1);
  }
  //reset player's position even along any window resizing
  player.x = width / 8;
  player.y = height / 2;
}

function instructions() {
  background(0);
  textSize(height/15);
  text("INSTRUCTIONS", width / 2, height / 8);
  textSize(height/30);
  text("PRESS SPACE TO CONTINUE", width - width / 6, height - height / 12);
  textAlign(LEFT, CENTER);
  textSize(height/22.5);
  textLeading(height/22.5);
   text("STAY IN WAVE MODE FOR AS LONG AS POSSIBLE\nWHILE AVOIDING ONCOMING PARTICLES \n\nIN A PINCH, CHANGE TO PARTICLE MODE BY \nPRESSING SPACE BAR\n\nWHILE IN PARTICLE MODE SCORE WILL FREEZE\nAND PARTICLE COLLISIONS DEDUCT 20 POINTS\nEACH\n\nNOTE: PARTICLE MODE LASTS FIVE SECONDS\nBEFORE CHANGING BACK TO WAVE FORM.\nTHEN, PARTICLE MODE WILL BE DISABLED FOR\nFIVE SECONDS, SO USE WISELY!", width / 3.25, height / 2);
  
  rectMode(LEFT, CENTER);
  let w = width/5.33;
  let h = height/11.25;
  let modeX = width / 18;
  //wave mode picture
  let gradient = drawingContext.createLinearGradient(modeX, height / 6, modeX + w, height / 6);
    gradient.addColorStop(0, color(255, 0, 0));
    gradient.addColorStop(0.5, color(0, 255, 0));
    gradient.addColorStop(1, color(0, 0, 255));
    drawingContext.fillStyle = gradient;
  rect(modeX, height / 5 , w, h);
  fill(255, 255, 255);
  textAlign(CENTER, CENTER);
  stroke(0);
  textSize(width/32);
  text("WAVE", width / 18 + w / 2, height / 5 + h/2);
  
  //particle mode picture
  fill(255, 255, 255);
  rect(modeX, height / 3, w, h);
  fill(0, 0, 0);
  textAlign(CENTER, CENTER);
  noStroke();
  textSize(width/32);
  text("PARTICLE", width / 18 + w / 2,height / 3 + h/2);
   
  //particle collision picture
  fill(0, 0, 255);
  let diam = height/9;
  circle(width / 11, height / 1.9, diam);
  fill(255, 255, 255);
  diam = height/18;
  circle(width / 5, height / 2.05, diam);
  fill(255, 255, 255);
  let inner = width/80;
  let outer = width/32;
  let pts = 10;
  star(width / 8, height / 1.95, inner, outer, pts);
  
}


function keepScore() {
  if (score < 10) {
    displayScore = '0000' + score;
  } else if (score < 100) {
    displayScore = '000' + score;
  } else if (score < 1000) {
    displayScore = '00' + score;
  } else if (score < 10000) {
    displayScore = '0' + score;
  }
 //score will only increase if the player is a wave
  if (frameCount % 5 == 0 && !playerIsParticle) {
    score++;
  }
  textAlign(CENTER, CENTER);
  textSize(width/27);
  text(displayScore, width - width / 15, height / 15);
}

function cooldown() {
  if (frameCount < cooldownTime) {
    inCooldown = true;
  } else {
    inCooldown = false;
  }
}

function keyPressed() {
  // Restart the game
  // Pressing space directs to the start screen
  if (isGameOver) {
    if(key == " " && frameCount > newGameWait) {
    //reset everything
    isGameOver = false;
    cooldownTime = 0;
    score = 0;
    gameStarted = false;
    startTime = millis();
    playerIsParticle = false;
    for (let i = 0; i < particles.length; i++) {
      particles[i].x = width + random(width/20, width/1.33);
      particles[i].y = random(height / 8, height);
    }
    // pressing x directs to instructions
  } else if (key == "x") {
    instructions();
  }
    
  } else {
    if (!gameStarted && firstStart) {
      showInstructions = true;
      firstStart = false;
    } else if (!gameStarted && frameCount > newGameWait) {
      showInstructions = false;
      gameStarted = true;
    } else {
      //starts particle mode, lasting for 5 seconds with a 5 second cooldown time before it can be used again
      if (key == " " && !playerIsParticle && !inCooldown) {
        playerIsParticle = true;
        particleTime = frameCount + 60 * 5; //5 seconds in particle mode
        cooldownTime = particleTime + 60 * 5; // 5-second cooldown
        //chooses a random frequency to "collapse" to and grabs its index
        winningPitch = random(midiValues);
        winningIndex = midiValues.indexOf(winningPitch);
      }
    }
  }
}

class Particle {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.r = height/37.5;
    this.xSpeed = random(-width/114, -width/160);
    this.ySpeed = 0;
    this.delayCollide = 0;
    this.colliding = false;

  }
  
  //checks for overlap, but only if there hasn't been a collision for half a second
  detectsOverlap() {
    if (dist(this.x, this.y, player.x, player.y) < player.r + this.r && !this.colliding) {
      this.colliding = true;
      this.delayCollide = frameCount + 60 * 0.5; //half sec delay from now
      return true;
    } else if (frameCount > this.delayCollide) {
      this.colliding = false;
    }
  }
  collide() {
    if(playerIsParticle) {
      //collision effect placed at the intersection of the two particles
      let inner = height/30;
      let outer = height/15;
      let pts = 10;
      push();
      stroke(0);
      strokeWeight(width/800);
    star(this.x - dist(this.x, this.y, player.x, player.y) / 2, this.y, inner, outer, pts);
      pop();
    //switches direction
    this.xSpeed = -this.xSpeed;
    this.ySpeed += random(-width/800, width/800);
    //player will emit only the winning pitch when collided with, also correspnding with its color
    for (let i = 0; i < pitch.length; i++) {
      if (midiValues[i] == winningPitch) {
        pitch[i].amp(0.1);
      }
    }
    } else {
      //if there is a collision with wave form, a wham-o effect will cover the collision
      let inner = height/15;
      let outer = height/6.4;
      let pts = 11;
      push();
      stroke(0);
      strokeWeight(width/800);
       star(player.x, player.y, inner, outer, pts);
      pop();
    }
  }
  display() {
    this.r = height/37.5;
    push();
    stroke(0);
    strokeWeight(width/800);
    circle(this.x, this.y, this.r * 2);
    pop();
  }
  
  move(timeFactor) {
    this.x += this.xSpeed * timeFactor; // Adjust the particle's xSpeed with timeFactor
    this.y += this.ySpeed * timeFactor; // Adjust the particle's ySpeed with timeFactor
    this.resetInBounds();
  }
  
  //handling canvas boundaries
  resetInBounds() {
    let leftBound = 0 - this.r;
    let rightBound = width - this.r;
    let topBound = 0 - this.r;
    let bottomBound = height + this.r;

    if (this.x > rightBound + width/2 || this.x < leftBound || this.y < topBound || this.y > bottomBound) {
      this.x = width;
      this.y = random(height / 8 + this.r, height);
      this.xSpeed = random(-width/114, -width/160);
      this.ySpeed = 0;
    }
  }
}

class Player {
  //x is fixed, y is arrow key input
  constructor() {
    this.x = width / 8;
    this.y = height / 2;
    this.r = height/22.5;
    this.speed = height/75; //can adjust the speed at which the player will move to the arrow key input
  }
  
  isWave() {
    topBar.waveMode();
    this.waveAnimation();
    changeVol();
  }
  isParticle() {
    topBar.particleMode();
    push();
    //changes particle to the color of the winning pitch when wave collapses
    if (winningIndex == 0) {
      fill(255, 0, 0);
    } else if (winningIndex == 1) {
      fill(0, 255, 0);
    } else if (winningIndex == 2) {
      fill(0, 0, 255);
    }
    
    circle(this.x, this.y, this.r * 2);
    pop();
    for (let i = 0; i < midiValues.length; i++) {
      pitch[i].amp(0.00);
    }
  }
  display() {
    if (playerIsParticle) {
      if (frameCount > particleTime) {
        playerIsParticle = false;
      }
      this.isParticle();
    } else {
      cooldown();
      this.isWave();
    }
  }
  move() {
    if (keyIsDown(UP_ARROW)) {
      this.y -= this.speed;
    }
    if (keyIsDown(DOWN_ARROW)) {
      this.y += this.speed;
    }
    this.keepInBounds();
  }
  
  //handling canvas boundaries
  keepInBounds() {
    let topBound = height / 8 + this.r;
    let bottomBound = height - this.r;

    if (this.y < topBound) {
      this.y = topBound;
    } else if (this.y > bottomBound) {
      this.y = bottomBound;
    }
  }
  
  waveAnimation() { 
    xspacing = width/114;
    amplitude = width/32;
    period = player.x/0.7;
    waveWidth = player.x;
    dx = (TWO_PI / period) * xspacing;
    yvalues = new Array(floor(waveWidth / xspacing));
    
    this.calcWave();
    this.renderWaves();
  }
//calculates sine wave
  calcWave() {
    theta += 0.09;
    let x = theta;
    for (let i = 0; i < yvalues.length; i++) {
      yvalues[i] = sin(x) * amplitude;
      x += dx;
    }
  }

  //displays rgb waves drawn in relaiton to one another, brightness fluctuating in correspondence with their associated pitch
  renderWaves() {
    push();
    colorMode(HSB);
    noStroke();
    //brightness mapped to volume in a way that ensure they don't completely disappear and interfere with gameplay... unless that becomes an added difficulty level later as time goes by?...
    let diam = width/133;
    for (let x = 0; x < yvalues.length; x++) {
      fill(360, 100, map(pitchVol[0], 0, 0.04, 92, 100));
      circle(x * xspacing, this.y + yvalues[x], diam);
      fill(120, 100, map(pitchVol[1], 0, 0.04, 92, 100));
      circle(x * xspacing, this.y + yvalues[x + 1], diam);
       fill(240, 100, map(pitchVol[2], 0, 0.04, 92, 100));
      circle(x * xspacing, this.y + yvalues[x + 2], diam);
    }
    pop();
  }
}

class modeBar {
  constructor() {
    this.x = 0;
    this.y = 0;
    this.w = width-width/5;
    this.h = height/9;
  }
  display() {
    rect(this.x, this.y, this.w, this.h);
  }
  particleMode() {
    push();
     //all white
    let c = [255, 255, 255, //r
            255, 255, 255,  //g
            255, 255, 255]; //b
   
    //1 second before particle mode ends
    if (frameCount > particleTime - 60) {
      //the bar flashes
      if (frameCount % 10 == 0) {
        //these values are passed in to fill the gradient
        c = [150, 150, 150,
            150, 150, 150,
            150, 150, 150]; //grey all across
      } else {
        c = [60, 0, 0,
            0, 60, 0,
            0, 0, 60]; //greyed out rainbow
      } 
    }
    this.linearGradient(c); //passes in these color stops to make a gradient
    this.display();
    fill(0);
    textAlign(CENTER, CENTER);
    textSize(height/15);
    text("PARTICLE MODE", this.x + this.w / 4, this.y + this.h / 2);
    pop();
  }
  
  waveMode() {
    push();
    let c = [255, 0, 0,
            0, 255, 0,
            0, 0, 255]; //rainbow
    this.linearGradient(c);
    if (inCooldown) {
      c = [60, 0, 0,
            0, 60, 0,
            0, 0, 60]; //greyed out rainbow (disabled)
       this.linearGradient(c);
    }
    this.display();
    fill(255);
    strokeWeight(height/225);
    stroke(0);
    textAlign(CENTER, CENTER);
    textSize(height/15);
    text("WAVE MODE", this.x + this.w / 4, this.y + this.h / 2);
    pop();
  }

  //creates a gradient from left to right of the bar
  linearGradient(c){
    let gradient = drawingContext.createLinearGradient(this.x, this.y - this.h/2, this.x + this.w, this.y -this.h/2);
    gradient.addColorStop(0, color(c[0], c[1], c[2]));
    gradient.addColorStop(0.4, color(c[3], c[4], c[5]));
    gradient.addColorStop(0.75, color(c[6], c[7], c[8]));
    gradient.addColorStop(1, color(0, 0, 0));
    drawingContext.fillStyle = gradient;
  }
}
///////audio functions///////

//defines the frequencies of the pitches based on the formula for a major triad, in midi values
function major(root) {
  midiValues = [root, root + 4, root + 7];
}

//creates oscillators for all the notes in the chord
function playChord() {
  for (let i = 0; i < midiValues.length; i++) {
    pitch[i] = new p5.Oscillator();
    pitch[i].setType('triangle');
    pitch[i].freq(midiToFreq(midiValues[i]));
    pitch[i].amp(0);
    pitch[i].start();
  }
}

//sets arbitrary rates each pitch's volume will increase and decrease by. Also for now sets pitch volumes all to 0.15 to start
function volRates () {
  for (let i = 0; i < pitch.length; i++) {
    pitchVol[i] = 0.15;
  }
  volRate = [0.015, 0.01, 0.009];
}

//fluctuates volume of each pitch  
function changeVol () {
  for (let i = 0; i < pitch.length; i++) {
  pitchVol[i] = pitch[i].getAmp();
    //flips the sign of the volume rate so that it will fade up the pitch until a designated volume, then fade back down until it hits 0 and repeats
      if(pitchVol[i] >= 0.1 || pitchVol[i] <= -0.25) {
      volRate[i] = -volRate[i];
      }
    pitch[i].amp(pitchVol[i]+volRate[i]); //pitchVol stores current amp, volRate updates it
  }
}

////extra functions for visuals////
//creates a custom star shape, used for the "wham-o" collision effects
function star(x, y, radius1, radius2, npoints) { //radius 1 is the inner, radius 2 is the outer where the points touch
  let angle = TWO_PI / npoints;
  let halfAngle = angle / 2.0;
  beginShape();
  for (let a = 0; a < TWO_PI; a += angle) {
    let sx = x + cos(a) * radius2;
    let sy = y + sin(a) * radius2;
    vertex(sx, sy);
    sx = x + cos(a + halfAngle) * radius1;
    sy = y + sin(a + halfAngle) * radius1;
    vertex(sx, sy);
  }
  endShape(CLOSE);
}

//these two functions probably need to instead be a sine wave object so that the same system can be used for both the start screen animation and the player's wave, but for lack of time this was easier for now:


function startAnimation() {
  xspacingStart = width/30;
  amplitudeStart = width/12;
  periodStart = width/1.5;
  waveWidthStart = width+width/8;
  dxStart = (TWO_PI / periodStart) * xspacingStart;
  yvaluesStart = new Array(floor(waveWidthStart / xspacingStart));

  calcWaveStart();
  renderWavesStart();
}
//calculating sine wave for start screen animation
 function calcWaveStart() {
    thetaStart += 0.08;
    let x = thetaStart;
    for (let i = 0; i < yvaluesStart.length; i++) {
      yvaluesStart[i] = sin(x) * amplitudeStart;
      x += dxStart;
    }
  }

//drawing the waves as array of ellipses (can increase number of ellipses and decrease spacing to get a more smooth line instead of dots)
  function renderWavesStart() {
    push();
    noStroke();
    //3 waves for rgb each drawn in respect to the same values, just slightly shifted from each other
    let diam = width/100;
    for (let x = 0; x < yvaluesStart.length; x++) {
      //red and blue 
      fill(255, 0, 0);
      circle(x * xspacingStart, height/2.25 + yvaluesStart[x], diam);//red defines the wave
      fill(0, 255, 0);
      circle(x * xspacingStart, height/2.25 + yvaluesStart[x + 1], diam);//green is slightly offset
      fill(0, 0, 255);
      circle(x * xspacingStart, height/2.25 + yvaluesStart[x + 2], diam);//blue is offset again
    }
    pop();
  }