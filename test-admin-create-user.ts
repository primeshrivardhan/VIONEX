import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

async function test() {
  try {
    const app = initializeApp({ credential: applicationDefault() });
    const auth = getAuth(app);
    const userRecord = await auth.createUser({
      email: "test999@vionex.com",
      password: "password123",
    });
    console.log("Successfully created new user:", userRecord.uid);
  } catch (err) {
    console.error("Error creating new user:", err);
  }
}
test();
