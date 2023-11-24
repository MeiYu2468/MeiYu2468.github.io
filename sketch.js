let sensitivity;

let points;
let survived_seconds;
let shot_enemies;

let player;
let shots = [];
let enemies = [];
let play_button;
let pause_button;
let request_permission;
let sensitivity_slider;
let background_image;

let enemy_timer;
let enemyspawn_cooldown_seconds;
let cooldown_low_limit = 0.2;

let mode = "none"; //dead, title, pause...

let enemy_spawn_zones;

let right_vector;

function setup() { 
  right_vector = createVector(1, 0);
  alert("newest version 2");
  background_image = loadImage("images/stars.png");
  pixelDensity(1);
  frameRate(60);
  createCanvas(window.innerWidth, window.innerHeight);
  
  enemy_spawn_zones = [ 
  [createVector(-20, 0), createVector(0, height)],
  [createVector(0, -20), createVector(width, 0)],
  [createVector(width, 0), createVector(width + 20, height)],
  [createVector(0, height + 20), createVector(width, height)]
  ];
  
  play_button = createButton('Play');
  play_button.size(150, 50);
  play_button.position(width/2 - play_button.width/2, height/3 * 2 + play_button.height + 15);
  play_button.mousePressed(change_to_game);
  
  pause_button = createButton('▐▐');
  pause_button.size(40, 40);
  pause_button.position(20, 20);
  pause_button.mousePressed(change_to_pause);
  
  request_permission = createButton('Request orientation permission');
  request_permission.position(width/2 - request_permission.width/2, 60);
  request_permission.mousePressed(requestMotionPermission);
  
  sensitivity_slider = createSlider(0.3, 2, 1, 0.01);
  sensitivity_slider.position(width/2 - sensitivity_slider.width/2, height/3 * 2 - 10);
  
  player = new Player(createVector(width/2, height/2));
  
  change_to_title();
  set_start_values();
  
  //Denne simple metode virker til devicemotion events for android
  window.addEventListener("devicemotion", phoneMoved);
  window.addEventListener("click", shoot);
}

function set_start_values(){
  points = 0.00;
  survived_seconds = 0.000;
  shot_enemies = 0;
  
  enemy_timer = 0;
  enemyspawn_cooldown_seconds = 2;
  
  enemies = [];
  shots = [];
  
  player.set_position(createVector(width/2, height/2));
}

//På iphone skal man have tilladelse til at anvende devicemotions
//nedenstående funktion kaldes fra tryk på en knap
function requestMotionPermission() {
  requestMotionPermission.hide();
  DeviceMotionEvent.requestPermission()
    .then((response) => {
      if (response == "granted") {
        window.addEventListener("devicemotion", (e) => {
          window.addEventListener("devicemotion", phoneMoved);
          window.addEventListener("click", shoot);
        });
      }
    })
    .catch(console.error);
}

//Koden ovenfor har orettet en event-listner på devicemotions, der kalder denne funktion
function phoneMoved(event) {
  player.set_acceleration(createVector(-event.accelerationIncludingGravity.x * sensitivity, event.accelerationIncludingGravity.y * sensitivity));
}

