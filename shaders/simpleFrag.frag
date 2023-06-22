#version 300 es
precision lowp float;
in vec3 vColor;
out vec4 outColor;
uniform vec3 uLight1, uLight2, uLight3;
uniform vec3 uDiffuse1, uDiffuse2, uDiffuse3;
uniform vec3 uAmbient, mDiffuse;
uniform vec3 uSpecularDiffuse, uSpecular;
uniform mat4 uView2, uModel2;
void main() {
    vec3 Normal = normalize((transpose(inverse(uView2 * uModel2)) * vec4(vColor, 1.0)).xyz);
    vec3 V = -Normal;
    vec3 L1 = normalize(uLight1 - Normal);
    vec3 L2 = normalize(uLight2 - Normal);
    vec3 L3 = normalize(uLight3 - Normal);
    vec3 R1 = reflect(-L1, Normal);
    vec3 R2 = reflect(-L2, Normal);
    vec3 R3 = reflect(-L3, Normal);
    vec3 I_d = mDiffuse * (uDiffuse1 * dot(Normal, L1) + uDiffuse2 * dot(Normal, L2) + uDiffuse3 * dot(Normal, L3));
    I_d += uSpecularDiffuse * uSpecular * pow(dot(V, R1) + dot(V, R2) + dot(V, R3), 10.0);
    outColor = clamp(vec4(I_d, 1.0), vec4(0.0, 0.0, 0.0, 0.0), vec4(1.0, 1.0, 1.0, 1.0));
}