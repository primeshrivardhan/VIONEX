const fs = require('fs');
let content = fs.readFileSync('src/lib/maharashtra-locations.ts', 'utf8');

const replacement = `
  "Miraj": [
    "Miraj", "Sangli", "Kupwad", "Arag", "Bedag", "Bolwad", "Erandoli", "Kavathe Piran", 
    "Mallewadi", "Nandre", "Savali", "Tanang", "Belanki", "Malgaon", "Budhgaon", 
    "Madhavnagar", "Wanlesswadi", "Bamnoli", "Bisur", "Brahmanpuri", "Dahigaon", 
    "Dhavali", "Dongarwadi", "Dudhgaon", "Haripur", "Inam Dhamni", "Janrao Wadi", 
    "Kakadwadi", "Kalambi", "Kande", "Karnal", "Kasabe Digraj", "Khandobachiwadi", 
    "Khatav", "Khubyachiwadi", "Lingnur", "Mhaishal", "Mhaiskarwadi", "Narwad", 
    "Nilji", "Padale", "Shindewadi", "Shipur", "Subhashnagar", "Takali", "Vaddi", 
    "Vyankateshnagar", "Yashwantnagar", "Zarandi", "Kupwad (R)", "Soni", "Vyankokchiwadi",
    "Bramhannath", "Chandannagar"
  ],
  "Tasgaon": [
    "Tasgaon", "Manerajuri", "Savalaj", "Turchi", "Borgaon", "Nimani", "Ped", "Waifhal", 
    "Yelavi", "Kavathe Ekand", "Limb", "Siddhewadi", "Chinchani", "Dorli", "Gaurgaon", 
    "Hatnoor", "Jarandi", "Kumathe", "Lodhavade", "Matakuntha", "Nagaon (Kavathe)", 
    "Nagaon (Nimani)", "Nimjani", "Punadi", "Shirgaon", "Upalavi", "Vasumbe", 
    "Yamgarwadi", "Balavadi", "Dhavali (Tasgaon)", "Gavan", "Kacharewadi", 
    "Kamalapur", "Khujgaon", "Morale", "Nagaon", "Nimsad", "Pundi", "Visapur"
  ],
  "Kavathe Mahankal": [
    "Kavathe Mahankal", "Borgaon (KM)", "Churewadi", "Deshing", "Hingangaon", "Irali", 
    "Kokanwadi", "Langarhpeth", "Shirdhon", "Agharnipur", "Kuchi", "Agran Dhulgaon", 
    "Alkud (M)", "Alkud (S)", "Arewadi", "Basargi", "Chauradi", "Chikhali", 
    "Dandobaachi Wadi", "Dhalgaon", "Dhalewadi", "Dudhabhavi", "Dhorale", "Garodi", 
    "Ghatnandre", "Ghoti", "Haroli", "Jakhapur", "Jaoli", "Kadamwadi", "Karoli (T)", 
    "Kharshing", "Kokale", "Kudal", "Loni", "Morale (KM)", "Nimbaj", "Padali", 
    "Rampur", "Ranjani", "Sindur", "Tisangi", "Vharoli", "Zurewadi", "Bhutewadi", "Dhalgaon"
  ],
  "Shirol": [
    "Shirol", "Kurundwad", "Jaysingpur", "Dharangutti", "Majale", "Danoli", 
    "Rukadi", "Alat", "Akiwat", "Arjunwad", "Aurwad", "Babu Jamal", "Bastawad",
    "Bubnal", "Chinchwad", "Danawad", "Dattavad", "Ganeshwadi", "Ghalwad", 
    "Gourwad", "Hasur", "Hathkanangale", "Herwad", "Jambhali", "Kavathesaar",
    "Khidrapur", "Kothali", "Kutwad", "Lat", "Latwadi", "Nandani", "Narasobawadi",
    "Narsimhwadi", "Nimsirgaon", "Rajnagar", "Sadalga", "Sambhapur", "Shedbal",
    "Shirdhon", "Shirguppi", "Shiroli", "Takarwadi", "Tamadalge", "Udanaichiwadi",
    "Umrani", "Yadrav", "Ganeshwadi"
  ],
  "Walwa": [
    "Islampur", "Ashta", "Bahe", "Boregaon", "Gotkhindi", "Kasegaon", "Peth", "Sakharale", 
    "Walwa", "Yede Nipani", "Bavchi", "Chikurde", "Kameri", "Rethare", "Yedemachindra",
    "Aitawade Budruk", "Aitawade Khurd", "Baghani", "Bavchi", "Bhikawadi", "Bhilawadi",
    "Dhotre", "Itkare", "Kande", "Kapurwadi", "Karanjavade", "Karmale", "Kasegaon", 
    "Khaowadi", "Kille Machhindragad", "Koregaon", "Kurlap", "Lavanmachi", "Mahadev Wadi",
    "Mardwadi", "Narsingpur", "Navekhed", "Nerle", "Padwalwadi", "Peth", "Pharane Wadi",
    "Pokharni", "Rethare Dharan", "Satapewadi", "Surul", "Tandulwadi", "Tupari", "Waghwadi"
  ],
  "Shirala": [
    "Shirala", "Mangale", "Sagaon", "Antri Budruk", "Antri Khurd", "Kandur", "Panchgani", 
    "Bilashi", "Kokrud", "Shendri", "Amardeep", "Arla", "Bhatwadi", "Bhedasgaon", 
    "Bhivghat", "Chande", "Chandoli", "Charan", "Chikhali", "Devwadi", "Dhaswadi",
    "Fakirwadi", "Gudhe", "Ingalawadi", "Jalwandi", "Kamarj", "Kandur", "Karanjawadi",
    "Khujgaon", "Kumbhargaon", "Kusavade", "Mani", "Marleshwar", "Masawadi", "Mhasoli",
    "Natoli", "Nigadi", "Panumbre", "Pawalwadi", "Punawat", "Red", "Rile", "Sawarde",
    "Shiral", "Shivani", "Tadavale", "Ukapir", "Wadi", "Wategaon", "Zari"
  ],
  "Palus": [
    "Palus", "Bhilawadi", "Kundal", "Suryagaon", "Dudhondi", "Burli", "Andhali", 
    "Rethare Harnax", "Amnapur", "Ankalkhop", "Bamnoli", "Burangwadi", "Chopadewadi",
    "Dahiwadi", "Gholapwadi", "Hajarwadi", "Khandobachiwadi", "Khatav", "Morale", 
    "Nagthane", "Pundiwadi", "Ramanandnagar", "Sandgewadi", "Sawantpur", "Shenoli",
    "Tupari", "Vasar"
  ],
  "Kadegaon": [
    "Kadegaon", "Wangi", "Nerli", "Tadsar", "Ambak", "Kotawade", "Shelkewadi",
    "Apshinge", "Bhikawadi", "Bhingardeve Wadi", "Devrashtre", "Hingangade",
    "Kadalegaon", "Kadepur", "Khed", "Khomnal", "Kumbhargaon", "Mhavashi", 
    "Nivmji", "Renavi", "Rethare", "Sahastramachi", "Sakhale", "Shalu", "Shedage",
    "Shivaji Nagar", "Sonsal", "Tondale", "Upadale", "Vihapur", "Wadgaon", "Yevati"
  ],
  "Atpadi": [
    "Atpadi", "Dighanchi", "Nimbavade", "Pimpri", "Zare", "Ghalnivad", "Karkhel",
    "Bhingewadi", "Bhosale Vasti", "Bhud", "Bomadwadi", "Deshmukh Vasti", 
    "Gargondi", "Gomevadi", "Hivtad", "Jadhav Vasti", "Kaleshwar", "Khandale",
    "Kharsundi", "Kouthuli", "Lengarewadi", "Madgule", "Mahanubhav Math",
    "Mapate Mala", "Mithsavari", "Nelkaranji", "Padalkarwadi", "Pujarwadi",
    "Rajewadi", "Rukhadi", "Tadavale", "Vibhutwadi", "Zunjwad"
  ],
  "Jat": [
    "Jat", "Daffalapur", "Umarani", "Sankh", "Madgyal", "Siddhanath", "Valsang",
    "Akalapur", "Amrabad", "Asangi", "Aundhi", "Badagandi", "Bagalwadi", 
    "Bailur", "Balgaon", "Banali", "Basargi", "Beli", "Bhasangi", "Bhivargi",
    "Bilewadi", "Birnal", "Bolewadi", "Borgi", "Chandhal", "Chorochi",
    "Daribad", "Dhavali", "Dholgarwadi", "Ekundi", "Gudapur", "Gulvanchi",
    "Hivare", "Jadar Boblad", "Kanthi", "Karajagi", "Karewadi", "Kasturi",
    "Khandnal", "Kosari", "Kumbhari", "Laman Tanda", "Lavharya", "Mallal",
    "Mendhigiri", "Muchandi", "Nigadi", "Pandharewadi", "Pratapapur",
    "Ravalagundwadi", "Salagar", "Sanal", "Shedyal", "Shegav", "Sindur",
    "Sonalgi", "Sordi", "Sushyachiwadi", "Tikon", "Utagi", "Vajrawad", 
    "Vashan", "Yalavi", "Yedrav"
  ],
  "Khanapur": [
    "Vita", "Khanapur", "Bhalvani", "Lengare", "Mahuli", "Parevadi", "Gardi",
    "Alsand", "Atpadi", "Balavadi", "Bamani", "Banur", "Bhikawadi", "Bhud",
    "Chinchani", "Devikhindi", "Dhondewadi", "Ganeshwadi", "Ghoti", "Goregaon",
    "Hanmant Vadiye", "Jadhavwadi", "Kalambi", "Kamalapur", "Karve", "Khambale",
    "Kusavade", "Mangrul", "Mayani", "Mhasoli", "Mopar", "Nagewadi", "Palshi",
    "Panchgani", "Pimpari", "Pusegaon", "Rade", "Rengatwadi", "Renavi",
    "Salshinge", "Shedgav", "Sultanpur", "Tadawale", "Upalavi", "Vaddi",
    "VejeGav", "Walsang", "Yelavi", "Zare"
  ]
`;

