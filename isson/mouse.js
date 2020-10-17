let mousex;
let mousey;
let mousedown = false;
let callbacks = [];
let registered = false;
let canvas;

export function registerGlContext(gl)
{
    if (registered)
    {
        console.log('mouse.js: gl context already registered');
        return;
    }
    canvas = gl.canvas;
    canvas.addEventListener('mousemove', mouseMoveEventListener);
    canvas.addEventListener('mouseup', mouseUpEventListener);
    canvas.addEventListener('mousedown', mouseDownEventListener);
    registered = true;
}

export function registerMouseClickCallback(callback)
{
    callbacks.push(callback);
}

function mouseMoveEventListener(e)
{
    const rect = canvas.getBoundingClientRect();
    mousex = e.clientX - rect.left;
    mousey = e.clientY - rect.top;
}

function mouseUpEventListener(e)
{
    if (mousedown) {
        for (const callback of callbacks) {
            callback();
        }
    }
    mousedown = false;
}

function mouseDownEventListener(e)
{
    mousedown = true;
}

export function isMouseDown()
{
    return mousedown;
}

export function getMousePosition()
{
    return {x: mousex, y: mousey};
}