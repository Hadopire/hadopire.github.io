#extension GL_EXT_frag_depth : enable

precision highp float;

uniform vec4 uLightPosition;

varying vec2 vertexA;
varying vec2 vertexB;
varying float theta;

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
        dist = min(length(vertexA), length(vertexB));
    }
    else {
        dist = (diff.y * vertexA.x - diff.x * vertexA.y) / cross2;
    }
    gl_FragDepthEXT = dist / 16.0;
    gl_FragColor = vec4(dist, 0.0, 0.0, 1.0);
}