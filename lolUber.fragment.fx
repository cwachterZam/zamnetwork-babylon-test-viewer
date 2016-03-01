precision highp float;

// Using RSL lingo: http://renderman.pixar.com/view/shader-global-variables-tables

varying vec3 P; // current/view space
varying vec3 N; // current/view space

varying vec2 st;
varying vec3 Pref;

uniform vec3 cameraPosition;
uniform mat4 worldView;

uniform sampler2D albedoTexture;
uniform sampler2D emissiveTexture;
uniform sampler2D hdrTexture;
uniform float opaque;

void main(void) {

    vec4 tmp = texture2D(albedoTexture, st);
    vec3 Cs = vec3(tmp);
    float A = tmp.a;
    if (
        ((abs(opaque - 0.0) < 0.00001) && (A >= 0.975)) ||
        ((abs(opaque - 1.0) < 0.00001) && (A < 0.975))
       ) { discard; }

    ////

    vec3 nI = -P;
    vec3 nN = normalize(N);
    vec3 nfN = faceforward(nN, nI, nN);
    
    vec3 refl = reflect(P, nN);
    float m = 2.0 * sqrt(
        (refl.x * refl.x) + (refl.y * refl.y) + ((refl.z + 1.0) * (refl.z + 1.0))
    );
    vec2 lookup = refl.xy / m + 0.5;
    vec3 Env = texture2D(hdrTexture, lookup).rgb * vec3(0.15, 0.15, 0.15) * A;

    vec3 Amb = vec3(0.025, 0.025, 0.025);

	float Cfres = clamp(1.0 - dot(nI, nN), 0.0, 1.0);
    vec3 Fres = Cfres * vec3(0.5, 0.5, 0.5);

    vec3 Ci = ((Env + Amb) * Cs) + Cs + Fres;

    vec3 Cemiss = vec3(0.2, 0.2, 0.2);
    Ci += Cemiss * vec3(texture2D(emissiveTexture, st));

    gl_FragColor = vec4(Ci, A); // webGL (GLSL ES 1 style required)

    //////// Debug
    // tmp = vec4(texture2D(emissiveTexture, st));
    // tmp = tmp.bbba;
    // tmp.r = tmp.a < 0.99 ? 1.0 : 0.0;
    // tmp.g = tmp.a > 0.99 ? 0.0 : 1.0;
    // tmp.b = 0.5;
    // tmp.a = tmp.a < 0.25 ? tmp.a : 1.0;
    // gl_FragColor = tmp;
    // gl_FragColor = vec4(Fres, 1.0);
    // gl_FragColor = vec4(nN, 1.0);
   ////////
}
