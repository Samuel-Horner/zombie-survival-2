class Cell {
    constructor(wall){
        this.wall = wall;
    }
}

class Maze {
    constructor(width, cell_scale){
        this.width = width
        this.cells = [new Cell(true),new Cell(true),new Cell(true),
                    new Cell(true),new Cell(false),new Cell(true),
                    new Cell(true),new Cell(true),new Cell(true)];
        this.generate();
    }

    generate(){
        if (Math.sqrt(this.cells.length) >= this.width) {return;}
        this.tile();
    }   

    tile(){
        let currentWidth = Math.sqrt(this.cells.length);
        let newCells = [];
        for (let i = 0; i < this.cells.length; i += currentWidth){
            newCells = newCells.concat(this.cells.slice(i, i + currentWidth));
            newCells = newCells.concat(this.cells.slice(i, i + currentWidth));
        }
        for (let i = 0; i < this.cells.length; i += currentWidth){
            newCells = newCells.concat(this.cells.slice(i, i + currentWidth));
            newCells = newCells.concat(this.cells.slice(i, i + currentWidth));
        }
        this.cells = newCells;
        this.print(6)
    }

    print(cells_per_line) {
        let output = "";
        this.cells.forEach((c, i) => {
            if (c.wall) { output+= "0" }
            else {output += "."}
            if ((i + 1) % cells_per_line == 0) {output += "\n";} 
        });
        console.log(output);
    }
}

let test = new Maze(3 * 3 * 3,0);