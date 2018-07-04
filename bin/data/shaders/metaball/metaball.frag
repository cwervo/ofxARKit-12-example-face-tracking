precision highp float;

uniform sampler2D src_tex_unit0;
uniform float useTexture;
uniform float useColors;
uniform vec4 globalColor;

// For metaballs, as well as FBM shader:
uniform float time;
uniform vec2 resolution;

uniform float u_time;
uniform vec2 u_resolution;

varying float depth;
varying vec4 colorVarying;
varying vec2 texCoordVarying;

uniform sampler2D inputImage;
uniform vec2 bounds;
uniform float u_smile;
uniform float u_frown;
uniform float u_browDown;
uniform vec2 u_faceOffset;

vec3 hsv2rgb(vec3 c) {
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

bool diffuseMetaballCenter = true;
float metaBallRadius = 0.09;
vec3 colorMult = vec3(1.2, 1.0, 1.3); // vec3(1.8, 1.0, 1.8);

//// Metaballs shader from: https://gist.github.com/julien/d7e71b837392f5239c6553098b5cac0c
float ball(vec2 p, float fx, float fy, float ax, float ay) {
//    vec2 r = vec2(p.x + sin(time * fx) * ax, p.y + cos(time * fy) * ay);
    vec2 r = vec2(p.x + sin(time * fx) * ax, p.y + cos(time * fy) * ay);
//    return 0.09 / length(r); comment this out in favor of parameterized version!
    return smoothstep( 0., 1.0, metaBallRadius / length(r));
}

float random (vec2 st) {
    return fract(sin(dot(st.xy,
                         vec2(12.9898,78.233)))*
                 43758.5453123);
}

float circle(in vec2 _st, in float _radius){
    vec2 dist = _st-vec2(0.5);
    return 1.-smoothstep(_radius-(_radius*0.01),
                         _radius+(_radius*0.01),
                         dot(dist,dist)*4.0);
}

//float windowWidth = 768.0;
// void main() {
//     // Stripes from tutorial:
//     // https://andreashackel.de/tech-art/stripes-shader-1/
//     float pos = gl_FragCoord.y / windowWidth * 50.;
//     float normalX = floor(fract(pos) + 0.5);
//     if (normalX > 0.5) {
//       gl_FragColor = vec4(0., 0., 0., 0.);
//     } else {
//       gl_FragColor = vec4(normalX, normalX, normalX, 1.0);
//     }
//    // gl_FragColor = vec4(sin(time), 0., 0., 1.);
// }


void main() {
    // This last magic number comes from: 4000 / 1136 (cam width / screen width) --- figure out the proper aspect conversion????
    vec2 st = gl_FragCoord.xy / resolution.xy;
    st.x *=  6.25; // 4000 / 640
    st.y *=  3.52; // 4000 / 1136
    
    st.y -= 0.015;
    st.x -= 0.015;
    
//    st = gl_FragCoord.xy;
//    st.y = bounds.y - st.y;
    
    vec3 cam = texture2D(inputImage, st).rgb;
    cam.r *= 0.9;
    
    float alpha = 1.;
    // Remove black from the shader :)
//    if (cam.r < 0.5) {
//        alpha = 0.;
//    }

    // Make blob go in a circle :)
    st.x += sin(u_time) * 0.25;
    st.y += cos(u_time) * 0.25;
    
//    st.x *= u_faceOffset.x;
//    st.y += u_faceOffset.y;
    
    vec2 p = -1.0 + 2. * st;

//    st.x += (u_faceOffset.x - 0.5) * 50.;
    //    cam += circle(st, 0.5);
    
    float col = 0.0;

    // From OSX metaballs fragment shader:
    col += ball(p, 0.2, 2.0, 0.1, 0.2);
    col += ball(p, 1.5, 2.5, 0.2, 0.3);
    col += ball(p, 1.0, 3.0, 0.3, 0.4 * cos(u_time));
    col += ball(p, 0.4, 3.5, 0.4 * sin(u_time), 0.5);
    col += ball(p, 0.3, 4.0, 0.5, 0.6);
    col += ball(p, 1.5, 0.5, 0.6, 0.7);
    col += ball(p, 0.5, .5, 0.6, 0.7);
    
    if (diffuseMetaballCenter) {
        
        // lower limit, upper limit
        col = max(mod(col, 0.3), min(col, .68));
    }
    
//    vec3 color = vec3(col * 0.1, col * 0.1, col * 0.1); // Commenting this for the below w/ the theory that colors no longer need to
    // be multiplied down because we're clamping them!
    
    colorMult.b *= u_frown * 1.5;
    colorMult.r *= 2.0;
    
    colorMult.r *= u_browDown * 1.25;
    
    vec3 color = vec3(col, col, col) * colorMult;
    float mixFactor = 0.;
//    if (color.r > 0.6) {
//        mixFactor = color.r; // 0.0 would be full cam, 1.0 would be full shader
//        // Note: this is a diagonal mix effect (top right blob overpowers image, bottom left blob basically disappears), but this
//        // technique in general could be used with a distance to modulate mixing over face/screen in general??
//        // mixFactor = 2.5 * st.x * st.y; // 0.0 would be full cam, 1.0 would be full shader
//    } else {
////        mixFactor = color.r;
//    }
    
    // * .3 to account for three color channels!
    mixFactor = clamp(length(color) * 0.4, 0., 1.); // Turns out this actually produces a feathery effect - should maybe sum all color channels??
    
    // Average color channels instead?
//    mixFactor = clamp((color.r + color.g + color.g) * .3 * 0.5, 0., 1.);
//    mixFactor = (color.r + color.g + color.g) * .3;
//    mixFactor = color.r;
//    mixFactor = length(color) * 0.5;
//    mixFactor = 1.;
    cam = mix(cam, clamp(color, 0., 1.), clamp(mixFactor, .0, 1.0));
    
    // ⇣ A sort of posterize effect!
//    cam = mix(cam, vec3(st.x, st.y, 1.0), distance(st, vec2(0.,0.) + resolution.xy/2.));
    
//    gl_FragColor = vec4(vec3(st.x), 1.0);
//    cam.r *= 0.5;
    
//    if (st.x < 0.5) {
//        gl_FragColor = vec4(cam.gbr * random(st * (u_time * .001)), alpha);
//    } else {
//        gl_FragColor = vec4(cam.rbg, alpha);
//    }
    
//    gl_FragColor = vec4(cam.gbr * random(st * (u_time * .001)), alpha); // add noise waves, mess with color channels
//    gl_FragColor = vec4(cam.rbg, alpha); // just mess with color channels
    
    gl_FragColor = vec4(cam, alpha); // normal camera + metaballs
    
//    gl_FragColor = vec4(texture2D(inputImage, st).rgb, alpha);
}
