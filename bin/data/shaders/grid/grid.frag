#ifdef GL_ES
precision highp float;
#endif

uniform sampler2DRect inputImage;
uniform vec2 bounds;


//--------------------------------- face info:
uniform vec2    mouth;
uniform vec2    eyel;
uniform vec2    eyer;
uniform vec2    nose;
uniform float   angle;
uniform float   faceFoundPct;

uniform float cellSize;
uniform float minScaleOnBri;
uniform float maxScaleOnBri;
//---------------------------------

mat2 rotate2d(float _angle){
    return mat2(cos(_angle),-sin(_angle),
                sin(_angle),cos(_angle));
}


void main() {
    
    vec2 pos = gl_FragCoord.xy;
    
    // vertical flip is needed
    pos.y = bounds.y - pos.y;
    
    
    float ww = cellSize;// + sin(pos.y*0.01 + pos.x*0.001)*10.;
    
    vec3 color = vec3(0.);
    
    vec2 frc = fract(pos / vec2(ww));
    vec2 flr = floor(pos / vec2(ww));
    frc -= vec2(.5);
    flr += vec2(0.5);
    float dist = distance(frc, vec2(0.0));
    
    vec3 brightness =  texture2DRect(inputImage, (flr)*ww).rgb;
    
    vec3 cam =  texture2DRect(inputImage, (frc*(pow((1.-brightness.r), 3.8)*maxScaleOnBri+minScaleOnBri)+flr)*ww).rgb;
    //vec3 cam =  texture2DRect(inputImage, (frc*3.1*(sin(dist*3.0 + brightness.r*10.))+flr)*ww).rgb;
    
    color = cam;
    //color.rgb =  vec3(pos.x / bounds.x);
    
    gl_FragColor = vec4(color,1.);
}
