const { initializeApp } = require('firebase/app');
const { getAuth, signInAnonymously } = require('firebase/auth');
const { getFirestore, collection, getDocs, doc, setDoc } = require('firebase/firestore');

const firebaseConfig = require('./firebase-applet-config.json');
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function run() {
  try {
    await signInAnonymously(auth);
    console.log("Logged in Anonymously");
    
    const snap = await getDocs(collection(db, "users"));
    console.log("Found users:", snap.docs.length);
    
    for (const d of snap.docs) {
      const data = d.data();
      if (data.loginId) {
         await setDoc(doc(db, "login_lookups", data.loginId.toLowerCase()), {
           userId: d.id
         });
         console.log("Backfilled:", data.loginId);
      }
    }
    console.log("Done backfilling!");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
run();
