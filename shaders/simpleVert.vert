#version 300 es
in vec4 aPosition;
in vec4 aNormal;
out vec3 N, L, E;
uniform mat4 mModel;
uniform mat4 mProjection;
uniform vec4 uLightPosition;
void main()
{
    vec3 pos = -(mModel * aPosition).xyz;
    vec3 light = uLightPosition.xyz;
    L = normalize(light - pos);
    E = -pos;
    N = normalize((mModel * aNormal).xyz);
    gl_Position = mProjection * mModel * aPosition;
}