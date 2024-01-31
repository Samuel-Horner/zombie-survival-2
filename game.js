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
        this.verts.forEach((e, i) => {
            this.verts[i] = Entity.updateArray(e, this.x, this.y);
        })
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
    constructor(size, colors){
        if (colors.length > 1){
            super(
                [[-size,size,0].concat(colors[0]),
                [size,size,0].concat(colors[1]),
                [-size,-size,0].concat(colors[2]),
                [size,-size,0].concat(colors[3])],
                [0,1,2,1,2,3]);
        } else{
            super(
                [[-size,size,0].concat(colors[0]),
                [size,size,0].concat(colors[0]),
                [-size,-size,0].concat(colors[0]),
                [size,-size,0].concat(colors[0])],
                [0,1,2,1,2,3]);
        }
    }
}

class Player extends Quad {
    constructor() {
        super(0.1, [[1,0,0]]);
        this.speed = 0.05;
    }

    movement(){
        if (keys.w){ this.move(0, 1); }
        if (keys.a){ this.move(-1, 0); }
        if (keys.s){ this.move(0, -1); }
        if (keys.d){ this.move(1, 0); }
    }

    move(x, y){
        this.x += x * this.speed;
        this.y += y * this.speed;
        //gl_canvas.updateCamera(this.x, this.y);
    }
}


let prevTime = 0;

const canvas = document.getElementById("game_canvas");

if (!canvas){ alert("Canvas could not be loaded"); }

canvas.width = 500;
canvas.height = 500;

const gl_canvas = new GLCanvas(canvas, 1024, () => {
    gl_canvas.render(0);
    loop(performance.now());
});

let keys = {w: false, a: false, s: false, d: false};

document.addEventListener("keydown", (event) => {
    if (event.key === "w"){
        keys.w = true;
    } else if (event.key === "a"){
        keys.a = true;
    } else if (event.key === "s"){
        keys.s = true;
    } else if (event.key === "d"){
        keys.d = true;
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
    }
})// Handles Keypresses

let player = new Player();

let entities = [new Quad(3, [[1,1,1]])];

function updateWorldMesh(){
    let worldMesh = [];
    let worldIndex = []
    entities.forEach(e => {
        worldIndex = worldIndex.concat(e.get_indices(worldMesh.length / 6));
        worldMesh = worldMesh.concat(e.get_verts());
    });
    worldIndex = worldIndex.concat(player.get_indices((worldMesh.length / 6)));
    worldMesh = worldMesh.concat(player.get_verts());

    gl_canvas.updateBuffers(worldMesh, worldIndex)
}

function loop(time){
    window.requestAnimationFrame((time) => loop(time));
    if (time - prevTime < 50){return;} // Locks to 20 steps per second
    prevTime = time;
    player.movement();
    updateWorldMesh();
}