# Scope Builder Functionality - Detailed Analysis

## Project Overview
This is a Next.js 15 construction agreement analyzer application with dual functionality:
1. **Job Summary Generator** - AI-powered analysis of construction agreements
2. **Scope Builder** - Interactive tool for breaking down insurance documents into organized scope items

The application uses Claude AI (Sonnet 4.5) via the Anthropic SDK and is styled with Tailwind CSS and Shadcn UI components.

---

## Folder Structure

```
Job summary generator/
├── app/                           # Next.js App Router
│   ├── layout.tsx                # Root layout with fonts and metadata
│   ├── page.tsx                  # Main entry point (SCOPE BUILDER IS HERE)
│   ├── globals.css               # Global styles with Tailwind
│   ├── favicon.ico               # Favicon
│   ├── api/
│   │   ├── analyze/
│   │   │   └── route.ts          # Job summary analyzer API
│   │   └── parse-scope/
│   │       └── route.ts          # Scope parser API (CORE SCOPE BUILDER API)
│   └── finalize/
│       └── page.tsx              # Final scope agreement signing page
│
├── components/
│   └── ui/                       # Shadcn UI components
│       ├── button.tsx
│       ├── card.tsx
│       ├── input.tsx
│       ├── label.tsx
│       └── textarea.tsx
│
├── lib/
│   └── utils.ts                  # Utility functions (cn - class merging)
│
├── types/
│   └── pdf-parse-fork.d.ts       # TypeScript definitions for PDF parser
│
├── public/                       # Static assets
│   ├── file.svg
│   ├── globe.svg
│   ├── next.svg
│   ├── vercel.svg
│   └── window.svg
│
├── Configuration Files
│   ├── package.json              # Dependencies and scripts
│   ├── tsconfig.json             # TypeScript configuration
│   ├── next.config.ts            # Next.js configuration
│   ├── components.json           # Shadcn UI configuration
│   ├── postcss.config.mjs         # PostCSS configuration
│   ├── eslint.config.mjs          # ESLint configuration
│   ├── .env.example              # Environment variables template
│   ├── .gitignore                # Git ignore rules
│   └── README.md                 # Project documentation
│
└── construction-analyzer/        # Separate Next.js app (not scope builder)
```

---

## Scope Builder Specific Files

### 1. MAIN ENTRY POINT: `/app/page.tsx`

**Size:** ~1000+ lines (dual-mode application)

**Key Components:**
- `Home` - Main component with mode switching between "job-summary" and "scope-builder"
- `JobSummaryView` - Job summary analysis view
- **`ScopeBuilderView`** - THE SCOPE BUILDER INTERFACE (Lines 132-700+)

**ScopeBuilderView Features:**
- File upload or text input for insurance documents
- Document parsing via `/api/parse-scope`
- Interactive trade/line-item selection with checkboxes
- Supplement management (add custom line items)
- Notes per line item
- Real-time RCV (Replacement Cost Value) calculation
- Deductible tracking
- Session storage for persistence
- Navigation to finalize page

**State Management:**
```typescript
const [trades, setTrades] = useState<Trade[]>([]);
const [loading, setLoading] = useState(false);
const [error, setError] = useState('');
const [inputMode, setInputMode] = useState<'file' | 'text'>('file');
const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set());
const [expandedSupplements, setExpandedSupplements] = useState<Set<string>>(new Set());
const [deductible, setDeductible] = useState<number>(0);
```

**Data Structures:**
```typescript
interface LineItem {
  id: string;
  quantity: string;           // "120 LF", "45 SQ", "1 EA"
  description: string;
  rcv: number;               // Replacement Cost Value in dollars
  checked: boolean;
  notes: string;
}

interface SupplementItem {
  id: string;
  title: string;
  quantity: string;
  amount: number;
}

interface Trade {
  id: string;
  name: string;              // "Roofing", "Gutters", etc.
  checked: boolean;
  supplements: SupplementItem[];
  lineItems: LineItem[];
}
```

**Key Functions:**
- `handleParse()` - Calls `/api/parse-scope` API
- `toggleTrade()` - Check/uncheck entire trade
- `toggleLineItem()` - Check/uncheck individual items
- `addSupplement()` - Add custom line items
- `updateSupplement()` - Update supplement fields
- `removeSupplement()` - Delete custom items
- `updateNotes()` - Add notes to line items
- `calculateTotals()` - Compute RCV totals per trade
- `handleClear()` - Clear all data with confirmation

