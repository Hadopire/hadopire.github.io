let mousex;
let mousey;
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
    registered = true;
}

function mouseMoveEventListener(e)
{
    const rect = canvas.getBoundingClientRect();
    mousex = e.clientX - rect.left;
    mousey = e.clientY - rect.top;
}

export function getMousePosition()
{
    return {x: mousex, y: mousey};
}