function in_intv(value, min, max){
    return (value >= min) && (value <= max)
}

function shuffle(array) {
    let currentIndex = array.length,  randomIndex;
  
    // While there remain elements to shuffle.
    while (currentIndex > 0) {
  
    // Pick a remaining element.
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
  
    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [
        array[randomIndex], array[currentIndex]];
    }
  
    return array;
}


class Entity {
    constructor(verts, indices){
        this.x = 0;
        this.y = 0;
        this.verts = verts;
        this.vert_len = this.verts.length;
        this.indices = indices;
    }

    set_pos(x, y){
        this.x = x;
        this.y = y;
    }
    
    get_verts(){
        let output = [];
        this.verts.forEach(e => {
            output = output.concat(Entity.updateArray(e, this.x, this.y));
        })
        return output;
    }

    get_indices(mesh_length){
        return this.indices.map(x => x + mesh_length);
    }

    static updateArray(e, x, y){
        return [e[0] + x, e[1] + y].concat(e.slice(2));
    }
}

class Quad extends Entity {
    constructor(size, colors, colision){
        if (colors.length > 1){
            super(
                [[-size,size,0].concat(colors[0]),
                [size,size,0].concat(colors[1]),
                [-size,-size,0].concat(colors[2]),
                [size,-size,0].concat(colors[3])],
                [0,1,2,1,2,3]);
            this.colision = colision;
            this.size = size;
        } else{
            super(
                [[-size,size,0].concat(colors[0]),
                [size,size,0].concat(colors[0]),
                [-size,-size,0].concat(colors[0]),
                [size,-size,0].concat(colors[0])],
                [0,1,2,1,2,3]);
            this.colision = colision;
            this.size = size;
        }
    }

    check_coll(other){
        if (!this.colision) { return false; }
        let minx = this.x - this.size;
        let maxx = this.x + this.size;
        let miny = this.y - this.size;
        let maxy = this.y + this.size;
        return (in_intv(other.x - other.size, minx, maxx) || in_intv(other.x + other.size, minx, maxx)) &&
                (in_intv(other.y - other.size, miny, maxy) || in_intv(other.y + other.size, miny, maxy));
    }
}

class Particle extends Quad {
    constructor(size, x, y, color, time, collision) {
        super(size, [color], collision);
        this.set_pos(x, y);
        this.time = time;
    }
}

class Wall extends Quad {
    constructor(scale, x_pos, y_pos, color){
        super(scale, [color], true);
        this.set_pos(x_pos, y_pos);
        this.wall = true;
    }
}

class Sword extends Particle {
    constructor(size, x, y){
        super(size, x, y, [0, 0, 1], 10, true);
    }
}

class Player extends Quad {
    constructor() {
        super(0.1, [[1,0,0]], true);
        this.speed = 0.05;
        this.direction = {x: 1, y: 0};
        this.attack_cd = 0;
    }
    
    movement(){
        if (keys.w){ this.move(0, 1); }
        if (keys.a){ this.move(-1, 0); }
        if (keys.s){ this.move(0, -1); }
        if (keys.d){ this.move(1, 0); }
        if (keys.space){ this.attack(0,0); }
    }

    check_wall_collision(){
        for (let i = 1; i < entities.length; i++){
            let e = entities[i];
            if (e.wall) {
                if (e.check_coll(this)) {
                    return true;
                }
            }
        }
        return false;
    }

    move(x, y){
        if (Math.random() > 0.5) {
            particles.push(new Particle(0.01, this.x + (0.5 - Math.random()) * this.size, this.y + (0.5 - Math.random()) * this.size, [0, 0, 0], 15, false));
        }
        this.direction = {x: x, y: y};
        let dx = x * this.speed;
        let dy = y * this.speed;

        const minx = entities[0].x - entities[0].size;
        const maxx = entities[0].x + entities[0].size;
        const miny = entities[0].y - entities[0].size;
        const maxy = entities[0].y + entities[0].size;

        const steps = 8;

        for (let i = 0; i < steps; i++) {
            this.x += dx / steps;
            this.y += dy / steps;
            if (this.check_wall_collision() || 
                (!in_intv(this.x - this.size, minx, maxx) || !in_intv(this.x + this.size, minx, maxx) ||
                 !in_intv(this.y - this.size, miny, maxy) || !in_intv(this.y + this.size, miny, maxy))) {
                this.x -= dx / steps;
                this.y -= dy / steps;
                break;
            }
        }
        gl_canvas.updateCamera(this.x, this.y);
    }

    attack(x, y) {
        if (x != 0) {this.direction.x = x;}
        if (y != 0) {this.direction.y = y;}
        if (this.attack_cd > 0) {return;}
        sword = new Sword(0.2, this.x + this.direction.x * 0.2, this.y + this.direction.y * 0.2);
        this.attack_cd = 20;
    }
}

class Zombie extends Quad {
    constructor(x, y){
        super(0.1,[[0,0.5,0]], true);
        this.set_pos(x, y);
        this.speed = 0.0025 + 0.0125 * Math.random();
    }

