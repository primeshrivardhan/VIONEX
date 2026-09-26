/**
 * VIONEX — One-time password-field scrubber
 * ==========================================
 * Strips the `password` field from every document in /users and /farmers
 * that still has it stored in plaintext.
 *
 * RUN ONCE, then delete this file (or keep it for audit history — it is
 * idempotent and safe to re-run; it only touches docs that still have the field).
 *
 * REQUIRES: Firebase Admin SDK credential (see README block at the bottom).
 *
 * Usage:
 *   node scripts/strip-passwords.mjs
 *
 *   Or with explicit key file:
 *   $env:GOOGLE_APPLICATION_CREDENTIALS="D:\VIONEX\vionex-service-account.json"
 *   node scripts/strip-passwords.mjs
 */

import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { readFileSync } from "fs";
import { resolve } from "path";

// ─── Credential bootstrap (mirrors server.ts logic) ──────────────────────────

function initAdmin() {
  if (getApps().length > 0) return getApps()[0];

  const saEnv =
    process.env.FIREBASE_SERVICE_ACCOUNT_KEY ||
    process.env.FIREBASE_SERVICE_ACCOUNT;

  const gacPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;

  if (saEnv) {
    // Env var: raw JSON string or base64-encoded JSON
    const trimmed = saEnv.trim();
    const jsonStr = trimmed.startsWith("{")
      ? trimmed
      : Buffer.from(trimmed, "base64").toString("utf-8");
    const sa = JSON.parse(jsonStr);
    if (sa.private_key) sa.private_key = sa.private_key.replace(/\\n/g, "\n");
    console.log("[Auth] Using FIREBASE_SERVICE_ACCOUNT_KEY env var.");
    return initializeApp({ credential: cert(sa), projectId: sa.project_id });
  }

  if (gacPath) {
    // File path: GOOGLE_APPLICATION_CREDENTIALS pointing to a JSON file
    const sa = JSON.parse(readFileSync(resolve(gacPath), "utf-8"));
    if (sa.private_key) sa.private_key = sa.private_key.replace(/\\n/g, "\n");
    console.log(`[Auth] Using service account file: ${gacPath}`);
    return initializeApp({ credential: cert(sa), projectId: sa.project_id });
  }

  // Fallback: look for vionex-service-account.json in a few standard locations
  // (the .gitignore pattern serviceAccountKey*.json and *serviceAccount*.json
  //  already cover this naming convention — it won't be committed)
  const localPaths = [
    resolve("vionex-service-account.json"),
    resolve("serviceAccountKey.json"),
    resolve("D:/VIONEX/vionex-service-account.json"),
  ];
  for (const p of localPaths) {
    try {
      const sa = JSON.parse(readFileSync(p, "utf-8"));
      if (sa.private_key) sa.private_key = sa.private_key.replace(/\\n/g, "\n");
      console.log(`[Auth] Found service account file at: ${p}`);
      return initializeApp({ credential: cert(sa), projectId: sa.project_id });
    } catch (_) {
      // not found at this path, try next
    }
  }

  throw new Error(
    "\n\n❌  No Firebase Admin credential found.\n" +
    "    See the README block at the bottom of this script for how to provide one.\n"
  );
}

// ─── Core migration ───────────────────────────────────────────────────────────

async function scrubCollection(db, collectionName) {
  console.log(`\n📂  Scanning /${collectionName} ...`);

  const snap = await db.collection(collectionName).get();
  console.log(`    Total documents: ${snap.size}`);

  const toScrub = snap.docs.filter((d) => d.data().password !== undefined);
  console.log(`    Documents with 'password' field: ${toScrub.length}`);

  if (toScrub.length === 0) {
    console.log("    ✅  Nothing to do.");
    return { total: snap.size, scrubbed: 0 };
  }

  // Process in batches of 400 (Firestore batch limit is 500 writes)
  const BATCH_SIZE = 400;
  let scrubbed = 0;

  for (let i = 0; i < toScrub.length; i += BATCH_SIZE) {
    const chunk = toScrub.slice(i, i + BATCH_SIZE);
    const batch = db.batch();

    for (const docSnap of chunk) {
      batch.update(docSnap.ref, { password: FieldValue.delete() });
      console.log(`    🗑  ${collectionName}/${docSnap.id}  (was: "${String(docSnap.data().password).slice(0, 3)}***")`);
    }

    await batch.commit();
    scrubbed += chunk.length;
    console.log(`    Committed batch of ${chunk.length}.`);
  }

  return { total: snap.size, scrubbed };
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("=".repeat(60));
  console.log("VIONEX — Password Field Scrubber");
  console.log("=".repeat(60));

  let app;
  try {
    app = initAdmin();
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }

  const db = getFirestore(app);

  const results = {};
  for (const col of ["users", "farmers"]) {
    try {
      results[col] = await scrubCollection(db, col);
    } catch (err) {
      console.error(`\n❌  Error processing /${col}:`, err.message);
      process.exit(1);
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log("DONE");
  for (const [col, r] of Object.entries(results)) {
    console.log(`  /${col}: ${r.scrubbed} / ${r.total} documents scrubbed`);
  }
  console.log("=".repeat(60));
  console.log("\n✅  All password fields removed from Firestore.");
  console.log("    You can now delete this script.\n");
}

main().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});

/*
 * ─────────────────────────────────────────────────────────────────────────────
 * HOW TO GET AND PROVIDE THE FIREBASE ADMIN CREDENTIAL
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * This script needs a Firebase Admin SDK service account key for project
 * vionex-d7055. It is a JSON file with a private RSA key — NOT the same as
 * the client-side API key in .env.local.
 *
 * STEP 1 — Download the key from Firebase Console:
 *   1. Go to: https://console.firebase.google.com/project/vionex-d7055/settings/serviceaccounts/adminsdk
 *   2. Click "Generate new private key" -> confirm -> a .json file downloads.
 *   3. Rename it to: vionex-service-account.json
 *   4. Move it to: D:\VIONEX\vionex-service-account.json
 *      (one level ABOVE the project root — already covered by .gitignore
 *       patterns, so it will never accidentally be committed)
 *
 * STEP 2 — Run the script from the project root (D:\VIONEX\vionex):
 *
 *   node scripts/strip-passwords.mjs
 *
 *   OR with an explicit env var if you saved the file elsewhere:
 *
 *   $env:GOOGLE_APPLICATION_CREDENTIALS = "D:\VIONEX\vionex-service-account.json"
 *   node scripts/strip-passwords.mjs
 *
 * STEP 3 — After success, DELETE the key file (or revoke it in Firebase Console
 *   under the same service accounts page). Never leave private keys lying
 *   around after a one-off operation.
 *
 * WHY IT FAILED BEFORE:
 *   The Render backend uses FIREBASE_SERVICE_ACCOUNT_KEY as an environment
 *   variable set in the Render dashboard — that env var only exists in the
 *   cloud process. It does NOT exist locally on your machine, which is why
 *   any local script using Admin SDK fails with "credential not found" unless
 *   you explicitly provide the JSON key file as shown above.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 */
