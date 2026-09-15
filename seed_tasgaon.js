import { initializeApp } from "firebase/app";
import { getFirestore, collection, writeBatch, doc } from "firebase/firestore";
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

const villages = [
  { en: "Alate", mr: "आलाते" },
  { en: "Anjani", mr: "अंजनी" },
  { en: "Arwade", mr: "आरवडे" },
  { en: "Balgavade", mr: "बलगवडे" },
  { en: "Bastawade", mr: "बस्तवडे" },
  { en: "Bendri", mr: "बेंद्री" },
  { en: "Bhairvawadi", mr: "भैरववाडी" },
  { en: "Biranwadi", mr: "बिरनवाडी" },
  { en: "Borgaon", mr: "बोरगाव" },
  { en: "Chikhal Gothan", mr: "चिखल गोठण" },
  { en: "Chinchani", mr: "चिंचणी" },
  { en: "Dahiwadi", mr: "दहिवडी" },
  { en: "Dhavali", mr: "ढवळी" },
  { en: "Dhondewadi", mr: "धोंडेवाडी" },
  { en: "Dhulgaon", mr: "धुळगाव" },
  { en: "Dongarsoni", mr: "डोंगरसोनी" },
  { en: "Dorli", mr: "डोर्ली" },
  { en: "Gaurgaon", mr: "गौरगाव" },
  { en: "Gavhan", mr: "गव्हाण" },
  { en: "Gotewadi", mr: "गोटेवाडी" },
  { en: "Hatnoli", mr: "हातनवली" },
  { en: "Hatnoor", mr: "हातणूर" },
  { en: "Jarandi", mr: "जरंडी" },
  { en: "Julewadi", mr: "जुळेवाडी" },
  { en: "Kacharewadi", mr: "कचरेवाडी" },
  { en: "Kaulage", mr: "कौलगे" },
  { en: "Kavathe Ekand", mr: "कवठे एकंद" },
  { en: "Khalsa Dhamani", mr: "खालसा धामणी" },
  { en: "Khujagaon", mr: "खुजगाव" },
  { en: "Kindarwadi", mr: "किंडरवाडी" },
  { en: "Kumathe", mr: "कुमठे" },
  { en: "Limb", mr: "लिंब" },
  { en: "Lode", mr: "लोडे" },
  { en: "Lokarewadi", mr: "लोकरेवाडी" },
  { en: "Manerajuri", mr: "मणेराजुरी" },
  { en: "Manjarde", mr: "मांजर्डे" },
  { en: "Matkunki", mr: "मातकूंकी" },
  { en: "Morale Ped", mr: "मोराळे पेड" },
  { en: "Nagaon Kavathe", mr: "नागाव कवठे" },
  { en: "Nagaon Nimani", mr: "नागाव निमणी" },
  { en: "Nagewadi", mr: "नागेवाडी" },
  { en: "Narsewadi", mr: "नर्सेवाडी" },
  { en: "Nehru Nagar", mr: "नेहरू नगर" },
  { en: "Nimani", mr: "निमणी" },
  { en: "Nimblak", mr: "निंबळक" },
  { en: "Padali", mr: "पाडळी" },
  { en: "Panmalewadi", mr: "पानमळेवाडी" },
  { en: "Ped", mr: "पेड" },
  { en: "Punadi", mr: "पुनाडी" },
  { en: "Rajapur", mr: "राजापूर" },
  { en: "Savalaj", mr: "सावळज" },
  { en: "Savarde", mr: "सावर्डे" },
  { en: "Shirgaon Kavathe", mr: "शिरगाव कवठे" },
  { en: "Siddhewadi", mr: "सिद्धेवाडी" },
  { en: "Sirgaon Visapur", mr: "शिरगाव विसापूर" },
  { en: "Turchi", mr: "तुरची" },
  { en: "Upalavi", mr: "उपळावी" },
  { en: "Vajrachaunde", mr: "वज्रचौंडे" },
  { en: "Vanjarwadi", mr: "वंजारवाडी" },
  { en: "Vijay Nagar", mr: "विजय नगर" },
  { en: "Visapur", mr: "विसापूर" },
  { en: "Wadgaon", mr: "वडगाव" },
  { en: "Waghapur", mr: "वाघापूर" },
  { en: "Waifale", mr: "वायफळे" },
  { en: "Wasumbe", mr: "वासुंबे" },
  { en: "Yamgarwadi", mr: "यमगरवाडी" },
  { en: "Yelavi", mr: "येळावी" },
  { en: "Yogewadi", mr: "योगेवाडी" },
  { en: "Tasgaon", mr: "तासगाव" }
];

async function run() {
  console.log('Adding new villages for Tasgaon...');
  let batch = writeBatch(db);
  let count = 0;
  
  for (const v of villages) {
    let base = v.en;
    const vilCode = base.replace(/[^a-zA-Z0-9]/g, '').trim().toUpperCase().replace(/W/g, 'V');
    const code = `MA_SAN_TAS_${vilCode}`;
    
    const docRef = doc(db, 'master-locations', code);
    batch.set(docRef, {
      id: code,
      villageCode: code,
      state: "Maharashtra",
      district: "Sangli",
      taluka: "Tasgaon",
      village: v.en,
      villageMarathi: v.mr,
      updatedAt: Date.now()
    });
    count++;
    
    if (count % 50 === 0) {
      await batch.commit();
      batch = writeBatch(db);
    }
  }
  
  if (count % 50 !== 0) {
    await batch.commit();
  }
  
  console.log(`Added ${count} villages for Tasgaon.`);
  process.exit(0);
}

run().catch(e => {
  console.error(e);
  process.exit(1);
});
