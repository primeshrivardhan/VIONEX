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
  { en: "Ambak", mr: "अंबक" },
  { en: "Ambegaon", mr: "आंबेगाव" },
  { en: "Amrapur", mr: "अमरापूर" },
  { en: "Apsinge", mr: "अपशिंगे" },
  { en: "Asad", mr: "आसद" },
  { en: "Belavade", mr: "बेलवडे" },
  { en: "Bhikawadi Kh", mr: "भिकवडी खुर्द" },
  { en: "Bombalewadi", mr: "बोंबळेवाडी" },
  { en: "Chikhali", mr: "चिखली" },
  { en: "Chinchani Wangi", mr: "चिंचणी वांगी" },
  { en: "Devrashtre", mr: "देवराष्ट्रे" },
  { en: "Dhanewadi", mr: "धनेवाडी" },
  { en: "Hanmant Vadiye", mr: "हणमंत वडिये" },
  { en: "Hingangaon Bk", mr: "हिंगणगाव बुद्रुक" },
  { en: "Hingangaon Kh", mr: "हिंगणगाव खुर्द" },
  { en: "Kadegaon", mr: "कडेगाव" },
  { en: "Kadepur", mr: "कडेपूर" },
  { en: "Kanharwadi", mr: "कण्हरवाडी" },
  { en: "Karandewadi", mr: "करंडेवाडी" },
  { en: "Khambale Aundh", mr: "खांबळे औंध" },
  { en: "Kherade Vita", mr: "खेराडे विटा" },
  { en: "Kheradewangi", mr: "खेराडेवांगी" },
  { en: "Kotawade", mr: "कोतावाडे" },
  { en: "Kotij", mr: "कोटीज" },
  { en: "Kumbhargaon", mr: "कुंभारगाव" },
  { en: "Mohityache Vadgaon", mr: "मोहितेचे वडगाव" },
  { en: "Nerli", mr: "नेर्ली" },
  { en: "Nevari", mr: "नेवरी" },
  { en: "Nimsod", mr: "निमसोड" },
  { en: "Padali", mr: "पडळी" },
  { en: "Ramapur", mr: "रामापूर" },
  { en: "Raygaon", mr: "रायगाव" },
  { en: "Renusewadi", mr: "रेणुसेवाडी" },
  { en: "Saholi", mr: "साहोळी" },
  { en: "Saspade", mr: "सास्पडे" },
  { en: "Shalgaon", mr: "शाळगाव" },
  { en: "Shelakbav", mr: "शेळकबाव" },
  { en: "Shirasgaon", mr: "शिरसगाव" },
  { en: "Shirgaon", mr: "शिरगाव" },
  { en: "Shivajinagar", mr: "शिवाजीनगर" },
  { en: "Shivani", mr: "शिवणी" },
  { en: "Sonkire", mr: "सोनकिरे" },
  { en: "Sonsal", mr: "सोनसळ" },
  { en: "Tadasar", mr: "तडसर" },
  { en: "Tondoli", mr: "तोंडोली" },
  { en: "Tupewadi", mr: "तुपेवाडी" },
  { en: "Tupewadi (1)", mr: "तुपेवाडी (१)" },
  { en: "Upale Mayani", mr: "उपाळे मायणी" },
  { en: "Upalewangi", mr: "उपाळेवांगी" },
  { en: "Vadiye-Raybag", mr: "वडिये रायबाग" },
  { en: "Vihapur", mr: "विहापूर" },
  { en: "Wang Rethare", mr: "वांग रेठरे" },
  { en: "Wangi", mr: "वांगी" },
  { en: "Yede", mr: "येडे" },
  { en: "Yetgaon", mr: "येतगाव" },
  { en: "Yevlewadi", mr: "येवलेवाडी" }
];

async function run() {
  console.log('Adding new villages for Kadegaon...');
  let batch = writeBatch(db);
  let count = 0;
  
  for (const v of villages) {
    let base = v.en;
    const vilCode = base.replace(/[^a-zA-Z0-9]/g, '').trim().toUpperCase().replace(/W/g, 'V');
    const code = `MA_SAN_KAD_${vilCode}`;
    
    const docRef = doc(db, 'master-locations', code);
    batch.set(docRef, {
      id: code,
      villageCode: code,
      state: "Maharashtra",
      district: "Sangli",
      taluka: "Kadegaon",
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
  
  console.log(`Added ${count} villages for Kadegaon.`);
  process.exit(0);
}

run().catch(e => {
  console.error(e);
  process.exit(1);
});
