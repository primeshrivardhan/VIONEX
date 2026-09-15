const fs = require('fs');

let appTsx = fs.readFileSync('src/App.tsx', 'utf-8');

appTsx = appTsx.replace(/if \(\!navigator\.onLine\) \{\s*\/\/ Prevent 10-second wait when offline\s*return "denied";\s*\}/g, `
      if (!navigator.onLine) {
        // Try searching in the cache instead of returning denied
        try {
          const { getDocsFromCache } = require("firebase/firestore");
          const allSnap = await getDocsFromCache(collection(db, "farmers"));
          const cleanDigits = cleanMobile.replace(/\\D/g, "");
          const mob10 = cleanDigits.slice(-10);
          const matchedDoc = allSnap.docs.find((doc) => {
            const data = doc.data();
            const fMobile = data?.mobile ? data.mobile.toString().replace(/\\D/g, "").slice(-10) : "";
            return fMobile && fMobile === mob10;
          });
          if (matchedDoc) {
            matchedFarmer = { ...(matchedDoc.data()), id: matchedDoc.id };
          }
        } catch (e) {
          console.error("Cache lookup failed", e);
        }
        if (!matchedFarmer) return "denied";
      }
`);

fs.writeFileSync('src/App.tsx', appTsx);
console.log("Patched farmer login");
