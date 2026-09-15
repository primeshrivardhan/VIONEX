const fs = require('fs');
const content = fs.readFileSync('src/App.tsx', 'utf-8');

const regex = /if\s*\(matchedUser\)\s*\{\s*if\s*\(matchedUser\.password\s*!==\s*cleanPass\)\s*\{\s*return\s*"wrong_password";\s*\}\s*if\s*\(matchedUser\.access\s*===\s*false\s*\|\|\s*matchedUser\.status\s*===\s*"pending"\)\s*\{\s*return\s*"pending";\s*\}\s*setCurrentUser\(\{ type: "user", data: matchedUser \}\);\s*return "success";\s*\}/;

const replacement = `if (matchedUser) {
      if (matchedUser.password !== cleanPass) {
        return "wrong_password";
      }
      if (matchedUser.access === false || matchedUser.status === "pending") {
        return "pending";
      }

      if (auth.currentUser?.uid) {
        setDoc(doc(db, "user_mappings", auth.currentUser.uid), {
          userId: matchedUser.id,
          role: matchedUser.role,
          loginId: matchedUser.loginId
        }, { merge: true }).catch(err => console.warn("Failed to set user mapping", err));
      }

      setCurrentUser({ type: "user", data: matchedUser });
      return "success";
    }`;

if (regex.test(content)) {
  fs.writeFileSync('src/App.tsx', content.replace(regex, replacement));
  console.log("Patched successfully");
} else {
  console.log("Target not found!");
}
