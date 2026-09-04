// =====================================================
var gl;
var supportsUint32Indices = false;

// =====================================================
var mvMatrix = mat4.create();
var pMatrix = mat4.create();
var rotMatrix = mat4.create();
var distCENTER;
var animationStartTime = Date.now();
// =====================================================

var PLANE = null;

var showPlan = true;
var showGrid = true;
var grid3DEcho = true;
var gridWaveAnimation = false;
var gridSmooth = false;
var gridSmoothStrength = 0;
var gridResolution = 80;
var textureChoice = 'echo4.png';

// =====================================================
// OBJET 3D, lecture fichier obj
// =====================================================

const triangleVertices = new Float32Array([
    -0.8, -0.6, 0.0,
     0.8, -0.6, 0.0,
     0.0,  0.8, 0.0
]);

class objmesh {
    constructor(objFname) {
        this.objName = objFname;
        this.shaderName = 'obj';
        this.loaded = -1;
        this.shader = null;
        this.mesh = null;

        loadObjFile(this);
        loadShaders(this);
    }

    setShadersParams() {
        gl.useProgram(this.shader);

        this.shader.vAttrib = gl.getAttribLocation(this.shader, "aVertexPosition");
        gl.enableVertexAttribArray(this.shader.vAttrib);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.mesh.vertexBuffer);
        gl.vertexAttribPointer(this.shader.vAttrib, this.mesh.vertexBuffer.itemSize, gl.FLOAT, false, 0, 0);

        this.shader.nAttrib = gl.getAttribLocation(this.shader, "aVertexNormal");
        gl.enableVertexAttribArray(this.shader.nAttrib);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.mesh.normalBuffer);
        gl.vertexAttribPointer(this.shader.nAttrib, this.mesh.vertexBuffer.itemSize, gl.FLOAT, false, 0, 0);

        this.shader.rMatrixUniform = gl.getUniformLocation(this.shader, "uRMatrix");
        this.shader.mvMatrixUniform = gl.getUniformLocation(this.shader, "uMVMatrix");
        this.shader.pMatrixUniform = gl.getUniformLocation(this.shader, "uPMatrix");
    }

    setMatrixUniforms() {
        mat4.identity(mvMatrix);
        mat4.translate(mvMatrix, distCENTER);
        mat4.multiply(mvMatrix, rotMatrix);
        gl.uniformMatrix4fv(this.shader.rMatrixUniform, false, rotMatrix);
        gl.uniformMatrix4fv(this.shader.mvMatrixUniform, false, mvMatrix);
        gl.uniformMatrix4fv(this.shader.pMatrixUniform, false, pMatrix);
    }

    draw() {
        if (this.shader && this.loaded == 4 && this.mesh != null) {
            this.setShadersParams();
            this.setMatrixUniforms();
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.mesh.indexBuffer);
            gl.drawElements(gl.TRIANGLES, this.mesh.indexBuffer.numItems, gl.UNSIGNED_INT, 0);
        }
    }
}

// =====================================================
// TRIANGLE TEST
// =====================================================

class triangleMesh {
    constructor() {
        this.shaderName = 'plane';
        this.loaded = -1;
        this.shader = null;
        this.texture = null;
        this.initAll();
    }

    initAll() {
        this.vBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, triangleVertices, gl.STATIC_DRAW);
        this.vBuffer.itemSize = 3;
        this.vBuffer.numItems = 3;

        var texcoords = [0.0, 0.0, 1.0, 0.0, 0.5, 1.0];

