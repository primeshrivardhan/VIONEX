const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');
const config = require('./firebase-applet-config.json');

const app = initializeApp(config);
const db = getFirestore(app);

async function run() {
  const q = collection(db, 'master-locations');
  const snap = await getDocs(q);
  console.log(`Found ${snap.size} master-locations`);
}

run().catch(console.error);
