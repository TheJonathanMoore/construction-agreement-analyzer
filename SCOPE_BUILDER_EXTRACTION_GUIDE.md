# Scope Builder Extraction Guide

## Quick Reference - Files to Extract

### ESSENTIAL FILES (Scope Builder Core)

#### Pages & Views
- `/app/page.tsx` - MAIN: ScopeBuilderView + Home component
- `/app/finalize/page.tsx` - Signature & finalization page
- `/app/layout.tsx` - Root layout wrapper

#### API Routes
- `/app/api/parse-scope/route.ts` - Document parsing with Claude AI

#### UI Components
- `/components/ui/button.tsx`
- `/components/ui/card.tsx`
- `/components/ui/input.tsx`
- `/components/ui/label.tsx`
- `/components/ui/textarea.tsx`

#### Utilities
- `/lib/utils.ts` - Class name merger (cn function)
- `/types/pdf-parse-fork.d.ts` - TypeScript definitions

#### Configuration
- `package.json`
- `tsconfig.json`
- `next.config.ts`
- `components.json` (Shadcn config)
- `postcss.config.mjs`

#### Styling
- `/app/globals.css`

#### Environment
- `.env.example`

---

## DETAILED CODE SNIPPETS

### Core TypeScript Interfaces (from /app/page.tsx)

```typescript
interface LineItem {
  id: string;
  quantity: string;
  description: string;
  rcv: number;
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
  name: string;
  checked: boolean;
  supplements: SupplementItem[];
  lineItems: LineItem[];
}

type AppMode = 'job-summary' | 'scope-builder';
```

### Claude System Prompt (from /app/api/parse-scope/route.ts)

The system prompt is 150+ lines and includes:
- Instructions to read ENTIRE document
- Extract EVERY single line item
- Common trade categories (Roofing, Gutters, Siding, Windows, Painting, Decking, Fencing, Miscellaneous)
- Quantity formats (LF, SQ, EA, HR)
- RCV value extraction rules
- JSON output structure requirements
- CRITICAL emphasis on completeness

---

## SCOPE BUILDER COMPONENT FLOW

```
Home (page.tsx)
├── Mode Switch: job-summary vs scope-builder
└── ScopeBuilderView
    ├── Left Panel: Input Section
    │   ├── File/Text Toggle
    │   ├── File Input (PDF) or Textarea (Text)
    │   ├── Error Display
    │   └── "Parse Document" Button
    │       └── POST /api/parse-scope
    │
    └── Right Panel: Scope Breakdown
        ├── Trade List (with checkboxes)
        │   ├── Trade Header
        │   ├── Supplements Section (expandable)
        │   │   ├── Add Supplement Button
        │   │   └── Supplement Items
        │   │
        │   └── Line Items
        │       ├── Checkbox + Quantity + Description + RCV
        │       └── Notes (expandable)
        │
        ├── Calculations Section
        │   ├── Pending Supplements Total
        │   ├── Total RCV
        │   ├── Deductible Input
        │   ├── Insurance Will Pay
        │   └── Homeowner Pays
        │
        ├── "Clear All" Button
        └── "Finalize & Sign" Button
            └── Navigate to /finalize
```

---

## SESSION STORAGE USAGE

```javascript
// Save (auto-saved on trades/deductible change)
sessionStorage.setItem('scopeData', JSON.stringify({ 
  trades, 
  deductible 
}));

// Load (in ScopeBuilderView useEffect)
const storedData = sessionStorage.getItem('scopeData');
if (storedData) {
  const parsed = JSON.parse(storedData);
  setTrades(parsed.trades || []);
  setDeductible(parsed.deductible || 0);
}
```

---

## API RESPONSE STRUCTURE

```json
{
  "trades": [
    {
      "id": "trade-1",
      "name": "Roofing",
      "checked": true,
      "supplements": [],
      "lineItems": [
        {
          "id": "item-1",
          "quantity": "45 SQ",
          "description": "Install GAF Timberline HDZ shingles - Weathered Wood",
          "rcv": 8500.00,
          "checked": true,
          "notes": ""
        },
        {
          "id": "item-2",
          "quantity": "1 EA",
          "description": "Tear off existing shingles",
          "rcv": 2500.00,
          "checked": true,
          "notes": ""
        }
      ]
    },
    {
      "id": "trade-2",
      "name": "Gutters & Downspouts",
      "checked": true,
      "supplements": [],
      "lineItems": [
        {
          "id": "item-3",
          "quantity": "120 LF",
          "description": "Replace 5 inch K-style aluminum gutters - White",
          "rcv": 1200.00,
          "checked": true,
          "notes": ""
        }
      ]
    }
  ]
}
```

---

## KEY HANDLER FUNCTIONS IN SCOPEBUILDER

```typescript
// Parse document from API
const handleParse = async () => {
  const formData = new FormData();
  if (inputMode === 'file' && file) {
    formData.append('file', file);
  } else {
    formData.append('text', insuranceText);
  }
  const response = await fetch('/api/parse-scope', {
    method: 'POST',
    body: formData,
  });
  // Parse and set trades
}

// Toggle entire trade (checks/unchecks all items)
const toggleTrade = (tradeId: string) => {
  setTrades((prevTrades) =>
    prevTrades.map((trade) => {
      if (trade.id === tradeId) {
        return {
          ...trade,
          checked: !trade.checked,
          lineItems: trade.lineItems.map((item) => ({
            ...item,
            checked: !trade.checked,
          })),
        };
      }
      return trade;
    })
  );
};

// Add custom supplement
const addSupplement = (tradeId: string) => {
  setTrades((prevTrades) =>
    prevTrades.map((trade) => {
      if (trade.id === tradeId) {
        return {
          ...trade,
          supplements: [
            ...trade.supplements,
            {
              id: `supp-${Date.now()}`,
              title: '',
              quantity: '',
              amount: 0,
            },
          ],
        };
      }
      return trade;
    })
  );
};

// Calculate totals across all selected items
const calculateTotals = () => {
  let totalRcv = 0;
  const tradeTotals: { [key: string]: number } = {};

  trades.forEach((trade) => {
    let tradeTotal = 0;
    trade.lineItems.forEach((item) => {
      if (item.checked) {
        tradeTotal += item.rcv;
      }
    });
    trade.supplements.forEach((supp) => {
      tradeTotal += supp.amount;
    });
    tradeTotals[trade.name] = tradeTotal;
    totalRcv += tradeTotal;
  });

  return { totalRcv, tradeTotals };
};
```

