#version 300 es
precision highp float;

uniform vec2 iResolution;
uniform float iTime;
uniform sampler2D iChannel0;
uniform sampler2D fbmTexture;

in vec2 fragCoord;
out vec4 fragColor;


const float EPSILON = 0.0001;
const int ITER = 600;
const float PI = 3.14159265359f;
const float AMPLITUDE = 0.3;
const float FREQUENCY = 3.0;

const float COLOR_FREQUENCY = 300.0;


const vec4 bitShR = vec4(1.0/16777216.0, 1.0/65536.0, 1.0/256.0, 1.0);
float unpackFloat( in vec4 value )
{
    return dot( value, bitShR ) * 2.0 - 1.0;
}


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

float circle(vec2 p, vec2 c, float r)
{
    return distance(p, c) - r;
}

float box(vec2 p, vec2 b, vec2 bp)
{
    vec2 d = abs(p-bp)-b;
    return length(max(d,0.0)) + min(max(d.x,d.y),0.0);
}

vec2 rot(vec2 p, float a)
{
    float c = cos(a);
    float s = sin(a);
    return vec2(p.x*c - p.y*s, p.x*s + p.y*c);
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

float sdf(vec2 p, vec2 nuv)
{
    float n = unpackFloat(texture(fbmTexture, nuv));
    float d = abs(circle(p, vec2(0.0,0.0), cos(iTime) + 1.0) + n);
    d = min(d, abs(box(vec2(rot(p, iTime)), vec2(cos(iTime - 2.0) + 1.0), vec2(0.0)) + n));
    return d;
}


void main() {
    vec2 uv = (2.0 * fragCoord - iResolution.xy) / iResolution.y;
    vec2 nuv = fragCoord / iResolution.xy;
    vec4 color = texture(iChannel0, fragCoord / iResolution.xy);
    //vec4 color = vec4(0.0);


    float d = sdf(uv, nuv);
    float thickness = 5.0 / iResolution.y;
    float r = (rd(floor(vec2(iTime) * 1000.0 / COLOR_FREQUENCY)) + 1.0) / 2.0;
    float g = (rd(floor(vec2(iTime + 100.0) * 1000.0 / COLOR_FREQUENCY)) + 1.0) / 2.0;
    float b = (rd(floor(vec2(iTime + 200.0) * 1000.0 / COLOR_FREQUENCY)) + 1.0) / 2.0;
    vec4 bcolor = vec4(r,g,b, 1.0);
    color = mix(bcolor, color, smoothstep(0.0, thickness, d));

    // Output to screen
    fragColor = color;
}