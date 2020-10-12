#version 300 es

#define PI 3.14159265359

layout (location = 0) in float aVertexPosition;
layout (location = 1) in vec4 aSegment;

uniform mat4 uModelMatrix;
uniform vec4 uLightPosition;

out vec2 vertexA;
out vec2 vertexB;
out float theta;

void main()
{
    vertexA = (uModelMatrix * vec4(aSegment.xy, 0.0, 1.0) - uLightPosition).xy;
    vertexB = (uModelMatrix * vec4(aSegment.zw, 0.0, 1.0) - uLightPosition).xy;

    float thetaA = atan(vertexA.y, vertexA.x);
    float thetaAB = atan(vertexA.x * vertexB.y - vertexA.y * vertexB.x, vertexA.x * vertexB.x + vertexA.y * vertexB.y) * aVertexPosition;
    theta = thetaA + thetaAB;
    gl_Position = vec4(theta / PI, 0.0, theta / PI, 1.0);
}