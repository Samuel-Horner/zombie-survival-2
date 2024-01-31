class GLCanvas {
    constructor(canvas, max_buffer_size = 1024, final_callback) {
        this.ready = false;
        this.canvas = canvas;
        /* Init webgl */
        this.gl = canvas.getContext("webgl");
        if (!this.gl) {
            alert("Failed to load webgl");
            return;
        }
        this.gl.viewport(0,0, this.gl.drawingBufferWidth, this.gl.drawingBufferHeight);
        this.gl.clearColor(1.0, 0.5, 1.0, 1.0);
        
        this.max_buffer = max_buffer_size;

        /* Load Shaders */
        /* This will also call initBuffers() once the program is initialised. */
        this.loadShaders().then(() => {
            this.initBuffers();
            this.ready = true;
            final_callback();
        });
    }

    async loadShaders(){
        /* Get shader source */
        const fragment_source = await fetch("fragment.fs").then(res => {
            return res.text();
        });
        const vertex_source = await fetch("vertex.vs").then(res => {
            return res.text();
        });
        /* Create shaders */
        const vertex_shader = GLCanvas.#loadShader(this.gl, this.gl.VERTEX_SHADER, vertex_source);
        const fragment_shader = GLCanvas.#loadShader(this.gl, this.gl.FRAGMENT_SHADER, fragment_source);
        /* Create program */
        const shader_program = this.gl.createProgram();
        this.gl.attachShader(shader_program, vertex_shader);
        this.gl.attachShader(shader_program, fragment_shader);
        this.gl.linkProgram(shader_program);

        /* Check compilation */
        if (!this.gl.getProgramParameter(shader_program, this.gl.LINK_STATUS)){
            alert(`Unable to link shader program:\n ${this.gl.getProgramInfoLog(shader_program)}`);
            return null;
        }

        /* Store attrib/uniform locations and program */
        this.program = {
            program: shader_program,
            attrib_loc: {
                vertex_loc: this.gl.getAttribLocation(shader_program, "a_position"),
                color_loc: this.gl.getAttribLocation(shader_program, "a_color")
            },
            uniform_loc: {
                res_loc: this.gl.getUniformLocation(shader_program, "u_res")
            }
        };
        this.gl.useProgram(this.program.program);
    }

    initBuffers() {
        /* Bind data buffers */
        this.vert_buffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vert_buffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, this.max_buffer, this.gl.DYNAMIC_DRAW);
        // this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array([0,0.5,0,1,0,0,0.5,-0.5,0,0,1,0,-0.5,-0.5,0,0,0,1]), this.gl.DYNAMIC_DRAW);

        this.indices_buffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.indices_buffer);
        this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, this.max_buffer, this.gl.DYNAMIC_DRAW);
        // this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, new Uint16Array([0,1,2]), this.gl.DYNAMIC_DRAW);


        this.gl.vertexAttribPointer(
            this.program.attrib_loc.vertex_loc,
            3,
            this.gl.FLOAT,
            false,
            6 * Float32Array.BYTES_PER_ELEMENT,
            0
        );

        this.gl.vertexAttribPointer(
            this.program.attrib_loc.color_loc,
            3,
            this.gl.FLOAT,
            true,
            6 * Float32Array.BYTES_PER_ELEMENT,
            3 * Float32Array.BYTES_PER_ELEMENT
        );

        this.gl.enableVertexAttribArray(this.program.attrib_loc.vertex_loc);
        this.gl.enableVertexAttribArray(this.program.attrib_loc.color_loc);

        this.indices_length = 0;
    }

    async updateBuffers(vertices_source, indices_source) {
        if (!this.ready){return;}
        this.indices_length = indices_source.length;
        this.gl.bufferSubData(this.gl.ARRAY_BUFFER, 0, new Float32Array(vertices_source));
        this.gl.bufferSubData(this.gl.ELEMENT_ARRAY_BUFFER, 0, new Uint16Array(indices_source));
    }

    render(time) {
        window.requestAnimationFrame((time) => this.render(time), this.canvas);
        if (!this.ready){return;}

        this.gl.viewport(0, 0, this.gl.drawingBufferWidth, this.gl.drawingBufferHeight);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);

        this.gl.uniform1f(this.program.uniform_loc.res_loc, this.canvas.width);   

        this.gl.drawElements(this.gl.TRIANGLES, this.indices_length, this.gl.UNSIGNED_SHORT, 0);
    }

    static #loadShader(gl, shader_type, shader_source){
        const shader = gl.createShader(shader_type);
        gl.shaderSource(shader, shader_source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)){
            alert(`${shader_type == gl.VERTEX_SHADER ? "The vertex shader" : "The fragment shader"} 
                    could not be compiled:\n${gl.getShaderInfoLog(shader)}`);
            gl.deleteShader(shader);
            return null;
        }
        return shader;
    }
}

const canvas = document.getElementById("game_canvas");

if (!canvas){ alert("Canvas could not be loaded"); }

canvas.width = 500;
canvas.height = 500;

const gl_canvas = new GLCanvas(canvas, 1024, () => {
    gl_canvas.render(0);
    setTimeout(() => {
        gl_canvas.updateBuffers([
            0,0.5,0,1,0,0,
            0.5,-0.5,0,0,1,0,
            -0.5,-0.5,0,0,0,1
        ], [0, 1, 2]);
    }, 1000);
});