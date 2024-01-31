attribute vec3 a_position;
attribute vec3 a_color;
varying vec3 vColor;

void main() {
    gl_Position = vec4(a_position, 1.);
    vColor = a_color;
}