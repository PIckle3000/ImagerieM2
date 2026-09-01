
precision mediump float;

varying vec2 texCoords;

uniform sampler2D uSampler;


void main(void)
{
	gl_FragColor = texture2D(uSampler, texCoords);
}

// void main(void)
// {
// 	vec2 pos = floor(texCoords*100.0);

// 	float px = mod(pos.x+5.0,10.0);
// 	float py = mod(pos.y+5.0,10.0);

// 	float dx = min(abs((texCoords.x*100.0-0.5)-pos.x)*2.0,0.4);
// 	float dy = min(abs((texCoords.y*100.0-0.5)-pos.y)*2.0,0.4);

// 	gl_FragColor = vec4(0.0,0.0,0.0,1.0);

// 	// texture2D(uSampler, vTextureCoord);

// 	// if(px == 0.0 && py == 0.0) gl_FragColor = vec4(0.5+dx*dy/0.4,0.5+dx*dy/0.4,0.5+dx*dy/0.4,1.0);
// 	// else if(px == 0.0) gl_FragColor = vec4(0.5+dx,0.5+dx,0.5+dx,1.0);
// 	// else if(py == 0.0) gl_FragColor = vec4(0.5+dy,0.5+dy,0.5+dy,1.0);
// 	// else gl_FragColor = vec4(0.9,0.9,0.9,1.0);
// }



