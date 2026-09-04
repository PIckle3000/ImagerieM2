attribute vec3 aVertexPosition;
attribute vec2 aTexCoords;

uniform mat4 uMVMatrix;
uniform mat4 uPMatrix;
uniform mat3 uNormalMatrix;
uniform sampler2D uSampler;

uniform float uHeightScale;
uniform float uUseRelief;
uniform float uEcho3DMode;
uniform float uUseSmooth;
uniform float uSmoothStrength;
uniform vec2 uTextureSize;


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

vec4 sampleVeryStrongSmooth(vec2 uv) {
    vec2 texSize = max(uTextureSize, vec2(1.0));
    vec2 texel = 1.0 / texSize;

    vec4 color = sampleStrongSmooth(uv) * 0.25;
    color += sampleStrongSmooth(uv + vec2(texel.x * 2.0, 0.0)) * 0.125;
    color += sampleStrongSmooth(uv + vec2(-texel.x * 2.0, 0.0)) * 0.125;
    color += sampleStrongSmooth(uv + vec2(0.0, texel.y * 2.0)) * 0.125;
    color += sampleStrongSmooth(uv + vec2(0.0, -texel.y * 2.0)) * 0.125;
    color += sampleStrongSmooth(uv + vec2(texel.x * 2.0, texel.y * 2.0)) * 0.0625;
    color += sampleStrongSmooth(uv + vec2(-texel.x * 2.0, texel.y * 2.0)) * 0.0625;
    color += sampleStrongSmooth(uv + vec2(texel.x * 2.0, -texel.y * 2.0)) * 0.0625;
    color += sampleStrongSmooth(uv + vec2(-texel.x * 2.0, -texel.y * 2.0)) * 0.0625;

    return color;
}

float getElevation(vec2 uv) {
    vec4 strongColor = mix(sampleStrongSmooth(uv), sampleVeryStrongSmooth(uv), uSmoothStrength);
    vec4 texColor = mix(texture2D(uSampler, uv), strongColor, uUseSmooth);
    float gray = dot(texColor.rgb, vec3(0.299, 0.587, 0.114));
    
    float reliefValue = mix(1.0 - gray, gray, uEcho3DMode);
    return mix(0.1, 0.1 + (reliefValue * uHeightScale), uUseRelief);
}

// 2. NOUVEAU : Une fonction ultra-rapide utilisée SEULEMENT pour déduire les normales
float getFastElevation(vec2 uv) {
    // On lit la texture directement sans faire les 720 boucles de lissage
    vec4 texColor = texture2D(uSampler, uv);
    float gray = dot(texColor.rgb, vec3(0.299, 0.587, 0.114));
    
    float reliefValue = mix(1.0 - gray, gray, uEcho3DMode);
    return mix(0.1, 0.1 + (reliefValue * uHeightScale), uUseRelief);
}

void main(void) {
    vTexCoords = aTexCoords;

    // A. Calcul de la vraie position avec la fonction "lourde"
    float z = getElevation(aTexCoords);
    vec3 pos = aVertexPosition;
    pos.z = z;

    // B. Calcul des normales avec la fonction "rapide"
    vec2 texel = 1.0 / max(uTextureSize, vec2(1.0));
    
    float hL = getFastElevation(aTexCoords + vec2(-texel.x, 0.0));
    float hR = getFastElevation(aTexCoords + vec2(texel.x, 0.0));
    float hD = getFastElevation(aTexCoords + vec2(0.0, -texel.y));
    float hU = getFastElevation(aTexCoords + vec2(0.0, texel.y));

    // Calcul du gradient (la pente) en divisant par la distance entre les pixels
    float dX = (hR - hL) / (2.0 * texel.x);
    float dY = (hU - hD) / (2.0 * texel.y);

    // Ajustez cette valeur si le relief est trop fort ou trop faible face à la lumière
    float normalStrength = 0.5; 

    // Création de la normale corrigée
    vec3 localNormal = normalize(vec3(-dX * normalStrength, -dY * normalStrength, 1.0));

    vNormal = uNormalMatrix * localNormal;

    gl_Position = uPMatrix * uMVMatrix * vec4(pos, 1.0);
}