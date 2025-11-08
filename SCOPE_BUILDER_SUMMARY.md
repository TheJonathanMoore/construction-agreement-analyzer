# Scope Builder - Complete Technical Summary

## Quick Overview

The Scope Builder is an interactive web application that:

1. Accepts insurance documents (PDF or text)
2. Uses Claude AI to parse and extract scope items
3. Organizes items by trade (Roofing, Gutters, Siding, etc.)
4. Allows users to select/deselect items and add custom supplements
5. Calculates RCV totals and deductibles
6. Generates a final scope agreement with digital signature

---

## File Inventory

### Files to Extract for Standalone App (19 core files)

#### App Structure (4 files)
- `/app/page.tsx` - Main component with ScopeBuilderView
- `/app/layout.tsx` - Root layout
- `/app/finalize/page.tsx` - Signature page
- `/app/globals.css` - Global styling

#### API Routes (1 file)
- `/app/api/parse-scope/route.ts` - Document parsing engine

#### UI Components (5 files)
- `/components/ui/button.tsx`
- `/components/ui/card.tsx`
- `/components/ui/input.tsx`
- `/components/ui/label.tsx`
- `/components/ui/textarea.tsx`

#### Utilities & Types (2 files)
- `/lib/utils.ts`
- `/types/pdf-parse-fork.d.ts`

#### Configuration (7 files)
- `package.json` - Dependencies
- `tsconfig.json` - TypeScript config
- `next.config.ts` - Next.js config
- `components.json` - Shadcn UI config
- `postcss.config.mjs` - PostCSS config
- `.env.example` - Environment template
- `README.md` - Documentation

---

## Technology Stack

```
Frontend:        React 19, Next.js 15, TypeScript
UI Framework:    Shadcn UI (built on Radix UI)
Styling:         Tailwind CSS v4
State:           React hooks + sessionStorage
AI Integration:  Anthropic Claude SDK
PDF Processing:  pdf-parse-fork
Form Handling:   Native HTML5 Canvas (signature)
```

---

## Core Data Structures

### Trade
```typescript
{
  id: string;           // "trade-1"
  name: string;         // "Roofing", "Gutters"
  checked: boolean;     // User selection
  supplements: SupplementItem[];
  lineItems: LineItem[];
}
```

### LineItem
```typescript
{
  id: string;           // "item-1"
  quantity: string;     // "45 SQ", "120 LF", "1 EA"
  description: string;  // "Install GAF Timberline shingles"
  rcv: number;         // 8500.00
  checked: boolean;     // User selected?
  notes: string;        // User notes
}
```

### SupplementItem
```typescript
{
  id: string;           // "supp-timestamp"
  title: string;        // Custom item description
  quantity: string;     // "10 LF"
  amount: number;       // 1500.00
}
```

---

## User Flow

### Step 1: Input
User uploads PDF or pastes text document

### Step 2: Parse
Click "Parse Document" → `/api/parse-scope` endpoint
- Extracts text from PDF (or uses text directly)
- Sends to Claude with detailed system prompt
- Returns JSON with trades array

### Step 3: Select
Interactive UI allows user to:
- Check/uncheck entire trades (cascades to line items)
- Check/uncheck individual line items
- Add custom supplements
- Add notes to specific items
- Change deductible amount

### Step 4: Review
System displays:
- Work to Complete (checked items)
- Work Not Included (unchecked items)
- Pending Supplements
- Total RCV with deductible calculations

### Step 5: Sign
User enters name, signs with mouse/touch, submits

---

## API Contract

### POST /api/parse-scope

**Request:**
```
Content-Type: multipart/form-data

Either:
  - file: PDF (binary)
  - text: Insurance document (text)
```

**Response (Success):**
```json
{
  "trades": [
    {
      "id": "trade-1",
      "name": "Roofing",
      "checked": true,
      "supplements": [],
      "lineItems": [...]
    }
  ]
}
```

**Response (Error):**
```json
{
  "error": "Error message describing the issue"
}
```

