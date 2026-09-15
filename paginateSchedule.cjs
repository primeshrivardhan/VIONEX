const fs = require('fs');
let code = fs.readFileSync('src/components/ScheduleList.tsx', 'utf8');

code = code.replace(
  'const listItems = useMemo(() => {',
  'const [pageSize, setPageSize] = useState(15);\n\n  const listItems = useMemo(() => {'
);

code = code.replace(
  '              listItems.map((item, idx) => {',
  '              listItems.slice(0, pageSize).map((item, idx) => {'
);

const loadMoreBtn = `
            {listItems.length > pageSize && (
              <div className="flex justify-center pt-2 pb-6">
                <button
                  onClick={() => setPageSize(prev => prev + 15)}
                  className="px-6 py-2.5 rounded-xl border border-emerald-200 text-emerald-700 font-semibold text-sm hover:bg-emerald-50 active:bg-emerald-100 transition-colors shadow-sm"
                >
                  {isEn ? "Load More Schedules" : "आणखी वेळापत्रक पहा"}
                </button>
              </div>
            )}
`;
code = code.replace(
  '          <div className="space-y-4 pt-4 pb-12">',
  '          <div className="space-y-4 pt-4 pb-12">'
); // Wait, replacing exactly after the map is better. Let's find `})` of the map.

