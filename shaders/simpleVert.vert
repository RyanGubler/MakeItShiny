#version 300 es
    in vec4 aPosition;
    in vec4 aColor;
    in vec4 aNormal;
    uniform mat4 mProjection;
    uniform mat4 mView;
    uniform mat4 mModel;
    out vec4 vColor;
    void main()
    {
        gl_Position = mProjection * mView * mModel * aPosition;
        vColor = aNormal;
    }