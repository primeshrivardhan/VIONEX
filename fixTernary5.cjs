const fs = require('fs');
let code = fs.readFileSync('src/components/ScheduleList.tsx', 'utf8');

code = code.replace(
  /              \}\)\n                \{listItems\.length > pageSize/g,
  '              })}\n                {listItems.length > pageSize'
);

fs.writeFileSync('src/components/ScheduleList.tsx', code);
