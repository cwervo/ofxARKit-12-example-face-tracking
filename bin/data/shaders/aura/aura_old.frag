//#ifdef GL_ES
//precision highp float;
//#endif
//
//uniform sampler2DRect inputImage;
//uniform vec2 bounds;
//
//
////--------------------------------- face info:
//uniform vec2    mouth;
//uniform vec2    eyel;
//uniform vec2    eyer;
//uniform vec2    nose;
//uniform float   angle;
//uniform float   faceFoundPct;
//
//uniform float cellSize;
//uniform float minScaleOnBri;
//uniform float maxScaleOnBri;
////---------------------------------
//
//mat2 rotate2d(float _angle){
//    return mat2(cos(_angle),-sin(_angle),
//                sin(_angle),cos(_angle));
//}
//
//
//void main() {
//
//    vec2 pos = gl_FragCoord.xy;
//
//    // vertical flip is needed
//    pos.y = bounds.y - pos.y;
//
//
//    float ww = cellSize;// + sin(pos.y*0.01 + pos.x*0.001)*10.;
//
//    vec3 color = vec3(0.);
//
//    vec2 frc = fract(pos / vec2(ww));
//    vec2 flr = floor(pos / vec2(ww));
//    frc -= vec2(.5);
//    flr += vec2(0.5);
//    float dist = distance(frc, vec2(0.0));
//
//    vec3 brightness =  texture2DRect(inputImage, (flr)*ww).rgb;
//
//    vec3 cam =  texture2DRect(inputImage, (frc*(pow((1.-brightness.r), 3.8)*maxScaleOnBri+minScaleOnBri)+flr)*ww).rgb;
//    //vec3 cam =  texture2DRect(inputImage, (frc*3.1*(sin(dist*3.0 + brightness.r*10.))+flr)*ww).rgb;
//
//    color = cam;
//    //color.rgb =  vec3(pos.x / bounds.x);
//
//    gl_FragColor = vec4(color,1.);
//}

#ifdef GL_ES
precision mediump float;
#endif

uniform sampler2DRect inputImage;

uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float u_time;

float random (in vec2 _st) {
    return fract(sin(dot(_st.xy,
                         vec2(12.9898,78.233)))*
                 43758.5453123);
}

// Based on Morgan McGuire @morgan3d
// https://www.shadertoy.com/view/4dS3Wd
float noise (in vec2 _st) {
    vec2 i = floor(_st);
    vec2 f = fract(_st);
    
    // Four corners in 2D of a tile
    float a = random(i);
    float b = random(i + vec2(1.0, 0.0));
    float c = random(i + vec2(0.0, 1.0));
    float d = random(i + vec2(1.0, 1.0));
    
    vec2 u = f * f * (3.0 - 2.0 * f);
    
    return mix(a, b, u.x) +
    (c - a)* u.y * (1.0 - u.x) +
    (d - b) * u.x * u.y;
}

#define NUM_OCTAVES 5

float fbm ( in vec2 _st) {
    float v = 0.0;
    float a = 0.5;
    vec2 shift = vec2(100.0);
    // Rotate to reduce axial bias
    mat2 rot = mat2(cos(0.5), sin(0.5),
                    -sin(0.5), cos(0.50));
    for (int i = 0; i < NUM_OCTAVES; ++i) {
        v += a * noise(_st);
        _st = rot * _st * 2.0 + shift;
        a *= 0.5;
    }
    return v;
}

void main() {
    vec2 st = gl_FragCoord.xy/u_resolution.xy*3.;
    vec3 color = vec3(0.0);
    
    vec2 q = vec2(0.);
    q.x = fbm( st + u_time);
    q.y = fbm( st + vec2(1.0));
    
    vec2 r = vec2(0.);
    r.x = fbm( st + 1.0*q + vec2(1.7,9.2)+ 0.15*u_time );
    r.y = fbm( st + 1.0*q + vec2(8.3,2.8)+ 0.126*u_time);
    
    float f = fbm(st+r);
    
    st = vec2( fbm( st + vec2(0.0,0.0) ),
              fbm( st + vec2(-0.300,-0.380 * u_time * 1.) ) );
    
    r = vec2( fbm( st + 4.0*st + vec2(0.180,-0.240) ),
             fbm( st + 4.0*st + vec2(-0.240,0.170) ) );
    
    f =  fbm( st + 4.0*r );
    
    color = mix(vec3(0.667,0.405,0.228),
                vec3(0.666667,0.666667,0.498039),
                clamp((f*f)*4.0,0.0,1.0));
    
    color = mix(color,
                vec3(0,0,0.164706),
                clamp(length(q),0.0,1.0));
    
    color = mix(color,
                vec3(0.666667,1,1),
                clamp(length(r.x),0.0,1.0));
    color = vec3((f*f*f+.6*f*f+.5*f)*color);
    color = texture2DRect(inputImage, vec2(1., 1.)).rgb;
//    color = mix(color,
//                texture2DRect(inputImage, gl_FragCoord.xy/u_resolution.xy).rgb,
//                1.);
    gl_FragColor = vec4(color, 1.);
}
