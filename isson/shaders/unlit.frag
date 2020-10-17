#version 300 es

precision highp float;

in vec4 vertexColor;
in vec4 fragPosition;

out vec4 fragColor;

void main()
{
    fragColor = vec4(vertexColor.rgb, 1.0);
}