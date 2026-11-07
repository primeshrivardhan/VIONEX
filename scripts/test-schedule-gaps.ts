// Pure unit test for computeGap, buildSheetRows, and planPages
// Run with: npx tsx scripts/test-schedule-gaps.ts
// No Firebase, no network, no external dependencies beyond the src lib.

import { computeGap, buildSheetRows } from '../vionex/src/lib/scheduleGaps.js';
import { planPages } from '../vionex/src/lib/sheetPagination.js';

let pass = 0;
let fail = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    pass++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    fail++;
  }
}

console.log('\n=== computeGap tests ===');

// Day -5 then 1 → gap from -4 to 0, count=5
const g1 = computeGap(-5, 1);
assert(g1 !== null, 'gap(-5, 1) is not null');
assert(g1?.from === -4, 'gap(-5,1).from = -4');
assert(g1?.to === 0, 'gap(-5,1).to = 0');
assert(g1?.count === 5, 'gap(-5,1).count = 5');
assert(g1?.marathiText === 'गॅप दिवस -4 ते 0 (5 दिवस गॅप)', `gap(-5,1) marathi: "${g1?.marathiText}"`);
assert(g1?.englishText === 'Gap days -4 to 0 (5-day gap)', `gap(-5,1) english: "${g1?.englishText}"`);

// Day 1 then 3 → gap day 2, count=1
const g2 = computeGap(1, 3);
assert(g2 !== null, 'gap(1, 3) is not null');
assert(g2?.from === 2, 'gap(1,3).from = 2');
assert(g2?.count === 1, 'gap(1,3).count = 1');
assert(g2?.marathiText === 'गॅप दिवस 2 (1 दिवस गॅप)', `gap(1,3) marathi: "${g2?.marathiText}"`);
assert(g2?.englishText === 'Gap day 2 (1-day gap)', `gap(1,3) english: "${g2?.englishText}"`);

// Day 3 then 6 → gap 4 ते 5, count=2
const g3 = computeGap(3, 6);
assert(g3?.count === 2, 'gap(3,6).count = 2');
assert(g3?.marathiText === 'गॅप दिवस 4 ते 5 (2 दिवस गॅप)', `gap(3,6): "${g3?.marathiText}"`);

// Day 6 then 8 → gap day 7, count=1
const g4 = computeGap(6, 8);
assert(g4?.count === 1, 'gap(6,8).count = 1');
assert(g4?.marathiText === 'गॅप दिवस 7 (1 दिवस गॅप)', `gap(6,8): "${g4?.marathiText}"`);

// Day 8 then 9 → no bar
const g5 = computeGap(8, 9);
assert(g5 === null, 'gap(8,9) = null (adjacent)');

// Day 0 then 1 → no bar
const g6 = computeGap(0, 1);
assert(g6 === null, 'gap(0,1) = null (adjacent)');

console.log('\n=== buildSheetRows tests ===');

// Test with days [-5, 1, 3, 6, 8, 9, 10] (possibly unsorted input)
const schedules = [
  { day: '1', scheduleDate: '2024-01-01', selectedProducts: [] },
  { day: '-5', scheduleDate: '2023-12-27', selectedProducts: [] },
  { day: '9', scheduleDate: '2024-01-09', selectedProducts: [] },
  { day: '3', scheduleDate: '2024-01-03', selectedProducts: [] },
  { day: '6', scheduleDate: '2024-01-06', selectedProducts: [] },
  { day: '8', scheduleDate: '2024-01-08', selectedProducts: [] },
  { day: '10', scheduleDate: '2024-01-10', selectedProducts: [] },
];

const rows = buildSheetRows(schedules);
const gapRows = rows.filter(r => r.type === 'gap') as any[];
const entryRows = rows.filter(r => r.type === 'entry');

assert(entryRows.length === 7, `7 entry rows (got ${entryRows.length})`);
assert(gapRows.length === 4, `4 gap rows (got ${gapRows.length})`);

// Check gap texts in order
assert(gapRows[0]?.gap?.marathiText === 'गॅप दिवस -4 ते 0 (5 दिवस गॅप)', `gap[0]: "${gapRows[0]?.gap?.marathiText}"`);
assert(gapRows[1]?.gap?.marathiText === 'गॅप दिवस 2 (1 दिवस गॅप)', `gap[1]: "${gapRows[1]?.gap?.marathiText}"`);
assert(gapRows[2]?.gap?.marathiText === 'गॅप दिवस 4 ते 5 (2 दिवस गॅप)', `gap[2]: "${gapRows[2]?.gap?.marathiText}"`);
assert(gapRows[3]?.gap?.marathiText === 'गॅप दिवस 7 (1 दिवस गॅप)', `gap[3]: "${gapRows[3]?.gap?.marathiText}"`);

