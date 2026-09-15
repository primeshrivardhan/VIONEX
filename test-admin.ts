import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

async function test() {
  try {
    const app = initializeApp({ credential: applicationDefault() });
    const auth = getAuth(app);
    const token = await auth.createCustomToken("test-user-id");
    console.log("Custom Token:", token);
    const db = getFirestore(app);
    const snap = await db.collection("users").limit(1).get();
    console.log("Docs found:", snap.docs.length);
  } catch (err) {
    console.error("Error:", err);
  }
}
test();
