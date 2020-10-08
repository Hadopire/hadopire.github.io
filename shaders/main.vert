attribute vec4 aVertexPosition;
attribute vec4 aVertexColor;

uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;

varying vec4 vertexColor;
varying vec4 fragPosition;

void main()
{
    vec4 worldPosition = uModelViewMatrix * aVertexPosition;
    gl_Position = uProjectionMatrix * worldPosition;
    vertexColor = aVertexColor;
    fragPosition = worldPosition;
}