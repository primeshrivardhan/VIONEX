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
  { en: "Ankali", mr: "अंकली" },
  { en: "Arag", mr: "आरग" },
  { en: "Bamani", mr: "बामणी" },
  { en: "Bamnoli", mr: "बामणोली" },
  { en: "Bedag", mr: "बेडग" },
  { en: "Belanki", mr: "बेळंकी" },
  { en: "Bhose", mr: "भोसे" },
  { en: "Bisur", mr: "बिसूर" },
  { en: "Bolwad", mr: "बोलवाड" },
  { en: "Chabukswarwadi", mr: "चाबुकस्वारवाडी" },
  { en: "Dhavali", mr: "ढवळी" },
  { en: "Dongarwadi", mr: "डोंगरवाडी" },
  { en: "Dudhgaon", mr: "दुधगाव" },
  { en: "Erandoli", mr: "एरंडोली" },
  { en: "Gundewadi", mr: "गुंडेवाडी" },
  { en: "Haripur", mr: "हरिपूर" },
  { en: "Inam Dhamani", mr: "इनाम धामणी" },
  { en: "Janaraowadi", mr: "जानराववाडी" },
  { en: "Kadamwadi", mr: "कदमवाडी" },
  { en: "Kakadwadi", mr: "काकडवाडी" },
  { en: "Kalambi", mr: "कळंबी" },
  { en: "Kanadwadi", mr: "कानडवाडी" },
  { en: "Karnal", mr: "करनाल" },
  { en: "Karoli", mr: "करोली" },
  { en: "Kasabe Digraj", mr: "कसबे डिग्रज" },
  { en: "Kavaji Khotwadi", mr: "कवजी खोतवाडी" },
  { en: "Kavalapur", mr: "कवलापूर" },
  { en: "Kavathe Piran", mr: "कवठे पिरान" },
  { en: "Khanderajuri", mr: "खांडेराजुरी" },
  { en: "Kharkatwadi", mr: "खरकटवाडी" },
  { en: "Khatav", mr: "खटाव" },
  { en: "Laxmiwadi", mr: "लक्ष्मीवाडी" },
  { en: "Lingnur", mr: "लिंगनूर" },
  { en: "Malewadi", mr: "माळेवाडी" },
  { en: "Malgaon", mr: "माळगाव" },
  { en: "Malwadi", mr: "माळवाडी" },
  { en: "Manmodi", mr: "मनमोडी" },
  { en: "Mhaisal", mr: "म्हैसाळ" },
  { en: "Mouje Digraj", mr: "मौजे डिग्रज" },
  { en: "Nandra", mr: "नांद्रे" },
  { en: "Narwad", mr: "नरवाड" },
  { en: "Nilaji", mr: "निलजी" },
  { en: "Padmale", mr: "पद्माळे" },
  { en: "Patgaon", mr: "पाटगाव" },
  { en: "Payappachiwadi", mr: "पायप्पाचीवाडी" },
  { en: "Rasulwadi", mr: "रसूलवाडी" },
  { en: "Salgare", mr: "सलगरे" },
  { en: "Sambarwadi", mr: "सांबरवाडी" },
  { en: "Samdoli", mr: "सामडोली" },
  { en: "Santoshwadi", mr: "संतोषवाडी" },
  { en: "Savali", mr: "सावळी" },
  { en: "Savalwadi", mr: "सावळवाडी" },
  { en: "Sheri Kavathe", mr: "शेरी कवठे" },
  { en: "Shindewadi", mr: "शिंदेवाडी" },
  { en: "Shipur", mr: "शिपूर" },
  { en: "Siddhewadi", mr: "सिद्धेवाडी" },
  { en: "Soni", mr: "सोनी" },
  { en: "Takali", mr: "टाकळी" },
  { en: "Tanang", mr: "तनांग" },
  { en: "Tung", mr: "तुंग" },
  { en: "Vaddi", mr: "वड्डी" },
  { en: "Vijay Nagar", mr: "विजय नगर" },
  { en: "Vyankuchiwadi", mr: "व्यंकुचीवाडी" },
  { en: "Wajegaon", mr: "वाजेगाव" },
  { en: "Sangli", mr: "सांगली" },
  { en: "Miraj", mr: "मिरज" },
  { en: "Kupwad", mr: "कुपवाड" },
  { en: "Madhavnagar", mr: "माधवनगर" }
];

async function run() {
  console.log('Adding new villages for Miraj...');
  let batch = writeBatch(db);
  let count = 0;
  
  for (const v of villages) {
    let base = v.en;
    const vilCode = base.replace(/[^a-zA-Z0-9]/g, '').trim().toUpperCase().replace(/W/g, 'V');
    const code = `MA_SAN_MIR_${vilCode}`;
    
    const docRef = doc(db, 'master-locations', code);
    batch.set(docRef, {
      id: code,
      villageCode: code,
      state: "Maharashtra",
      district: "Sangli",
      taluka: "Miraj",
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
  
  console.log(`Added ${count} villages for Miraj.`);
  process.exit(0);
}

run().catch(e => {
  console.error(e);
  process.exit(1);
});
