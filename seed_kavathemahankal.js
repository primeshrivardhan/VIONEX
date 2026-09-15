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
  { en: "Agalgaon", mr: "आगळगाव" },
  { en: "Alkud", mr: "अळकूड" },
  { en: "Alkud [s]", mr: "अळकूड (एस)" },
  { en: "Arewadi", mr: "आरेवाडी" },
  { en: "Banewadi", mr: "बानेवाडी" },
  { en: "Bassappawadi", mr: "बसप्पावाडी" },
  { en: "Borgaon", mr: "बोरगाव" },
  { en: "Chorochi", mr: "चोरोची" },
  { en: "Chudekhindi", mr: "चुडेखिंडी" },
  { en: "Deshing", mr: "देशिंग" },
  { en: "Dhalewadi", mr: "ढळेवाडी" },
  { en: "Dhalgaon", mr: "ढालगाव" },
  { en: "Dholewadi", mr: "ढोलेवाडी" },
  { en: "Dhulgaon", mr: "धुळगाव" },
  { en: "Dudhebhavi", mr: "दुधेभावी" },
  { en: "Garjewadi", mr: "गर्जेवाडी" },
  { en: "Ghatnandre", mr: "घाटनंद्रे" },
  { en: "Ghorpadi", mr: "घोरपडी" },
  { en: "Haroli", mr: "हरोली" },
  { en: "Hingangaon", mr: "हिंगणगाव" },
  { en: "Irali", mr: "इरळी" },
  { en: "Jadhavwadi", mr: "जाधववाडी" },
  { en: "Jakhapur", mr: "जाखापूर" },
  { en: "Jambhulwadi", mr: "जांभूळवाडी" },
  { en: "Jaygavhan", mr: "जयगव्हाण" },
  { en: "Kadamwadi", mr: "कदमवाडी" },
  { en: "Karalhetti", mr: "करलहट्टी" },
  { en: "Karoli", mr: "करोली" },
  { en: "Kavathe Mahankal", mr: "कवठे महांकाळ" },
  { en: "Kerewadi", mr: "केरेवाडी" },
  { en: "Kharshing", mr: "खरशिंग" },
  { en: "Kognoli", mr: "कोगनोळी" },
  { en: "Kokale", mr: "कोकळे" },
  { en: "Kuchi", mr: "कुची" },
  { en: "Kuktoli", mr: "कुकटोळी" },
  { en: "Kundlapur", mr: "कुंडलपूर" },
  { en: "Landgewadi", mr: "लांडगेवाडी" },
  { en: "Langarpeth", mr: "लंगरपेठ" },
  { en: "Lonarwadi", mr: "लोणारवाडी" },
  { en: "Malangaon", mr: "मलांगणगाव" },
  { en: "Mhaisal", mr: "म्हैसाळ" },
  { en: "Moghamwadi", mr: "मोघमवाडी" },
  { en: "Morgaon", mr: "मोरगाव" },
  { en: "Nagaj", mr: "नागज" },
  { en: "Nangole", mr: "नांगोळे" },
  { en: "Nimaj", mr: "निमज" },
  { en: "Pimpalwadi", mr: "पिंपळवाडी" },
  { en: "Rampurwadi", mr: "रामपूरवाडी" },
  { en: "Ranjani", mr: "रांजणी" },
  { en: "Raywadi", mr: "रायवाडी" },
  { en: "Sarati", mr: "सरती" },
  { en: "Shelkewadi", mr: "शेळकेवाडी" },
  { en: "Shindewadi", mr: "शिंदेवाडी" },
  { en: "Shirdhon", mr: "शिरढोण" },
  { en: "Thabadewadi", mr: "थबाडेवाडी" },
  { en: "Tisangi", mr: "तिसंगी" },
  { en: "Vithurayachi Wadi", mr: "विठुरायाची वाडी" },
  { en: "Wagholi", mr: "वाघोली" },
  { en: "Zurewadi", mr: "झुरेवाडी" }
];

async function run() {
  console.log('Adding new villages for Kavathe Mahankal...');
  let batch = writeBatch(db);
  let count = 0;
  
  for (const v of villages) {
    let base = v.en;
    const vilCode = base.replace(/[^a-zA-Z0-9]/g, '').trim().toUpperCase().replace(/W/g, 'V');
    const code = `MA_SAN_KAV_${vilCode}`;
    
    const docRef = doc(db, 'master-locations', code);
    batch.set(docRef, {
      id: code,
      villageCode: code,
      state: "Maharashtra",
      district: "Sangli",
      taluka: "Kavathe Mahankal", // Use standard name
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
  
  console.log(`Added ${count} villages for Kavathe Mahankal.`);
  process.exit(0);
}

run().catch(e => {
  console.error(e);
  process.exit(1);
});
