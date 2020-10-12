import * as keyboard from './keyboard.js'
import * as mouse from './mouse.js'
import * as glutils from './glutils.js'
import * as utils from './utils.js'

import * as glmatrix from './glmatrix/index.js'

let gl;
let aspectRatio;

let scene = {
    materials: {},
    shadowmap: {},
    light: {
        position: glmatrix.vec4.fromValues(0.0, 0.0, 0.0, 1.0),
        color: glmatrix.vec3.fromValues(1.0, 1.0, 1.0)
    },
    controlled: [],
};

function main() {
    let canvas = document.querySelector("#glCanvas");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    aspectRatio = canvas.clientWidth / canvas.clientHeight;

    gl = canvas.getContext("webgl2");
    if (gl == null) {
        console.log("Failed to initialize webgl2");
        return;
    }

    if (gl.getExtension("EXT_color_buffer_float") == null) {
        console.log("Failed to load extension EXT_color_buffer_float");
        return;
    }

    mouse.registerGlContext(gl);
    
    scene.shadowmap = {
        framebuffer: gl.createFramebuffer(),
        depthbuffer: gl.createRenderbuffer(),
        texture: gl.createTexture(),
        width: 8192,
        height: 1,
    };

    gl.bindTexture(gl.TEXTURE_2D, scene.shadowmap.texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, scene.shadowmap.width, scene.shadowmap.height, 0, gl.RGBA, gl.FLOAT, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.bindFramebuffer(gl.FRAMEBUFFER, scene.shadowmap.framebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, scene.shadowmap.texture, 0);
    gl.bindRenderbuffer(gl.RENDERBUFFER, scene.shadowmap.depthbuffer);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, scene.shadowmap.width, scene.shadowmap.height);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, scene.shadowmap.depthbuffer);

    let shaderProgram = glutils.initShaderProgram(gl, utils.loadFile("shaders/main_webgl2.vert"), utils.loadFile("shaders/main_webgl2.frag"));
    scene.materials.diffuse = {
        program: shaderProgram,
        uniformLocations: {
            modelMatrix:        gl.getUniformLocation(shaderProgram, 'uModelMatrix'),
            viewMatrix:         gl.getUniformLocation(shaderProgram, 'uViewMatrix'),
            projectionMatrix:   gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
            lightPosition:      gl.getUniformLocation(shaderProgram, 'uLightPosition'),
            lightColor:         gl.getUniformLocation(shaderProgram, 'uLightColor'),
            shadowmap:          gl.getUniformLocation(shaderProgram, 'uShadowmap'),
        },
        uniforms: {
            viewMatrix:         glmatrix.mat4.create(),
            projectionMatrix:   glmatrix.mat4.ortho(
                                    glmatrix.mat4.create(),
                                    -1.0,
                                    1.0,
                                    -1.0 / aspectRatio,
                                    1.0 / aspectRatio,
                                    -1.0,
                                    1.0
                                ),
            lightPosition:      scene.light,
            lightColor:         glmatrix.vec4.fromValues(1.0, 1.0, 1.0, 1.0),
            shadowmap:          scene.shadowmap,
        },
        objects: [],
    };

    shaderProgram = glutils.initShaderProgram(gl, utils.loadFile("shaders/main_webgl2.vert"), utils.loadFile("shaders/unlit.frag"));
    scene.materials.ambiant = {
        program: shaderProgram,
        uniformLocations: {
            modelMatrix:        gl.getUniformLocation(shaderProgram, 'uModelMatrix'),
            viewMatrix:         gl.getUniformLocation(shaderProgram, 'uViewMatrix'),
            projectionMatrix:   gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
        },
        uniforms: {
            viewMatrix:         glmatrix.mat4.create(),
            projectionMatrix:   glmatrix.mat4.ortho(
                                    glmatrix.mat4.create(),
                                    -1.0,
                                    1.0,
                                    -1.0 / aspectRatio,
                                    1.0 / aspectRatio,
                                    -1.0,
                                    1.0
                                ),
        },
        objects: [],
    };

    shaderProgram = glutils.initShaderProgram(gl, utils.loadFile("shaders/shadow_webgl2.vert"), utils.loadFile("shaders/shadow_webgl2.frag"));
    scene.materials.shadow = {
        program: shaderProgram,
        uniformLocations: {
            modelMatrix:    gl.getUniformLocation(shaderProgram, 'uModelMatrix'),
            lightPosition:  gl.getUniformLocation(shaderProgram, 'uLightPosition'),
        },
        uniforms: {
            lightPosition:  scene.light,
        },
        objects: [],
    };

    const margin = 0.0005;

    rectangle(scene.materials.diffuse, 0.0, 0.0, 10.0, 10.0, [0.133, 0.639, 0.521, 1.0]);
    scene.controlled.push(rectangle(scene.materials.ambiant, 0.0, 0.0, 0.25, 0.25, [0.133, 0.639, 0.521, 1.0]));
    scene.controlled.push(obstacleRectangle(scene.materials.shadow, 0.0, 0.0, 0.25 - margin, 0.25 - margin));


    requestAnimationFrame(render);
}

