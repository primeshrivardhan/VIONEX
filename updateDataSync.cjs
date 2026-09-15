const fs = require('fs');
let code = fs.readFileSync('src/lib/data-sync.ts', 'utf8');

code = code.replace(
  "import { \n  collection, \n  onSnapshot, \n  addDoc, \n  updateDoc, \n  deleteDoc, \n  doc, \n  query, \n  where, \n  setDoc,\n  getDocs,\n  Timestamp,\n  serverTimestamp,\n  writeBatch\n} from 'firebase/firestore';",
  "import { \n  collection, \n  onSnapshot, \n  addDoc, \n  updateDoc, \n  deleteDoc, \n  doc, \n  query, \n  where, \n  setDoc,\n  getDocs,\n  Timestamp,\n  serverTimestamp,\n  writeBatch,\n  orderBy,\n  limit\n} from 'firebase/firestore';"
);

code = code.replace(
  "options?: { where?: [string, any, any] }",
  "options?: { where?: [string, any, any], orderBy?: [string, 'asc' | 'desc'], limit?: number }"
);

code = code.replace(
  "    q = query(q, where(options.where[0], options.where[1], options.where[2]));\n  }",
  "    q = query(q, where(options.where[0], options.where[1], options.where[2]));\n  }\n  if (options?.orderBy) {\n    q = query(q, orderBy(options.orderBy[0], options.orderBy[1]));\n  }\n  if (options?.limit) {\n    q = query(q, limit(options.limit));\n  }"
);

fs.writeFileSync('src/lib/data-sync.ts', code);
