let pressedKeys = {}
window.onkeyup = function(e) { pressedKeys[e.key] = false; pressedKeys[e.keyCode] = false; }
window.onkeydown = function(e) { pressedKeys[e.key] = true; pressedKeys[e.keyCode] = true; }

function keyDown(keys)
{
  for (let i = 0; i < keys.length; ++i)
  {
    if (pressedKeys[keys[i]])
      return true;
  }
  return false;
}

export function isKeyDown(...keys)
{
  return keyDown(keys);
}

export function isKeyUp(...keys)
{
  return !keyDown(keys);
}