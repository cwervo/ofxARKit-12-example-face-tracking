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
uniform vec2    smileScore;
uniform float   angle;
uniform float   faceFoundPct;

uniform float uTime;
uniform float u_time;
uniform vec2 u_resolution;

uniform float cellSize;
uniform float minScaleOnBri;
uniform float maxScaleOnBri;
uniform vec2 circleCenter;

uniform bool marbleShaderOn;
uniform bool useEmotionData;
uniform bool mixWithCamera;
uniform bool clearAroundFace;
uniform float cameraMixLevel;
uniform bool addMetaBalls;

// FBM uniforms
uniform vec3 color1;
uniform vec3 color2;
uniform vec3 color3;
uniform vec3 color4;
uniform vec2 speedFactorVec;
uniform float metaBallRadius;
uniform bool diffuseMetaballCenter;
uniform vec3 metaBallColor;
//---------------------------------

mat2 rotate2d(float _angle){
    return mat2(cos(_angle),-sin(_angle),
                sin(_angle),cos(_angle));
}

// this calculates the minimum distance from point (p) to line (v,w)
float minimum_distance(vec3 v, vec3 w, vec3 p) {
    // Return minimum distance between line segment vw and point p
    float l2 =  distance(v,w);
    l2 = l2*l2; //(v-w).lengthSquared();  // i.e. |w-v|^2 -  avoid a sqrt
    if (l2 == 0.0) return distance(p,v);   // v == w case
    float t = dot((p-v),(w - v)) / l2;
    if (t < 0.0) return distance(p,v);       // Beyond the 'v' end of the segment
    else if (t > 1.0) return distance(p,w);  // Beyond the 'w' end of the segment
    vec3 projection = v + t * (w - v);  // Projection falls on the segment
    return distance(p,projection);
}

// FBM shader functions from:
// https://thebookofshaders.com/13/

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

float rotationFidelity = 2.;

float fbm ( in vec2 _st) {
    float v = 0.0;
    float a = 0.5;
    vec2 shift = vec2(80.0);
    // Rotate to reduce axial bias
    mat2 rot = mat2(cos(.6), sin(-1.516),
                    -sin(0.516), cos(0.772));
    for (int i = 0; i < NUM_OCTAVES; ++i) {
        v += a * noise(_st) * noise(_st);
        _st = rot * _st * rotationFidelity + shift;
        a *= 0.5;
    }
    return v;
}

// end FBM shader functions

float circle(in vec2 _st, in float _radius, in vec2 _center){
    vec2 dist = _st-vec2(_center);
    return 1.-smoothstep(_radius-(_radius*0.01),
                         _radius+(_radius*0.01),
                         dot(dist,dist)*4.0);
}

float inverseCircle(in vec2 _st, in float _radius, in vec2 _center){
    vec2 dist = _st-vec2(_center);
    return smoothstep(_radius-(_radius*0.01),
                         _radius*0.5+(_radius*0.9),
                         dot(dist,dist)*4.0);
}

float inverseOval(in vec2 _st, in float _radius, in vec2 _center){
    vec2 dist = _st-vec2(_center);
    dist.x *= 1.5;
    return smoothstep(_radius-(_radius*0.01),
                      _radius+(_radius*0.9),
                      dot(dist,dist * .25)*4.0);
}

float ball(vec2 p, float fx, float fy, float ax, float ay) {
    vec2 r = vec2(p.x + sin(u_time * fx) * ax, p.y + cos(u_time * fy) * ay);
    return smoothstep(0., 2., metaBallRadius / length(r));
}

