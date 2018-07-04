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

uniform float uTime;

uniform float cellSize;
uniform float minScaleOnBri;
uniform float maxScaleOnBri;
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


void main() {
    
   // float uTime = 0.0;
    float faceRotation = 0.0;
    
    vec2 pos = gl_FragCoord.xy;
    
    // vertical flip is needed
    pos.y = bounds.y - pos.y;
    
    
    //vec2 mouth = uRenderSize*0.5 + -vec2(mouth_x, mouth_y)*2.1;
    vec2 leftEye = eyel;
    vec2 rightEye = eyer;
    vec2 nose = nose;


    vec3 cam =  texture2DRect(inputImage, pos).rgb;
    
    // mid point based on face points:
    vec2 midPt = (mouth + leftEye + rightEye + nose) / 4.0;
    
    // eye distance is good for scaling (ie, change the size of things based on face size)
    float eyeDist = distance(rightEye, leftEye);
    
    // since I use glFragCoord this is an alternative
    vec2 pixel = pos; //uRenderSize*uv;
    
    // color add me is for the glow
    // total dist is how much did we add color wise to this pixel
    vec3 colorAddMe = vec3(0.0);
    float totalDist = 0.0;
    
    // draw 15 lines:
    for (int i = 0; i < 15; i++){
        
        // where are we in two pi-ish
        float iPct = (float(i) / 15.0) * 6.26;
        
        // what color is this line.  this just messing around with sin for color,
        // using pct and face rotation
        // we could do something else here too like LUT, etc.
        vec3 colorToAdd = vec3(sin( sin(iPct)*1.2 + faceRotation*1.0  + 1.0)*0.2+ 0.8,
                               sin(sin(iPct)*13.3 + faceRotation*1.0 + 1.0)*0.2+ 0.8,
                               sin(sin(iPct)*6.4 + faceRotation*1.0 + 1.0)*0.2+ 0.8) * 1.1;
        
        colorToAdd = min(colorToAdd, vec3(1.0));
        // center of the line
        vec2 center = eyel;
        
        // radius A and B for the line:
        float radiusA = eyeDist*0.1 + 0.6 * sin(uTime);
        float radiusB = radiusA + 1000.8 + abs(faceRotation)*202.0; //radiusA + 300.0 * (sin(uTime)*0.5+0.5);
        
        // angle of the line -- use face rotation to change this
        float angle = (float(i)/15.0) * 6.28 + faceRotation + mod(uTime, 6.28)*faceRotation + uTime*1.1;
        
        // points a and b of the line:
        vec3 a = vec3(center + vec2(cos(angle), sin(angle)) * radiusA, 1.0);
        vec3 b = vec3(center + vec2(cos(angle), sin(angle)) * radiusB, 1.0);
        
        // points c for the minimum distance function (needs to be a vec3) :
        vec3 pos = vec3(pixel.xy,0.0);
        
        // calc the distance from pixel to line:
        float distToLine = minimum_distance(a,b,pos);
        // pow can change the effect a bit:
        float dist = 100.0 / pow(distToLine ,0.9);
        // sum into total distance and color
        if (sin( float(i)*1.1 + uTime*10.0) > 0.){
        totalDist += dist;
        colorAddMe += colorToAdd * dist;
        }
        
    }
    
    
    for (int i = 0; i < 15; i++){
        
        // where are we in two pi-ish
        float iPct = (float(i) / 15.0) * 6.26;
        
        // what color is this line.  this just messing around with sin for color,
        // using pct and face rotation
        // we could do something else here too like LUT, etc.
        vec3 colorToAdd = vec3(sin( sin(iPct)*1.2 + faceRotation*1.0  + 1.0)*0.2+ 0.8,
                               sin(sin(iPct)*13.3 + faceRotation*1.0 + 1.0)*0.2+ 0.8,
                               sin(sin(iPct)*6.4 + faceRotation*1.0 + 1.0)*0.2+ 0.8) * 1.1;
        
        colorToAdd = min(colorToAdd, vec3(1.0));
        // center of the line
        vec2 center = eyer;
        
        // radius A and B for the line:
        float radiusA = eyeDist*0.1 + 0.6 * sin(uTime * -1.);
        float radiusB = radiusA + 1000.8 + abs(faceRotation)*202.0; //radiusA + 300.0 * (sin(uTime)*0.5+0.5);
        
        // angle of the line -- use face rotation to change this
        float angle = (float(i)/15.0) * 6.28 + faceRotation + mod(uTime, 6.28)*faceRotation + uTime*-1.1;
        
        // points a and b of the line:
        vec3 a = vec3(center + vec2(cos(angle), sin(angle)) * radiusA, 1.0);
        vec3 b = vec3(center + vec2(cos(angle), sin(angle)) * radiusB, 1.0);
        
        // points c for the minimum distance function (needs to be a vec3) :
        vec3 pos = vec3(pixel.xy,0.0);
        
        // calc the distance from pixel to line:
        float distToLine = minimum_distance(a,b,pos);
        // pow can change the effect a bit:
        float dist = 100.0 / pow(distToLine ,.9);
        // sum into total distance and color
        if (sin( float(i)*1.1 + uTime*10.0) > 0.){
            totalDist += dist;
            colorAddMe += colorToAdd * dist;
        }
        
    }
    
    // normalize color
    colorAddMe /= totalDist;
    
    
    // this is some weird compositing magic to make things look good -- not sure the best way to explain it :)
    
    // now, add the glow color to a grayscale (use red channel) version of the video darkened a little
    // and multipied by the glow channel
    vec4 color = vec4(vec3(cam*0.4), 1.2); //* vec4(colorAddMe, 1.0);
    // adjust the glow channel.
    
    //color /= vec4(colorAddMe, 1.0) * 1.3;
    
    colorAddMe = pow(colorAddMe, vec3(40.3));
    // add it on top
    
    
    color += vec4(colorAddMe, 1.0) * 0.9;
    
    gl_FragColor = vec4( color.rgb,1.0);
    
    
    
    
//    //vec3 color = cam;
//
//
//
//    //color *= 0.9;
//    vec3 colorAddMe = vec3(0.0);
//    float totalDistance = 0.0;
//
//    for (int i = 0; i < 10; i++){
//        float distToLine = minimum_distance(vec3(eyer.x, eyer.y+ float(i)*30.0, 0.0),
//                                      vec3(eyel.x, eyel.y + float(i)*30.0, 0.0),
//                                      vec3(pos.x, pos.y, 0.0));
//        float dist = 100.0 / pow(distToLine, 10.0);
//
//        totalDistance += dist;
//
//        colorAddMe += vec3(1.0,0.0, 0.0)*dist;
//        //color = color + pct*vec3(1.0, 0.0, 0.0);
//    }
//
//    colorAddMe /= totalDistance;
//
//    vec4 color = vec4(vec3(cam.r*0.8 + 0.0), 1.2) * vec4(colorAddMe, 1.0);
//    // adjust the glow channel.
//   // colorAddMe = pow(colorAddMe, vec3(8.3));
//    // add it on top
//    //color += vec4(colorAddMe, 1.0) * 1.0;
//    gl_FragColor = color; //vec4(color,1.);
}
