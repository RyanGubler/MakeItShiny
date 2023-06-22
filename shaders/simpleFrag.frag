#version 300 es
precision lowp float;
in vec3 vColor;
out vec4 outColor;
uniform vec3 uLight1, uLight2, uLight3, uDiffuse1, uDiffuse2, uDiffuse3, uAmbient, mDiffuse, uSpecularDiffuse, uSpecular;
uniform mat4 uView2, uModel2;
void main() {
    vec3 Normal = normalize((transpose(inverse(uView2 * uModel2)) * vec4(vColor, 1.0)).xyz);
    vec3 I_a = mDiffuse * uAmbient;
    vec3 eye = vec3(0.0, 0.0, 0.0);
    vec3 V = eye - Normal;
    vec3 L1, L2, L3, R1, R2, R3;
    L1 = normalize(uLight1 - Normal);
    L2 = normalize(uLight2 - Normal);
    L3 = normalize(uLight3 - Normal); 
    R1 = reflect(-L1, Normal);
    R2 = reflect(-L2, Normal);
    R3 = reflect(-L3, Normal);  
    float Cos1 = dot(Normal, L1);
    float Cos2 = dot(Normal, L2);
    float Cos3 = dot(Normal, L3);
    vec3 I_d = mDiffuse * (uDiffuse1 * Cos1 + uDiffuse2 * Cos2 + uDiffuse3 * Cos3) + uSpecularDiffuse * uSpecular * pow(dot(V, R1) + dot(V, R2) + dot(V, R3), 2.0);
    outColor = clamp(vec4(I_d, 1.0),vec4(0.0,0.0,0.0,00.0),vec4(1.0,1.0,1.0,1.0));
}