// Test: unsorted gives same result
const shuffled = [...schedules].reverse();
const rows2 = buildSheetRows(shuffled);
const gaps2 = rows2.filter(r => r.type === 'gap') as any[];
assert(gaps2.length === 4, `unsorted input: same 4 gaps (got ${gaps2.length})`);
assert(gaps2[0]?.gap?.marathiText === gapRows[0]?.gap?.marathiText, 'unsorted: same first gap');

// Test: duplicate days
const withDups = [
  { day: '5', scheduleDate: '2024-01-05', selectedProducts: [] },
  { day: '5', scheduleDate: '2024-01-05', selectedProducts: [] },
  { day: '8', scheduleDate: '2024-01-08', selectedProducts: [] },
];
const rowsDup = buildSheetRows(withDups);
const gapsDup = rowsDup.filter(r => r.type === 'gap') as any[];
assert(rowsDup.filter(r => r.type === 'entry').length === 2, 'duplicate days: 2 unique entry rows');
assert(gapsDup.length === 1, `duplicate days: 1 gap (got ${gapsDup.length})`);
assert(gapsDup[0]?.gap?.count >= 1, 'no negative count from duplicates');

// Test: empty list
const emptyRows = buildSheetRows([]);
assert(emptyRows.length === 0, 'empty input: 0 rows');

// Test: single entry
const singleRows = buildSheetRows([{ day: '3', scheduleDate: '2024-01-03', selectedProducts: [] }]);
assert(singleRows.length === 1, 'single entry: 1 row, no gaps');
assert(singleRows[0].type === 'entry', 'single entry: type is entry');

console.log('\n=== planPages tests (Step 3) ===');

// 1. Empty list
const pEmpty = planPages([], [], 1000);
assert(pEmpty.length === 0, 'planPages: empty list returns []');

// 2. A block that exactly fits
const pFits = planPages([0, 500], [500, 1000], 1000);
assert(pFits.length === 1, 'planPages: exactly fits produces 1 page');
assert(pFits[0][0] === 0 && pFits[0][1] === 1000, `planPages: exactly fits [0, 1000] (got [${pFits[0]}])`);

// 3. A block that would cross the bottom (moves to next page)
// Block 0: 0-600. Block 1: 600-1200. Page height 1000. Block 1 would cross 1000, so break at 600.
const pCross = planPages([0, 600], [600, 1200], 1000);
assert(pCross.length === 2, 'planPages: crossing block moves to next page (2 pages)');
assert(pCross[0][0] === 0 && pCross[0][1] === 600, `page 1 breaks cleanly before crossing block: [0, 600] (got [${pCross[0]}])`);
assert(pCross[1][0] === 600 && pCross[1][1] === 1200, `page 2 starts cleanly at block top: [600, 1200] (got [${pCross[1]}])`);

// 4. A block taller than a page
// Block 0: 0-2500. Page height 1000. Slices: [0, 1000], [1000, 2000], [2000, 2500]
const pTall = planPages([0], [2500], 1000);
assert(pTall.length === 3, `planPages: oversized block cut across pages (got ${pTall.length} pages)`);
assert(pTall[0][0] === 0 && pTall[0][1] === 1000, `oversized slice 1: [0, 1000]`);
assert(pTall[1][0] === 1000 && pTall[1][1] === 2000, `oversized slice 2: [1000, 2000]`);
assert(pTall[2][0] === 2000 && pTall[2][1] === 2500, `oversized slice 3: [2000, 2500]`);

// 5. Multiple realistic entries with gaps
// Header: 0-200. Entry 1: 200-500. Gap: 500-600. Entry 2: 600-950. Entry 3: 950-1300. Page height 1000.
// Entry 3 (950-1300) crosses 1000 -> break before Entry 3 at 950!
const pRealistic = planPages([0, 200, 500, 600, 950], [200, 500, 600, 950, 1300], 1000);
assert(pRealistic.length === 2, `planPages realistic: 2 pages (got ${pRealistic.length})`);
assert(pRealistic[0][1] === 950, `planPages realistic: page 1 ends at 950 before entry 3`);
assert(pRealistic[1][0] === 950 && pRealistic[1][1] === 1300, `planPages realistic: page 2 is [950, 1300]`);

console.log(`\n${'='.repeat(40)}`);
console.log(`Results: ${pass} PASS, ${fail} FAIL`);
if (fail > 0) process.exit(1);
