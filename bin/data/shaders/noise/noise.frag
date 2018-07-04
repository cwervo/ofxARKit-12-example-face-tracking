//#ifdef GL_ES
//// define default precision for float, vec, mat.
//precision highp float;
//#endif
//
//uniform sampler2D src_tex_unit0;
//uniform float useTexture;
//uniform float useColors;
//uniform vec4 globalColor;
//
//varying float depth;
//varying vec4 colorVarying;
//varying vec2 texCoordVarying;
//
//void main(){
//    //this is the fragment shader
//    //this is where the pixel level drawing happens
//    //gl_FragCoord gives us the x and y of the current pixel its drawing
//
//    //we grab the x and y and store them in an int
////    float xVal = gl_FragCoord.x;
////    float yVal = gl_FragCoord.y;
////
////    vec4 c;
////    if(useColors>0.5){
////        c = colorVarying;
////    }else{
////        c = globalColor;
////    }
////
////    if(mod(xVal, 4.0) > 1.0 && mod(yVal, 4.0) > 1.0){
////        // leave unchanged
////    }else{
////        c.a = 0.2;
////    }
////
////    if(useTexture>0.5){
////        gl_FragColor = texture2D(src_tex_unit0, texCoordVarying) * c;
////    }else{
////        gl_FragColor = c;
////    }
//
//    float r = gl_FragCoord.x / width;
//    float g = gl_FragCoord.y / height;
//    float b = 1.0;
//    float a = 1.0;
//    //    outputColor = vec4(r, g, b, a);
//    gl_FragColor = vec4(r,g,b,a);
//}

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
    
    gl_FragColor = vec4( r, g, b, a );
}
