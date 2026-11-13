// A small QR code generator with no dependencies: byte mode, error correction level M, versions 1 to 10
// (up to 174 characters). A visitor pass is a short code like "PR-605309", which fits the smallest version.
// qrMatrix("PR-605309") -> boolean[][] (true = dark module). Draw it with <QrImage /> or qrToSvg().

// error correction level M, per version (index = version): [error correction codewords per block, [blocks, data codewords per block][]]
const BLOCKS: Record<number, [number, [number, number][]]> = {
  1: [10, [[1, 16]]],
  2: [16, [[1, 28]]],
  3: [26, [[1, 44]]],
  4: [18, [[2, 32]]],
  5: [24, [[2, 43]]],
  6: [16, [[4, 27]]],
  7: [18, [[4, 31]]],
  8: [22, [[2, 38], [2, 39]]],
  9: [22, [[3, 36], [2, 37]]],
  10: [26, [[4, 43], [1, 44]]],
};
const ALIGNMENT: Record<number, number[]> = {
  1: [],
  2: [6, 18],
  3: [6, 22],
  4: [6, 26],
  5: [6, 30],
  6: [6, 34],
  7: [6, 22, 38],
  8: [6, 24, 42],
  9: [6, 26, 46],
  10: [6, 28, 50],
};
const MAX_VERSION = 10;

const dataCodewords = (version: number) => BLOCKS[version][1].reduce((sum, [count, size]) => sum + count * size, 0);

// ----- Reed-Solomon over GF(256) -----

const EXP = new Array<number>(512);
const LOG = new Array<number>(256);
{
  let x = 1;
  for (let i = 0; i < 255; i++) {
    EXP[i] = x;
    LOG[x] = i;
    x <<= 1;
    if (x & 0x100) x ^= 0x11d;
  }
  for (let i = 255; i < 512; i++) EXP[i] = EXP[i - 255];
}
const mul = (a: number, b: number) => (a === 0 || b === 0 ? 0 : EXP[LOG[a] + LOG[b]]);

function generator(degree: number) {
  let poly = [1];
  for (let i = 0; i < degree; i++) {
    const next = new Array<number>(poly.length + 1).fill(0);
    poly.forEach((coef, j) => {
      next[j] ^= coef;
      next[j + 1] ^= mul(coef, EXP[i]);
    });
    poly = next;
  }
  return poly; // highest power first
}

function remainder(data: number[], degree: number) {
  const gen = generator(degree);
  const result = new Array<number>(degree).fill(0);
  for (const byte of data) {
    const factor = byte ^ result.shift()!;
    result.push(0);
    if (factor !== 0) gen.slice(1).forEach((coef, i) => (result[i] ^= mul(coef, factor)));
  }
  return result;
}

// ----- the data: mode, length, bytes, terminator, padding, then split into blocks with their error correction -----

function buildCodewords(bytes: number[], version: number) {
  const capacity = dataCodewords(version) * 8;
  const bits: number[] = [];
  const push = (value: number, length: number) => {
    for (let i = length - 1; i >= 0; i--) bits.push((value >>> i) & 1);
  };
  push(0b0100, 4); // byte mode
  push(bytes.length, version <= 9 ? 8 : 16);
  bytes.forEach((byte) => push(byte, 8));
  push(0, Math.min(4, capacity - bits.length)); // terminator
  while (bits.length % 8 !== 0) bits.push(0);
  for (let pad = 0xec; bits.length < capacity; pad ^= 0xec ^ 0x11) push(pad, 8);

  const data: number[] = [];
  for (let i = 0; i < bits.length; i += 8) data.push(parseInt(bits.slice(i, i + 8).join(""), 2));

  const [ecPerBlock, groups] = BLOCKS[version];
  const blocks: { data: number[]; ec: number[] }[] = [];
  let at = 0;
  for (const [count, size] of groups) {
    for (let i = 0; i < count; i++) {
      const part = data.slice(at, at + size);
      at += size;
      blocks.push({ data: part, ec: remainder(part, ecPerBlock) });
    }
  }

  // interleave: first the data codewords of every block, then the error correction codewords
  const out: number[] = [];
  const longest = Math.max(...blocks.map((block) => block.data.length));
  for (let i = 0; i < longest; i++) blocks.forEach((block) => i < block.data.length && out.push(block.data[i]));
  for (let i = 0; i < ecPerBlock; i++) blocks.forEach((block) => out.push(block.ec[i]));
  return out;
}

