const fs = require('fs');
let code = fs.readFileSync('src/components/ScheduleList.tsx', 'utf8');

code = code.replace(
  '                      })\n                    </div>\n                  </div>\n                );\n              })}',
  '                      })}\n                    </div>\n                  </div>\n                );\n              })}'
);

fs.writeFileSync('src/components/ScheduleList.tsx', code);
