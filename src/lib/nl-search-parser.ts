/**
 * Heuristic natural-language query parser.
 * Converts conversational queries into structured filters.
 */

export interface NLFilters {
  category?: string;
  supplier?: string;
  status?: string;
  location?: string;
  dateRange?: { from: Date; to: Date };
  movementType?: string;
}

export interface ParsedQuery {
  searchTerms: string[];
  filters: NLFilters;
  isNaturalLanguage: boolean;
}

const NL_KEYWORDS = ["show", "find", "what", "which", "list", "give", "get", "where"];

const STATUS_PATTERNS: [RegExp, string][] = [
  [/\b(running low|low stock|below reorder)\b/i, "low_stock"],
  [/\b(out of stock|zero stock|no stock|stockout)\b/i, "out_of_stock"],
  [/\b(active|in stock|available)\b/i, "active"],
  [/\b(discontinued|archived)\b/i, "discontinued"],
];

const MOVEMENT_PATTERNS: [RegExp, string][] = [
  [/\breceived\b/i, "received"],
  [/\bshipped\b/i, "shipped"],
  [/\badjusted\b/i, "adjusted"],
  [/\btransferred\b/i, "transferred"],
];

const DATE_PATTERNS: [RegExp, () => { from: Date; to: Date }][] = [
  [
    /\blast (7 days|week)\b/i,
    () => ({ from: daysAgo(7), to: new Date() }),
  ],
  [
    /\blast (30 days|month)\b/i,
    () => ({ from: daysAgo(30), to: new Date() }),
  ],
  [
    /\blast (90 days|quarter|3 months)\b/i,
    () => ({ from: daysAgo(90), to: new Date() }),
  ],
  [
    /\btoday\b/i,
    () => {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      return { from: d, to: new Date() };
    },
  ],
  [
    /\byesterday\b/i,
    () => {
      const d = daysAgo(1);
      d.setHours(0, 0, 0, 0);
      const e = daysAgo(1);
      e.setHours(23, 59, 59, 999);
      return { from: d, to: e };
    },
  ],
];

function daysAgo(n: number): Date {
  return new Date(Date.now() - n * 86_400_000);
}

// Noise words to strip from search terms
const NOISE = new Set([
  "show", "me", "find", "what", "which", "list", "give", "get",
  "where", "is", "are", "the", "a", "an", "of", "in", "from",
  "that", "items", "products", "things", "stuff", "all", "my",
  "have", "has", "been", "with", "for", "to", "and", "or",
]);

export function parseQuery(query: string): ParsedQuery {
  const filters: NLFilters = {};
  let remaining = query.trim();

  const words = remaining.split(/\s+/);
  const isNL =
    words.length > 3 || words.some((w) => NL_KEYWORDS.includes(w.toLowerCase()));

  // Extract status
  for (const [pattern, status] of STATUS_PATTERNS) {
    if (pattern.test(remaining)) {
      filters.status = status;
      remaining = remaining.replace(pattern, " ");
      break;
    }
  }

  // Extract movement type
  for (const [pattern, type] of MOVEMENT_PATTERNS) {
    if (pattern.test(remaining)) {
      filters.movementType = type;
      remaining = remaining.replace(pattern, " ");
      break;
    }
  }

  // Extract date range
  for (const [pattern, fn] of DATE_PATTERNS) {
    if (pattern.test(remaining)) {
      filters.dateRange = fn();
      remaining = remaining.replace(pattern, " ");
      break;
    }
  }

  // Extract "from [supplier]"
  const fromMatch = remaining.match(/\bfrom\s+([A-Z][a-zA-Z\s&]+?)(?:\s+(?:received|shipped|last|in|that|$))/i);
  if (fromMatch) {
    filters.supplier = fromMatch[1].trim();
    remaining = remaining.replace(fromMatch[0], fromMatch[0].replace(fromMatch[1], " "));
  }

  // Extract "in [category/location]"
  const inMatch = remaining.match(/\bin\s+([A-Za-z][a-zA-Z\s&]+?)(?:\s+(?:from|received|shipped|last|that|$))/i);
  if (inMatch) {
    // Could be category or location — store as category, consumers can try both
    filters.category = inMatch[1].trim();
    remaining = remaining.replace(inMatch[0], inMatch[0].replace(inMatch[1], " "));
  }

  // Clean remaining into search terms
  const searchTerms = remaining
    .split(/\s+/)
    .map((w) => w.replace(/[^a-zA-Z0-9-]/g, "").toLowerCase())
    .filter((w) => w.length > 1 && !NOISE.has(w));

  return { searchTerms, filters, isNaturalLanguage: isNL };
}
