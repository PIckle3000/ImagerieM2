function getTextureList() {
	const fallback = Array.from(new Set([
		'echo1.png',
		'echo2.png',
		'echo3.png',
		textureChoice || 'echo1.png'
	]));

	return fetch('img/?cache=' + Date.now(), { cache: 'no-store' })
		.then(function(response) {
			if (!response.ok) {
				throw new Error('Directory listing unavailable');
			}
			return response.text();
		})
		.then(function(html) {
			const items = Array.from(html.matchAll(/href=['\"]([^'\"]+\.(png|jpg|jpeg|gif|webp))['\"]/gi))
				.map(function(match) {
					return match[1].replace(/^\//, '');
				})
				.filter(function(name) {
					return name.indexOf('img/') === 0 || name.indexOf('/') === -1;
				});

			const cleaned = items.map(function(name) {
				return name.replace(/^img\//, '');
			}).filter(function(value, index, array) {
				return array.indexOf(value) === index && /\.(png|jpg|jpeg|gif|webp)$/i.test(value);
			});

			return cleaned.length ? cleaned : fallback;
		})
		.catch(function() {
			return fallback;
		});
}

function refreshTextureList() {
	const textureSelect = document.getElementById('texture-select');
	if (!textureSelect) {
		return;
	}

	const currentValue = textureSelect.value || textureChoice || 'echo1.png';

	getTextureList().then(function(list) {
		const safeList = Array.from(new Set((list && list.length ? list : [textureChoice || 'echo1.png']).concat([
			textureChoice || 'echo1.png',
			'echo1.png',
			'echo2.png',
			'echo3.png',
			'echo4.png',
		])));
		textureSelect.innerHTML = '';

		safeList.forEach(function(name) {
			const option = document.createElement('option');
			option.value = name;
			option.textContent = name.replace(/\.[^/.]+$/, '');
			textureSelect.appendChild(option);
		});

		const nextValue = safeList.indexOf(currentValue) >= 0
			? currentValue
			: (safeList.indexOf(textureChoice) >= 0 ? textureChoice : safeList[0]);

		if (nextValue) {
			textureSelect.value = nextValue;
			textureChoice = nextValue;
			if (PLANE) {
				PLANE.setTexture(textureChoice);
			}
		}
	});
}

function initGui() {
	if (window.__guiInitialized) {
		return;
	}

	const planeCheckbox = document.getElementById('plane-checkbox');
	const gridCheckbox = document.getElementById('grid-checkbox');
	const grid3DEchoCheckbox = document.getElementById('grid-3d-echo');
	const gridSmoothCheckbox = document.getElementById('grid-smooth');
	const gridSmoothStrengthInput = document.getElementById('grid-smooth-strength');
	const gridSmoothStrengthValue = document.getElementById('grid-smooth-strength-value');
	const textureSelect = document.getElementById('texture-select');
	const gridResolutionInput = document.getElementById('grid-resolution');
	const gridResolutionValue = document.getElementById('grid-resolution-value');
	const heightScaleInput = document.getElementById('height-scale');
	const heightScaleValue = document.getElementById('height-scale-value');

	if (planeCheckbox) {
		planeCheckbox.checked = showPlan;
		planeCheckbox.addEventListener('change', function() {
			showPlan = this.checked;
		});
	}

	if (gridCheckbox) {
		gridCheckbox.checked = showGrid;
		gridCheckbox.addEventListener('change', function() {
			showGrid = this.checked;
			if (PLANE) {
				PLANE.setMeshMode(showGrid);
			}
		});
	}

	if (grid3DEchoCheckbox) {
		grid3DEchoCheckbox.checked = grid3DEcho;
		grid3DEchoCheckbox.addEventListener('change', function() {
			grid3DEcho = this.checked;
			if (PLANE) {
				PLANE.setEcho3DMode(grid3DEcho);
			}
		});
	}

	if (gridSmoothCheckbox) {
		gridSmoothCheckbox.checked = gridSmooth;
		gridSmoothCheckbox.addEventListener('change', function() {
			gridSmooth = this.checked;
			if (PLANE) {
				PLANE.setSmoothMode(gridSmooth);
			}
		});
	}

	if (gridSmoothStrengthInput) {
		gridSmoothStrengthInput.value = String(gridSmoothStrength);
		if (gridSmoothStrengthValue) {
			gridSmoothStrengthValue.textContent = gridSmoothStrength.toFixed(2);
		}
		gridSmoothStrengthInput.addEventListener('input', function() {
			gridSmoothStrength = parseFloat(this.value) || 0;
			if (gridSmoothStrengthValue) {
				gridSmoothStrengthValue.textContent = gridSmoothStrength.toFixed(2);
			}
			if (PLANE) {
				PLANE.setSmoothStrength(gridSmoothStrength);
			}
		});
	}

	if (textureSelect) {
		refreshTextureList();

		textureSelect.addEventListener('change', function() {
			textureChoice = this.value;
			if (PLANE) {
				PLANE.setTexture(textureChoice);
			}
		});
	}

	if (gridResolutionInput) {
		gridResolutionInput.value = String(gridResolution);
		if (gridResolutionValue) {
			gridResolutionValue.textContent = String(gridResolution);
		}
		gridResolutionInput.addEventListener('input', function() {
			gridResolution = parseInt(this.value, 10) || 40;
			if (gridResolutionValue) {
				gridResolutionValue.textContent = String(gridResolution);
			}
			if (PLANE) {
				PLANE.updateResolution(gridResolution);
			}
		});
	}

	if (heightScaleInput) {
		const initialHeight = PLANE ? PLANE.heightScale : 0.15;
		heightScaleInput.value = String(initialHeight);
		if (heightScaleValue) {
			heightScaleValue.textContent = String(initialHeight.toFixed(2));
		}
		heightScaleInput.addEventListener('input', function() {
			const value = parseFloat(this.value) || 0.15;
			if (heightScaleValue) {
				heightScaleValue.textContent = String(value.toFixed(2));
			}
			if (PLANE) {
				PLANE.updateHeightScale(value);
			}
		});
	}

	if (PLANE) {
		PLANE.setEcho3DMode(grid3DEcho);
		PLANE.setSmoothMode(gridSmooth);
		PLANE.setSmoothStrength(gridSmoothStrength);
	}

	if (!window.__textureRefreshTimer) {
		window.__textureRefreshTimer = window.setInterval(function() {
			refreshTextureList();
		}, 2000);
	}

	window.__guiInitialized = true;
}

function aff_checkbox() {
	initGui();
}
