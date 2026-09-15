const cleanAndNormalize = (str) => {
  if (!str) return "";
  return str.toLowerCase()
    .replace(/\(.*\)/g, "")
    .replace(/district|tehsil|taluka|taluk|subdistrict|division|village|town|city|state/g, "")
    .replace(/[^a-z0-9]/g, "")
    .trim();
};

const isNameMatch = (nameA, nameB) => {
  if (!nameA || !nameB) return false;
  const normA = cleanAndNormalize(nameA);
  const normB = cleanAndNormalize(nameB);
  if (!normA || !normB) return false;
  
  if (normA === normB) {
    return true;
  }
  
  // Let's allow one to contain the other if the shorter one is >= 5 chars
  if (normA.length >= 5 && normB.length >= 5) {
    if (normA.includes(normB) || normB.includes(normA)) {
        return true;
    }
  }
  
  return false;
};

console.log(isNameMatch("Siddhewadi", "Siddhewadi road")); // true
console.log(isNameMatch("Jarandi", "Jarandi")); // true
console.log(isNameMatch("Khanapur (Vita)", "Khanapur")); // true
