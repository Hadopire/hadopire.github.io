#version 300 es
#define PI 3.14159265359
#define MAXLIGHTCOUNT 64

layout (location = 0) in float aVertexPosition;
layout (location = 1) in vec4 aSegment;

uniform mat4 uModelMatrix;
uniform vec4 uLightPosition[MAXLIGHTCOUNT];

out vec2 vertexA;
out vec2 vertexB;
out float theta;

void main()
{
    vertexA = (uModelMatrix * vec4(aSegment.xy, 0.0, 1.0) - uLightPosition[gl_InstanceID]).xy;
    vertexB = (uModelMatrix * vec4(aSegment.zw, 0.0, 1.0) - uLightPosition[gl_InstanceID]).xy;

    float thetaA = atan(vertexA.y, vertexA.x);
    float thetaAB = atan(vertexA.x * vertexB.y - vertexA.y * vertexB.x, vertexA.x * vertexB.x + vertexA.y * vertexB.y) * aVertexPosition;
    theta = thetaA + thetaAB;
    float ySnappedPixelPos = (2.0 * float(gl_InstanceID) + 1.0) / (2.0 * float(MAXLIGHTCOUNT));
    gl_Position = vec4(theta / PI, ySnappedPixelPos * 2.0 - 1.0, 0.0, 1.0);
}