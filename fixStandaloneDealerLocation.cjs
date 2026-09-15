const fs = require('fs');
let code = fs.readFileSync('src/components/StandaloneDealerForm.tsx', 'utf8');

const targetAutoDetect = `  const handleLocationRequest = () => {
    setLocationLoading(true);
    setLocationError("");
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser");
      setLocationLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(`;

const newAutoDetect = `  const handleLocationRequest = () => {
    setLocationLoading(true);
    setLocationError("");
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser");
      setLocationLoading(false);
      return;
    }

    const requestLocation = (highAccuracy, retriesLeft) => {
      navigator.geolocation.getCurrentPosition(`;

code = code.replace(targetAutoDetect, newAutoDetect);

const targetError = `      (error) => {
        console.error("Error getting location:", error);
        setLocationError("Could not get location. Please enable GPS permissions.");
        setLocationLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };`;

const newError = `      (error) => {
        console.error("Error getting location:", error);
        if (retriesLeft > 0) {
           console.log("Retrying location with highAccuracy:", !highAccuracy);
           requestLocation(!highAccuracy, retriesLeft - 1);
           return;
        }
        let errMsg = "Could not get location. Please enable GPS permissions.";
        if (error.code === error.TIMEOUT) {
          errMsg = "Location request timed out. Please try again or move outside.";
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          errMsg = "Location unavailable. Please check your GPS signal.";
        }
        setLocationError(errMsg);
        setLocationLoading(false);
      },
      { enableHighAccuracy: highAccuracy, timeout: highAccuracy ? 10000 : 15000, maximumAge: 10000 }
    );
  };
  requestLocation(true, 1);
};`;

code = code.replace(targetError, newError);

fs.writeFileSync('src/components/StandaloneDealerForm.tsx', code);
