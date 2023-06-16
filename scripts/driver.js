MySample.main = (function() {
    'use strict';  
    let canvas = document.getElementById('canvas-main');
    let gl = canvas.getContext('webgl2');
    let previousTime = performance.now();
    let indices = [];
    let vertices = [];
    let normals = [0, 0, 1];
    let triangles = [];
    let view = new Float32Array([
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1
    ]);
    let right = .25;
    let left = -.25;
    let top = .25;
    let bottom = .25;
    let near = 1;
    let far = 10;
    let translate1 = new Float32Array ([
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, -2,
        0, 0, 0, 1
    ]);
    let translate2 = new Float32Array([
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1
    ]);

    let perspectiveProjection = new Float32Array([
        near / right, 0, 0, 0,
        0, near / top, 0, 0,
        0, 0, -(far + near) / (far - near), (-2 * far * near) / (far - near),
        0, 0, -1, 0
    ]);
    let model = new Float32Array([
        1.0, 0.0, 0.0, 0.0,
        0.0, 1.0, 0.0, 0.0,
        0.0, 0.0, 1.0, 0.0,
        0.0, 0.0, 0.0, 1.0
    ]);
    let vertexBuffer = gl.createBuffer();
    let normalBuffer = gl.createBuffer();
    let indexBuffer = gl.createBuffer();
    let shaderProgram = gl.createProgram();
    async function bufferAndShader(){
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, normals, gl.STATIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, null)
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
        let vertexShaderSource = await loadFileFromServer("shaders/simpleVert.vert");
        let fragmentShaderSource = await loadFileFromServer("shaders/simpleFrag.frag");
        let vertexShader = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(vertexShader, vertexShaderSource);
        gl.compileShader(vertexShader);
        let fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(fragmentShader, fragmentShaderSource);
        gl.compileShader(fragmentShader);
        gl.attachShader(shaderProgram, vertexShader);
        gl.attachShader(shaderProgram, fragmentShader);
        gl.linkProgram(shaderProgram);
        gl.useProgram(shaderProgram);
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        let position = gl.getAttribLocation(shaderProgram, 'aPosition');
        gl.enableVertexAttribArray(position);
        gl.vertexAttribPointer(position, 3, gl.FLOAT, false, vertices.BYTES_PER_ELEMENT * 3, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
        let normal = gl.getAttribLocation(shaderProgram, 'aNormal');
        gl.enableVertexAttribArray(normal);
        gl.vertexAttribPointer(normal, 3, gl.FLOAT, false, normals.BYTES_PER_ELEMENT * 3, 0);
        requestAnimationFrame(animationLoop);
    }
    async function loadFile(filename){
        let file = await loadFileFromServer(filename);
        let data = file.split("end_header");
        let elementVertex = data[1];
        data = data[0].split(/\r?\n/);
        let numberToSplice = data[3].split(" ");
        numberToSplice = parseInt(numberToSplice[2]);
        elementVertex = elementVertex.split(/\r?\n/);
        elementVertex.shift();
        elementVertex.pop();
        let elementFace = elementVertex.slice(numberToSplice);
        elementVertex = elementVertex.slice(0, numberToSplice);
        elementFace = elementFace.map(str => str.substring(2));
        elementVertex = elementVertex.map(stringData => {
            let stuff = stringData.split(" ").slice(0, 3);
            return stuff;
        });
        elementFace = elementFace.map(convert => convert.split(" "));
        let elementFaceResult = [];
        for(let i = 0; i < elementFace.length; i++){
            for (let j = 0; j < 3; j++){
                elementFaceResult.push(parseInt(elementFace[i][j]));
                if(triangles[elementFace[i][j]] !== undefined){
                    triangles[elementFace[i][j]].push([...elementFace[i]]);
                }else{
                    triangles[elementFace[i][j]] = [[...elementFace[i]]];
                }
            }
        }
        elementVertex = elementVertex.flat().map(parseFloat);
        vertices = new Float32Array(elementVertex);
        indices = new Uint32Array(elementFaceResult);
        bufferAndShader();
    }

    

    let theta = 0;
    let newFile = "models/bunny.ply"
    async function update(elapsedTime) {
        if(theta <= 10){
            newFile = "models/bunny.ply"
        }else if(theta > 10 && theta <= 20){
            newFile = "models/happy_vrip_res4.ply"
        }else{
            newFile = "models/bunny.ply";
            theta =0
        }
        let xzRotation = new Float32Array([
            Math.cos(theta), 0, Math.sin(theta), 0,
            0, 1, 0, 0,
            -Math.sin(theta), 0, Math.cos(theta), 0,
            0, 0, 0, 1
        ]);

        theta += elapsedTime / 1000;
        let mProjection = gl.getUniformLocation(shaderProgram, "mProjection");
        gl.uniformMatrix4fv(mProjection, false, transposeMatrix4x4(perspectiveProjection));
        let mView = gl.getUniformLocation(shaderProgram, "mView");
        gl.uniformMatrix4fv(mView, false, transposeMatrix4x4(view));
        let mModel = gl.getUniformLocation(shaderProgram, "mModel");
        let translation = multiplyMatrix4x4(translate1, xzRotation);
        model = multiplyMatrix4x4(translation, translate2);
        gl.uniformMatrix4fv(mModel, false, transposeMatrix4x4(model));
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    }
    function render() {
        gl.clearColor(
            0.3921568627450980392156862745098,
            0.58431372549019607843137254901961,
            0.92941176470588235294117647058824,
            1.0
        );
        gl.clearDepth(1.0);
        gl.depthFunc(gl.LEQUAL);
        gl.enable(gl.DEPTH_TEST);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_INT, 0);
    }
    function animationLoop(time) {
        let elapsedTime = time - previousTime;
        previousTime = time
        update(elapsedTime);
        render();
        requestAnimationFrame(animationLoop);
    }
    console.log('initializing...');
    
    // loadFile("models/bunny.ply");
    loadFile("models/happy_vrip_res4.ply");

}());