---

## Key Features

### Document Parsing
- Supports PDF and text input
- Robust error handling with fallback options
- Claude extracts items with high accuracy
- JSON validation

### Interactive Selection
- Checkbox-based UI
- Cascading checks (trade → line items)
- Expandable supplements section
- Collapsible notes per item

### Calculations
- Real-time RCV totals per trade
- Total RCV across all selections
- Supplement tracking
- Deductible impact calculation
- Insurance vs homeowner split

### Persistence
- SessionStorage for current work session
- Auto-save on every state change
- Survives page refresh
- Clears on browser tab close

### Signature Capture
- HTML5 Canvas for drawing
- Mouse and touch support
- Clear button
- Image data URL storage

---

## State Management

### ScopeBuilderView State
```typescript
const [trades, setTrades] = useState<Trade[]>([]);
const [loading, setLoading] = useState(false);
const [error, setError] = useState('');
const [inputMode, setInputMode] = useState<'file' | 'text'>('file');
const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set());
const [expandedSupplements, setExpandedSupplements] = useState<Set<string>>(new Set());
const [deductible, setDeductible] = useState<number>(0);
const [file, setFile] = useState<File | null>(null);
const [insuranceText, setInsuranceText] = useState('');
```

### Persistence Flow
```
trades/deductible change
  ↓
useEffect triggered
  ↓
sessionStorage.setItem('scopeData', JSON.stringify({trades, deductible}))
  ↓
On mount: sessionStorage.getItem('scopeData')
  ↓
Parse and restore state
```

---

## Claude System Prompt (Key Elements)

The `/api/parse-scope/route.ts` includes a detailed system prompt that instructs Claude to:

1. **Read everything** - "Read the ENTIRE document carefully - do not skip any sections"
2. **Extract completely** - "Extract EVERY SINGLE line item, no matter how small"
3. **Identify trades** - Lists common categories (Roofing, Gutters, Siding, Windows, Painting, etc.)
4. **Parse quantities** - Handle units like SQ, LF, EA, HR
5. **Extract RCV values** - Parse dollar amounts from the document
6. **Format JSON** - Provide exact structure with specific field names
7. **Validate** - "DOUBLE-CHECK before returning"

This prompt is critical for accuracy. It's ~150 lines and highly specific.

---

## UI Component Hierarchy

```
Root (layout.tsx)
└── Home (page.tsx)
    ├── Mode Switcher (Job Summary vs Scope Builder)
    └── ScopeBuilderView
        ├── Card (Input Section)
        │   ├── Textarea
        │   ├── Input (file)
        │   └── Button (Parse)
        │
        └── Card (Scope Breakdown)
            ├── Trade[] (map)
            │   ├── Checkbox
            │   ├── Trade Details
            │   ├── Supplement Section
            │   │   ├── Input[] (supplement fields)
            │   │   └── Button (Add/Remove)
            │   │
            │   └── LineItem[] (map)
            │       ├── Checkbox
            │       ├── Item Display
            │       └── Textarea (Notes)
            │
            └── Summary Section
                ├── Calculations
                ├── Deductible Input
                └── Button (Finalize)

Finalize (finalize/page.tsx)
├── Work Display Sections
├── Totals Summary
└── Signature Canvas
    ├── Canvas (drawing)
    ├── Input (name, date)
    └── Button (Submit)
```

---

## Styling System

### Tailwind CSS Features Used
- CSS Variables for theming
- Dark mode support
- Responsive grid layouts
- Rounded corners and shadows
- Transitions and animations
- Flex layouts

### Color Palette
```
Primary:       Main action color
Secondary:     Secondary actions
Accent:        Highlights and emphasis
Muted:         Disabled/secondary text
Destructive:   Delete/warning actions
Card:          Container backgrounds
Border:        Dividing lines
Ring:          Focus states
```

### Component Styling
- Button: CVA with variants (default, outline, ghost, destructive)
- Card: Container with header, content, footer sections
- Input/Textarea: Form controls with validation states
- Label: Accessible form labels

