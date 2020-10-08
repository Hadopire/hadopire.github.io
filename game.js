import * as keyboard from './keyboard.js'
import * as mouse from './mouse.js'
import * as glutils from './glutils.js'
import * as utils from './utils.js'

import * as glmatrix from './glmatrix/index.js'

let gl;
let aspectRatio;
let scene = {};
const shadowMapWidth = 10240;

function main() {
    let canvas = document.querySelector("#glCanvas");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    aspectRatio = canvas.width / canvas.height;
    console.log(aspectRatio);
    gl = canvas.getContext("webgl");
    if (gl == null) {
        console.log("Failed to initialize webgl");
        return;
    }
    if (!gl.getExtension("OES_texture_float")) {
        console.log("OES_texture_half_float extension is not supported");
        return;
    }
    if (!gl.getExtension('EXT_frag_depth')) {
        console.log("EXT_frag_depth extension is not supported");
        return;
    }

    mouse.registerGlContext(gl);
    const shaderProgram = glutils.initShaderProgram(
        gl,
        utils.loadFile("shaders/main.vert"),
        utils.loadFile("shaders/main.frag")
    );

    let object = {}
    object.material = {
        program: shaderProgram,
        attribLocations: {
            vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
            vertexColor: gl.getAttribLocation(shaderProgram, 'aVertexColor'),
        },
        uniformLocations: {
            projectionMatrix: gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
            modelViewMatrix: gl.getUniformLocation(shaderProgram, 'uModelViewMatrix'),
            lightPosition: gl.getUniformLocation(shaderProgram, 'uLightPosition'),
            lightColor: gl.getUniformLocation(shaderProgram, 'uLightColor'),
            shadowMap: gl.getUniformLocation(shaderProgram, 'uShadowMap'),
        },
    };

    let positions = [
        -1.0, 1.0,
        1.0, 1.0,
        -1.0, -1.0,
        1.0, -1.0,
    ];
    object.positions = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, object.positions);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    let colors = [
        1.0, 1.0, 1.0, 1.0,
        1.0, 1.0, 1.0, 1.0,
        1.0, 1.0, 1.0, 1.0,
        1.0, 1.0, 1.0, 1.0,
    ]
    object.color = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, object.color);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

    object.modelView = glmatrix.mat4.create();
    glmatrix.mat4.scale(object.modelView, object.modelView, [0.25, 0.002, 1.0]);
    object.projection = glmatrix.mat4.ortho(glmatrix.mat4.create(), -1.0, 1.0, -1.0 / aspectRatio, 1.0 / aspectRatio, -1.0, 1.0);
    scene.objects = []

    let bg = { ...object };
    bg.modelView = glmatrix.mat4.create();
    glmatrix.mat4.scale(bg.modelView, bg.modelView, [10.0, 10.0, 1.0]);
    colors = [
        0.133, 0.639, 0.521, 1.0,
        0.133, 0.639, 0.521, 1.0,
        0.133, 0.639, 0.521, 1.0,
        0.133, 0.639, 0.521, 1.0,
    ]
    bg.color = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, bg.color);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
    scene.objects.push(bg);
    scene.objects.push(object);

    scene.shadowMap = {
        frameBuffer: gl.createFramebuffer(),
        texture: gl.createTexture(),
    }

    gl.bindTexture(gl.TEXTURE_2D, scene.shadowMap.texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, shadowMapWidth, 1, 0, gl.RGBA, gl.FLOAT, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.bindFramebuffer(gl.FRAMEBUFFER, scene.shadowMap.frameBuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, scene.shadowMap.texture, 0);

    const shadowMapProgram = glutils.initShaderProgram(
        gl,
        utils.loadFile("shaders/shadowmap.vert"),
        utils.loadFile("shaders/shadowmap.frag")
    );

    let line = {}
    line.material = {
        program: shadowMapProgram,
        attribLocations: {
            vertexPosition: gl.getAttribLocation(shadowMapProgram, 'aVertexPosition'),
            segment: gl.getAttribLocation(shadowMapProgram, 'aSegment'),
        },
        uniformLocations: {
            lightPosition: gl.getUniformLocation(shadowMapProgram, 'uLightPosition'),
        },
    };

    console.log(gl.getError());

    positions = [
        0.0, 1.0,
        0.0, 1.0,
        0.0, 1.0,
        0.0, 1.0,
        0.0, 1.0,
        0.0, 1.0,
    ];

    let segments = [
        -0.25, 0.0, 0.0, 0.0, -0.25, 0.0, 0.0, 0.0,
        0.0, 0.0, -0.25, 0.0, 0.0, 0.0, -0.25, 0.0,
        -0.25, -0.25, 0.25, -0.25, -0.25, -0.25, 0.25, -0.25,
        0.25, -0.25, -0.25, -0.25, 0.25, -0.25, -0.25, -0.25,
        -0.25, 0.0, -0.25, -0.25, -0.25, 0.0, -0.25, -0.25,
        -0.25, -0.25, -0.25, 0.0, -0.25, -0.25, -0.25, 0.0,
    ];

    line.positions = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, line.positions);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
    line.segments = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, line.segments);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(segments), gl.STATIC_DRAW);
    scene.line = line;
    console.log(scene.line);

    requestAnimationFrame(render);
}


