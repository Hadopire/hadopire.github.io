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

    vec4 color = vec4(0.5 * vertexColor.rgb, 1.0);
    if (dist < casterDist)
    {
        const float l = 0.1;
        float q = sqrt(l*l+dist*dist);
        vec4 diffuse = vec4((l/q) * uLightColor, 1.0);
        color += diffuse * vertexColor;
    }

    if (dist < 0.05 && dist > 0.03)
    {
        if (casterDist > 10.0) 
            fragColor = vec4(0.7, 0.3, 0.6, 1.0);
        else
            fragColor = vec4(0.0, texture(uShadowmap, vec2(angularPosition, 0.0)).x * 2.0, 0.0, 1.0);
    }
    else
    {
        fragColor = color;
    }
}