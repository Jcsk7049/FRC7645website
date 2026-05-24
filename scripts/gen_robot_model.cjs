const fs = require("fs");
const path = require("path");

// Helper to generate unit box with normals
function genBoxData() {
  const positions = [
    // Front face (z = 0.5)
    -0.5, -0.5,  0.5,   0.5, -0.5,  0.5,   0.5,  0.5,  0.5,  -0.5,  0.5,  0.5,
    // Back face (z = -0.5)
    -0.5, -0.5, -0.5,  -0.5,  0.5, -0.5,   0.5,  0.5, -0.5,   0.5, -0.5, -0.5,
    // Top face (y = 0.5)
    -0.5,  0.5, -0.5,  -0.5,  0.5,  0.5,   0.5,  0.5,  0.5,   0.5,  0.5, -0.5,
    // Bottom face (y = -0.5)
    -0.5, -0.5, -0.5,   0.5, -0.5, -0.5,   0.5, -0.5,  0.5,  -0.5, -0.5,  0.5,
    // Right face (x = 0.5)
     0.5, -0.5, -0.5,   0.5,  0.5, -0.5,   0.5,  0.5,  0.5,   0.5, -0.5,  0.5,
    // Left face (x = -0.5)
    -0.5, -0.5, -0.5,  -0.5, -0.5,  0.5,  -0.5,  0.5,  0.5,  -0.5,  0.5, -0.5,
  ];

  const normals = [
    // Front
    0, 0, 1,  0, 0, 1,  0, 0, 1,  0, 0, 1,
    // Back
    0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1,
    // Top
    0, 1, 0,  0, 1, 0,  0, 1, 0,  0, 1, 0,
    // Bottom
    0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0,
    // Right
    1, 0, 0,  1, 0, 0,  1, 0, 0,  1, 0, 0,
    // Left
    -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0
  ];

  const indices = [];
  for (let f = 0; f < 6; f++) {
    const b = f * 4;
    indices.push(b, b+1, b+2, b, b+2, b+3);
  }

  return { positions, normals, indices };
}

// Helper to generate cylinder with normals
function genCylinderData(radius, length, segments = 16) {
  const positions = [];
  const normals = [];
  const indices = [];
  const halfL = length / 2;

  let vIdx = 0;

  // --- Cap 1 (x = -halfL) ---
  const cap1CenterIdx = vIdx++;
  positions.push(-halfL, 0, 0);
  normals.push(-1, 0, 0);

  const cap1Start = vIdx;
  for (let i = 0; i < segments; i++) {
    const theta = (i / segments) * Math.PI * 2;
    positions.push(-halfL, radius * Math.cos(theta), radius * Math.sin(theta));
    normals.push(-1, 0, 0);
    vIdx++;
  }

  for (let i = 0; i < segments; i++) {
    const next = (i + 1) % segments;
    indices.push(cap1CenterIdx, cap1Start + next, cap1Start + i);
  }

  // --- Cap 2 (x = +halfL) ---
  const cap2CenterIdx = vIdx++;
  positions.push(halfL, 0, 0);
  normals.push(1, 0, 0);

  const cap2Start = vIdx;
  for (let i = 0; i < segments; i++) {
    const theta = (i / segments) * Math.PI * 2;
    positions.push(halfL, radius * Math.cos(theta), radius * Math.sin(theta));
    normals.push(1, 0, 0);
    vIdx++;
  }

  for (let i = 0; i < segments; i++) {
    const next = (i + 1) % segments;
    indices.push(cap2CenterIdx, cap2Start + i, cap2Start + next);
  }

  // --- Sides ---
  const sidesStart = vIdx;
  for (let i = 0; i < segments; i++) {
    const theta = (i / segments) * Math.PI * 2;
    const cosVal = Math.cos(theta);
    const sinVal = Math.sin(theta);
    const ny = cosVal;
    const nz = sinVal;
    const y = radius * cosVal;
    const z = radius * sinVal;

    // Left side vertex
    positions.push(-halfL, y, z);
    normals.push(0, ny, nz);
    vIdx++;

    // Right side vertex
    positions.push(halfL, y, z);
    normals.push(0, ny, nz);
    vIdx++;
  }

  for (let i = 0; i < segments; i++) {
    const next = (i + 1) % segments;
    const vLeft = sidesStart + i * 2;
    const vRight = vLeft + 1;
    const vNextLeft = sidesStart + next * 2;
    const vNextRight = vNextLeft + 1;

    indices.push(vLeft, vRight, vNextRight);
    indices.push(vLeft, vNextRight, vNextLeft);
  }

  return { positions, normals, indices };
}

