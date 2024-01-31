let prevTime = 0;

const canvas = document.getElementById("game_canvas");

if (!canvas){ alert("Canvas could not be loaded"); }

canvas.width = 500;
canvas.height = 500;

const gl_canvas = new GLCanvas(canvas, 1024, () => {
    gl_canvas.render(0);
    loop(performance.now());
});

let worldMesh = [0,0.5,0,1,0,0,0.5,-0.5,0,0,1,0,-0.5,-0.5,0,0,0,1];
let worldIndex = [0,1,2];

function loop(time){
    window.requestAnimationFrame((time) => loop(time));
    if (time - prevTime < 50){return;} // Locks to 20 steps per second
    console.log(time - prevTime);
    prevTime = time;
    gl_canvas.updateBuffers(worldMesh, worldIndex);
    gl_canvas.updateCamera((Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2);
}