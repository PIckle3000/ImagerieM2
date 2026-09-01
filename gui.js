function initGui() {
	if (window.__guiInitialized) {
		return;
	}

	const bunnyCheckbox = document.getElementById('bunny-checkbox');
	const planCheckbox = document.getElementById('plan-checkbox');
	const trianglesCheckbox = document.getElementById('triangles-checkbox');

	if (bunnyCheckbox) bunnyCheckbox.checked = showBunny;
	if (planCheckbox) planCheckbox.checked = showPlan;
	if (trianglesCheckbox) trianglesCheckbox.checked = showTriangles;

	if (bunnyCheckbox) {
		bunnyCheckbox.addEventListener('change', function() {
			showBunny = this.checked;
		});
	}

	if (planCheckbox) {
		planCheckbox.addEventListener('change', function() {
			showPlan = this.checked;
		});
	}

	if (trianglesCheckbox) {
		trianglesCheckbox.addEventListener('change', function() {
			showTriangles = this.checked;
		});
	}

	window.__guiInitialized = true;
}

function aff_checkbox() {
	initGui();
}