        this.tBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.tBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texcoords), gl.STATIC_DRAW);
        this.tBuffer.itemSize = 2;
        this.tBuffer.numItems = 3;

        var image = new Image();
        image.src = 'img/echo1.png';
        image.onload = () => {
            this.texture = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, this.texture);
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            gl.bindTexture(gl.TEXTURE_2D, null);
        };

        loadShaders(this);
    }

    setShadersParams() {
        gl.useProgram(this.shader);

        this.shader.vAttrib = gl.getAttribLocation(this.shader, 'aVertexPosition');
        gl.enableVertexAttribArray(this.shader.vAttrib);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vBuffer);
        gl.vertexAttribPointer(this.shader.vAttrib, this.vBuffer.itemSize, gl.FLOAT, false, 0, 0);

        this.shader.tAttrib = gl.getAttribLocation(this.shader, 'aTexCoords');
        gl.enableVertexAttribArray(this.shader.tAttrib);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.tBuffer);
        gl.vertexAttribPointer(this.shader.tAttrib, this.tBuffer.itemSize, gl.FLOAT, false, 0, 0);

        this.shader.pMatrixUniform = gl.getUniformLocation(this.shader, 'uPMatrix');
        this.shader.mvMatrixUniform = gl.getUniformLocation(this.shader, 'uMVMatrix');
        this.shader.samplerUniform = gl.getUniformLocation(this.shader, 'uSampler');

        mat4.identity(mvMatrix);
        mat4.translate(mvMatrix, distCENTER);
        mat4.multiply(mvMatrix, rotMatrix);

        gl.uniformMatrix4fv(this.shader.pMatrixUniform, false, pMatrix);
        gl.uniformMatrix4fv(this.shader.mvMatrixUniform, false, mvMatrix);

        if (this.texture) {
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, this.texture);
            gl.uniform1i(this.shader.samplerUniform, 0);
        }
    }

    draw() {
        if (this.shader && this.loaded == 4 && this.texture) {
            this.setShadersParams();
            gl.drawArrays(gl.TRIANGLES, 0, this.vBuffer.numItems);
        }
    }
}

// =====================================================
// PLAN 3D, Support géométrique
// =====================================================

class plane {
    constructor() {
        this.shaderName = 'plane';
        this.loaded = -1;
        this.shader = null;
        this.texture = null;
        this.textureWidth = 1;
        this.textureHeight = 1;
        this.textureName = textureChoice || 'echo1.png';
        this.useRelief = !!showGrid;
        this.showMesh = !!showGrid;
        this.echo3DMode = !!grid3DEcho;
        this.waveAnimation = !!gridWaveAnimation;
        this.useSmoothing = !!gridSmooth;
        this.smoothStrength = gridSmoothStrength || 0;
        this.resolution = gridResolution || 40;
        this.heightScale = 0.15;  
        this.zoom = 1.0;
        this.textureOffset = textureOffset || [0.0, 0.0];
        this.indexType = supportsUint32Indices ? gl.UNSIGNED_INT : gl.UNSIGNED_SHORT;
        this.initAll();
        this.setZoom = function(zoom) {
            this.zoom = zoom;
        }
        this.setTextureOffset = function(x, y) {
            this.textureOffset[0] = Number(x) || 0.0;
            this.textureOffset[1] = Number(y) || 0.0;
            textureOffset[0] = this.textureOffset[0];
            textureOffset[1] = this.textureOffset[1];
        };
        
    }

    // Méthode pour changer la résolution depuis l'interface (slider)
    updateResolution(newRes) {
        this.resolution = Math.max(2, parseInt(newRes, 10) || 40);
        gridResolution = this.resolution;
        this.buildMesh();
    }

    // Méthode pour changer la hauteur depuis l'interface
    updateHeightScale(newHeight) {
        this.heightScale = parseFloat(newHeight);
    }

    setEcho3DMode(enabled) {
        this.echo3DMode = !!enabled;
        grid3DEcho = this.echo3DMode;
    }

    setWaveAnimation(enabled) {
        this.waveAnimation = !!enabled;
        gridWaveAnimation = this.waveAnimation;
    }

    setSmoothMode(enabled) {
        this.useSmoothing = !!enabled;
        gridSmooth = this.useSmoothing;
    }

    setSmoothStrength(value) {
        this.smoothStrength = Math.max(0.0, Math.min(1.0, parseFloat(value) || 0.0));
        gridSmoothStrength = this.smoothStrength;
    }

    setReliefMode(enabled) {
        this.useRelief = !!enabled;
        this.showMesh = !!enabled;
        showGrid = !!enabled;
    }

    setMeshMode(enabled) {
        this.useRelief = !!enabled;
        this.showMesh = !!enabled;
        showGrid = !!enabled;
    }

    setTexture(name) {
        const safeName = name || this.textureName || 'echo1.png';
        this.textureName = safeName;
        textureChoice = safeName;

        const imagePath = safeName.indexOf('img/') === 0 || safeName.indexOf('/') >= 0
            ? safeName
            : 'img/' + safeName;

        const image = new Image();
        image.onload = () => {
            this.setImage(image);
        };
        image.src = imagePath;
    }

    setImage(image) {
        this.textureWidth = image.width || 1;
        this.textureHeight = image.height || 1;
        this.texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.bindTexture(gl.TEXTURE_2D, null);
    }

