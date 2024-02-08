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
        super(size, x, y, [0., 0., 1.], 10, true);
    }
}

class Player extends Quad {
    constructor() {
        super(0.1, [[1,0,0]], true);
        this.speed = 0.05;
        this.direction = {x: 0, y: 0};
        this.attack_cd = 0;
        this.dir_indicator = new Quad(0.01, [[0,0,1]], false);
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

    get_indices(mesh_length) {
        return super.get_indices(mesh_length).concat(this.dir_indicator.get_indices(mesh_length));
    }
    get_verts() {
        return super.get_verts().concat(this.dir_indicator.get_verts());
    }

    move(x, y){
        this.direction = {x: x, y: y};
        this.dir_indicator.set_pos(this.x + this.direction.x * 0.1, this.y + this.direction.y * 0.1);
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
        console.log(this.direction);
        particles.push(new Sword(0.2, this.x + this.direction.x * 0.2, this.y + this.direction.y * 0.2));
        this.attack_cd = 20;
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
let particles = [];

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
    })
    worldIndex = worldIndex.concat(player.get_indices((worldMesh.length / 6)));
    worldMesh = worldMesh.concat(player.get_verts());

    gl_canvas.updateBuffers(worldMesh, worldIndex)
}

let frameCount = 0;
let prevFrameTimeElapsed = 0;
let prevTime = 0;

const fps_display = document.getElementById("fps");

function loop(time){
    window.requestAnimationFrame((time) => loop(time));
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

    updateWorldMesh();
}