function draw() {  
  background(255);
  
  push();
  rotate(PI/2);
  tint(255, 255, 255, 255);
  blendMode(MULTIPLY)
  image(background_image, 0, -background_image.height);
  pop();
  
  if (mode != "dead" && mode != "title") {
    fill(255);
    textSize(20);
    textAlign(LEFT, TOP);
    text(" Survived " + survived_seconds.toFixed(3) + " Score: " + points.toFixed(), 80, 30);
  }
  
  player.display();
  
  if (mode == "game") {
    survived_seconds = survived_seconds + 1 / frameRate();
    player.update();
    if (enemyspawn_cooldown_seconds > cooldown_low_limit) {
    enemyspawn_cooldown_seconds = enemyspawn_cooldown_seconds - 0.01 / frameRate();
    }
    enemy_timer = enemy_timer + 1;
    if (enemy_timer > enemyspawn_cooldown_seconds * frameRate()) {
      spawn_enemy();
    }
  }
  
  shots.forEach((o, i) => {
    o.display(); 
    if (mode == "game"){
      o.update();
      if (o.position.x < 0 || o.position.x > width || o.position.y < 0 || o.position.y > height) {
      shots.splice(i, 1);
      }
    }
  });
  
  if (enemies.length > 0) {
    enemies.forEach((e, i) => {
      if (e.dead == false) {
        e.display();
        
        if (mode == "game") {
          e.update(); 
          
          shots.forEach((s, i2) => {
            if (e.collided_with(s) && e.fading == false) {
              points = points + survived_seconds;
              shot_enemies = shot_enemies + 1;
              shots.splice(i2, 1);
              e.explode();
            }
          });
          
          if (e.collided_with(player) && e.fading == false) {
            enemies[i].explode(); 
            change_to_dead();
          }
        }
      }   
  });
  }
  
  if (mode == "title") {
    draw_title_screen();
  } else if (mode == "dead") {
    draw_dead_screen();
  } else if (mode == "pause") {
    draw_pause_screen();
  }
  
  if (mode != "game") {
    textSize(15);
    textAlign(CENTER, TOP);
    let slider_value = sensitivity_slider.value() * 100;
    text(slider_value.toFixed() + "% sensitivity", width/2, height/3 * 2 - 35);
  }
}

function draw_title_screen() {
  let title = "TRIANGLE SHOOTER!";
  let info = "TILT your phone to steer! \nTAP to shoot \n -Get points by hitting! \n\nMove out of the screen to \nappear on the other side!";
  make_panel(title, info);
}

function draw_dead_screen(){
  let title = "You died!"
  let info = "SCORE: " + points.toFixed() + " points\n:( \n\nSurvived for " + survived_seconds.toFixed(3) + " seconds \nShot " + shot_enemies + " enemies";
  make_panel(title, info);
}

function draw_pause_screen() {
  let title = "Game PAUSED";
  let info = "TILT your phone to steer! \nTAP to shoot \n -Get points by hitting! \n\nMove out of the screen to \nappear on the other side!";
  make_panel(title, info);
}

function make_panel(title, info){
  fill(35, 35, 45, 200);
  stroke(100);
  strokeWeight(2);
  rect(width / 8, height/10, width - width / 4, height/3*2, width/30);
  
  noStroke();
  fill(0);
  rect(width / 8 + 5, height/10 + 5, width - width / 4 - 10, 60, width/30);
  
  fill(255);
  textAlign(CENTER, CENTER);
  textSize(25);
  text(title, width/2, height/10 + 35);
  
  textAlign(CENTER, TOP);
  textSize(15);
  text(info, width/2, height/10 + 80);
}

function shoot(){
  if (mode == "game") {
    shots.push(new Bullet(player.get_position(), player.get_velocity()));
  }
}

function spawn_enemy() {  
  let spawn_zone = enemy_spawn_zones[Math.round(Math.random() * enemy_spawn_zones.length)];
  if (spawn_zone != null) {
    enemy_timer = 0;
    enemies.push(new Enemy(createVector(randomFromInterval(spawn_zone[0].x, spawn_zone[1].x), randomFromInterval(spawn_zone[0].y, spawn_zone[1].y))));
  }
}

//Denne funkton fra: https://stackoverflow.com/questions/4959975/generate-random-number-between-two-numbers-in-javascript
function randomFromInterval(min, max) { // min and max included 
  return Math.random() * (max - min + 1) + min;
}

function random_of_two(one, two){
  let possible_values = [one, two];
  return possible_values[Math.floor(Math.random() * possible_values.length)];
}

function change_to_title() {
  sensitivity_slider.show();
  play_button.show();
  pause_button.hide();
  mode = "title";
}

function change_to_game(){
  if (mode == "dead") {
    set_start_values();
  }
  sensitivity = sensitivity_slider.value();
  sensitivity_slider.hide();
  play_button.hide();
  pause_button.show();
  mode = "game";
}

function change_to_dead(){
  sensitivity_slider.show();
  play_button.show();
  pause_button.hide();
  mode = "dead";
}

function change_to_pause() {
  sensitivity_slider.show();
  play_button.show();
  pause_button.hide();
  mode = "pause";
}

//------------CLASSES-----------------------------------------------------
//------------------------------------------------------------------------