    // --- Génération de la grille ---
    buildMesh() {
        let vertices = [];
        let texcoords = [];
        let indices = [];
        let size = 1.0;
        let res = this.resolution;

        // Création des sommets et des coordonnées UV
        for (let y = 0; y <= res; y++) {
            for (let x = 0; x <= res; x++) {
                let u = x / res;
                let v = y / res;

                // Position de -size à +size
                let xPos = (u * 2.0 - 1.0) * size;
                let yPos = (v * 2.0 - 1.0) * size;
                
                vertices.push(xPos, yPos, 0.1); // Z de base à 0.1 comme dans ton code d'origine
                texcoords.push(u, v);
            }
        }

        // Création des indices pour relier les points en triangles
        for (let y = 0; y < res; y++) {
            for (let x = 0; x < res; x++) {
                let p1 = y * (res + 1) + x;
                let p2 = p1 + 1;
                let p3 = (y + 1) * (res + 1) + x;
                let p4 = p3 + 1;

                indices.push(p1, p2, p3);
                indices.push(p2, p4, p3);
            }
        }

        // Remplissage des buffers WebGL
        this.vBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
        this.vBuffer.itemSize = 3;
        this.vBuffer.numItems = vertices.length / 3;

        this.tBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.tBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texcoords), gl.STATIC_DRAW);
        this.tBuffer.itemSize = 2;
        this.tBuffer.numItems = texcoords.length / 2;

        this.indexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        const indexData = supportsUint32Indices ? new Uint32Array(indices) : new Uint16Array(indices);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indexData, gl.STATIC_DRAW);
        this.indexBuffer.numItems = indices.length;
    }

    initAll() {
        this.buildMesh();
        this.texture = null;
        this.setTexture(this.textureName);
        loadShaders(this);
    }
	setShadersParams() {
        gl.useProgram(this.shader);

        this.shader.vAttrib = gl.getAttribLocation(this.shader, "aVertexPosition");
        gl.enableVertexAttribArray(this.shader.vAttrib);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vBuffer);
        gl.vertexAttribPointer(this.shader.vAttrib, this.vBuffer.itemSize, gl.FLOAT, false, 0, 0);

        this.shader.tAttrib = gl.getAttribLocation(this.shader, "aTexCoords");
        gl.enableVertexAttribArray(this.shader.tAttrib);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.tBuffer);
        gl.vertexAttribPointer(this.shader.tAttrib, this.tBuffer.itemSize, gl.FLOAT, false, 0, 0);

        this.shader.nMatrixUniform = gl.getUniformLocation(this.shader, "uNormalMatrix");

        this.shader.pMatrixUniform = gl.getUniformLocation(this.shader, "uPMatrix");
        this.shader.mvMatrixUniform = gl.getUniformLocation(this.shader, "uMVMatrix");
        this.shader.samplerUniform = gl.getUniformLocation(this.shader, "uSampler");
        this.shader.heightScaleUniform = gl.getUniformLocation(this.shader, "uHeightScale");
        this.shader.reliefUniform = gl.getUniformLocation(this.shader, "uUseRelief");
        this.shader.echo3DUniform = gl.getUniformLocation(this.shader, "uEcho3DMode");
        this.shader.waveAnimationUniform = gl.getUniformLocation(this.shader, "uWaveAnimation");
        this.shader.smoothUniform = gl.getUniformLocation(this.shader, "uUseSmooth");
        this.shader.smoothStrengthUniform = gl.getUniformLocation(this.shader, "uSmoothStrength");
        this.shader.textureSizeUniform = gl.getUniformLocation(this.shader, "uTextureSize");
        this.shader.timeUniform = gl.getUniformLocation(this.shader, "uTime");
        this.shader.lightColorUniform = gl.getUniformLocation(this.shader, "uLightColor");
        this.shader.lightIntensityUniform = gl.getUniformLocation(this.shader, "uLightIntensity");
        this.shader.zoomUniform = gl.getUniformLocation(this.shader, "uZoom");
        this.shader.textureOffsetUniform = gl.getUniformLocation(this.shader, "uTextureOffset");
        if (this.shader.heightScaleUniform !== null) {
            gl.uniform1f(this.shader.heightScaleUniform, this.heightScale);
        }
        if (this.shader.reliefUniform !== null) {
            gl.uniform1f(this.shader.reliefUniform, this.useRelief ? 1.0 : 0.0);
        }
        if (this.shader.echo3DUniform !== null) {
            gl.uniform1f(this.shader.echo3DUniform, this.echo3DMode ? 1.0 : 0.0);
        }
        if (this.shader.waveAnimationUniform !== null) {
            gl.uniform1f(this.shader.waveAnimationUniform, this.waveAnimation ? 1.0 : 0.0);
        }
        if (this.shader.smoothUniform !== null) {
            gl.uniform1f(this.shader.smoothUniform, this.useSmoothing ? 1.0 : 0.0);
        }
        if (this.shader.smoothStrengthUniform !== null) {
            gl.uniform1f(this.shader.smoothStrengthUniform, this.smoothStrength);
        }
        if (this.shader.textureSizeUniform !== null) {
            gl.uniform2f(this.shader.textureSizeUniform, this.textureWidth || 1, this.textureHeight || 1);
        }
        if (this.shader.timeUniform !== null) {
            gl.uniform1f(this.shader.timeUniform, (Date.now() - animationStartTime) / 1000.0);
        }
        if (this.shader.lightColorUniform !== null) {
            gl.uniform3fv(this.shader.lightColorUniform, new Float32Array(lightColorRGB));
        }
        if (this.shader.lightIntensityUniform !== null) {
            gl.uniform1f(this.shader.lightIntensityUniform, lightIntensity);
        }
        if (this.shader.zoomUniform !== null) {
            gl.uniform1f(this.shader.zoomUniform, this.zoom);
        }
        if (this.shader.textureOffsetUniform !== null) {
            gl.uniform2fv(this.shader.textureOffsetUniform, new Float32Array(this.textureOffset));
        }
        // --- CALCUL DES MATRICES ---
        mat4.identity(mvMatrix);
        mat4.translate(mvMatrix, distCENTER);
        mat4.multiply(mvMatrix, rotMatrix);

        var normalMatrix = mat3.create();
        mat4.toInverseMat3(mvMatrix, normalMatrix);
        mat3.transpose(normalMatrix);

        gl.uniformMatrix4fv(this.shader.pMatrixUniform, false, pMatrix);
        gl.uniformMatrix4fv(this.shader.mvMatrixUniform, false, mvMatrix);
        

        if (this.shader.nMatrixUniform !== null) {
            gl.uniformMatrix3fv(this.shader.nMatrixUniform, false, normalMatrix);
        }

        if (this.texture) {
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, this.texture);
            gl.uniform1i(this.shader.samplerUniform, 0);
        }
    }

    draw() {
        if (this.shader && this.loaded == 4 && this.texture && this.indexBuffer) {
            this.setShadersParams();
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
            gl.drawElements(gl.TRIANGLES, this.indexBuffer.numItems, this.indexType, 0);

            if (this.showMesh) {
                gl.disable(gl.CULL_FACE);
                gl.drawElements(gl.LINE_STRIP, this.indexBuffer.numItems, this.indexType, 0);
                gl.enable(gl.CULL_FACE);
            }
        }
    }
}
// =====================================================
// GRILLE 3D - relief texturé à partir de l'image
// =====================================================
/*
class grille {
    constructor() {
        this.shaderName = 'grille';
        this.loaded = -1;
        this.shader = null;
        this.texture = null;
        this.image = null;
        this.gridSize = gridResolution;
        this.heightScale = 0.12;
        this.reliefPower = 1.8;
        this.baseZ = 0.1;
        this.vertices = [];
        this.texcoords = [];
        this.indices = [];
        this.initAll();
    }

    updateResolution(value) {
        this.gridSize = Math.max(8, Math.min(120, parseInt(value, 10) || 40));
        gridResolution = this.gridSize;
        this.buildGrid();
    }

    setTexture(name) {
        this.textureName = name || 'echo1';
        textureChoice = this.textureName;
        this.loadTexture(this.textureName);
    }

    loadTexture(name) {
        var imgPath = (name === 'echo2') ? 'img/echo2.png' : 'img/echo1.png';
        var image = new Image();
        image.onload = () => {
            this.image = image;
            this.texture = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, this.texture);
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            gl.bindTexture(gl.TEXTURE_2D, null);
            this.buildGrid();
        };
        image.src = imgPath;
    }

    buildGrid() {
        if (!this.image) {
            return;
        }

        this.vertices = [];
        this.texcoords = [];
        this.indices = [];

        var imgW = this.image.width;
        var imgH = this.image.height;
        var canvas = document.createElement('canvas');
        canvas.width = imgW;
        canvas.height = imgH;
        var ctx = canvas.getContext('2d');
        ctx.drawImage(this.image, 0, 0);
        var pixels = ctx.getImageData(0, 0, imgW, imgH).data;

        for (var y = 0; y < this.gridSize; y++) {
            for (var x = 0; x < this.gridSize; x++) {
                var u = x / (this.gridSize - 1);
                var v = y / (this.gridSize - 1);
                var px = Math.min(imgW - 1, Math.floor(u * (imgW - 1)));
                var py = Math.min(imgH - 1, Math.floor(v * (imgH - 1)));
                var offset = (py * imgW + px) * 4;
                var r = pixels[offset];
                var g = pixels[offset + 1];
                var b = pixels[offset + 2];
                var gray = (r * 0.299 + g * 0.587 + b * 0.114) / 255.0;

                var baseRelief = Math.max(0.0, 1.0 - gray);
                var backgroundMask = gray < 0.12 ? 0.0 : 1.0;
                var smoothRelief = Math.pow(Math.max(0.0, baseRelief), this.reliefPower) * backgroundMask;
                var z = this.baseZ + smoothRelief * this.heightScale;

                var xPos = -1.0 + 2.0 * u;
                var yPos = 1.0 - 2.0 * v;

                this.vertices.push(xPos, yPos, z);
                this.texcoords.push(u, 1.0 - v);
            }
        }

        for (var y = 0; y < this.gridSize - 1; y++) {
            for (var x = 0; x < this.gridSize - 1; x++) {
                var i0 = y * this.gridSize + x;
                var i1 = i0 + 1;
                var i2 = i0 + this.gridSize;
                var i3 = i2 + 1;
                this.indices.push(i0, i2, i1);
                this.indices.push(i1, i2, i3);
            }
        }

        this.vBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vertices), gl.STATIC_DRAW);
        this.vBuffer.itemSize = 3;
        this.vBuffer.numItems = this.vertices.length / 3;

        this.tBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.tBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.texcoords), gl.STATIC_DRAW);
        this.tBuffer.itemSize = 2;
        this.tBuffer.numItems = this.texcoords.length / 2;

        this.indexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(this.indices), gl.STATIC_DRAW);
        this.indexBuffer.numItems = this.indices.length;
    }

    initAll() {
        this.gridSize = gridResolution;
        this.loadTexture(textureChoice);
        loadShaders(this);
    }

    setShadersParams() {
        gl.useProgram(this.shader);

        this.shader.vAttrib = gl.getAttribLocation(this.shader, 'aVertexPosition');
        gl.enableVertexAttribArray(this.shader.vAttrib);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vBuffer);
        gl.vertexAttribPointer(this.shader.vAttrib, this.vBuffer.itemSize, gl.FLOAT, false, 0, 0);

        this.shader.tAttrib = gl.getAttribLocation(this.shader, 'aTexCoords');
        gl.enableVertexAttribArray(this.shader.tAttrib);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.tBuffer);
        gl.vertexAttribPointer(this.shader.tAttrib, this.tBuffer.itemSize, gl.FLOAT, false, 0, 0);

        this.shader.pMatrixUniform = gl.getUniformLocation(this.shader, 'uPMatrix');
        this.shader.mvMatrixUniform = gl.getUniformLocation(this.shader, 'uMVMatrix');
        this.shader.samplerUniform = gl.getUniformLocation(this.shader, 'uSampler');

        mat4.identity(mvMatrix);
        mat4.translate(mvMatrix, distCENTER);
        mat4.multiply(mvMatrix, rotMatrix);

        gl.uniformMatrix4fv(this.shader.pMatrixUniform, false, pMatrix);
        gl.uniformMatrix4fv(this.shader.mvMatrixUniform, false, mvMatrix);

        if (this.texture) {
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, this.texture);
            gl.uniform1i(this.shader.samplerUniform, 0);
        }
    }

    draw() {
        if (this.shader && this.loaded == 4 && this.texture && this.indexBuffer) {
            this.setShadersParams();
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
            gl.drawElements(gl.TRIANGLES, this.indexBuffer.numItems, gl.UNSIGNED_INT, 0);
        }
    }
}
*/


