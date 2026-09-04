precision mediump float;

varying vec2 vTexCoords;
varying vec3 vNormal;

uniform sampler2D uSampler;
uniform vec3 uLightColor; // NOUVEAU : La couleur dynamique envoyée par JS
uniform float uLightIntensity;

void main(void)
{
    vec4 color = texture2D(uSampler, vTexCoords);
    float gray = dot(color.rgb, vec3(0.299, 0.587, 0.114));
    vec3 baseColor = vec3(gray, gray, gray);
    
    vec3 normal = normalize(vNormal);

    vec3 lightDir = normalize(vec3(1.0, 0.2, 0.2)); 

    float diffuse = max(dot(normal, lightDir), 0.0);
    float ambient = 0.15;
    
    // NOUVEAU : On utilise uLightColor
    vec3 finalLight = (diffuse + ambient) * uLightColor * uLightIntensity;

    gl_FragColor = vec4(baseColor * finalLight, color.a);
}