function buildGLB() {
  const boxData = genBoxData();
  const cylData = genCylinderData(0.5, 1.0, 16);

  const boxPos = new Float32Array(boxData.positions);
  const boxNorm = new Float32Array(boxData.normals);
  const boxIdx = new Uint16Array(boxData.indices);

  const cylPos = new Float32Array(cylData.positions);
  const cylNorm = new Float32Array(cylData.normals);
  const cylIdx = new Uint16Array(cylData.indices);

  // Pack buffer views into a single buffer
  const bufferViews = [];
  const buffersList = [];
  let currentByteOffset = 0;

  function addBufferView(typedArray, target) {
    let rawBuf = Buffer.from(typedArray.buffer, typedArray.byteOffset, typedArray.byteLength);
    // Pad to 4-byte boundary
    const padLength = (4 - (rawBuf.length % 4)) % 4;
    if (padLength > 0) {
      rawBuf = Buffer.concat([rawBuf, Buffer.alloc(padLength)]);
    }
    const view = {
      buffer: 0,
      byteOffset: currentByteOffset,
      byteLength: rawBuf.length
    };
    if (target) {
      view.target = target;
    }
    bufferViews.push(view);
    buffersList.push(rawBuf);
    currentByteOffset += rawBuf.length;
    return bufferViews.length - 1;
  }

  const viewBoxPos = addBufferView(boxPos, 34962);  // ARRAY_BUFFER
  const viewBoxNorm = addBufferView(boxNorm, 34962);
  const viewBoxIdx = addBufferView(boxIdx, 34963);  // ELEMENT_ARRAY_BUFFER

  const viewCylPos = addBufferView(cylPos, 34962);
  const viewCylNorm = addBufferView(cylNorm, 34962);
  const viewCylIdx = addBufferView(cylIdx, 34963);

  const binBuf = Buffer.concat(buffersList);

  const accessors = [
    // 0: Box Positions
    {
      bufferView: viewBoxPos,
      componentType: 5126, // FLOAT
      count: boxPos.length / 3,
      type: "VEC3",
      min: [-0.5, -0.5, -0.5],
      max: [0.5, 0.5, 0.5]
    },
    // 1: Box Normals
    {
      bufferView: viewBoxNorm,
      componentType: 5126, // FLOAT
      count: boxNorm.length / 3,
      type: "VEC3"
    },
    // 2: Box Indices
    {
      bufferView: viewBoxIdx,
      componentType: 5123, // UNSIGNED_SHORT
      count: boxIdx.length,
      type: "SCALAR"
    },
    // 3: Cylinder Positions
    {
      bufferView: viewCylPos,
      componentType: 5126, // FLOAT
      count: cylPos.length / 3,
      type: "VEC3",
      min: [-0.5, -0.5, -0.5],
      max: [0.5, 0.5, 0.5]
    },
    // 4: Cylinder Normals
    {
      bufferView: viewCylNorm,
      componentType: 5126, // FLOAT
      count: cylNorm.length / 3,
      type: "VEC3"
    },
    // 5: Cylinder Indices
    {
      bufferView: viewCylIdx,
      componentType: 5123, // UNSIGNED_SHORT
      count: cylIdx.length,
      type: "SCALAR"
    }
  ];

  const materials = [
    // 0: Blue Bumper
    {
      name: "BlueBumper",
      pbrMetallicRoughness: {
        baseColorFactor: [0.0, 0.294, 0.529, 1.0],
        metallicFactor: 0.1,
        roughnessFactor: 0.6
      }
    },
    // 1: Red Bumper
    {
      name: "RedBumper",
      pbrMetallicRoughness: {
        baseColorFactor: [0.929, 0.109, 0.141, 1.0],
        metallicFactor: 0.1,
        roughnessFactor: 0.6
      }
    },
    // 2: Silver Metal (Chassis frame, bars)
    {
      name: "SilverMetal",
      pbrMetallicRoughness: {
        baseColorFactor: [0.75, 0.75, 0.75, 1.0],
        metallicFactor: 0.9,
        roughnessFactor: 0.2
      }
    },
    // 3: Dark Metal (Motors, plates)
    {
      name: "DarkMetal",
      pbrMetallicRoughness: {
        baseColorFactor: [0.2, 0.2, 0.22, 1.0],
        metallicFactor: 0.85,
        roughnessFactor: 0.45
      }
    },
    // 4: Black Rubber (Wheels)
    {
      name: "BlackRubber",
      pbrMetallicRoughness: {
        baseColorFactor: [0.1, 0.1, 0.1, 1.0],
        metallicFactor: 0.0,
        roughnessFactor: 0.8
      }
    },
    // 5: Neon Green Roller (Intake wheels)
    {
      name: "NeonGreen",
      pbrMetallicRoughness: {
        baseColorFactor: [0.3, 0.9, 0.1, 1.0],
        metallicFactor: 0.1,
        roughnessFactor: 0.4
      }
    },
    // 6: Orange Accent (Claw/Arm parts)
    {
      name: "OrangeAccent",
      pbrMetallicRoughness: {
        baseColorFactor: [1.0, 0.42, 0.0, 1.0],
        metallicFactor: 0.7,
        roughnessFactor: 0.3
      }
    }
  ];

  const meshes = [
    // 0: Box - Blue Bumper
    {
      name: "Box_BlueBumper",
      primitives: [{ attributes: { POSITION: 0, NORMAL: 1 }, indices: 2, material: 0, mode: 4 }]
    },
    // 1: Box - Red Bumper
    {
      name: "Box_RedBumper",
      primitives: [{ attributes: { POSITION: 0, NORMAL: 1 }, indices: 2, material: 1, mode: 4 }]
    },
    // 2: Box - Silver Metal
    {
      name: "Box_SilverMetal",
      primitives: [{ attributes: { POSITION: 0, NORMAL: 1 }, indices: 2, material: 2, mode: 4 }]
    },
    // 3: Box - Dark Metal
    {
      name: "Box_DarkMetal",
      primitives: [{ attributes: { POSITION: 0, NORMAL: 1 }, indices: 2, material: 3, mode: 4 }]
    },
    // 4: Box - Orange Accent
    {
      name: "Box_OrangeAccent",
      primitives: [{ attributes: { POSITION: 0, NORMAL: 1 }, indices: 2, material: 6, mode: 4 }]
    },
    // 5: Cylinder - Black Rubber
    {
      name: "Cylinder_BlackRubber",
      primitives: [{ attributes: { POSITION: 3, NORMAL: 4 }, indices: 5, material: 4, mode: 4 }]
    },
    // 6: Cylinder - Neon Green
    {
      name: "Cylinder_NeonGreen",
      primitives: [{ attributes: { POSITION: 3, NORMAL: 4 }, indices: 5, material: 5, mode: 4 }]
    },
    // 7: Cylinder - Silver Metal
    {
      name: "Cylinder_SilverMetal",
      primitives: [{ attributes: { POSITION: 3, NORMAL: 4 }, indices: 5, material: 2, mode: 4 }]
    }
  ];

  // Define components of the FRC robot
  const parts = [
    // --- BUMPERS (Blue theme) ---
    { name: "Bumper_Front", mesh: 0, translation: [0, 0.075, 0.45], scale: [1.0, 0.15, 0.1] },
    { name: "Bumper_Back", mesh: 0, translation: [0, 0.075, -0.45], scale: [1.0, 0.15, 0.1] },
    { name: "Bumper_Left", mesh: 0, translation: [-0.45, 0.075, 0], scale: [0.1, 0.15, 0.8] },
    { name: "Bumper_Right", mesh: 0, translation: [0.45, 0.075, 0], scale: [0.1, 0.15, 0.8] },
    
    // --- TEAM PLATES ---
    { name: "Plate_Front", mesh: 2, translation: [0, 0.075, 0.505], scale: [0.3, 0.08, 0.01] },
    { name: "Plate_Back", mesh: 2, translation: [0, 0.075, -0.505], scale: [0.3, 0.08, 0.01] },

    // --- CHASSIS FRAME ---
    { name: "Frame_Left", mesh: 2, translation: [-0.38, 0.075, 0], scale: [0.04, 0.1, 0.8] },
    { name: "Frame_Right", mesh: 2, translation: [0.38, 0.075, 0], scale: [0.04, 0.1, 0.8] },
    { name: "Frame_Front", mesh: 2, translation: [0, 0.075, 0.38], scale: [0.72, 0.1, 0.04] },
    { name: "Frame_Back", mesh: 2, translation: [0, 0.075, -0.38], scale: [0.72, 0.1, 0.04] },
    { name: "Electronics_Board", mesh: 3, translation: [0, 0.03, 0], scale: [0.72, 0.01, 0.72] },

    // --- SWERVE DRIVES (4 corners) ---
    // FL Module
    { name: "Swerve_FL_Pivot", mesh: 3, translation: [-0.34, 0.05, 0.34], scale: [0.1, 0.1, 0.1] },
    { name: "Swerve_FL_Wheel", mesh: 5, translation: [-0.34, -0.05, 0.34], scale: [0.06, 0.12, 0.12] },
    // FR Module
    { name: "Swerve_FR_Pivot", mesh: 3, translation: [0.34, 0.05, 0.34], scale: [0.1, 0.1, 0.1] },
    { name: "Swerve_FR_Wheel", mesh: 5, translation: [0.34, -0.05, 0.34], scale: [0.06, 0.12, 0.12] },
    // BL Module
    { name: "Swerve_BL_Pivot", mesh: 3, translation: [-0.34, 0.05, -0.34], scale: [0.1, 0.1, 0.1] },
    { name: "Swerve_BL_Wheel", mesh: 5, translation: [-0.34, -0.05, -0.34], scale: [0.06, 0.12, 0.12] },
    // BR Module
    { name: "Swerve_BR_Pivot", mesh: 3, translation: [0.34, 0.05, -0.34], scale: [0.1, 0.1, 0.1] },
    { name: "Swerve_BR_Wheel", mesh: 5, translation: [0.34, -0.05, -0.34], scale: [0.06, 0.12, 0.12] },

    // --- ELEVATOR STAGE 1 (Silver) ---
    { name: "Elevator_L1", mesh: 2, translation: [-0.2, 0.6, -0.2], scale: [0.04, 1.0, 0.04] },
    { name: "Elevator_R1", mesh: 2, translation: [0.2, 0.6, -0.2], scale: [0.04, 1.0, 0.04] },
    { name: "Elevator_Crossbar1", mesh: 2, translation: [0, 1.1, -0.2], scale: [0.44, 0.04, 0.04] },

    // --- ELEVATOR STAGE 2 (Orange) ---
    { name: "Elevator_L2", mesh: 4, translation: [-0.16, 0.8, -0.18], scale: [0.03, 0.9, 0.03] },
    { name: "Elevator_R2", mesh: 4, translation: [0.16, 0.8, -0.18], scale: [0.03, 0.9, 0.03] },
    { name: "Elevator_Crossbar2", mesh: 4, translation: [0, 1.25, -0.18], scale: [0.35, 0.03, 0.03] },

    // --- INTAKE CLAW ---
    { name: "Carriage_Plate", mesh: 3, translation: [0, 0.8, -0.14], scale: [0.28, 0.2, 0.02] },
    { name: "Intake_Arm_Left", mesh: 2, translation: [-0.12, 0.8, 0.05], scale: [0.03, 0.1, 0.4] },
    { name: "Intake_Arm_Right", mesh: 2, translation: [0.12, 0.8, 0.05], scale: [0.03, 0.1, 0.4] },
    { name: "Intake_Roller_Motor", mesh: 3, translation: [0, 0.8, 0.18], scale: [0.15, 0.08, 0.08] },
    { name: "Intake_Roller", mesh: 6, translation: [0, 0.8, 0.22], scale: [0.2, 0.06, 0.06] },

    // --- ONBOARD ELECTRONICS ---
    { name: "Battery", mesh: 4, translation: [0, 0.08, -0.1], scale: [0.15, 0.15, 0.1] },
    { name: "RoboRIO", mesh: 2, translation: [-0.15, 0.05, 0.1], scale: [0.12, 0.03, 0.12] },
    { name: "PDH", mesh: 3, translation: [0.15, 0.05, 0.1], scale: [0.12, 0.03, 0.12] }
  ];

  // Convert parts to glTF nodes
  const nodes = [
    {
      name: "FRC_Robot",
      children: parts.map((_, index) => index + 1)
    }
  ];

  parts.forEach(part => {
    const node = {
      name: part.name,
      mesh: part.mesh,
      translation: part.translation
    };
    if (part.scale) {
      node.scale = part.scale;
    }
    nodes.push(node);
  });

  const gltfJson = {
    asset: { version: "2.0", generator: "Antigravity-FRC-Robot-Gen" },
    scene: 0,
    scenes: [{ nodes: [0] }],
    nodes: nodes,
    meshes: meshes,
    materials: materials,
    accessors: accessors,
    bufferViews: bufferViews,
    buffers: [{ byteLength: binBuf.length }]
  };

  let jsonStr = JSON.stringify(gltfJson);
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

const outDir = path.join(__dirname, "..", "public");
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}
const outPath = path.join(outDir, "frc_robot.glb");
fs.writeFileSync(outPath, buildGLB());
console.log("✓ Created:", outPath);
