import { SimplePolygon, Vec3 } from "manifold-3d";
import earcut from "earcut";

export async function polygonsToGrayscale(
  canvas: HTMLCanvasElement,
  layers: SimplePolygon[][], // Array of layers, each containing an array of polygons
  originalWidth: number,
  originalHeight: number,
  backgroundColor: Vec3 = [0, 0, 0],
  polygonColor: Vec3 = [1, 1, 1],
) {
  const gl = canvas.getContext("webgl");
  if (!gl) {
    console.error("WebGL not supported");
    return;
  }

  const width = canvas.width;
  const height = canvas.height;

  // 1. Prepare Vertex Data
  const vertices: number[] = [];
  const colors: number[] = []; // Per vertex color (can be optimized)
  const indices: number[] = [];
  let vertexOffset = 0;

  for (const layer of layers) {
    for (const polygon of layer) {
      const color = determineWinding(polygon) ? polygonColor : backgroundColor;
      // Prepare data for triangulation (flattened vertices)
      const flatVertices = polygon.flat();

      // Use earcut to get the triangle indices
      const polygonIndices = earcut(flatVertices);
      // Add vertices and colors for each vertex of the triangles
      for (let i = 0; i < polygonIndices.length; i++) {
        const vertexIndexInPolygon = polygonIndices[i];
        const [x, y] = polygon[vertexIndexInPolygon];
        const scaledX = (x / originalWidth + 0.5) * width;
        const scaledY = (y / originalHeight + 0.5) * height;
        vertices.push(scaledX, scaledY);
        colors.push(...color);
        indices.push(vertexOffset + i); // Use the index of the newly added vertex
      }
      vertexOffset += polygonIndices.length; // Update the offset for the next polygon
    }
  }

  // 2. Vertex Shader Source
  const vertexShaderSource = `
    attribute vec2 a_position;
    attribute vec3 a_color;
    uniform vec2 u_resolution;
    varying vec3 v_color;

    void main() {
      vec2 clipSpace = (a_position / u_resolution) * 2.0 - 1.0;
      gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1); // Flip Y for canvas
      v_color = a_color;
    }
  `;

  // 3. Fragment Shader Source (Simple Color per Polygon)
  const fragmentShaderSource = `
    precision highp float;
    varying vec3 v_color;

    void main() {
      gl_FragColor = vec4(v_color, 1.0);
    }
  `;

  // Create and compile shaders (function not shown for brevity)
  const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
  const fragmentShader = createShader(
    gl,
    gl.FRAGMENT_SHADER,
    fragmentShaderSource,
  );

  // Create and link program (function not shown for brevity)
  const program = createProgram(gl, vertexShader, fragmentShader);
  gl.useProgram(program);

  // 4. Set up Buffers
  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

  const colorBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

  const indexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(
    gl.ELEMENT_ARRAY_BUFFER,
    new Uint16Array(indices),
    gl.STATIC_DRAW,
  );

  // 5. Set up Attributes
  const positionAttributeLocation = gl.getAttribLocation(program, "a_position");
  gl.enableVertexAttribArray(positionAttributeLocation);
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);

  const colorAttributeLocation = gl.getAttribLocation(program, "a_color");
  gl.enableVertexAttribArray(colorAttributeLocation);
  gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
  gl.vertexAttribPointer(colorAttributeLocation, 3, gl.FLOAT, false, 0, 0);

  // 6. Set up Uniforms
  const resolutionUniformLocation = gl.getUniformLocation(
    program,
    "u_resolution",
  );
  gl.uniform2f(resolutionUniformLocation, width, height);

  // 7. Rendering
  gl.viewport(0, 0, width, height);
  gl.clearColor(
    backgroundColor / 255,
    backgroundColor / 255,
    backgroundColor / 255,
    1,
  );
  gl.clear(gl.COLOR_BUFFER_BIT);

  gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);

  // Clean up (optional)
  // gl.deleteBuffer(positionBuffer);
  // gl.deleteBuffer(colorBuffer);
  // gl.deleteBuffer(indexBuffer);
  // gl.deleteProgram(program);
  // gl.deleteShader(vertexShader);
  // gl.deleteShader(fragmentShader);
}

// Reuse the existing determineWinding function
function determineWinding(polygon) {
  let signedArea = 0;

  // Need at least 3 points to form a polygon
  if (polygon.length < 3) {
    return false;
  }

  // Calculate the signed area using the shoelace formula
  for (let i = 0; i < polygon.length; i++) {
    const [x1, y1] = polygon[i];
    const [x2, y2] = polygon[(i + 1) % polygon.length];

    signedArea += x1 * y2 - x2 * y1;
  }

  // Divide by 2 to get the actual area
  signedArea /= 2;

  return signedArea > 0;
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