// ----- the grid -----

type Grid = { size: number; dark: boolean[][]; fixed: boolean[][] };

function drawFunctionPatterns(version: number): Grid {
  const size = version * 4 + 17;
  const dark = Array.from({ length: size }, () => new Array<boolean>(size).fill(false));
  const fixed = Array.from({ length: size }, () => new Array<boolean>(size).fill(false));
  const set = (x: number, y: number, value: boolean) => {
    if (x < 0 || y < 0 || x >= size || y >= size) return;
    dark[y][x] = value;
    fixed[y][x] = true;
  };

  // timing patterns
  for (let i = 0; i < size; i++) {
    set(6, i, i % 2 === 0);
    set(i, 6, i % 2 === 0);
  }
  // finder patterns (with their white border)
  for (const [cx, cy] of [[3, 3], [size - 4, 3], [3, size - 4]]) {
    for (let dy = -4; dy <= 4; dy++) {
      for (let dx = -4; dx <= 4; dx++) {
        const distance = Math.max(Math.abs(dx), Math.abs(dy));
        set(cx + dx, cy + dy, distance !== 2 && distance !== 4);
      }
    }
  }
  // alignment patterns (not on top of a finder pattern)
  const spots = ALIGNMENT[version];
  spots.forEach((cy, row) =>
    spots.forEach((cx, col) => {
      const onFinder = (row === 0 && col === 0) || (row === 0 && col === spots.length - 1) || (row === spots.length - 1 && col === 0);
      if (onFinder) return;
      for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) set(cx + dx, cy + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
    }),
  );
  drawFormat(0, { size, dark, fixed }); // reserves the format areas; the real bits are drawn once the mask is chosen
  if (version >= 7) {
    let rem = version;
    for (let i = 0; i < 12; i++) rem = (rem << 1) ^ ((rem >>> 11) * 0x1f25);
    const bits = (version << 12) | rem;
    for (let i = 0; i < 18; i++) {
      const bit = ((bits >>> i) & 1) === 1;
      const a = size - 11 + (i % 3);
      const b = Math.floor(i / 3);
      set(a, b, bit);
      set(b, a, bit);
    }
  }
  return { size, dark, fixed };
}

/** The 15 format bits (error correction level M + mask number) are written twice, plus the one fixed dark module. */
function drawFormat(mask: number, { size, dark, fixed }: Grid) {
  const data = (0b00 << 3) | mask; // level M = 00
  let rem = data;
  for (let i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
  const bits = ((data << 10) | rem) ^ 0x5412;
  const bit = (i: number) => ((bits >>> i) & 1) === 1;
  const set = (x: number, y: number, value: boolean) => {
    dark[y][x] = value;
    fixed[y][x] = true;
  };
  for (let i = 0; i <= 5; i++) set(8, i, bit(i));
  set(8, 7, bit(6));
  set(8, 8, bit(7));
  set(7, 8, bit(8));
  for (let i = 9; i < 15; i++) set(14 - i, 8, bit(i));
  for (let i = 0; i < 8; i++) set(size - 1 - i, 8, bit(i));
  for (let i = 8; i < 15; i++) set(8, size - 15 + i, bit(i));
  set(8, size - 8, true);
}

/** Puts the codeword bits in the free modules, two columns at a time from the bottom right, zig-zagging up and down. */
function placeData(grid: Grid, codewords: number[]) {
  const { size, dark, fixed } = grid;
  let bit = 0;
  const total = codewords.length * 8;
  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5; // the vertical timing column is skipped
    for (let i = 0; i < size; i++) {
      for (let k = 0; k < 2; k++) {
        const x = right - k;
        const upward = ((right + 1) & 2) === 0;
        const y = upward ? size - 1 - i : i;
        if (fixed[y][x] || bit >= total) continue;
        dark[y][x] = ((codewords[bit >>> 3] >>> (7 - (bit & 7))) & 1) === 1;
        bit++;
      }
    }
  }
}