function tick(delta) {
    let move = glmatrix.vec3.create();
    if (keyboard.isKeyDown("w", "W"))
        move[1] += 1;
    if (keyboard.isKeyDown("a", "A"))
        move[0] -= 1;
    if (keyboard.isKeyDown("s", "S"))
        move[1] -= 1;
    if (keyboard.isKeyDown("d", "D"))
        move[0] += 1;
    glmatrix.vec3.scale(move, move, delta);
    scene.objects[1].modelView[12] += move[0];
    scene.objects[1].modelView[13] += move[1];

    let mPos = mouse.getMousePosition();
    mPos.x = (mPos.x / gl.canvas.width * 2.0) - 1.0;
    mPos.y = -(((mPos.y / gl.canvas.height * 2.0) - 1.0) / aspectRatio);
    scene.light = glmatrix.vec4.fromValues(mPos.x, mPos.y, 0.0, 1.0);
}

let then = 0;
function render(now) {
    now *= 0.001;
    let delta = now - then;
    tick(delta);
    then = now;

    
    gl.bindFramebuffer(gl.FRAMEBUFFER, scene.shadowMap.frameBuffer);
    gl.viewport(0, 0, shadowMapWidth, 1);
    gl.clearColor(1337.0, 0.0, 0.0, 1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LESS);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.bindBuffer(gl.ARRAY_BUFFER, scene.line.positions);
    gl.enableVertexAttribArray(scene.line.material.attribLocations.vertexPosition);
    gl.vertexAttribPointer(scene.line.material.attribLocations.vertexPosition, 1, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, scene.line.segments);
    gl.enableVertexAttribArray(scene.line.material.attribLocations.segment);
    gl.vertexAttribPointer(scene.line.material.attribLocations.segment, 4, gl.FLOAT, false, 0, 0);
    
    gl.useProgram(scene.line.material.program);
    gl.uniform4fv(scene.line.material.uniformLocations.lightPosition, scene.light);
    gl.drawArrays(gl.LINES, 0, 12);

    gl.disableVertexAttribArray(scene.line.material.attribLocations.position);


    //console.log(gl.getError());


    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.disable(gl.DEPTH_TEST);
    gl.clear(gl.COLOR_BUFFER_BIT);

    for (const object of scene.objects) {
        gl.bindBuffer(gl.ARRAY_BUFFER, object.positions);
        gl.enableVertexAttribArray(object.material.attribLocations.vertexPosition);
        gl.vertexAttribPointer(object.material.attribLocations.vertexPosition, 2, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, object.color);
        gl.enableVertexAttribArray(object.material.attribLocations.vertexColor);
        gl.vertexAttribPointer(object.material.attribLocations.vertexColor, 4, gl.FLOAT, false, 0, 0);

        gl.useProgram(object.material.program);
        gl.uniformMatrix4fv(object.material.uniformLocations.projectionMatrix, false, object.projection);
        gl.uniformMatrix4fv(object.material.uniformLocations.modelViewMatrix, false, object.modelView);
        gl.uniform4fv(object.material.uniformLocations.lightPosition, scene.light);
        gl.uniform3fv(object.material.uniformLocations.lightColor, glmatrix.vec3.fromValues(1.0, 1.0, 1.0));

        gl.bindTexture(gl.TEXTURE_2D, scene.shadowMap.texture);
        gl.activeTexture(gl.TEXTURE0);
        gl.uniform1i(object.material.uniformLocations.shadowMap, 0);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

        gl.disableVertexAttribArray(object.material.attribLocations.vertexPosition);
        gl.disableVertexAttribArray(object.material.attribLocations.vertexColor);
    }

    requestAnimationFrame(render);
}

window.onload = main;