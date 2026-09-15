const fs = require('fs');
let code = fs.readFileSync('src/components/DealersView.tsx', 'utf8');

const targetAutoDetect = `  const autoDetectDealerLocation = () => {
    if (!navigator.geolocation) {
      alert("तुमच्या ब्राउझरमध्ये लोकेशन फीचर उपलब्ध नाही.");
      return;
    }

    setIsDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;`;

const newAutoDetect = `  const autoDetectDealerLocation = () => {
    if (!navigator.geolocation) {
      alert("तुमच्या ब्राउझरमध्ये लोकेशन फीचर उपलब्ध नाही.");
      return;
    }

    setIsDetectingLocation(true);
    
    const requestLocation = (highAccuracy, retriesLeft) => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          setFormData(prev => ({ ...prev, lat: latitude, lon: longitude }));
          `;

code = code.replace(targetAutoDetect, newAutoDetect);

const targetError = `      (error) => {
        console.error("Geolocation error:", error);
        let errMsg = "लोकेशन ऍक्सेस नाकारला गेला. कृपया ॲपला लोकेशनची परवानगी द्या.";
        if (error.code === error.TIMEOUT) {
          errMsg = "लोकेशन शोधण्याची वेळ संपली (Timeout). कृपया पुन्हा प्रयत्न करा किंवा GPS सुरू करा.";
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          errMsg = "तुमचे लोकेशन सध्या उपलब्ध नाही. कृपया GPS सिग्नल तपासा.";
        }
        alert(errMsg);
        setIsDetectingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };`;

const newError = `        (error) => {
          console.error("Geolocation error:", error);
          if (retriesLeft > 0) {
             console.log("Retrying location with highAccuracy:", !highAccuracy);
             requestLocation(!highAccuracy, retriesLeft - 1);
             return;
          }
          let errMsg = "लोकेशन ऍक्सेस नाकारला गेला. कृपया ॲपला लोकेशनची परवानगी द्या.";
          if (error.code === error.TIMEOUT) {
            errMsg = "लोकेशन शोधण्याची वेळ संपली (Timeout). कृपया पुन्हा प्रयत्न करा किंवा GPS सुरू करा.";
          } else if (error.code === error.POSITION_UNAVAILABLE) {
            errMsg = "तुमचे लोकेशन सध्या उपलब्ध नाही. कृपया GPS सिग्नल तपासा.";
          }
          alert(errMsg);
          setIsDetectingLocation(false);
        },
        { enableHighAccuracy: highAccuracy, timeout: highAccuracy ? 10000 : 15000, maximumAge: 10000 }
      );
    };
    requestLocation(true, 1);
  };`;

code = code.replace(targetError, newError);

fs.writeFileSync('src/components/DealersView.tsx', code);
