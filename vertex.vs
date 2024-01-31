attribute vec3 a_position;
attribute vec3 a_color;

uniform vec2 cam_pos;

varying vec3 vColor;

void main() {
    gl_Position = vec4(a_position.xy - cam_pos, a_position.z, 1.);
    vColor = a_color;
}