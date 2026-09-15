const fs = require('fs');
let code = fs.readFileSync('src/components/ScheduleList.tsx', 'utf8');

code = code.replace(
  '  const [pullDistance, setPullDistance] = useState(0);',
  '  const [pullDistance, setPullDistance] = useState(0);\n  const [pageSize, setPageSize] = useState(15);'
);

fs.writeFileSync('src/components/ScheduleList.tsx', code);
