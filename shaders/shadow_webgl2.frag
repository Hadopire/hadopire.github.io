#version 300 es

precision highp float;

in vec2 vertexA;
in vec2 vertexB;
in float theta;

out vec4 fragColor;

void main()
{
    // line intersection
    // <cos(angle), sin(angle)> * distance = vertexA + (vertexB - vertexA) * t
    float cosTheta = cos(theta);
    float sinTheta = sin(theta);
    vec2 diff = vertexB - vertexA;
    float cross2 = cosTheta * diff.y - sinTheta * diff.x;
    float dist;
    if (abs(cross2) < 1e-3) {
       // The ray is collinear with the obstacle
        dist = max(length(vertexA), length(vertexB));
    }
    else {
        dist = (diff.y * vertexA.x - diff.x * vertexA.y) / cross2;
    }
    gl_FragDepth = dist / 16.0;
    fragColor = vec4(dist, 1.0, dist, 1.0);
}