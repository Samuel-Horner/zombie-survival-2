precision highp float;
varying vec3 vColor;
uniform float u_res;

void main() {
    vec2 uv = gl_FragCoord.xy / u_res;
    gl_FragColor = vec4(vColor, 1.);
}