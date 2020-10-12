#version 300 es

precision highp float;
precision highp sampler2D;

uniform vec4 uLightPosition;
uniform vec3 uLightColor;
uniform sampler2D uShadowmap;

in vec4 vertexColor;
in vec4 fragPosition;

out vec4 fragColor;

void main()
{
    const float pi = 3.14159265359;
    
    vec2 lightSpacePosition = (fragPosition - uLightPosition).xy;
    float dist = length(lightSpacePosition);
    float angularPosition = atan(lightSpacePosition.y, lightSpacePosition.x) / (2.0 * pi) + 0.5;
    float casterDist = texture(uShadowmap, vec2(angularPosition, 0.0)).x;

    vec4 color = vec4(0.01 * vertexColor.rgb, 1.0);
    if (dist < casterDist)
    {
        const float r = 0.05;
        float attenuation = 1.0 / pow(dist/r + 1.0, 2.0);
        vec4 diffuse = vec4(attenuation * uLightColor, 1.0);
        color += diffuse * vertexColor;
    }

    fragColor = color;
}