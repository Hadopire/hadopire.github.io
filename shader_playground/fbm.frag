#version 300 es
precision highp float;

uniform vec2 iResolution;
uniform float iTime;
uniform sampler2D iChannel0;

in vec2 fragCoord;
out vec4 fragColor;

const float PI = 3.14159265359f;
const vec4 bitShL = vec4(16777216.0, 65536.0, 256.0, 1.0);
vec4 packFloat( in float value )
{
    value = (value + 1.0) / 2.0;
    vec4 res = fract( value*bitShL );
	res.yzw -= res.xyz/256.0;
	return res;
}


float rd(vec2 p)
{
    p = 50.f * fract(p / PI);
    return 2.f * fract(p.x*p.y*(p.x + p.y)) - 1.f;
}

float noise(vec2 p)
{
    vec2 ij = floor(p) + vec2(1234.f, 234.f);
    vec2 w = fract(p);

    float sx = smoothstep(0.f, 1.f, w.x);
    float sy = smoothstep(0.f, 1.f, w.y);

    float a = rd(ij);
    float b = rd(ij + vec2(1.f, 0.f));
    float c = rd(ij + vec2(0.f, 1.f));
    float d = rd(ij + vec2(1.f, 1.f));

    return a + (b-a) * sx + (c-a) * sy + (a-b-c+d) * sx * sy;
}

float fbm(vec2 p)
{
    float value = 0.f;
    float amplitude = 0.5f;
    float f = 1.f;
    for (int i = 0; i < 10; ++i) {
        value += amplitude * noise(f * p);
        amplitude *= 0.5f;
        f *= 2.f;
    }
    return value;
}

void main() {
    vec2 uv = (2.0 * fragCoord - iResolution.xy) / iResolution.y;
    fragColor = packFloat( fbm(uv * 30.0) / 20.0 );
}