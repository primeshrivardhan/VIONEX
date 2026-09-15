const fs = require('fs');
let code = fs.readFileSync('src/components/AlertsView.tsx', 'utf8');

const targetAutoDetect = `                          navigator.geolocation.getCurrentPosition((pos) => {
                            setFormData({
                              ...formData, 
                              lat: pos.coords.latitude, 
                              lng: pos.coords.longitude,
                              radius: 50
                            });
                          });`;

const newAutoDetect = `                          const reqLoc = (highAccuracy, retries) => {
                            navigator.geolocation.getCurrentPosition((pos) => {
                              setFormData({
                                ...formData, 
                                lat: pos.coords.latitude, 
                                lng: pos.coords.longitude,
                                radius: 50
                              });
                            }, (err) => {
                              if(retries > 0) {
                                reqLoc(!highAccuracy, retries - 1);
                              } else {
                                alert("लोकेशन ऍक्सेस नाकारला गेला. कृपया ॲपला लोकेशनची परवानगी द्या.");
                              }
                            }, { enableHighAccuracy: highAccuracy, timeout: highAccuracy ? 10000 : 15000, maximumAge: 10000 });
                          };
                          reqLoc(true, 1);`;

code = code.replace(targetAutoDetect, newAutoDetect);
fs.writeFileSync('src/components/AlertsView.tsx', code);
