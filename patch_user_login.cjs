const fs = require('fs');
let appTsx = fs.readFileSync('src/App.tsx', 'utf-8');

appTsx = appTsx.replace(/if \(\!navigator\.onLine\) \{\s*return "wrong_password"; \/\/ Or return denied\. Avoids hang\.\s*\}/g, `
      if (!navigator.onLine) {
        // Try searching in the cache instead of returning wrong_password
        try {
          const allSnap = await getDocsFromCache(collection(db, "users"));
          const matchedDoc = allSnap.docs.find((doc) => {
            const data = doc.data();
            return data?.loginId && data.loginId.toLowerCase() === cleanId;
          });
          if (matchedDoc) {
            matchedUser = { ...(matchedDoc.data()), id: matchedDoc.id };
          }
        } catch (e) {
          console.error("Cache lookup failed", e);
        }
        if (!matchedUser) return "wrong_password";
      }
`);

fs.writeFileSync('src/App.tsx', appTsx);
console.log("Patched user login");
