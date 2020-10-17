#version 300 es

precision highp float;

uniform float delta;

in vec2 vertexA;
in vec2 vertexB;
in vec2 diff;
in float theta;

out vec4 fragColor;
/*
void main()
{
    // line intersection
    // <cos(angle), sin(angle)> * distance = vertexA + (vertexB - vertexA) * t
    float cosTheta = cos(theta);
    float sinTheta = sin(theta);
    float cross2 = cosTheta * diff.y - sinTheta * diff.x;
    float dist;
    if (abs(cross2) < 1e-3) {
       // The ray is collinear with the obstacle
        discard;
    }
    else {
        dist = (diff.y * vertexA.x - diff.x * vertexA.y) / cross2;
    }
    gl_FragDepth = dist / 16.0;
    fragColor = vec4(dist, 0.0, dist, 1.0);
}*/

void main()
{
    vec2 bminusa = vertexB - vertexA;
    float alpha = atan(bminusa.y, bminusa.x);
    float lengtha = length(vertexA);
    float dd = mod(delta * 100.0, 50.0) - 25.0;
    float x = tan(theta) / (2.0 * distance(vertexA, vertexA + bminusa*dd) * cos(alpha / 2.0));
    float dist = lengtha + x;
    gl_FragDepth = dist / 16.0;
    fragColor = vec4(dist, 0.0, dist, 1.0);
}
