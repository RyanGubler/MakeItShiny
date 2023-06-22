#version 300 es
uniform mat4 uProjection;
uniform mat4 uView;
uniform mat4 uModel;
in vec4 aPosition;
in vec3 aNormal;
out vec3 vColor;
void main()
{
    gl_Position = uProjection * uView * uModel * aPosition;
    vColor = aNormal;
}