const MASKS: ((x: number, y: number) => boolean)[] = [
  (x, y) => (x + y) % 2 === 0,
  (_x, y) => y % 2 === 0,
  (x) => x % 3 === 0,
  (x, y) => (x + y) % 3 === 0,
  (x, y) => (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0,
  (x, y) => ((x * y) % 2) + ((x * y) % 3) === 0,
  (x, y) => (((x * y) % 2) + ((x * y) % 3)) % 2 === 0,
  (x, y) => (((x + y) % 2) + ((x * y) % 3)) % 2 === 0,
];

function applyMask(grid: Grid, mask: number) {
  for (let y = 0; y < grid.size; y++) for (let x = 0; x < grid.size; x++) if (!grid.fixed[y][x] && MASKS[mask](x, y)) grid.dark[y][x] = !grid.dark[y][x];
}

/** The standard penalty score: the lower, the easier for a camera to read. */
function penalty({ size, dark }: Grid) {
  let score = 0;
  const lines = [...dark, ...Array.from({ length: size }, (_, x) => dark.map((row) => row[x]))];
  for (const line of lines) {
    let run = 1;
    for (let i = 1; i <= size; i++) {
      if (i < size && line[i] === line[i - 1]) run++;
      else {
        if (run >= 5) score += run - 2;
        run = 1;
      }
    }
    // 1:1:3:1:1 finder-like pattern with four light modules on one side
    for (let i = 0; i + 10 < size; i++) {
      const at = (j: number) => (line[i + j] ? 1 : 0);
      const core = at(4) && !at(5) && at(6) && at(7) && at(8) && !at(9) && at(10) ? 1 : 0;
      if (!core) continue;
      const light = (from: number) => [0, 1, 2, 3].every((j) => !line[from + j]);
      if ((i + 10 + 4 < size && light(i + 11)) || (i - 4 >= 0 && light(i - 4))) score += 40;
    }
  }
  for (let y = 0; y < size - 1; y++) for (let x = 0; x < size - 1; x++) if (dark[y][x] === dark[y][x + 1] && dark[y][x] === dark[y + 1][x] && dark[y][x] === dark[y + 1][x + 1]) score += 3;
  const darkCount = dark.reduce((sum, row) => sum + row.filter(Boolean).length, 0);
  score += Math.floor(Math.abs((darkCount * 20) / (size * size) - 10)) * 10;
  return score;
}

/** The QR code for a text as rows of modules (true = dark). Throws when the text is longer than 174 bytes. */
export function qrMatrix(text: string): boolean[][] {
  const bytes = [...new TextEncoder().encode(text)];
  let version = 1;
  while (version <= MAX_VERSION && bytes.length + (version <= 9 ? 2 : 3) > dataCodewords(version)) version++;
  if (version > MAX_VERSION) throw new Error("That text is too long for a QR code here.");

  const codewords = buildCodewords(bytes, version);
  let best: Grid | null = null;
  let bestScore = Infinity;
  for (let mask = 0; mask < 8; mask++) {
    const grid = drawFunctionPatterns(version);
    placeData(grid, codewords);
    applyMask(grid, mask);
    drawFormat(mask, grid);
    const score = penalty(grid);
    if (score < bestScore) {
      best = grid;
      bestScore = score;
    }
  }
  return best!.dark;
}

const QUIET_ZONE = 4;

/** An SVG string (dark modules as one path, on a white square with the quiet zone a scanner needs). */
export function qrToSvg(text: string, label = "QR code") {
  const matrix = qrMatrix(text);
  const size = matrix.length + QUIET_ZONE * 2;
  let path = "";
  matrix.forEach((row, y) =>
    row.forEach((on, x) => {
      if (on) path += `M${x + QUIET_ZONE} ${y + QUIET_ZONE}h1v1h-1z`;
    }),
  );
  const safe = label.replace(/[<>&"]/g, "");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" shape-rendering="crispEdges" role="img" aria-label="${safe}"><rect width="${size}" height="${size}" fill="#fff"/><path d="${path}" fill="#000"/></svg>`;
}

/** A PNG data URL of the QR code, `pixels` wide, for downloading. Needs a browser. */
export function qrToPngDataUrl(text: string, pixels = 600) {
  const matrix = qrMatrix(text);
  const modules = matrix.length + QUIET_ZONE * 2;
  const scale = Math.max(1, Math.floor(pixels / modules));
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = modules * scale;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Couldn't draw the QR code.");
  context.fillStyle = "#fff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "#000";
  matrix.forEach((row, y) => row.forEach((on, x) => on && context.fillRect((x + QUIET_ZONE) * scale, (y + QUIET_ZONE) * scale, scale, scale)));
  return canvas.toDataURL("image/png");
}
