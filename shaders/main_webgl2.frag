#version 300 es
#define PI 3.14159265359
#define MAXLIGHTCOUNT 64

precision highp float;
precision highp sampler2D;

uniform vec4 uLightPosition[MAXLIGHTCOUNT];
uniform vec3 uLightColor[MAXLIGHTCOUNT];
uniform sampler2D uShadowmap;

in vec4 vertexColor;
in vec4 fragPosition;

out vec4 fragColor;

void main()
{
    vec4 color = vec4(0.0, 0.0, 0.0, 1.0);
    
    for (int i = 0; i < MAXLIGHTCOUNT; ++i)
    {
        vec2 lightSpacePosition = (fragPosition - uLightPosition[i]).xy;
        float dist = length(lightSpacePosition);
        float angularPosition = atan(lightSpacePosition.y, lightSpacePosition.x) / (2.0 * PI) + 0.5;
        float casterDist = texture(uShadowmap, vec2(angularPosition, float(i) / (float(MAXLIGHTCOUNT) - 1.0))).x;

        if (dist < casterDist)
        {
            const float r = 0.1;
            float attenuation = 1.0 / pow(dist/r + 1.0, 2.0);
            vec4 diffuse = vec4(attenuation * uLightColor[i], 1.0);
            color += diffuse * vertexColor;
        }
    }

    fragColor = color;
}