// Simple regex replace for the section from "Miraj": [ ... ] to "Khanapur (Vita)": [ ... ]
// Wait, we can just replace everything inside VILLAGES_BY_TALUKA safely

const regex = /("Miraj":\s*\[[^\]]+\]\s*,\s*"Tasgaon":\s*\[[^\]]+\]\s*,\s*"Kavthe Mahankal":\s*\[[^\]]+\]\s*,\s*"Walwa":\s*\[[^\]]+\]\s*,\s*"Shirala":\s*\[[^\]]+\]\s*,\s*"Palus":\s*\[[^\]]+\]\s*,\s*"Kadegaon":\s*\[[^\]]+\]\s*,\s*"Atpadi":\s*\[[^\]]+\]\s*,\s*"Jat":\s*\[[^\]]+\]\s*,\s*"Khanapur \(Vita\)":\s*\[[^\]]+\]\s*,)/m;

content = content.replace(regex, replacement + ',\n');
// Also replace "Kavthe Mahankal" with "Kavathe Mahankal" key for consistency
content = content.replace(/"Kavthe Mahankal":/g, '"Kavathe Mahankal":');
content = content.replace(/"Khanapur \(Vita\)":/g, '"Khanapur":');

fs.writeFileSync('src/lib/maharashtra-locations.ts', content, 'utf8');
