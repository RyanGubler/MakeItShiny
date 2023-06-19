#version 300 es
precision lowp float;
in vec3 N, L, E;
in vec2 vTexCoord;
uniform vec4 uAmbientProduct;
uniform vec4 uDiffuseProduct;
uniform vec4 uSpecularProduct;
uniform float uShininess;
uniform sampler2D uSampler;
out vec4 outColor;
void main()
{
    vec4 color = texture(uSampler, vTexCoord);
    vec3 H = normalize(L + E);
    vec4 ambient = uAmbientProduct;

    float Kd = max(dot(L, N), 0.0);
    vec4 diffuse = Kd * uDiffuseProduct;

    float Ks = pow(max(dot(N, H), 0.0), uShininess);
    vec4 specular = Ks * uSpecularProduct;
    if (dot(L, N) < 0.0) {
        specular = vec4(0.0, 0.0, 0.0, 1.0);
    }
    outColor = ambient + diffuse + specular;
    outColor.a = 1.0;
}