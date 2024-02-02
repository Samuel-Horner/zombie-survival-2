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

class Cell {
    constructor(){
        this.wall = true;
        this.visited = false;
    }

    set_wall() {
        this.wall = true;
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

    print() {
        this.grid.forEach(row => {
            let output = "";
            row.forEach(c => {
                if (c.wall){ output += "0 "}
                else {output += ". "}
            })
            console.log(output)
        })
    }
}

let maze = new Maze(9);
maze.generate();
maze.print();