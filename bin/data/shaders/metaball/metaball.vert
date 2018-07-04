attribute vec4 position;
attribute vec4 color;
attribute vec4 normal;
attribute vec2 texcoord;

uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;

uniform mat4 cameraMatrix;

varying vec4 colorVarying;
varying vec2 texCoordVarying;

// Version 3
// https://stackoverflow.com/questions/5149544/can-i-generate-a-random-number-inside-a-pixel-shader
float random( vec2 p )
{
    vec2 K1 = vec2(
        23.14069263277926, // e^pi (Gelfond's constant)
         2.665144142690225 // 2^sqrt(2) (Gelfondâ€“Schneider constant)
    );
    return fract( cos( dot(p,K1) ) * 12345.6789 );
}

void main() {
    vec4 pos = projectionMatrix * modelViewMatrix * position;
    // pos.z *= random(vec2(1., 2.));
    
    /*
     TODO: April 5, afternoon:
     
     - Remove (but document in AR Notion note?) cameraMatrix b/c it's an illusion
     - Transform cameraMatrix into 2d screen points (definitely should be iOS utilities for that?) & then add that offset to pos??
     
     */
    
    gl_Position = pos;
}