    check_wall_collision(){
        for (let i = 1; i < entities.length; i++){
            let e = entities[i];
            if (e.wall) {
                if (e.check_coll(this)) {
                    return true;
                }
            }
        }
        return false;
    }

    check_others_collision(){
        for (let i = 0; i < zombies.length; i++){
            let e = zombies[i];
            if (e.x == this.x && e.y == this.y) {continue;}
            if (e.check_coll(this)) {
                return true;
            }
        }
        return false;
    }

    move(){
        if (Math.random() > 0.5) {
            particles.push(new Particle(0.01, this.x + (0.5 - Math.random()) * this.size, this.y + (0.5 - Math.random()) * this.size, [0, 0, 0], 15, false));
        }
        let x = (player.x - this.x > 0 ? 1 : -1);
        let y = (player.y - this.y > 0 ? 1 : -1);
        const halt_interval = 0.025;
        if (in_intv(this.x, player.x - halt_interval, player.x + halt_interval)){x = 0;}
        if (in_intv(this.y, player.y - halt_interval, player.y + halt_interval)){y = 0;}
        let dx = x * this.speed;
        let dy = y * this.speed;

        const minx = entities[0].x - entities[0].size;
        const maxx = entities[0].x + entities[0].size;
        const miny = entities[0].y - entities[0].size;
        const maxy = entities[0].y + entities[0].size;

        const steps = 8;

        for (let i = 0; i < steps; i++) {
            this.x += dx / steps;
            if (this.check_wall_collision() || this.check_others_collision() ||
                (!in_intv(this.x - this.size, minx, maxx) || !in_intv(this.x + this.size, minx, maxx) ||
                 !in_intv(this.y - this.size, miny, maxy) || !in_intv(this.y + this.size, miny, maxy))) {
                this.x -= dx / steps;
                break;
            }
        }

        for (let i = 0; i < steps; i++) {
            this.y += dy / steps;
            if (this.check_wall_collision() || this.check_others_collision() ||
                (!in_intv(this.x - this.size, minx, maxx) || !in_intv(this.x + this.size, minx, maxx) ||
                 !in_intv(this.y - this.size, miny, maxy) || !in_intv(this.y + this.size, miny, maxy))) {
                this.y -= dy / steps;
                break;
            }
        }
    }
}

class Cell {
    constructor(){
        this.wall = true;
        this.visited = false;
    }

    set_clear() {
        this.wall = false;
    }
}

class Maze {
    constructor(size) {
        this.grid = [];
        this.size = size;
        for (let i = 0; i < this.size; i++){
            let row = [];
            for (let j = 0; j < this.size; j++){
                row.push(new Cell());
            }
            this.grid.push(row);
        }
    }

    generate() {
        let startingCell = (this.size - 1) / 2;
        this.grid[startingCell][startingCell].set_clear();
        this.propagate(startingCell, startingCell);
    }

    propagate(x, y) {
        if (this.grid[y][x].visited) { return; }
        let coords = this.get_neighbours(x, y);
        this.grid[y][x].visited = true;
        coords.forEach(e => {
            if (this.get_wall(e.x, e.y)){
                let walls = 0;
                let new_coords = this.get_neighbours(e.x, e.y);
                new_coords.forEach(e => {
                    if (this.get_wall(e.x, e.y)) { 
                        walls += 1;
                    }
                })
                if (walls >= 4) {
                   this.grid[e.y][e.x].set_clear();
                }
                this.propagate(e.x, e.y);
            }
        })
    }

    get_neighbours(x, y){
        return shuffle([{x: x + 1, y: y},{x: x - 1, y: y},{x: x, y: y + 1},{x: x, y: y - 1},
            {x: x + 1, y: y + 1},{x: x - 1, y: y + 1},{x: x - 1, y: y - 1},{x: x + 1, y: y - 1}]);
    }

    get_wall(x, y){
        if ((x > this.size - 1) || (x < 0) || (y > this.size - 1) || (y < 0)) { return false; }
        else {return this.grid[y][x].wall; }
    }

    create_random_grey(){
        return [0.12 + 0.1 * (0.5 - Math.random()), 0.13 + 0.1 * (0.5 - Math.random()), 0.13 + 0.1 * (0.5 - Math.random())];
    }

    generate_wall_list() {
        let output = [];
        this.grid.forEach((row, y) => {
            row.forEach((c, x) => {
                if (c.wall){
                    let wall = new Wall(maze_scale, this.size * maze_scale - (2 * x * maze_scale) - 1, this.size * maze_scale - (2 * y * maze_scale) - 1, [0.12, 0.13, 0.13]);
                    output.push(wall);
                }
            })
            
        })
        return output;
    }
    generate_spawner_list() {
        let output = [];
        this.grid.forEach((row, y) => {
            row.forEach((c, x) => {
                if (!c.wall){
                    output.push({x: this.size * maze_scale - (2 * x * maze_scale) - 1, y: this.size * maze_scale - (2 * y * maze_scale) - 1});
                }
            })
            
        })
        return output;
    }
}

