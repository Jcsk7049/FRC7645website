const admin = require("firebase-admin");
admin.initializeApp({ projectId: "team7645" });
const db = admin.firestore();
async function seed() {
  await db.collection("robots").doc("2027").set({
    year: "2027",
    name: "NKMTC Concept 2027",
    game: "REEFSCAPE",
    drivetrain: "Swerve Drive",
    weight: "52 kg",
    image: "",
    glbUrl: "https://team7645.web.app/demo_robot_2027.glb",
    achievements: ["Demo 3D 展示機器人（概念展示用）"]
  });
  console.log("✓ robots/2027 created");
  process.exit(0);
}
seed().catch(err => { console.error(err.message); process.exit(1); });