// =====================================================
// FONCTIONS GENERALES, INITIALISATIONS
// =====================================================

// =====================================================
function initGL(canvas)
{
    try {
        gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        if (gl) {
            supportsUint32Indices = !!gl.getExtension('OES_element_index_uint');
            gl.viewportWidth = canvas.width;
            gl.viewportHeight = canvas.height;
            gl.viewport(0, 0, canvas.width, canvas.height);
            gl.clearColor(0.7, 0.7, 0.7, 1.0);
            gl.enable(gl.DEPTH_TEST);
            gl.enable(gl.CULL_FACE);
            gl.cullFace(gl.BACK);
        }
    } catch (e) {
        console.log('WebGL init error: ' + e.message);
    }
    if (!gl) {
        console.log('Could not initialise WebGL');
    }
}

// =====================================================
loadObjFile = function(OBJ3D)
{
    var xhttp = new XMLHttpRequest();

    xhttp.onreadystatechange = function() {
        if (xhttp.readyState == 4 && xhttp.status == 200) {
            var tmpMesh = new OBJ.Mesh(xhttp.responseText);
            OBJ.initMeshBuffers(gl, tmpMesh);
            OBJ3D.mesh = tmpMesh;
        }
    };

    xhttp.open('GET', OBJ3D.objName, true);
    xhttp.overrideMimeType('text/plain');
    xhttp.send();
};