let rectangleBuffer = null;
function rectangle(material, x, y, scalex, scaley, color) {
    if (rectangleBuffer == null) {
        rectangleBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, rectangleBuffer);
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
    }

    let object = {
        vao: gl.createVertexArray(),
        drawCount: 4,
        positions: rectangleBuffer,
        colors: gl.createBuffer(),
        transform: {
            position: {
                x: x,
                y: y,
            },
            rotation: 0.0,
            scale: {
                x: scalex,
                y: scaley,
            }
        },
        modelMatrix: glmatrix.mat4.create(),
    };

    glmatrix.mat4.fromRotationTranslationScale(
        object.modelMatrix,
        glmatrix.quat.create(),
        glmatrix.vec3.fromValues(x, y, 0.0),
        glmatrix.vec3.fromValues(scalex, scaley, 0.0)
    );

    gl.bindVertexArray(object.vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, object.positions);
    gl.vertexAttribPointer(0, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(0);

    gl.bindBuffer(gl.ARRAY_BUFFER, object.colors);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(color.concat(color, color, color)), gl.STATIC_DRAW);
    gl.vertexAttribPointer(1, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(1);
    gl.bindVertexArray(null);

    material.objects.push(object);
    return object;
}

let obstacleRectanglePositionsBuffer = null;
let obstacleRectangleSegmentsBuffer = null;
function obstacleRectangle(material, x, y, scalex, scaley) {
    if (obstacleRectanglePositionsBuffer == null) {
        obstacleRectanglePositionsBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, obstacleRectanglePositionsBuffer);
        gl.bufferData(
            gl.ARRAY_BUFFER,
            new Float32Array([
                0.0, 1.0,
                0.0, 1.0,
                0.0, 1.0,
                0.0, 1.0,
                0.0, 1.0,
                0.0, 1.0,
                0.0, 1.0,
                0.0, 1.0,
            ]),
            gl.STATIC_DRAW
        );

        obstacleRectangleSegmentsBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, obstacleRectangleSegmentsBuffer);
        gl.bufferData(
            gl.ARRAY_BUFFER,
            new Float32Array([
                -1.0,  1.0,  1.0,  1.0,     -1.0,  1.0,  1.0,  1.0,
                 1.0,  1.0, -1.0,  1.0,      1.0,  1.0, -1.0,  1.0,
                 1.0,  1.0,  1.0, -1.0,      1.0,  1.0,  1.0, -1.0,
                 1.0, -1.0,  1.0,  1.0,      1.0, -1.0,  1.0,  1.0,
                 1.0, -1.0, -1.0, -1.0,      1.0, -1.0, -1.0, -1.0,
                -1.0, -1.0,  1.0, -1.0,     -1.0, -1.0,  1.0, -1.0,
                -1.0, -1.0, -1.0,  1.0,     -1.0, -1.0, -1.0,  1.0,
                -1.0,  1.0, -1.0, -1.0,     -1.0,  1.0, -1.0, -1.0,
            ]),
            gl.STATIC_DRAW
        );
    }

    let object = {
        vao: gl.createVertexArray(),
        drawCount: 16,
        positions: obstacleRectanglePositionsBuffer,
        segments: obstacleRectangleSegmentsBuffer,
        transform: {
            position: {
                x: x,
                y: y,
            },
            rotation: 0.0,
            scale: {
                x: scalex,
                y: scaley,
            }
        },
        modelMatrix: glmatrix.mat4.create(),
    };

    glmatrix.mat4.fromRotationTranslationScale(
        object.modelMatrix,
        glmatrix.quat.create(),
        glmatrix.vec3.fromValues(x, y, 0.0),
        glmatrix.vec3.fromValues(scalex, scaley, 0.0)
    );

    gl.bindVertexArray(object.vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, object.positions);
    gl.vertexAttribPointer(0, 1, gl.FLOAT, false, 0.0, 0.0);
    gl.enableVertexAttribArray(0);

    gl.bindBuffer(gl.ARRAY_BUFFER, object.segments);
    gl.vertexAttribPointer(1, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(1);
    gl.bindVertexArray(null);

    material.objects.push(object);
    return object;
}

