// Generates a minimal valid GLB file: simple FRC robot shape (box chassis + 4 wheels)
const fs = require("fs");
const path = require("path");

function buildGLB() {
  // --- Geometry: box chassis ---
  // 6 faces × 4 verts = 24 positions (VEC3 float32), 6 faces × 2 tris × 3 idx = 36 uint16

  const chassis = [
    // Front  (z=+1)
    -1.5, -0.4,  1,   1.5, -0.4,  1,   1.5,  0.4,  1,  -1.5,  0.4,  1,
    // Back   (z=-1)
    -1.5, -0.4, -1,  -1.5,  0.4, -1,   1.5,  0.4, -1,   1.5, -0.4, -1,
    // Top    (y=+0.4)
    -1.5,  0.4, -1,  -1.5,  0.4,  1,   1.5,  0.4,  1,   1.5,  0.4, -1,
    // Bottom (y=-0.4)
    -1.5, -0.4, -1,   1.5, -0.4, -1,   1.5, -0.4,  1,  -1.5, -0.4,  1,
    // Right  (x=+1.5)
     1.5, -0.4, -1,   1.5,  0.4, -1,   1.5,  0.4,  1,   1.5, -0.4,  1,
    // Left   (x=-1.5)
    -1.5, -0.4, -1,  -1.5, -0.4,  1,  -1.5,  0.4,  1,  -1.5,  0.4, -1,
  ];

  const indices = [];
  for (let f = 0; f < 6; f++) {
    const b = f * 4;
    indices.push(b, b+1, b+2, b, b+2, b+3);
  }

  const positions = new Float32Array(chassis);
  const idxArr    = new Uint16Array(indices);

  const posBuf  = Buffer.from(positions.buffer);
  // Pad idx to 4-byte boundary
  const idxRaw  = Buffer.from(idxArr.buffer);
  const idxPad  = (idxRaw.length % 4) ? Buffer.alloc(4 - (idxRaw.length % 4)) : Buffer.alloc(0);
  const idxBuf  = Buffer.concat([idxRaw, idxPad]);

  const binBuf  = Buffer.concat([posBuf, idxBuf]);

  const gltfJson = {
    asset: { version: "2.0", generator: "NKMTC-DemoRobot" },
    scene: 0,
    scenes: [{ nodes: [0] }],
    nodes: [{ mesh: 0, name: "NKMTC_2027_CONCEPT" }],
    meshes: [{
      name: "Chassis",
      primitives: [{
        attributes: { POSITION: 0 },
        indices: 1,
        material: 0,
        mode: 4
      }]
    }],
    materials: [{
      name: "NKMTCBlue",
      pbrMetallicRoughness: {
        baseColorFactor: [0.039, 0.682, 0.910, 1.0],  // #0AAEE8
        metallicFactor: 0.85,
        roughnessFactor: 0.25
      }
    }],
    accessors: [
      {
        bufferView: 0,
        componentType: 5126,        // FLOAT
        count: positions.length / 3,
        type: "VEC3",
        min: [-1.5, -0.4, -1],
        max: [ 1.5,  0.4,  1]
      },
      {
        bufferView: 1,
        componentType: 5123,        // UNSIGNED_SHORT
        count: indices.length,
        type: "SCALAR"
      }
    ],
    bufferViews: [
      { buffer: 0, byteOffset: 0,            byteLength: posBuf.length, target: 34962 },
      { buffer: 0, byteOffset: posBuf.length, byteLength: idxRaw.length, target: 34963 }
    ],
    buffers: [{ byteLength: binBuf.length }]
  };

  let jsonStr = JSON.stringify(gltfJson);
  // Pad JSON to 4-byte boundary with spaces
  while (jsonStr.length % 4 !== 0) jsonStr += " ";
  const jsonBuf = Buffer.from(jsonStr, "utf8");

  const totalLen = 12 + 8 + jsonBuf.length + 8 + binBuf.length;

  const header = Buffer.alloc(12);
  header.writeUInt32LE(0x46546C67, 0); // magic "glTF"
  header.writeUInt32LE(2, 4);
  header.writeUInt32LE(totalLen, 8);

  const jsonHdr = Buffer.alloc(8);
  jsonHdr.writeUInt32LE(jsonBuf.length, 0);
  jsonHdr.writeUInt32LE(0x4E4F534A, 4); // "JSON"

  const binHdr = Buffer.alloc(8);
  binHdr.writeUInt32LE(binBuf.length, 0);
  binHdr.writeUInt32LE(0x004E4942, 4); // "BIN\0"

  return Buffer.concat([header, jsonHdr, jsonBuf, binHdr, binBuf]);
}

const outPath = path.join(__dirname, "..", "public", "demo_robot_2027.glb");
fs.writeFileSync(outPath, buildGLB());
console.log("✓ Created:", outPath);
