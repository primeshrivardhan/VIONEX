import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, query, where } from "firebase/firestore";
import { readFileSync } from "fs";

const config = JSON.parse(readFileSync("./firebase-applet-config.json", "utf8"));
const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId);

async function run() {
  const q1 = query(collection(db, 'master-locations'), where('taluka', '==', 'Kavathemahankal'));
  const snap1 = await getDocs(q1);
  console.log('Kavathemahankal count:', snap1.size);

  const q2 = query(collection(db, 'master-locations'), where('taluka', '==', 'Kavathe Mahankal'));
  const snap2 = await getDocs(q2);
  console.log('Kavathe Mahankal count:', snap2.size);
  process.exit(0);
}
run();
