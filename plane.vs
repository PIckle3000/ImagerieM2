attribute vec3 aVertexPosition;
attribute vec2 aTexCoords;

uniform mat4 uMVMatrix;
uniform mat4 uPMatrix;

uniform sampler2D uSampler;

uniform float uHeightScale;
uniform float uUseRelief;
uniform float uEcho3DMode;
uniform float uUseSmooth;
uniform vec2 uTextureSize;


varying vec2 vTexCoords;

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

vec4 sampleBicubic(vec2 uv) {
    vec2 texSize = max(uTextureSize, vec2(1.0));
    vec2 pixel = uv * texSize - 0.5;
    vec2 base = floor(pixel);
    vec2 fraction = pixel - base;
    vec4 sumColor = vec4(0.0);
    float totalWeight = 0.0;

    for (int j = -1; j <= 2; j++) {
        for (int i = -1; i <= 2; i++) {
            vec2 offset = vec2(float(i), float(j));
            vec2 sampleUV = (base + offset + 0.5) / texSize;
            float weight = cubicWeight(float(i) - fraction.x) * cubicWeight(float(j) - fraction.y);
            sumColor += texture2D(uSampler, sampleUV) * weight;
            totalWeight += weight;
        }
    }

    return sumColor / totalWeight;
}

vec4 sampleStrongSmooth(vec2 uv) {
    vec2 texSize = max(uTextureSize, vec2(1.0));
    vec2 texel = 1.0 / texSize;

    vec4 center = sampleBicubic(uv) * 0.40;
    vec4 left = sampleBicubic(uv + vec2(-texel.x, 0.0)) * 0.15;
    vec4 right = sampleBicubic(uv + vec2(texel.x, 0.0)) * 0.15;
    vec4 up = sampleBicubic(uv + vec2(0.0, texel.y)) * 0.15;
    vec4 down = sampleBicubic(uv + vec2(0.0, -texel.y)) * 0.15;

    return center + left + right + up + down;
}

void main(void) {
    vTexCoords = aTexCoords;

    vec4 texColor = mix(texture2D(uSampler, aTexCoords), sampleStrongSmooth(aTexCoords), uUseSmooth);
    float gray = dot(texColor.rgb, vec3(0.299, 0.587, 0.114));

    float reliefValue = mix(1.0 - gray, gray, uEcho3DMode);
    float relief = reliefValue * uHeightScale;

    vec3 pos = aVertexPosition;
    pos.z = mix(0.1, 0.1 + relief, uUseRelief);

    gl_Position = uPMatrix * uMVMatrix * vec4(pos, 1.0);
}