class Player{
  constructor(position) {
    this.position = position;
    this.acceleration = createVector(0.0, 0.0)
    this.velocity = createVector(0.0, 0.0);
    this.size = 7;
    this.speed_limit = 4;
    this.bcolor = color(255, 255, 255);
  }
  
  update(){
    this.velocity.add(this.acceleration.mult(0.2));
    this.velocity = p5.Vector.limit(this.velocity, this.speed_limit);
    this.position.add(this.velocity);
    
    if (this.position.x > width) {
      this.position.x = 0;
    } else if (this.position.x < 0) {
      this.position.x = width;
    }
    if (this.position.y > height) {
      this.position.y = 0;
    } else if (this.position.y < 0) {
      this.position.y = height;
    }
  }
  
  display(){ 
    push();
    translate(this.position.x, this.position.y);
    rotate(right_vector.angleBetween(this.velocity));
    strokeWeight(2);
    stroke(this.bcolor);
    line(this.size * 1.5 - 2, 0, this.size + 5, 0);
    fill(this.bcolor);
    noStroke();
    triangle(-this.size * 1.5, -this.size, -this.size * 1.5, this.size, this.size * 1.5 , 0);
    pop();
  }
  
  get_position(){
    return this.position;
  }
  set_position(position){
    this.position = position;
  }
  get_acceleration() {
    return this.acceleration;
  }
  set_acceleration(acceleration){
    this.acceleration = acceleration;
  }
  get_velocity() {
    return this.velocity;
  }
  set_velocity(velocity) {
    this.velocity = velocity;
  }
}

class Bullet {
  constructor(position, parent_velocity) {
    console.log("Shots fired!");
    this.size = 10;
    this.velocity = createVector(parent_velocity.x, parent_velocity.y);
    this.position = createVector(position.x + this.velocity.normalize().x * this.size * 1.5, position.y + this.velocity.normalize().y * this.size * 1.5);
    this.stop_acceleration = 0.5;
    this.local_bullet_speed = this.velocity.mag() * 3;
    this.bcolor = color(random_of_two(0, 255), random_of_two(0, 255), random_of_two(0, 255));
    this.first_color = this.bcolor;
  }
  
  update() {
    this.velocity.setMag(this.velocity.mag() + this.local_bullet_speed);
    this.position.add(this.velocity); 
    this.velocity.mult(0.8);
    this.size *= 0.99;
  }
  
  display() {
    noStroke();
    this.bcolor.setAlpha(alpha(this.bcolor)*0.9);
    fill(this.bcolor);
    circle(this.position.x, this.position.y, this.size * 1.5);
    
    fill(this.first_color);
    circle(this.position.x, this.position.y, this.size * 1);
    
    fill(255);
    circle(this.position.x, this.position.y, this.size * 0.5);
  }
}

class Enemy {
  constructor(position){
    this.fading = false;
    this.dead = false;
    this.position = createVector(position.x, position.y);
    this.velocity = createVector(0.0, 0.0);
    this.size = 5;
    this.speed = randomFromInterval(1, player.speed_limit * 0.5);
    this.bcolor = color(255, 0, 0);
  }
  
  update_target(){
    this.target = createVector(player.get_position().x,player.get_position().y);
  }
  
  update() {
    this.update_target();
    this.velocity = this.target.sub(this.position).normalize().mult(this.speed);
    this.position.add(this.velocity);
    
    if (this.fading == true) {
      this.bcolor.setAlpha(alpha(this.bcolor)*0.9);
      this.size = this.size * 1.1;
    }
    
    if (alpha(this.bcolor) <= 10) {
      console.log("enemy died");
      this.dead = true;
    } 
  }
  
  display(){
    push();
    translate(this.position.x, this.position.y);
    rotate(right_vector.angleBetween(this.velocity));
    fill(this.bcolor);
    noStroke();
    triangle(-this.size * 1.5, -this.size, -this.size * 1.5, this.size, this.size * 1.5 , 0);
    pop();
  }
  
  collided_with(other) {
    return this.position.dist(other.position) <= this.size + other.size + 2;
  }
  
  explode(){
    this.fading = true
  }
}
