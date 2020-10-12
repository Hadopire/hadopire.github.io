#version 300 es

layout (location = 0) in vec4 aVertexPosition;
layout (location = 1) in vec4 aVertexColor;

uniform mat4 uModelMatrix;
uniform mat4 uViewMatrix;
uniform mat4 uProjectionMatrix;

out vec4 vertexColor;
out vec4 fragPosition;

void main()
{
    vec4 worldPosition = uModelMatrix * aVertexPosition;
    gl_Position = uProjectionMatrix * uViewMatrix * worldPosition;
    vertexColor = aVertexColor;
    fragPosition = worldPosition;
}