const canvas = document.getElementById("game_canvas");

if (!canvas){ alert("Canvas could not be loaded"); }

canvas.width = 500;
canvas.height = 500;

const gl_canvas = new GLCanvas(canvas, 1024 * 1024, () => {
    gl_canvas.render(0);
    loop(performance.now());
});

let keys = {w: false, a: false, s: false, d: false, space: false};

document.addEventListener("keydown", (event) => {
    if (event.key === "w"){
        keys.w = true;
    } else if (event.key === "a"){
        keys.a = true;
    } else if (event.key === "s"){
        keys.s = true;
    } else if (event.key === "d"){
        keys.d = true;
    } else if (event.key === " "){
        keys.space = true;
    }
}); 
document.addEventListener("keyup", (event) => {
    if (event.key === "w"){
        keys.w = false;
    } else if (event.key === "a"){
        keys.a = false;
    } else if (event.key === "s"){
        keys.s = false;
    } else if (event.key === "d"){
        keys.d = false;
    } else if (event.key === " "){
        keys.space = false;
    }
})// Handles Keypresses

const maze_scale = 1;

let maze = new Maze(9);
maze.generate();

let entities = [new Quad(maze_scale * maze.size, [[0.32,0.38,0.42]], true)].concat(maze.generate_wall_list());
let player = new Player();
let score = 0;
let sword = null;
let particles = [];
let spawners = maze.generate_spawner_list();
let zombies = [];
let wave = 0;

function updateWorldMesh(){
    let worldMesh = [];
    let worldIndex = [];
    entities.forEach(e => {
        worldIndex = worldIndex.concat(e.get_indices(worldMesh.length / 6));
        worldMesh = worldMesh.concat(e.get_verts());
    });
    let newParticles = [];
    particles.forEach(e => {
        e.time -= 1;
        if (e.time > 0) { newParticles.push(e); }
    });
    particles = newParticles;
    particles.forEach(e => {
        worldIndex = worldIndex.concat(e.get_indices(worldMesh.length / 6));
        worldMesh = worldMesh.concat(e.get_verts());
    });
    zombies.forEach(e => {
        worldIndex = worldIndex.concat(e.get_indices(worldMesh.length / 6));
        worldMesh = worldMesh.concat(e.get_verts());
    })
    if (sword != null){
        sword.time -= 1
        if (sword.time <= 0) { sword = null }
        else {
            worldIndex = worldIndex.concat(sword.get_indices(worldMesh.length / 6));
            worldMesh = worldMesh.concat(sword.get_verts());
        }
    }
    worldIndex = worldIndex.concat(player.get_indices((worldMesh.length / 6)));
    worldMesh = worldMesh.concat(player.get_verts());

    gl_canvas.updateBuffers(worldMesh, worldIndex)
}

let frameCount = 0;
let prevFrameTimeElapsed = 0;
let prevWaveTime = 0;
let prevTime = 0;

const fps_display = document.getElementById("fps");
const zom_count_display = document.getElementById("zom_count");
const score_display = document.getElementById("score");

function loop(time){
    let frame = window.requestAnimationFrame((time) => loop(time));
    if (time - prevTime < 33){return;} // Locks to 30 steps per second
    prevTime = time;
    if (time - prevFrameTimeElapsed >= 1000) {
        fps_display.innerText = "FPS: " + frameCount;
        frameCount = 0;
        prevFrameTimeElapsed = time;
    }
    frameCount += 1;

    player.movement();
    player.attack_cd = Math.max(0, player.attack_cd - 1);

    if (time - prevWaveTime > 2000) {
        prevWaveTime = time;
        wave += 1;
        if (wave > 100){wave = 100;}
        zom_count = Math.floor(Math.sqrt(wave));
        for (let i = 0; i < zom_count; i++) {
            let spawn_point = {x: player.x, y: player.y};
            while ((spawn_point.x - player.x) * (spawn_point.x - player.x) + (spawn_point.y - player.y) * (spawn_point.y - player.y) <= 1){
                spawn_point = spawners[Math.floor(Math.random() * spawners.length)];
                spawn_point.x += Math.random() - 0.5;
                spawn_point.y += Math.random() - 0.5;
            }
            zombies.push(new Zombie(spawn_point.x, spawn_point.y));
        }
    }

    zom_count_display.innerText = "Zombies: " + zombies.length + " Wave: " + wave;

    let newZombies = [];
    zombies.forEach(e => {
        let dead = false;
        if (sword != null){
            if (sword.check_coll(e)) {
                dead = true;
                score += 1;
            }
        }
        if (dead) { return; }
        if (player.check_coll(e)){
            document.getElementById("game_over").style.display = "block";
            window.cancelAnimationFrame(frame);
        }
        e.move();
        newZombies.push(e);
    });
    zombies = newZombies;

    score_display.innerText = "Score: " + score;

    updateWorldMesh();
}