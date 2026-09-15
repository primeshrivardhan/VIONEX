const fs = require('fs');
let code = fs.readFileSync('src/components/AddFarmerForm.tsx', 'utf8');

const targetAutoDetect = `  const autoDetectLocation = () => {
    if (!navigator.geolocation) {
      alert("तुमच्या ब्राउझरमध्ये लोकेशन फीचर उपलब्ध नाही.");
      return;
    }

    setIsDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(`;

// I will replace autoDetectLocation completely. Let's see the bounds.
