import { SimplePolygon, Vec3 } from "manifold-3d";
import earcut, { flatten } from "earcut";

export function polygonsToGrayscale(
  canvas: HTMLCanvasElement,
  layers: SimplePolygon[][], // Array of layers
  originalWidth: number,
  originalHeight: number,
  backgroundColor: Vec3 = [0, 0, 0], // Array of background colors for each layer
  polygonColor: Vec3 = [1, 1, 1],
): ImageData[] {
  const gl = canvas.getContext("webgl");
  if (!gl) {
    console.error("WebGL not supported");
    return [];
  }

  const numLayers = layers.length;
  const framebuffers: WebGLFramebuffer[] = [];
  const textures: WebGLTexture[] = [];
  const layerData: ImageData[] = [];
  const width = canvas.width;
  const height = canvas.height;

  // Initialize shaders and program
  const vertexShaderSource = `
    attribute vec2 a_position;
    attribute vec3 a_color;
    uniform vec2 u_resolution;
    varying vec3 v_color;

    void main() {
      vec2 clipSpace = (a_position / u_resolution) * 2.0 - 1.0;
      gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
      v_color = a_color;
    }
  `;

  const fragmentShaderSource = `
    precision highp float;
    varying vec3 v_color;

    void main() {
      gl_FragColor = vec4(v_color, 1.0);
    }
  `;

  const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
  const fragmentShader = createShader(
    gl,
    gl.FRAGMENT_SHADER,
    fragmentShaderSource,
  );
  const program = createProgram(gl, vertexShader, fragmentShader);
  if (!program) return [];
  gl.useProgram(program);

  // Get attribute and uniform locations
  const positionAttributeLocation = gl.getAttribLocation(program, "a_position");
  const colorAttributeLocation = gl.getAttribLocation(program, "a_color");
  const resolutionUniformLocation = gl.getUniformLocation(
    program,
    "u_resolution",
  );
  gl.uniform2f(resolutionUniformLocation, width, height);

  // Prepare vertex and index data per layer
  const layerVertexData: number[][] = [];
  const layerColorData: number[][] = [];
  const layerIndexData: number[][] = [];

  for (const layer of layers) {
    let vertexOffset = 0;

    const { vertices: flatVertices, holes, dimensions } = flatten(layer);

    const vertices: number[] = [];
    const colors: number[] = [];
    const indices: number[] = [];

    // Triangulate the flattened vertices
    const polygonIndices = earcut(flatVertices, holes, dimensions);

    // Add vertices and colors for each vertex of the triangles
    for (let i = 0; i < polygonIndices.length; i++) {
      const vertexIndexInFlat = polygonIndices[i];
      const x = flatVertices[vertexIndexInFlat * dimensions];
      const y = flatVertices[vertexIndexInFlat * dimensions + 1];
      const scaledX = (x / originalWidth + 0.5) * width;
      const scaledY = (y / originalHeight + 0.5) * height;
      vertices.push(scaledX, scaledY); // Push to the correct array
      colors.push(...polygonColor); // Use the determined color
      indices.push(vertexOffset + i);
    }
    vertexOffset += polygonIndices.length;

    layerVertexData.push(vertices);
    layerColorData.push(colors);
    layerIndexData.push(indices);
  }

  // Create framebuffers and textures
  for (let i = 0; i < numLayers; i++) {
    const framebuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    framebuffers.push(framebuffer);
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      width,
      height,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      null,
    );
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      texture,
      0,
    );
    textures.push(texture);

    if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
      console.error(
        "Framebuffer is not complete:",
        gl.checkFramebufferStatus(gl.FRAMEBUFFER),
      );
      return [];
    }
  }
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);

  // Create and bind common position and color buffers
  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.enableVertexAttribArray(positionAttributeLocation);
  gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);

  const colorBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
  gl.enableVertexAttribArray(colorAttributeLocation);
  gl.vertexAttribPointer(colorAttributeLocation, 3, gl.FLOAT, false, 0, 0);

  // Render to each framebuffer
  for (let i = 0; i < numLayers; i++) {
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffers[i]);
    gl.viewport(0, 0, width, height);
    gl.clearColor(...backgroundColor, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array(layerVertexData[i]),
      gl.STATIC_DRAW,
    );

    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array(layerColorData[i]),
      gl.STATIC_DRAW,
    );

    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(
      gl.ELEMENT_ARRAY_BUFFER,
      new Uint16Array(layerIndexData[i]),
      gl.STATIC_DRAW,
    );

    gl.drawElements(
      gl.TRIANGLES,
      layerIndexData[i].length,
      gl.UNSIGNED_SHORT,
      0,
    );

    const buffer = new Uint8ClampedArray(width * height * 4);
    gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, buffer);
    layerData.push(new ImageData(buffer, width, height));
    gl.deleteBuffer(indexBuffer); // Clean up index buffer for this layer
  }
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);

  // Clean up resources
  gl.deleteBuffer(positionBuffer);
  gl.deleteBuffer(colorBuffer);
  framebuffers.forEach((fb) => gl.deleteFramebuffer(fb));
  textures.forEach((tex) => gl.deleteTexture(tex));
  gl.deleteProgram(program);
  gl.deleteShader(vertexShader);
  gl.deleteShader(fragmentShader);

  return layerData;
}

function createShader(
  gl: WebGLRenderingContext,
  type: number,
  source: string,
): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) {
    console.error("Failed to create shader");
    return null;
  }
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error("Shader compilation failed:", gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function createProgram(
  gl: WebGLRenderingContext,
  vertexShader: WebGLShader,
  fragmentShader: WebGLShader,
): WebGLProgram | null {
  const program = gl.createProgram();
  if (!program) {
    console.error("Failed to create program");
    return null;
  }
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error("Program linking failed:", gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);
    return null;
  }
  return program;
}
