attribute vec3 aVertexPosition;
attribute vec2 aTexCoords;

uniform mat4 uMVMatrix;
uniform mat4 uPMatrix;
uniform sampler2D uSampler;
uniform float uHeightScale;
uniform float uUseRelief;

varying vec2 vTexCoords;

void main(void) {
    vTexCoords = aTexCoords;

    vec4 texColor = texture2D(uSampler, aTexCoords);
    float gray = dot(texColor.rgb, vec3(0.299, 0.587, 0.114));
    float relief = (1.0 - gray) * uHeightScale;

    vec3 pos = aVertexPosition;
    pos.z = mix(0.1, 0.1 + relief, uUseRelief);

    gl_Position = uPMatrix * uMVMatrix * vec4(pos, 1.0);
}