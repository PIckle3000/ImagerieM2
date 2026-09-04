attribute vec3 aVertexPosition;
attribute vec2 aTexCoords;

uniform mat4 uMVMatrix;
uniform mat4 uPMatrix;
uniform mat3 uNormalMatrix;
uniform sampler2D uSampler;
uniform float uZoom;
uniform vec2 uTextureOffset;
uniform float uHeightScale;
uniform float uUseRelief;
uniform float uEcho3DMode;
uniform float uWaveAnimation;
uniform float uUseSmooth;
uniform float uSmoothStrength;
uniform vec2 uTextureSize;
uniform float uTime;

varying vec2 vTexCoords;
varying vec3 vNormal;

float cubicWeight(float x) {
    x = abs(x);
    if (x <= 1.0) {
        return (1.5 * x - 2.5) * x * x + 1.0;
    }
    if (x < 2.0) {
        return ((-0.5 * x + 2.5) * x - 4.0) * x + 2.0;
    }
    return 0.0;
}

vec4 sampleBicubicOptimized(vec2 uv) {
    vec2 texSize = max(uTextureSize, vec2(1.0));
    vec2 invTexSize = 1.0 / texSize;
    vec2 st = uv * texSize - 0.5;
    vec2 ixy = floor(st);
    vec2 fxy = fract(st);

    vec4 wX = vec4(
        -0.5 * fxy.x * fxy.x * fxy.x + fxy.x * fxy.x - 0.5 * fxy.x,
         1.5 * fxy.x * fxy.x * fxy.x - 2.5 * fxy.x * fxy.x + 1.0,
        -1.5 * fxy.x * fxy.x * fxy.x + 2.0 * fxy.x * fxy.x + 0.5 * fxy.x,
         0.5 * fxy.x * fxy.x * fxy.x - 0.5 * fxy.x * fxy.x
    );
    vec4 wY = vec4(
        -0.5 * fxy.y * fxy.y * fxy.y + fxy.y * fxy.y - 0.5 * fxy.y,
         1.5 * fxy.y * fxy.y * fxy.y - 2.5 * fxy.y * fxy.y + 1.0,
        -1.5 * fxy.y * fxy.y * fxy.y + 2.0 * fxy.y * fxy.y + 0.5 * fxy.y,
         0.5 * fxy.y * fxy.y * fxy.y - 0.5 * fxy.y * fxy.y
    );

    vec2 gX = vec2(wX.x + wX.y, wX.z + wX.w);
    vec2 gY = vec2(wY.x + wY.y, wY.z + wY.w);
    vec2 hX = vec2((wX.y / (gX.x + 0.0001)) - 1.0, (wX.w / (gX.y + 0.0001)) + 1.0);
    vec2 hY = vec2((wY.y / (gY.x + 0.0001)) - 1.0, (wY.w / (gY.y + 0.0001)) + 1.0);

    vec2 p0 = (ixy + vec2(hX.x, hY.x) + 0.5) * invTexSize;
    vec2 p1 = (ixy + vec2(hX.y, hY.x) + 0.5) * invTexSize;
    vec2 p2 = (ixy + vec2(hX.x, hY.y) + 0.5) * invTexSize;
    vec2 p3 = (ixy + vec2(hX.y, hY.y) + 0.5) * invTexSize;

    return gY.x * (gX.x * texture2D(uSampler, p0) + gX.y * texture2D(uSampler, p1)) +
           gY.y * (gX.x * texture2D(uSampler, p2) + gX.y * texture2D(uSampler, p3));
}

vec4 sampleSmartSmooth(vec2 uv) {
    vec2 texel = 1.0 / max(uTextureSize, vec2(1.0));
    float radius = mix(4.0, 8.0, clamp(uSmoothStrength, 0.0, 1.0));
    vec2 off = texel * radius;

    vec4 color = texture2D(uSampler, uv) * 0.25;
    color += texture2D(uSampler, uv + vec2(-off.x, 0.0)) * 0.125;
    color += texture2D(uSampler, uv + vec2(off.x, 0.0)) * 0.125;
    color += texture2D(uSampler, uv + vec2(0.0, -off.y)) * 0.125;
    color += texture2D(uSampler, uv + vec2(0.0, off.y)) * 0.125;
    color += texture2D(uSampler, uv + vec2(-off.x, -off.y)) * 0.0625;
    color += texture2D(uSampler, uv + vec2(off.x, -off.y)) * 0.0625;
    color += texture2D(uSampler, uv + vec2(-off.x, off.y)) * 0.0625;
    color += texture2D(uSampler, uv + vec2(off.x, off.y)) * 0.0625;
    return color;
}

float hash12(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float phasorNoise(vec2 uv, float timeValue) {
    vec2 p = uv * 10.0;
    vec2 cell = floor(p);
    vec2 f = fract(p);

    float a = hash12(cell);
    float b = hash12(cell + vec2(1.0, 0.0));
    float c = hash12(cell + vec2(0.0, 1.0));
    float d = hash12(cell + vec2(1.0, 1.0));

    vec2 smoothF = f * f * (3.0 - 2.0 * f);
    float phase = mix(mix(a, b, smoothF.x), mix(c, d, smoothF.x), smoothF.y) * 6.2831853;

    float waveA = sin(timeValue * 2.2 + phase + dot(uv, vec2(14.0, 7.0)));
    float waveB = sin(timeValue * 1.4 + phase * 1.3 + dot(uv, vec2(-9.0, 11.0)));
    return (waveA + 0.6 * waveB) * 0.625;
}

float getElevation(vec2 uv) {
    vec4 texColor;
    if (uUseSmooth > 0.5) {
        texColor = mix(sampleBicubicOptimized(uv), sampleSmartSmooth(uv), clamp(uSmoothStrength, 0.0, 1.0));
    } else {
        texColor = texture2D(uSampler, uv);
    }

    float gray = dot(texColor.rgb, vec3(0.299, 0.587, 0.114));
    float reliefValue = mix(1.0 - gray, gray, uEcho3DMode);
    float baseHeight = mix(0.1, 0.1 + (reliefValue * uHeightScale), uUseRelief);
    float wave = phasorNoise(uv, uTime) * (0.045 + uHeightScale * 0.18) * uUseRelief * uWaveAnimation;
    return baseHeight + wave;
}

void main(void) {

    vec2 center = vec2(0.5, 0.5);

    float safeZoom = uZoom > 0.0 ? uZoom : 1.0; 
    vec2 zoomedUV = (aTexCoords - center) / safeZoom + center + uTextureOffset;


    vTexCoords = zoomedUV; 

    vec3 pos = aVertexPosition;
    pos.z = getElevation(zoomedUV); 

    vec2 texel = 1.0 / max(uTextureSize, vec2(1.0));
    
    // 3. Calcul des normales avec les UV zoomées
    float hL = getElevation(zoomedUV + vec2(-texel.x, 0.0));
    float hR = getElevation(zoomedUV + vec2(texel.x, 0.0)); 
    float hD = getElevation(zoomedUV + vec2(0.0, -texel.y)); 
    float hU = getElevation(zoomedUV + vec2(0.0, texel.y)); 
    float dX = (hR - hL) / (2.0 * texel.x);
    float dY = (hU - hD) / (2.0 * texel.y);
    vec3 localNormal = normalize(vec3(-dX, -dY, 1.0));

    vNormal = uNormalMatrix * localNormal;
    gl_Position = uPMatrix * uMVMatrix * vec4(pos, 1.0);
}