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

// 1. Interpolation Bicubique Optimisée
vec4 sampleBicubicOptimized(vec2 uv) {
    vec2 texSize = max(uTextureSize, vec2(1.0));
    vec2 invTexSize = 1.0 / texSize;
    vec2 st = uv * texSize - 0.5;
    vec2 ixy = floor(st);
    vec2 fxy = fract(st);

    // Poids de Catmull-Rom optimisés
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

// 2. un flou Gaussien adaptatif 9-taps
vec4 sampleSmartSmooth(vec2 uv) {
    vec2 texel = 1.0 / max(uTextureSize, vec2(1.0));
    // Rayon dynamique : 1.0 = Strong, 2.0 = Very Strong
    // float radius = mix(1.0, 6.0, uSmoothStrength); 
    float radius = 6.0;
    vec2 off = texel * radius;

    // Un flou large casse déjà les pixels, une lecture bilinéaire (texture2D) suffit ici !
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

// 3. Fonction de hauteur conditionnelle
float getElevation(vec2 uv) {
    vec4 texColor;
    
    // uUseSmooth
    if (uUseSmooth > 0.5) {
        // Checkbox cochée : Lissage extrême direct
        texColor = sampleSmartSmooth(uv); 
    } else {
        // Checkbox décochée : Rendu détaillé normal
        texColor = sampleBicubicOptimized(uv); 
    }

    float gray = dot(texColor.rgb, vec3(0.299, 0.587, 0.114));
    float reliefValue = mix(1.0 - gray, gray, uEcho3DMode);
    return mix(0.1, 0.1 + (reliefValue * uHeightScale), uUseRelief);
}

// 4. Fonction ultra-rapide pour les normales (inchangée, parfaite pour sa tâche)
float getFastElevation(vec2 uv) {
    vec4 texColor = texture2D(uSampler, uv);
    float gray = dot(texColor.rgb, vec3(0.299, 0.587, 0.114));
    float reliefValue = mix(1.0 - gray, gray, uEcho3DMode);
    return mix(0.1, 0.1 + (reliefValue * uHeightScale), uUseRelief);
}

void main(void) {
    vTexCoords = aTexCoords;

    // A. Calcul de la hauteur lissée
    float z = getElevation(aTexCoords);
    vec3 pos = aVertexPosition;
    pos.z = z;

    // B. Calcul des normales par différences finies
    vec2 texel = 1.0 / max(uTextureSize, vec2(1.0));
    
    float hL = getFastElevation(aTexCoords + vec2(-texel.x, 0.0));
    float hR = getFastElevation(aTexCoords + vec2(texel.x, 0.0));
    float hD = getFastElevation(aTexCoords + vec2(0.0, -texel.y));
    float hU = getFastElevation(aTexCoords + vec2(0.0, texel.y));

    float dX = (hR - hL) / (2.0 * texel.x);
    float dY = (hU - hD) / (2.0 * texel.y);

    float normalStrength = 0.5; 
    vec3 localNormal = normalize(vec3(-dX * normalStrength, -dY * normalStrength, 1.0));

    vNormal = uNormalMatrix * localNormal;
    gl_Position = uPMatrix * uMVMatrix * vec4(pos, 1.0);
}