---

## Error Handling Strategy

### PDF Extraction Errors
```
PDF unreadable? 
  → Offer text input alternative
  → Show: "Please try pasting the text directly instead"
```

### API Errors
```
JSON parse error?
  → Show: "Unable to parse the AI response. Please try again"

Rate limited (429)?
  → Show: "API rate limit reached. Please wait and try again"

Missing data?
  → Validate trades array exists
  → Check for line items
  → Alert: "Invalid data format received"
```

### Validation
```
No file/text?
  → Show: "Please upload a PDF file" or "Please enter agreement text"

No signature on finalize?
  → Disable submit button
  → Show: "Sign above using your mouse or touch screen"

No customer name?
  → Disable submit button
```

---

## Performance Considerations

### Optimizations
- Lazy rendering of large trade lists
- Expandable/collapsible sections to reduce DOM size
- SessionStorage for persistence (lightweight)
- Efficient state updates with functional setState

### Potential Issues
- Many line items = large DOM tree
- PDF extraction can be slow for large documents
- Canvas drawing on touch devices needs `touchAction: none`

---

## Deployment Checklist

For standalone app:

1. Environment setup
   - [ ] Create `.env.local` with ANTHROPIC_API_KEY
   - [ ] Verify API key has sufficient credits

2. Dependencies
   - [ ] npm install (all packages)
   - [ ] Verify pdf-parse-fork is installed
   - [ ] Check Tailwind CSS builds correctly

3. Configuration
   - [ ] Next.js config adequate for your use case
   - [ ] PostCSS pipeline set up
   - [ ] TypeScript builds without errors

4. Testing
   - [ ] Test PDF upload
   - [ ] Test text input
   - [ ] Test parsing with sample documents
   - [ ] Test selections and calculations
   - [ ] Test signature on desktop and mobile

5. Production
   - [ ] Build: `npm run build`
   - [ ] Test build: `npm start`
   - [ ] Deploy to Vercel/hosting platform
   - [ ] Set environment variables on platform

---

## File Size Reference

```
/app/page.tsx              ~1000+ lines (includes both features)
/app/api/parse-scope/route.ts  ~150 lines
/app/finalize/page.tsx     ~300+ lines
/app/globals.css           ~122 lines
All UI components          ~500 lines combined
Config files               ~200 lines combined
```

**Total for scope builder: ~2200+ lines of code (excluding job summary)**

---

## Next.js App Router Structure

```
app/
├── layout.tsx          → Root layout (HTML, fonts, metadata)
├── page.tsx            → "/" route (Home with scope builder)
├── globals.css         → Global styles
│
├── api/
│   └── parse-scope/
│       └── route.ts    → POST /api/parse-scope
│
└── finalize/
    └── page.tsx        → "/finalize" route
```

---

## Important Notes

1. **Anthropic API Key Required** - App won't work without valid key
2. **PDF Extraction** - Uses pdf-parse-fork fork (not standard pdf-parse)
3. **SessionStorage** - Browser-only, not suitable for shared data
4. **Signature** - Canvas drawing, stored as data URL (not truly secure)
5. **TypeScript** - Strict mode enabled, requires proper typing
6. **Shadcn UI** - Uses Radix UI primitives, requires proper setup

---

## Extension Ideas

### Features to Add
- Export scope to PDF
- Email final agreement
- Document history/archiving
- Multi-user support
- Backend data persistence
- OCR for scanned documents
- Compare multiple documents
- Template system

### Integrations
- Payment processing (deposits)
- CRM integration
- Email service
- Cloud storage
- Authentication system
- Analytics

---

## Document References

Three detailed documents have been created:

1. **SCOPE_BUILDER_ANALYSIS.md** - Complete technical analysis
2. **SCOPE_BUILDER_EXTRACTION_GUIDE.md** - Code snippets and extraction guide
3. **SCOPE_BUILDER_SUMMARY.md** - This file, quick reference

Start with this summary, then refer to the other docs for detailed implementation.

