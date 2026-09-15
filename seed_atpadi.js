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
  { en: "Ambewadi", mr: "आंबेवाडी" },
  { en: "Atpadi", mr: "आटपाडी" },
  { en: "Autewadi", mr: "औटेवाडी" },
  { en: "Awalai", mr: "आवळाई" },
  { en: "Balewadi", mr: "बाळेवाडी" },
  { en: "Banpuri", mr: "बाणपुरी" },
  { en: "Bhingewadi", mr: "भिंगेवाडी" },
  { en: "Bombewadi", mr: "बोंबेवाडी" },
  { en: "Chinchale", mr: "चिंचले" },
  { en: "Deshamukhwadi", mr: "देशमुखवाडी" },
  { en: "Dhavadwadi", mr: "धवडवाडी" },
  { en: "Dighanchi", mr: "दिघंची" },
  { en: "Galavewadi", mr: "गळवेवाडी" },
  { en: "Ghanand", mr: "घाणंद" },
  { en: "Gharniki", mr: "घारनिकी" },
  { en: "Gomewadi", mr: "गोमेवाडी" },
  { en: "Gulewadi", mr: "गुळेवाडी" },
  { en: "Hivtad", mr: "हिवतड" },
  { en: "Jambhulni", mr: "जांभुळणी" },
  { en: "Kalewadi", mr: "काळेवाडी" },
  { en: "Kamth", mr: "कामथ" },
  { en: "Kankatrewadi", mr: "कंकत्रेवाडी" },
  { en: "Kargani", mr: "करगणी" },
  { en: "Kautholi", mr: "कौठोळी" },
  { en: "Khanjodwadi", mr: "खांजोडवाडी" },
  { en: "Kharsundi", mr: "खरसुंडी" },
  { en: "Kurundwadi", mr: "कुरुंदवाडी" },
  { en: "Lengrewadi", mr: "लेंगरेवाडी" },
  { en: "Lingivare", mr: "लिंगिवरे" },
  { en: "Madgule", mr: "माडगुळे" },
  { en: "Malewadi", mr: "माळेवाडी" },
  { en: "Manewadi", mr: "मानेवाडी" },
  { en: "Maptemala", mr: "मापटेमळा" },
  { en: "Masalwadi", mr: "मसलवाडी" },
  { en: "Mitki", mr: "मिटकी" },
  { en: "Mudhewadi", mr: "मुढेवाडी" },
  { en: "Nelkaranji", mr: "नेलकरंजी" },
  { en: "Nimbawade", mr: "निंबवडे" },
  { en: "Padalkarwadi", mr: "पडळकरवाडी" },
  { en: "Palaskhel", mr: "पळसखेल" },
  { en: "Pandharewadi", mr: "पांढरेवाडी" },
  { en: "Parekarwadi", mr: "परेकरवाडी" },
  { en: "Patrewadi", mr: "पत्रेवाडी" },
  { en: "Pimpari Bk.", mr: "पिंपरी बुद्रुक" },
  { en: "Pimpari Kh", mr: "पिंपरी खुर्द" },
  { en: "Pisewadi", mr: "पिसेवाडी" },
  { en: "Pujarwadi", mr: "पुजारवाडी" },
  { en: "Rajewadi", mr: "राजेवाडी" },
  { en: "Sherewadi", mr: "शेरेवाडी" },
  { en: "Shetphale", mr: "शेटफळे" },
  { en: "Tadvale", mr: "तडवळे" },
  { en: "Talewadi", mr: "तळेवाडी" },
  { en: "Umbargaon", mr: "उंबरगाव" },
  { en: "Vibhutwadi", mr: "विभूतवाडी" },
  { en: "Vithalapur", mr: "विठलापूर" },
  { en: "Wakasewadi", mr: "वाकसेवाडी" },
  { en: "Walwan", mr: "वळवण" },
  { en: "Yamaji Patalachi Wadi", mr: "यामाजी पाटलाची वाडी" },
  { en: "Zare", mr: "झरे" }
];

async function run() {
  console.log('Adding new villages for Atpadi...');
  let batch = writeBatch(db);
  let count = 0;
  
  for (const v of villages) {
    let base = v.en;
    const vilCode = base.replace(/[^a-zA-Z0-9]/g, '').trim().toUpperCase().replace(/W/g, 'V');
    const code = `MA_SAN_ATP_${vilCode}`;
    
    const docRef = doc(db, 'master-locations', code);
    batch.set(docRef, {
      id: code,
      villageCode: code,
      state: "Maharashtra",
      district: "Sangli",
      taluka: "Atpadi",
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
  
  console.log(`Added ${count} villages for Atpadi.`);
  process.exit(0);
}

run().catch(e => {
  console.error(e);
  process.exit(1);
});
