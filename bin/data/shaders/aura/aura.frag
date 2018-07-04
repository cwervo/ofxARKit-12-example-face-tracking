precision highp float;

uniform sampler2D src_tex_unit0;
uniform float useTexture;
uniform float useColors;
uniform vec4 globalColor;

varying float depth;
varying vec4 colorVarying;
varying vec2 texCoordVarying;

void main() {
   // gl_FragCoord contains the window relative coordinate for the fragment.
   // we use gl_FragCoord.x position to control the red color value
   // we use gl_FragCoord.y position to control the green color value
   // please note that all r, g, b, a values are between 0 and 1

   float windowWidth = 768.0;
   float windowHeight = 1024.0;

   float r = gl_FragCoord.x / windowWidth;
   float g = gl_FragCoord.y / windowHeight;
   float b = 1.0;
   float a = 1.0;

   vec4 col = vec4( r, g, b, a );

   gl_FragColor = col;
}
