import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, writeBatch, doc } from "firebase/firestore";
import { readFileSync } from "fs";

const config = JSON.parse(readFileSync("./firebase-applet-config.json", "utf8"));
const firebaseConfig = {
  apiKey: config.apiKey,
  authDomain: config.authDomain,
  projectId: config.projectId,
  storageBucket: config.storageBucket,
  messagingSenderId: config.messagingSenderId,
  appId: config.appId
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, config.firestoreDatabaseId);

const marathiMap = {
  "Amanapur": "अमनापूर",
  "Andhali": "आंधळी",
  "Ankalkhop": "अंकलखोप",
  "Anugdewadi": "अनुगडेवाडी",
  "Bambavade": "बांबवडे",
  "Bhilwadi": "भिलवडी",
  "Bramhanal": "ब्रह्मनाळ",
  "Burli": "बुर्ली",
  "Burungwadi": "बुरुंगवाडी",
  "Chopdewadi": "चोपडेवाडी",
  "Dahyari": "दह्यारी",
  "Dudhondi": "दुधोंडी",
  "Ghogaon": "घोगाव",
  "Hajarwadi": "हजारवाडी",
  "Khandobachiwadi": "खंडोबाचीवाडी",
  "Khatav": "खटाव",
  "Kundal": "कुंडल",
  "Malewadi": "माळेवाडी",
  "Morale": "मोराळे",
  "Nagrale": "नागराळे",
  "Nagthane": "नागठाणे",
  "Palus": "पलूस",
  "Pundi Tarf Walava": "पुंडी तर्फ वाळवा",
  "Pundiwadi": "पुंडीवाडी",
  "Radewadi": "राडेवाडी",
  "Ramanandnagar": "रामानंदनगर",
  "Sandgewadi": "सांडगेवाडी",
  "Sawantpur": "सावंतपूर",
  "Share Dudhondi": "शारे दुधोंडी",
  "Sukhwadi": "सुखवाडी",
  "Suryagaon": "सुर्यगाव",
  "Tavdarwadi": "तावदरवाडी",
  "Tupari": "तुपारी",
  "Vithalwadi": "विठ्ठलवाडी",
  "Wasgade": "वसगडे"
};

async function run() {
  const collectionRef = collection(db, 'master-locations');
  console.log('Fetching locations...');
  const snapshot = await getDocs(collectionRef);
  
  const batch = writeBatch(db);
  let count = 0;
  
  snapshot.forEach((d) => {
    const data = d.data();
    if (data.taluka === "Palus" && marathiMap[data.village]) {
      batch.update(d.ref, { villageMarathi: marathiMap[data.village] });
      count++;
    }
  });
  
  if (count > 0) {
    await batch.commit();
    console.log(`Updated ${count} villages with Marathi names.`);
  } else {
    console.log('No villages updated.');
  }
  process.exit(0);
}

run().catch(e => {
  console.error(e);
  process.exit(1);
});
