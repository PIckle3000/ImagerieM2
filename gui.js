var OBJ1 = null;

const bunnyCheckbox = document.getElementById('bunny-checkbox');
const planCheckbox = document.getElementById('plan-checkbox');
const trianglesCheckbox = document.getElementById('triangles-checkbox');

function aff_checkbox(){
if (bunnyCheckbox) {
	bunnyCheckbox.addEventListener('change', function() {
	OBJ1 = new objmesh('bunny.obj');
	});
}

if (planCheckbox) {
	planCheckbox.addEventListener('change', function() {
		
	});
}

if (trianglesCheckbox) {
	trianglesCheckbox.addEventListener('change', function() {
		
	});
}}
