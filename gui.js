var lightColorRGB = [1.0, 0.90, 0.80];
var lightIntensity = 1.0;

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
	const gridWaveAnimationCheckbox = document.getElementById('grid-wave-animation');
	const gridSmoothCheckbox = document.getElementById('grid-smooth');
	const gridSmoothStrengthInput = document.getElementById('grid-smooth-strength');
	const gridSmoothStrengthValue = document.getElementById('grid-smooth-strength-value');
	const textureSelect = document.getElementById('texture-select');
	const gridResolutionInput = document.getElementById('grid-resolution');
	const gridResolutionValue = document.getElementById('grid-resolution-value');
	const heightScaleInput = document.getElementById('height-scale');
	const heightScaleValue = document.getElementById('height-scale-value');
	const lightColorPicker = document.getElementById('lightColorPicker');
	const lightIntensityInput = document.getElementById('light-intensity');
	const lightIntensityValue = document.getElementById('light-intensity-value');
	const zoomScaleInput = document.getElementById('zoom-scale');
    const zoomScaleValue = document.getElementById('zoom-scale-value');
	const planePositionXInput = document.getElementById('plane-position-x');
	const planePositionXValue = document.getElementById('plane-position-x-value');
	const planePositionYInput = document.getElementById('plane-position-y');
	const planePositionYValue = document.getElementById('plane-position-y-value');
	const textureOffsetX = textureOffset[0];
	const textureOffsetY = textureOffset[1];

	if (typeof window.zoomValue === 'undefined') {
        window.zoomValue = 1.0;
    }

    if (zoomScaleInput) {
        zoomScaleInput.value = String(window.zoomValue);
        if (zoomScaleValue) {
            zoomScaleValue.textContent = window.zoomValue.toFixed(1);
        }
        zoomScaleInput.addEventListener('input', function() {
            window.zoomValue = parseFloat(this.value) || 1.0;
            if (zoomScaleValue) {
                zoomScaleValue.textContent = window.zoomValue.toFixed(1);
            }
			if (PLANE && typeof PLANE.setZoom === 'function') {
				PLANE.setZoom(window.zoomValue);
            }
        });
    }

	function updatePlanePosition() {
		if (PLANE && typeof PLANE.setTextureOffset === 'function') {
			PLANE.setTextureOffset(textureOffset[0], textureOffset[1]);
		}
	}

	if (planePositionXInput) {
		planePositionXInput.value = String(textureOffsetX);
		if (planePositionXValue) {
			planePositionXValue.textContent = textureOffsetX.toFixed(2);
		}
		planePositionXInput.addEventListener('input', function() {
			textureOffset[0] = parseFloat(this.value) || 0.0;
			if (planePositionXValue) {
				planePositionXValue.textContent = textureOffset[0].toFixed(2);
			}
			updatePlanePosition();
		});
	}

	if (planePositionYInput) {
		planePositionYInput.value = String(textureOffsetY);
		if (planePositionYValue) {
			planePositionYValue.textContent = textureOffsetY.toFixed(2);
		}
		planePositionYInput.addEventListener('input', function() {
			textureOffset[1] = parseFloat(this.value) || 0.0;
			if (planePositionYValue) {
				planePositionYValue.textContent = textureOffset[1].toFixed(2);
			}
			updatePlanePosition();
		});
	}
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

	if (gridWaveAnimationCheckbox) {
		gridWaveAnimationCheckbox.checked = gridWaveAnimation;
		gridWaveAnimationCheckbox.addEventListener('change', function() {
			gridWaveAnimation = this.checked;
			if (PLANE) {
				PLANE.setWaveAnimation(gridWaveAnimation);
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
	if (lightColorPicker) {
        let hex = lightColorPicker.value;
        if (hex) {
            let r = parseInt(hex.substring(1, 3), 16) / 255.0;
            let g = parseInt(hex.substring(3, 5), 16) / 255.0;
            let b = parseInt(hex.substring(5, 7), 16) / 255.0;
            lightColorRGB = [r, g, b];
        }


        lightColorPicker.addEventListener('input', function(event) {
            let hexValue = event.target.value;
            let r = parseInt(hexValue.substring(1, 3), 16) / 255.0;
            let g = parseInt(hexValue.substring(3, 5), 16) / 255.0;
            let b = parseInt(hexValue.substring(5, 7), 16) / 255.0;
            
            lightColorRGB = [r, g, b];
        });
    }
	if (lightIntensityInput) {
		lightIntensityInput.value = String(lightIntensity);
		if (lightIntensityValue) {
			lightIntensityValue.textContent = lightIntensity.toFixed(2);
		}
		lightIntensityInput.addEventListener('input', function() {
			lightIntensity = parseFloat(this.value) || 0;
			if (lightIntensityValue) {
				lightIntensityValue.textContent = lightIntensity.toFixed(2);
			}
		});
	}
	if (PLANE) {
		PLANE.setEcho3DMode(grid3DEcho);
		PLANE.setWaveAnimation(gridWaveAnimation);
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
