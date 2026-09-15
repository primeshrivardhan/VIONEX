import sys
import re

with open('src/components/LocationMapping.tsx') as f:
    content = f.read()

# Replace the relevantLocations logic
old_logic = r"""    const relevantLocations = locations\.filter\(loc => {.*?    }\);"""
new_logic = """    // Single Source of Truth: Derive locations directly from dealers
    const uniqueLocationsMap = new Map<string, any>();
    dealers.forEach(d => {
       const code = d.villageCode || `${d.district}_${d.taluka}_${d.village}`;
       if (!uniqueLocationsMap.has(code)) {
         uniqueLocationsMap.set(code, {
           id: code,
           villageCode: code,
           state: d.state || "Maharashtra",
           district: d.district,
           taluka: d.taluka,
           village: d.village,
           updatedAt: d.updatedAt || Date.now()
         });
       }
    });
    const locationsFromDealers = Array.from(uniqueLocationsMap.values());
    
    const relevantLocations = locationsFromDealers.filter(loc => {
      if (!currentTaluka) return true;
      const locTalNorm = (loc.taluka || "").toLowerCase().replace(/[^a-z0-9]/g, "").trim();
      const currTalNorm = currentTaluka.toLowerCase().replace(/[^a-z0-9]/g, "").trim();
      return locTalNorm === currTalNorm || locTalNorm.includes(currTalNorm) || currTalNorm.includes(locTalNorm);
    });"""

content = re.sub(old_logic, new_logic, content, flags=re.DOTALL)

with open('src/components/LocationMapping.tsx', 'w') as f:
    f.write(content)
