import * as glmatrix from './glmatrix/index.js'

const passThroughVert = `#version 300 es

layout (location = 0) in vec4 vertexPosition;

uniform vec2 iResolution;

out vec2 fragCoord;

void main() {
    gl_Position = vertexPosition;
    fragCoord = (vertexPosition.xy + 1.0) / 2.0 * iResolution;
}
`

const passThroughFrag = `#version 300 es
precision highp float;

uniform vec2 iResolution;
uniform sampler2D iChannel0;

in vec2 fragCoord;
out vec4 fragColor;

void main() {
    vec2 uv = fragCoord / iResolution;
    fragColor = texture(iChannel0, uv);
}`

let gl = null;

let mainShader = null;
let passthroughShader = null;

let vao = null;
let previousRenderTarget = null;
let renderTarget = null;

function onResize() {
    if (gl == null) return;

    gl.canvas.width = window.innerWidth;
    gl.canvas.height = window.innerHeight;
    previousRenderTarget = createRenderTarget();
    renderTarget = createRenderTarget();
}

function loadFile(filePath) {
    let response = "";
    let req = new XMLHttpRequest();
    req.open("GET", filePath, false);
    req.send();
    if (req.status == 200)
        response = req.responseText;
    return response;
}

function loadShader(type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }

    return shader;
}

function loadProgram(vertexSrc, fragmentSrc) {
    const vertexShader = loadShader(gl.VERTEX_SHADER, vertexSrc);
    if (vertexShader == null) {
        return null;
    }

    const fragmentShader = loadShader(gl.FRAGMENT_SHADER, fragmentSrc);
    if (fragmentShader == null) {
        return null;
    }

    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.log("Failed to initialize program program: " + gl.getProgramInfoLog(program));
        return null;
    }

    return program;
}

function createRenderTarget() {
    const width = gl.canvas.width;
    const height = gl.canvas.height;
    const texture = gl.createTexture();

    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    const framebuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    return {
        texture: texture,
        framebuffer: framebuffer
    };
}

function render(now) {
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.disable(gl.DEPTH_TEST);
    gl.bindVertexArray(vao);

    gl.bindFramebuffer(gl.FRAMEBUFFER, previousRenderTarget.framebuffer);
    gl.useProgram(passthroughShader.program);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, renderTarget.texture);
    gl.uniform1i(passthroughShader.iChannel0, 0);
    gl.uniform2fv(passthroughShader.iResolution, glmatrix.vec2.fromValues(gl.canvas.width, gl.canvas.height));
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    gl.bindFramebuffer(gl.FRAMEBUFFER, renderTarget.framebuffer);
    gl.useProgram(mainShader.program);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, previousRenderTarget.texture);
    gl.uniform1i(mainShader.iChannel0, 0);
    gl.uniform2fv(mainShader.iResolution, glmatrix.vec2.fromValues(gl.canvas.width, gl.canvas.height));
    gl.uniform1f(mainShader.iTime, now / 1000.0);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.useProgram(passthroughShader.program);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, renderTarget.texture);
    gl.uniform1i(passthroughShader.iChannel0, 0);
    gl.uniform2fv(passthroughShader.iResolution, glmatrix.vec2.fromValues(gl.canvas.width, gl.canvas.height));
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    requestAnimationFrame(render);
}

function main() {
    const canvas = document.querySelector("#glCanvas");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    gl = canvas.getContext("webgl2");
    if (gl == null) {
        console.log("Failed to initialize webgl2");
        return;
    }

    let program = loadProgram(passThroughVert, loadFile("shader.frag"));
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.log("Failed to initialize shader program: " + gl.getProgramInfoLog(program));
        return;
    }

    mainShader = {
        program: program,
        iResolution: gl.getUniformLocation(program, "iResolution"),
        iTime: gl.getUniformLocation(program, "iTime"),
        iChannel0: gl.getUniformLocation(program, "iChannel0"),
    };


    program = loadProgram(passThroughVert, passThroughFrag);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.log("Failed to initialize shader program: " + gl.getProgramInfoLog(program));
        return;
    }
    
    passthroughShader = {
        program: program,
        iResolution: gl.getUniformLocation(program, "iResolution"),
        iChannel0: gl.getUniformLocation(program, "iChannel0"),
    }
    

    const vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([
            -1.0,  1.0, 0.0, 1.0,
            1.0,  1.0, 0.0, 1.0,
            -1.0, -1.0, 0.0, 1.0,
            1.0, -1.0, 0.0, 1.0,
        ]),
        gl.STATIC_DRAW
    );

    vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.vertexAttribPointer(0, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(0);

    renderTarget = createRenderTarget();
    previousRenderTarget = createRenderTarget();

    requestAnimationFrame(render);
}


window.onload = main;
window.onresize = onResize;