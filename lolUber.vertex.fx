precision highp float;
 
// Attributes - N.B.: raw/object space
attribute vec3 position;
attribute vec2 uv;
attribute vec3 normal;
attribute vec3 rest;

// Uniforms
uniform mat4 world, worldView, worldViewProjection, inverseTransposeWorldView;

// Normal
varying vec2 st;
varying vec3 N;
varying vec3 P;
varying vec3 Pref;

void main(void) {
    gl_Position = worldViewProjection * vec4(position, 1.0); // webGL (GLSL ES 1 style required)

    P = vec3(worldView * vec4(position, 1.0));
    N = vec3(inverseTransposeWorldView * vec4(normal, 0.0));

    st = uv;
    Pref = rest;
    Pref = vec3(rest.x, rest.y, 0);
}
