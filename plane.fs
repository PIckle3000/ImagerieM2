precision mediump float;

varying vec2 vTexCoords;

uniform sampler2D uSampler;

void main(void)
{
	gl_FragColor = texture2D(uSampler, vTexCoords);
}