function tick(delta) {
    let mPos = mouse.getMousePosition();
    mPos.x = (mPos.x / gl.canvas.width * 2.0) - 1.0;
    mPos.y = -(((mPos.y / gl.canvas.height * 2.0) - 1.0) / aspectRatio);
    scene.light.position = glmatrix.vec4.fromValues(mPos.x, mPos.y, 0.0, 1.0);

    for (const controlled of scene.controlled) {
        let transform = controlled.transform;
        if (keyboard.isKeyDown("w", "W", "z", "Z"))
            transform.position.y += 1 * delta;
        if (keyboard.isKeyDown("a", "A", "q", "Q"))
            transform.position.x -= 1 * delta;
        if (keyboard.isKeyDown("s", "S"))
            transform.position.y -= 1 * delta;
        if (keyboard.isKeyDown("d", "D"))
            transform.position.x += 1 * delta;

        glmatrix.mat4.fromRotationTranslationScale(
            controlled.modelMatrix,
            glmatrix.quat.create(),
            glmatrix.vec3.fromValues(transform.position.x, transform.position.y, 0.0),
            glmatrix.vec3.fromValues(transform.scale.x, transform.scale.y, 0.0)
        );
    }
}

let then = 0;
function render(now) {
    now *= 0.001;
    let delta = now - then;
    tick(delta);
    then = now;

    gl.bindFramebuffer(gl.FRAMEBUFFER, scene.shadowmap.framebuffer);
    gl.viewport(0, 0, scene.shadowmap.width, scene.shadowmap.height);
    gl.clearColor(1000.0, 0.0, 0.0, 1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    let material = scene.materials.shadow;
    gl.useProgram(material.program);
    gl.uniform4fv(material.uniformLocations.lightPosition, scene.light.position);
    for (const object of material.objects) {
        gl.uniformMatrix4fv(material.uniformLocations.modelMatrix, false, object.modelMatrix);
        gl.bindVertexArray(object.vao);
        gl.drawArrays(gl.LINES, 0, object.drawCount);
    }


    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.disable(gl.DEPTH_TEST);
    gl.clear(gl.COLOR_BUFFER_BIT);

    for (material of [scene.materials.diffuse, scene.materials.ambiant]) {
        //material = scene.materials.diffuse;
        gl.useProgram(material.program);
        gl.bindTexture(gl.TEXTURE_2D, scene.shadowmap.texture);
        gl.activeTexture(gl.TEXTURE0)
        gl.uniform1i(material.uniformLocations.shadowmap, 0);
        gl.uniformMatrix4fv(material.uniformLocations.viewMatrix, false, material.uniforms.viewMatrix);
        gl.uniformMatrix4fv(material.uniformLocations.projectionMatrix, false, material.uniforms.projectionMatrix);
        gl.uniform4fv(material.uniformLocations.lightPosition, scene.light.position);
        gl.uniform3fv(material.uniformLocations.lightColor, scene.light.color);
        for (const object of material.objects) {
            gl.uniformMatrix4fv(material.uniformLocations.modelMatrix, false, object.modelMatrix);
            gl.bindVertexArray(object.vao);
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, object.drawCount);
        }
    }

    requestAnimationFrame(render);
}

window.onload = main;