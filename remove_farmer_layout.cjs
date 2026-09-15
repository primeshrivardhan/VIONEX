const fs = require('fs');

let appTsx = fs.readFileSync('src/App.tsx', 'utf-8');

// Find the start of the block
const startMarker = "// Dedicated Farmer Simplified Layout";
const startIndex = appTsx.indexOf(startMarker);

if (startIndex !== -1) {
    // We know it ends right before `  return (` around line 2270
    const endMarker = "  return (\n    <div className=\"h-[100dvh] bg-slate-50";
    const endIndex = appTsx.indexOf(endMarker);
    
    if (endIndex !== -1) {
        appTsx = appTsx.substring(0, startIndex) + appTsx.substring(endIndex);
        fs.writeFileSync('src/App.tsx', appTsx);
        console.log("Removed dedicated farmer layout");
    } else {
        console.log("Could not find end marker");
    }
} else {
    console.log("Could not find start marker");
}
