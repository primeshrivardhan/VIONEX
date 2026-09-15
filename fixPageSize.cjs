const fs = require('fs');
let code = fs.readFileSync('src/components/ScheduleList.tsx', 'utf8');

code = code.replace(
  '  const [copySuccess, setCopySuccess] = useState<string | null>(null);',
  '  const [copySuccess, setCopySuccess] = useState<string | null>(null);\n  const [pageSize, setPageSize] = useState(15);'
);

fs.writeFileSync('src/components/ScheduleList.tsx', code);