**Session Storage:**
```javascript
// Auto-saves trades and deductible
sessionStorage.setItem('scopeData', JSON.stringify({ trades, deductible }));

// Loads on mount
const storedData = sessionStorage.getItem('scopeData');
```

---

### 2. SCOPE PARSER API: `/app/api/parse-scope/route.ts`

**Size:** ~150 lines

**Purpose:** Parses insurance documents (PDF or text) using Claude AI

**System Prompt:** Detailed instructions to extract ALL scope items organized by trade

**Key Claude Instructions:**
- Extract EVERY line item (no matter how small)
- Common trade categories: Roofing, Gutters, Siding, Windows, Painting, Decking, Fencing, Miscellaneous
- For each item: Quantity, Description, RCV value
- Output format: JSON with trades array

**API Endpoint:**
```
POST /api/parse-scope
Content-Type: multipart/form-data

Body:
  - file: PDF file (optional)
  - text: Insurance document text (optional)
```

**Request Handler:**
1. Extract PDF using `pdf-parse-fork`
2. If text input provided, use directly
3. Send to Claude with system prompt
4. Parse JSON response (removes markdown code blocks)
5. Return structured trades data

**Response Format:**
```json
{
  "trades": [
    {
      "id": "unique-id-1",
      "name": "Roofing",
      "checked": true,
      "supplements": [],
      "lineItems": [
        {
          "id": "unique-item-id-1",
          "quantity": "1 EA",
          "description": "Tear off existing shingles",
          "rcv": 2500.00,
          "checked": true,
          "notes": ""
        }
      ]
    }
  ]
}
```

**Error Handling:**
- PDF extraction errors with fallback to text input option
- Rate limiting detection
- JSON parsing validation
- User-friendly error messages

---

### 3. FINALIZE PAGE: `/app/finalize/page.tsx`

**Size:** ~300+ lines

**Purpose:** Display final scope agreement with signature capture

**Features:**
- Display "Work to Complete" section
- Display "Work Not Included" section
- Display pending supplements
- RCV totals with deductible calculation
- Digital signature canvas (mouse and touch support)
- Customer name and date fields
- Submit button

**Key Functions:**
- Canvas drawing: `startDrawing()`, `draw()`, `stopDrawing()`
- Clear signature
- Calculate totals from selected items
- Load data from sessionStorage on mount

**Components Used:**
- Card, Button, Input, Label (from Shadcn UI)

---

### 4. ANALYZE API: `/app/api/analyze/route.ts`

**Size:** ~80 lines

**Purpose:** Job summary analyzer (separate from scope builder)

**Note:** Not part of scope builder, but uses similar patterns

---

## Dependencies & Environment

### `package.json` Key Dependencies

```json
{
  "dependencies": {
    "@anthropic-ai/sdk": "^0.65.0",
    "@radix-ui/react-label": "^2.1.7",
    "@radix-ui/react-slot": "^1.2.3",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "lucide-react": "^0.545.0",
    "next": "15.5.4",
    "pdf-parse-fork": "^1.2.0",
    "react": "19.1.0",
    "react-dom": "19.1.0",
    "tailwind-merge": "^3.3.1"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4",
    "tailwindcss": "^4",
    "typescript": "^5"
  }
}
```

**Critical Dependencies for Scope Builder:**
- `@anthropic-ai/sdk` - Claude API calls
- `pdf-parse-fork` - PDF text extraction
- `react` & `react-dom` - UI framework
- `next` - Full-stack framework
- Shadcn UI components - Pre-built components
- Tailwind CSS - Styling

### Environment Variables

**Required:**
```
ANTHROPIC_API_KEY=your_api_key_here
```

**Location:** `.env.local` (created from `.env.example`)

---

## TypeScript Configuration

**tsconfig.json:**
```json
{
  "compilerOptions": {
    "target": "ES2017",
    "jsx": "preserve",
    "strict": true,
    "moduleResolution": "bundler",
    "paths": {
      "@/*": ["./*"]  // Path alias for imports
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx"]
}
```

---

## Shadcn UI Components

Located in `/components/ui/`:

### Button (`button.tsx`)
- Variants: default, destructive, outline, secondary, ghost, link
- Sizes: default, sm, lg, icon
- Full CVA implementation for flexibility

### Card (`card.tsx`)
- CardHeader, CardTitle, CardDescription
- CardContent, CardFooter
- CardAction (for layout flexibility)

### Input (`input.tsx`)
- Text input with file support
- Validation states (aria-invalid)

### Textarea (`textarea.tsx`)
- Multi-line text input
- Used for notes and document pasting

### Label (`label.tsx`)
- Based on Radix UI primitive
- Accessible form labels

---

