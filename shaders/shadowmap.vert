precision highp float;

attribute float aVertexPosition;
attribute vec4 aSegment;

uniform vec4 uLightPosition;

varying vec2 vertexA;
varying vec2 vertexB;
varying float theta;

void main()
{
    const float pi = 3.14159265359;

    vertexA = (aSegment.xy - uLightPosition.xy);
    vertexB = (aSegment.zw - uLightPosition.xy);

    float thetaA = atan(vertexA.y, vertexA.x);
    float thetaAB = atan(vertexA.x * vertexB.y - vertexA.y * vertexB.x, vertexA.x * vertexB.x + vertexA.y * vertexB.y) * aVertexPosition;
    theta = thetaA + thetaAB;
    gl_Position = vec4(theta / pi, 0.0, theta / pi, 1.0);
}