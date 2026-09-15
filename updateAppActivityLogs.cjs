const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  `        unsubActivityLogs = syncCollection<any>("activity-logs", (data) => {\n          setActivityLogs(data || []);\n          updateSyncTime();\n        });`,
  `        unsubActivityLogs = syncCollection<any>("activity-logs", (data) => {\n          setActivityLogs(data || []);\n          updateSyncTime();\n        }, { orderBy: ['timestamp', 'desc'], limit: 500 });`
);

fs.writeFileSync('src/App.tsx', code);
