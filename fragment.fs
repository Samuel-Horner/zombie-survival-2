precision mediump float;
varying vec3 vColor;

uniform float u_res;
uniform float u_time;

const float PHI = 1.61803398874989484820459;

float gold_noise(in vec2 xy, in float seed){
    return fract(tan(distance(xy*PHI, xy)*seed)*xy.x);
}

vec3 grain(in vec3 col, in float intensity, in vec2 xy) {
    intensity = intensity * 0.7;
    return col * ((1.-intensity) + (intensity) * gold_noise(xy, max(fract(u_time),0.1)));
}

void main() {
    vec2 uv = gl_FragCoord.xy / u_res;
    vec2 cuv = (uv - vec2(0.5,0.5)) * 2.;
    gl_FragColor = vec4(grain(vColor, dot(cuv, cuv), gl_FragCoord.xy), 1.);
}