## Styling & Theme

### Tailwind CSS Setup

**Config:** `components.json`
```json
{
  "style": "new-york",
  "tailwind": {
    "css": "app/globals.css",
    "baseColor": "neutral",
    "cssVariables": true
  }
}
```

### Global Styles (`app/globals.css`)

- Custom CSS variables for colors
- Shadcn theme implementation
- Tailwind v4 imports
- Animation library (tw-animate-css)

**Color Variables:**
- Backgrounds: `background`, `foreground`
- Cards: `card`, `card-foreground`
- Primary/Secondary: `primary`, `secondary`
- UI: `muted`, `accent`, `border`, `ring`
- Destructive: `destructive`
- Chart colors 1-5

---

## Utilities

### `/lib/utils.ts`

```typescript
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

**Purpose:** Merge Tailwind classes with conflict resolution

---

## Shared Features with Job Summary

Both features share:
- Same Next.js app structure
- Same Shadcn UI components
- Same Anthropic SDK setup
- Same layout and styling
- PDF upload capability
- Text input fallback
- Mode switching in Home component

---

## How Data Flows in Scope Builder

1. **Input Phase:**
   - User uploads PDF or pastes text
   - Stored in React state (`file`, `insuranceText`)

2. **Parsing Phase:**
   - Click "Parse Document" button
   - FormData sent to `/api/parse-scope`
   - Claude extracts and structures data
   - JSON response with trades array

3. **Selection Phase:**
   - User checks/unchecks trades and line items
   - Can add supplements for missing items
   - Can add notes to individual items
   - All auto-saved to sessionStorage

4. **Finalization Phase:**
   - Click "Finalize & Sign"
   - Data passed to `/finalize` page via sessionStorage
   - User signs agreement
   - Totals calculated with deductible

---

## Key Features for Extraction

**For a Standalone Scope Builder App, Extract:**

1. **Core Logic Files:**
   - `app/page.tsx` - ScopeBuilderView component (and data structures)
   - `app/api/parse-scope/route.ts` - AI parsing engine
   - `app/finalize/page.tsx` - Finalization/signature

2. **UI Components:**
   - All files in `components/ui/`

3. **Configuration:**
   - `tsconfig.json`
   - `package.json`
   - `components.json`
   - `next.config.ts`
   - `postcss.config.mjs`

4. **Styling:**
   - `app/globals.css`

5. **Utilities:**
   - `lib/utils.ts`

6. **Environment:**
   - `.env.example`

7. **Other:**
   - `types/pdf-parse-fork.d.ts`
   - `app/layout.tsx` (base layout)

---

## Dependencies to Keep

**Essential:**
- @anthropic-ai/sdk
- pdf-parse-fork
- next
- react & react-dom
- All @radix-ui packages
- class-variance-authority
- clsx
- tailwind-merge
- tailwindcss
- typescript

**Optional:**
- lucide-react (icons - only if used in final version)
- tw-animate-css (animations)

---

## Claude Model & API

- **Model:** `claude-sonnet-4-5-20250929`
- **Max Tokens:** 8192 (parse-scope), 2048 (analyze)
- **API Key:** From `process.env.ANTHROPIC_API_KEY`

---

## Session Storage Keys

**Key:** `scopeData`
**Value:**
```json
{
  "trades": [...],
  "deductible": 0
}
```

This persists across page navigation and browser refresh.

---

## Testing the Scope Builder

1. Start: `npm run dev`
2. Navigate to: `http://localhost:3000`
3. Click "Scope Builder" button
4. Upload sample insurance document PDF or paste text
5. Click "Parse Document"
6. Select/deselect trades and line items
7. Add supplements as needed
8. Click "Finalize & Sign"
9. Add signature and submit

---

## API Route Structure

```
POST /api/parse-scope
├── Input: FormData with file OR text
├── Processing:
│   ├── PDF extraction (if file)
│   ├── Claude API call with system prompt
│   └── JSON response parsing
└── Output: { trades: [...] }

GET /api/analyze
└── Similar pattern for job summary
```

---

## Notes for Extraction

1. **Remove:** Job summary feature, construction-analyzer folder if creating standalone
2. **Keep:** All scope builder specific code
3. **Claude API Key:** Essential - document clearly in README
4. **PDF Support:** Uses pdf-parse-fork (ensure this stays in dependencies)
5. **Session Storage:** Browser-based persistence - replace with backend if needed
6. **Signature Canvas:** Uses HTML5 Canvas API - ensure touch/mouse events work
7. **Styling:** All Tailwind classes - ensure PostCSS pipeline is set up

