/**
 * sheetPagination.ts — Pure pagination planner for multi-page PDF schedule exports.
 * Calculates exact slice boundaries [startY, endY] ensuring no schedule entry is cut.
 * Pure logic: no React, no Firebase, no DOM/window imports.
 */

/**
 * Plans page slices given block boundaries and max usable page height.
 * 
 * @param blockTops Array of block top positions in sheet pixels relative to sheet top
 * @param blockBottoms Array of block bottom positions in sheet pixels relative to sheet top
 * @param pageHeight Max usable height per page in sheet pixels (e.g. 1075 px for A4 at 96 dpi)
 * @returns Array of [startY, endY] pixel ranges for each page
 */
export function planPages(
  blockTops: number[],
  blockBottoms: number[],
  pageHeight: number
): [number, number][] {
  if (!blockTops || !blockBottoms || blockTops.length === 0) {
    return [];
  }

  const n = Math.min(blockTops.length, blockBottoms.length);
  const pages: [number, number][] = [];
  let currentPageStart = 0;

  for (let i = 0; i < n; i++) {
    const top = blockTops[i];
    const bottom = blockBottoms[i];

    // If block fits on current page
    if (bottom - currentPageStart <= pageHeight) {
      continue;
    }

    // Block would cross the bottom of current page.
    // If we have previous content on this page, start a new page before this block.
    if (top > currentPageStart) {
      pages.push([currentPageStart, top]);
      currentPageStart = top;
    }

    // Check if this single block itself is taller than a full page
    while (bottom - currentPageStart > pageHeight) {
      pages.push([currentPageStart, currentPageStart + pageHeight]);
      currentPageStart += pageHeight;
    }
  }

  // Final page for remaining content
  const lastBottom = blockBottoms[n - 1];
  if (lastBottom > currentPageStart) {
    pages.push([currentPageStart, lastBottom]);
  }

  return pages;
}