void main() {
    
   // float uTime = 0.0;
    float faceRotation = 0.0;
    
    vec2 pos = gl_FragCoord.xy;
    
    // vertical flip is needed
    pos.y = bounds.y - pos.y;
    
    float smileFactor = 1.;
    
    if (useEmotionData) {
        smileFactor = 1.5 * normalize(smileScore).y;
    }
    
    // ----- start actual FBM shader stuff
    vec2 st = gl_FragCoord.xy/u_resolution.xy*3.;
    // st += st * abs(sin(u_time*0.1)*3.0);
    vec3 color = vec3(0.0);
    
    vec2 q = vec2(0.);
    q.x = fbm( st + 0.00*u_time);
    q.y = fbm( st + vec2(1.0));

    if (false) {
        vec2 r = vec2(0.);
        //    r.x = fbm( st + 1.0*q + vec2(-0.340,-0.020)+ 0.15*u_time );
        r.x = fbm( st + 1.0*q + vec2(-0.440,-0.050 * smileFactor * 10.0)+ speedFactorVec.x*u_time ) ;
        r.y = fbm( st + 1.0*q + vec2(0.100*10.0 ,0.030)+ speedFactorVec.y*u_time);
        
        float f = fbm(st+r);

        /*
         TODO: expose a bunch of these as GUI variables to play around with!
         */
        
        color = mix(color1,
                    color2 * smileFactor,
                    clamp((f*f)*4.0,0.0,1.0));
        
        color = mix(color,
                    color3,
                    clamp(length(q),0.0,1.0));
        
        color = mix(color,
                    color4,
                    clamp(length(r.x),0.0,1.0));
        
        if (marbleShaderOn) {
            color = vec3((f*f*f+.6*f*f+.5*f)*color);
        }
    }
    // ----- end FBM shader stuff
    
    vec3 cam = texture2DRect(inputImage, pos).rgb * 1.5;
    
    if (addMetaBalls) {
        vec2 q = pos / u_resolution.xy;
        vec2 p = -0.75 + 3. * q;
        p.x   *= u_resolution.x / u_resolution.y;
        
        float col = 0.0;
        col += ball(p, 0.2, 2.0, 0.1, 0.2);
        col += ball(p, 1.5, 2.5, 0.2, 0.3);
        col += ball(p, 2.0, 3.0, 0.3, 0.4);
        col += ball(p, 2.5, 3.5, 0.4, 0.5);
        col += ball(p, 3.0, 4.0, 0.5, 0.6);
        col += ball(p, 1.5, 0.5, 0.6, 0.7);
        col += ball(p, 0.1, .5, 0.6, 0.7);
        
        if (diffuseMetaballCenter) {
            col = max(mod(col, 0.1), min(col, 2.0));
        }
//        color = mix(cam, vec3(col * 0.8, col * 0.2, col * 0.3), 1.0);
        color = mix(color, vec3(col * metaBallColor.x, col * metaBallColor.y, col * metaBallColor.z), .75);
    }
    
    // Try out a softer version of: http://glslsandbox.com/e#45573.0
    if (false) {
        vec2 p =  pos / u_resolution.xy ;
        vec3 col = vec3(0.0);
        
        //    for(float j = 4.0; j > 0.0; j--) {
        for(float j = 0.0; j < 4.0; j++) {
            for(float i = 1.0; i < 7.0; i++) {
                p.x += 0.1 / (i + j) * sin(i * 4.00 * p.y + u_time * 2.19 + cos((0.8335 * u_time / (7.11 * i)) * i - j));
                p.y += 0.1 / (i + j) * cos(i * 8.00 * p.x + u_time * 1.32 + sin((u_time * 0.7713 / (6. * i)) * i + j));
            }
            
            col[int(j)] = (cos(7.0*p.x*p.x) + sin(7.0*p.y*p.y)) ;
        }
        
        color = vec3(0.45 * col   + sin(0.5));
    }
    
    #define MAX_ITER 10
    
    if (false) {
        vec2 p = pos*.05;
        vec2 i = p;
        float c = 0.0;
        float inten = 0.5;
        
        for (int n = 0; n < MAX_ITER; n++) {
            float t = 0.5*u_time * (1.0 - (1.0 / float(n+1)));
            i = p + vec2(
                         cos(t + i.x*2.1) - sin(t + i.y*1.99),
                         sin(t + i.y*2.21) + cos(t + i.x*1.9)
                         );
            c += 1.0/length(vec2(
                                 (sin(i.x+t)/inten),
                                 (cos(i.y+t)/inten)
                                 )
                            );
        }
        c /= float(MAX_ITER);
        
        vec3 col = c*vec3(0.01, 0.19, .51);
        
        if (mixWithCamera) {
            col *= cam;
        }
        
        color = col;
    }
    
    // Watery shader
    if (false) {
        vec2 sp = pos * 0.001;//vec2(.4, .7);
        vec2 p = sp*6.0 - vec2(125.0);
        vec2 i = p;
        float c = 1.0;
        float cc = fract(1.);
        int ccc = int(cc);
        float rc = 0.0;
        float time = u_time;
        float inten = 0.0095;
        
        for (int n = 0; n < MAX_ITER; n++)
        {
            float t = time* (0.05 - (0.75 / float(n+1)));
            i = p + vec2(rc*0.4+sin(i.x+time*0.24+cos(i.y+sin(cos(t - i.x) + sin(t + i.y))+time*0.35)),
                         rc*0.4+sin(i.y+time*0.23+cos(i.x+cos(sin(t - i.y) + cos(t + i.x))+time*0.26)));
            c += 1.0/length(vec2(p.x / (sin(i.x+t)/inten),p.y / (cos(i.y+t)/inten)));
            rc = c+rc*0.9;
        }
        c /= float(MAX_ITER);
        c = 1.5-sqrt(c);
        float cb = pow(c,10.0);
        float cr = cb;
        float cg = cr;
        color = vec3(cr*.8,cg*0.8,cb*5.0);
    }
    
    if (clearAroundFace) {
//        color *= vec3(inverseCircle(st, 0.5, circleCenter));
//        color *= vec3(inverseCircle(st, 0.5, nose / (u_resolution.xy * 0.4)));
        color *= vec3(inverseOval(st, 0.5, nose / (u_resolution.xy * 0.5)));
        //            color *= vec3(circle(st, smileFactor, nose / (u_resolution.xy * 0.5)));
    }
    
    if (mixWithCamera) {
        color = mix(cam, color.rgb, cameraMixLevel  * distance(pos, nose) * 0.2);
//        color = mix(cam, color.rgb, cameraMixLevel);
    }
    
    float shaderAlpha = distance(st, nose);
    
//    color *= mix(cam, vec3(.5, .2, 0.), 0.5);
    gl_FragColor = vec4(color, shaderAlpha);
}
