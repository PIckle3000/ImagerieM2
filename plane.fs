precision mediump float;

varying vec2 texCoords;

uniform sampler2D uSampler;

void main(void)
{
	gl_FragColor = texture2D(uSampler, texCoords);
}


