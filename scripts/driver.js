MySample.main = (function() {
    'use strict';  
    let canvas = document.getElementById('canvas-main');
    let gl = canvas.getContext('webgl2');
    let previousTime = performance.now();
    let indices = [];
    let vertices = [];
    let normals = [];
    let triangles = [];
    let shininess = 200.0;
    let right = .1;
    let left = -.1;
    let top = .1;
    let bottom = .1;
    let near = 1;
    let far = 10;
    let camera = new Float32Array([
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1
    ]);
    let light1 = new Float32Array([0.0, 0.0, 0.0]);
    let light2 = new Float32Array([0.0, 0.0, 0.0]);
    let light3 = new Float32Array([0.0, 0.0, 0.0]);
    let ambientLight = new Float32Array([
        1.0,
        1.0,
        1.0
    ]);
    let specularLight = new Float32Array([
        1.0,
        1.0,
        1.0
    ]);
    let specDiffuse = new Float32Array([
        0.0,
        0.9,
        0.63
    ]);
    let diffuseLight1 = new Float32Array([1.0, 0.0, 0.0]);
    let diffuseLight2 = new Float32Array([0.0, 1.0, 0.0]);
    let diffuseLight3 = new Float32Array([0.0, 0.0, 1.0]);
    let mDiffuse = new Float32Array([
        0.0,
        0.0,
        0.0
    ]);  
    let translate1 = new Float32Array ([
        1, 0, 0, 0,
        0, 1, 0, -.1,
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
        if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
            console.error('ERROR compiling vertex shader!', gl.getShaderInfoLog(vertexShader));
            return;
        }
        let fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(fragmentShader, fragmentShaderSource);
        gl.compileShader(fragmentShader);
        if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
            console.error('ERROR compiling fragment shader!', gl.getShaderInfoLog(fragmentShader));
            return;
        }
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
        for(let i = 0; i < triangles.length - 1; i++){
            let x = 0;
            let y = 0;
            let z = 0;
            let nx = 0;
            let ny = 0;
            let nz = 0;
            if(triangles[i] !== undefined){
                for (let k = 0; k < triangles[i].length - 1; k++){
                    let [x1, y1, z1] = elementVertex[triangles[i][k][0]].map(parseFloat);
                    let [x2, y2, z2] = elementVertex[triangles[i][k][1]].map(parseFloat);
                    let [x3, y3, z3] = elementVertex[triangles[i][k][2]].map(parseFloat);
                    let v = [x1 - x3, y1 - y3, z1 - z3]; 
                    let w = [x2 - x3, y2 - y3, z2 - z3];
                    let normal = [w[1]*v[2] - w[2]*v[1], w[2]*v[0] - w[0]*v[2],w[0]*v[1] - w[1]*v[0]];
                    x += normal[0];
                    y += normal[1];
                    z += normal[2];
                    let magnitude = Math.sqrt(x **2 + y ** 2 + z ** 2);
                    if(magnitude != 0){
                        x /= magnitude;
                        y /= magnitude;
                        z /= magnitude;
                        nx += x;
                        ny += y;
                        nz += z; 
                    }
                }
                nx /= triangles[i].length;
                ny /= triangles[i].length;
                nz /= triangles[i].length;
                normals[i] = [nx, ny, nz];
            }else {
                normals[i] = [0, 0, 0];
            }
        }
        elementVertex = elementVertex.flat().map(parseFloat);
        let maxVal = Math.max(elementVertex);
        elementVertex.forEach(el => {
            el = el / maxVal;
        });
        normals = new Float32Array(normals.flat());
        vertices = new Float32Array(elementVertex);
        indices = new Uint32Array(elementFaceResult);
        bufferAndShader();
    }

 
    let theta = 0
    async function update(elapsedTime) {
        theta += elapsedTime/1000;
        if (theta <= 15){
            light1 = [1.0, 1.0, 1.0];
            light2 = [0.5, -2.0, 0.0];
            light3 = [-1.0, 2.0, -2.0];
            diffuseLight1 = [-1.0, 0.0, 0.0];
            diffuseLight2 = [0.0, 1.0, -1.0];
            diffuseLight3 = [1.0, -1.0, -1.0];
            specDiffuse = [.5, .29, 0.0];
            specularLight = [1, 1, 1];
            mDiffuse = [0.0,0.0, 0.0];
        }else if(theta > 15 && theta <= 25){
            light1 = [1.0, 1.0, 2.0];
            light2 = [0.0, -2.0, 0.0];
            light3 = [-1.0, 2.0, -2.0];
            diffuseLight1 = [.5, 0.0, 0.0];
            diffuseLight2 = [0.0, 0.0, 0.0];
            diffuseLight3 = [0.0, 0.0, 0.0];
            ambientLight = [1.0, 1.0, 1.0];
            mDiffuse = [0.7,0.5, 0.7];
            specularLight = [0.5, 0.29, 0.0];
            specDiffuse = [1.0, 1.0, 1.0]; 
        }else{
            theta = 0;
        }
        let xzRotation = new Float32Array([
            Math.cos(theta), 0, Math.sin(theta), 0,
            0, 1, 0, 0,
            -Math.sin(theta), 0, Math.cos(theta), 0,
            0, 0, 0, 1
        ]);
        let translateOut = multiplyMatrix4x4(translate1, xzRotation);
        model = multiplyMatrix4x4(translateOut, translate2);
        let spec1 = gl.getUniformLocation(shaderProgram, 'uLight1');
        gl.uniform3fv(spec1, light1);
        let spec2 = gl.getUniformLocation(shaderProgram, 'uLight2');
        gl.uniform3fv(spec2, light2);
        let spec3 = gl.getUniformLocation(shaderProgram, 'uLight3');
        gl.uniform3fv(spec3, light3);
        let diff1 = gl.getUniformLocation(shaderProgram, 'uDiffuse1');
        gl.uniform3fv(diff1, diffuseLight1);
        let diff2 = gl.getUniformLocation(shaderProgram, 'uDiffuse2');
        gl.uniform3fv(diff2, diffuseLight2);
        let diff3 = gl.getUniformLocation(shaderProgram, 'uDiffuse3');
        gl.uniform3fv(diff3, diffuseLight3);
        let specular = gl.getUniformLocation(shaderProgram, 'uSpecular');
        gl.uniform3fv(specular, specularLight);
        let specularDiff= gl.getUniformLocation(shaderProgram, 'uSpecularDiffuse');
        gl.uniform3fv(specularDiff, specDiffuse);
        let ambient = gl.getUniformLocation(shaderProgram, 'uAmbient');
        gl.uniform3fv(ambient, ambientLight);
        let mDiff = gl.getUniformLocation(shaderProgram, 'mDiffuse');
        gl.uniform3fv(mDiff, mDiffuse);
        let uPerspective = gl.getUniformLocation(shaderProgram, 'uProjection');
        gl.uniformMatrix4fv(uPerspective,false,transposeMatrix4x4(perspectiveProjection));
        let uView = gl.getUniformLocation(shaderProgram, 'uView');
        gl.uniformMatrix4fv(uView,false,transposeMatrix4x4(camera));
        let uModel = gl.getUniformLocation(shaderProgram,'uModel');
        gl.uniformMatrix4fv(uModel,false,transposeMatrix4x4(model));
        let fragmentView = gl.getUniformLocation(shaderProgram, 'uView2');
        gl.uniformMatrix4fv(fragmentView,false,transposeMatrix4x4(camera));
        let fragmentModel = gl.getUniformLocation(shaderProgram,'uModel2');
        gl.uniformMatrix4fv(fragmentModel,false,transposeMatrix4x4(model));

    }
    function render() {
        gl.clearColor(
            0,
            0,
            0,
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
    
    loadFile("models/buddha.ply");
    // loadFile("models/dragon.ply");

}());
