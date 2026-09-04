

// =====================================================
// Mouse management
// =====================================================
var mouseDown = false;
var lastMouseX = null;
var lastMouseY = null;
var rotY = 0;
var rotX = -1;
var panSpeed = 0.005;
var textureOffset = [0.0, 0.0];

// =====================================================
window.requestAnimFrame = (function()
{
	return window.requestAnimationFrame ||
         window.webkitRequestAnimationFrame ||
         window.mozRequestAnimationFrame ||
         window.oRequestAnimationFrame ||
         window.msRequestAnimationFrame ||
         function(/* function FrameRequestCallback */ callback,
									/* DOMElement Element */ element)
         {
            window.setTimeout(callback, 1000/60);
         };
})();

// ==========================================
function tick() {
	requestAnimFrame(tick);
	drawScene();
}

// =====================================================
function degToRad(degrees) {
	return degrees * Math.PI / 180;
}


// =====================================================
function handleMouseWheel(event) {

	distCENTER[2] += event.deltaY/10.0;
}

// =====================================================
function handleMouseDown(event) {
	mouseDown = true;
	lastMouseX = event.clientX;
	lastMouseY = event.clientY;
	event.preventDefault();
}


// =====================================================
function handleMouseUp(event) {
	mouseDown = false;
}


// =====================================================
function handleMouseMove(event) {
	
	if (!mouseDown) return;

	var newX = event.clientX;
	var newY = event.clientY;	
	var deltaX = newX - lastMouseX;
	var deltaY = newY - lastMouseY;
	
	if (event.buttons === 2 || event.button === 2) {
		textureOffset[0] -= deltaX * panSpeed;
		textureOffset[1] += deltaY * panSpeed;
		if (PLANE && typeof PLANE.setTextureOffset === 'function') {
			PLANE.setTextureOffset(textureOffset[0], textureOffset[1]);
		}
	} else if(event.shiftKey) {
		distCENTER[2] += deltaY/100.0;
	} else {

		rotY += degToRad(deltaX / 5);
		rotX += degToRad(deltaY / 5);

		mat4.identity(rotMatrix);
		mat4.rotate(rotMatrix, rotX, [1, 0, 0]);
		mat4.rotate(rotMatrix, rotY, [0, 0, 1]);
	}
	
	lastMouseX = newX;
	lastMouseY = newY;
}

function handleKeyDown(event) {
	if (event.target && ['INPUT', 'SELECT', 'TEXTAREA'].includes(event.target.tagName)) {
		return;
	}

	var distance = event.shiftKey ? 0.2 : 0.05;
	switch (event.key) {
		case 'ArrowLeft':
			distCENTER[0] -= distance;
			break;
		case 'ArrowRight':
			distCENTER[0] += distance;
			break;
		case 'ArrowUp':
			distCENTER[1] += distance;
			break;
		case 'ArrowDown':
			distCENTER[1] -= distance;
			break;
		default:
			return;
	}

	event.preventDefault();
}
