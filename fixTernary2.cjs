const fs = require('fs');
let code = fs.readFileSync('src/components/ScheduleList.tsx', 'utf8');

code = code.replace(
  '            {listItems.length > 0 ? (\n              <>\n              listItems.slice(0, pageSize).map((item, idx) => {',
  '            {listItems.length > 0 ? (\n              <>\n              {listItems.slice(0, pageSize).map((item, idx) => {'
);

code = code.replace(
  '              })\n                {listItems.length > pageSize && (',
  '              })}\n                {listItems.length > pageSize && ('
);

fs.writeFileSync('src/components/ScheduleList.tsx', code);