// =====================================================
function loadShaders(Obj3D) {
    loadShaderText(Obj3D, '.vs');
    loadShaderText(Obj3D, '.fs');
}

// =====================================================
function loadShaderText(Obj3D, ext) {
    var xhttp = new XMLHttpRequest();

    xhttp.onreadystatechange = function() {
        if (xhttp.readyState == 4 && xhttp.status == 200) {
            if (ext === '.vs') { Obj3D.vsTxt = xhttp.responseText; Obj3D.loaded++; }
            if (ext === '.fs') { Obj3D.fsTxt = xhttp.responseText; Obj3D.loaded++; }
            if (Obj3D.loaded == 2) {
                Obj3D.loaded++;
                compileShaders(Obj3D);
                Obj3D.loaded++;
            }
        }
    };

    Obj3D.loaded = 0;
    xhttp.open('GET', Obj3D.shaderName + ext, true);
    xhttp.overrideMimeType('text/plain');
    xhttp.send();
}

// =====================================================
function compileShaders(Obj3D)
{
    Obj3D.vshader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(Obj3D.vshader, Obj3D.vsTxt);
    gl.compileShader(Obj3D.vshader);
    if (!gl.getShaderParameter(Obj3D.vshader, gl.COMPILE_STATUS)) {
        console.log('Vertex Shader FAILED... ' + Obj3D.shaderName + '.vs');
        console.log(gl.getShaderInfoLog(Obj3D.vshader));
    }

    Obj3D.fshader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(Obj3D.fshader, Obj3D.fsTxt);
    gl.compileShader(Obj3D.fshader);
    if (!gl.getShaderParameter(Obj3D.fshader, gl.COMPILE_STATUS)) {
        console.log('Fragment Shader FAILED... ' + Obj3D.shaderName + '.fs');
        console.log(gl.getShaderInfoLog(Obj3D.fshader));
    }

    Obj3D.shader = gl.createProgram();
    gl.attachShader(Obj3D.shader, Obj3D.vshader);
    gl.attachShader(Obj3D.shader, Obj3D.fshader);
    gl.linkProgram(Obj3D.shader);
    if (!gl.getProgramParameter(Obj3D.shader, gl.LINK_STATUS)) {
        console.log('Could not initialise shaders');
        console.log(gl.getShaderInfoLog(Obj3D.shader));
    }
}

// =====================================================
function webGLStart() {
    var canvas = document.getElementById('WebGL-test');

    canvas.onmousedown = handleMouseDown;
    document.onmouseup = handleMouseUp;
    document.onmousemove = handleMouseMove;
    canvas.onwheel = handleMouseWheel;

    initGL(canvas);

    mat4.perspective(45, gl.viewportWidth / gl.viewportHeight, 0.1, 100.0, pMatrix);
    mat4.identity(rotMatrix);
    mat4.rotate(rotMatrix, rotX, [1, 0, 0]);
    mat4.rotate(rotMatrix, rotY, [0, 0, 1]);

    distCENTER = vec3.create([0.0, -0.2, -3]);
    animationStartTime = Date.now();

    initGui();
    PLANE = new plane();
    // GRID = new grille();
    tick();
}

// =====================================================
function drawScene() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    if (showPlan && PLANE) {
        PLANE.draw();
    }

    // if (showGrid && GRID) {
    //     GRID.draw();
    // }
}