---

## FINALIZE PAGE KEY FUNCTIONS

```typescript
// Canvas drawing for signature
const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
  setIsDrawing(true);
  const ctx = canvasRef.current?.getContext('2d');
  const rect = canvasRef.current?.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  ctx?.beginPath();
  ctx?.moveTo(x, y);
};

const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
  if (!isDrawing) return;
  const ctx = canvasRef.current?.getContext('2d');
  const rect = canvasRef.current?.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  ctx?.lineTo(x, y);
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 2;
  ctx?.stroke();
};

const stopDrawing = () => {
  setIsDrawing(false);
  const canvas = canvasRef.current;
  if (canvas) {
    setSignature(canvas.toDataURL());
  }
};

// Load data from session storage
useEffect(() => {
  const storedData = sessionStorage.getItem('scopeData');
  if (storedData) {
    const parsed = JSON.parse(storedData);
    if (Array.isArray(parsed)) {
      setTrades(parsed);
    } else {
      setTrades(parsed.trades || []);
      setDeductible(parsed.deductible || 0);
    }
  }
}, []);
```

---

## DEPENDENCY TREE FOR SCOPE BUILDER

```
next@15.5.4
├── react@19.1.0
│   └── react-dom@19.1.0
│
Anthropic SDK
├── @anthropic-ai/sdk@^0.65.0
│
PDF Processing
├── pdf-parse-fork@^1.2.0
│
UI Library
├── @radix-ui/react-label@^2.1.7
├── @radix-ui/react-slot@^1.2.3
├── class-variance-authority@^0.7.1
├── clsx@^2.1.1
├── lucide-react@^0.545.0 (optional - icons)
│
Styling
├── tailwindcss@^4
├── tailwind-merge@^3.3.1
├── @tailwindcss/postcss@^4
├── tw-animate-css@^1.4.0 (optional - animations)
│
Dev Tools
├── typescript@^5
```

---

## IMPORTANT IMPLEMENTATION DETAILS

### PDF Extraction Flow
```
User selects PDF file
    ↓
File converted to ArrayBuffer
    ↓
Buffer sent to pdf-parse-fork
    ↓
Text extracted from PDF
    ↓
Text + system prompt sent to Claude
    ↓
JSON response with trades
    ↓
Markdown code blocks removed
    ↓
Parsed and set to state
```

### Error Handling Strategy
- PDF extraction error? Suggest text input
- JSON parsing error? Show user-friendly message
- Rate limit hit? Detect 429 status
- Missing data? Validate trades array exists

### Accessibility Features
- Checkboxes for all selections
- Labels linked to inputs
- ARIA attributes for validation
- Touch support on canvas signature
- Keyboard navigation support

---

## ENVIRONMENTAL SETUP FOR STANDALONE APP

1. Create `.env.local` with:
   ```
   ANTHROPIC_API_KEY=sk-ant-...
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Build:
   ```
   npm run build
   ```

4. Dev server:
   ```
   npm run dev -- --turbopack
   ```

---

## DATA PERSISTENCE STRATEGY

Current: Browser sessionStorage
- Persists across page reloads
- Cleared when browser tab closes
- Lives in browser memory only

For Production Consider:
- IndexedDB for larger data
- Backend API with user authentication
- Cloud storage (Firebase, etc.)
- Local database (SQLite via wasm)

---

## STYLING SYSTEM OVERVIEW

```
globals.css (122 lines)
    ↓
Tailwind v4 imports
    ↓
Custom CSS variables for theme
    ↓
Dark mode support
    ↓
Component-level Tailwind classes
    ↓
CVA for Button variants
    ↓
Final styled component
```

**Theme Colors Used:**
- primary/primary-foreground
- secondary/secondary-foreground
- accent/accent-foreground
- muted/muted-foreground
- destructive
- card/card-foreground
- background/foreground
- border, ring, input

---

## CLAUDE PROMPT STRATEGY

The `/api/parse-scope/route.ts` uses a highly detailed system prompt (~150 lines) that:

1. Sets expert role
2. Lists ALL trade categories
3. Specifies line item requirements
4. Defines unit formats
5. Explains RCV extraction
6. Shows JSON output format
7. Provides parsing guidelines
8. Emphasizes completeness
9. Includes double-check reminder

This is critical for accurate extraction. If modifying:
- Keep completeness emphasis
- List all expected trade types
- Show exact JSON structure
- Test with sample documents

---

## NEXT STEPS FOR STANDALONE APP

1. **Extract** only scope builder files
2. **Remove** JobSummaryView and analyze API
3. **Simplify** Home component - make ScopeBuilderView the main page
4. **Update** README to focus on scope building
5. **Test** with various insurance documents
6. **Consider** backend integration for:
   - Data persistence
   - User authentication
   - Document history
   - Multiple user support
7. **Enhance** UI with:
   - Better error messages
   - Loading states
   - Export to PDF
   - Email integration

