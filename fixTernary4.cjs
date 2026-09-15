const fs = require('fs');
let code = fs.readFileSync('src/components/ScheduleList.tsx', 'utf8');

code = code.replace(
  '                );\n              })\n                {listItems.length > pageSize && (',
  '                );\n              })}\n                {listItems.length > pageSize && ('
);

fs.writeFileSync('src/components/ScheduleList.tsx', code);
