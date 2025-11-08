# Scope Builder Documentation - Complete Package

## What You Have

Four comprehensive documentation files have been created to help you understand and extract the Scope Builder functionality from the Job Summary Generator application.

### Files Created

1. **SCOPE_BUILDER_INDEX.md** (349 lines) - START HERE
   - Navigation guide for all documentation
   - Quick reference for all key information
   - FAQ about common questions
   - Reading path recommendations

2. **SCOPE_BUILDER_SUMMARY.md** (483 lines) - QUICK OVERVIEW
   - 5-minute summary of what it does
   - File inventory (19 files to extract)
   - Technology stack
   - User flow diagram
   - Deployment checklist

3. **SCOPE_BUILDER_ANALYSIS.md** (547 lines) - DETAILED REFERENCE
   - Complete project structure
   - File-by-file breakdown
   - Component analysis
   - API documentation
   - State management patterns
   - Extraction checklist

4. **SCOPE_BUILDER_EXTRACTION_GUIDE.md** (507 lines) - CODE SNIPPETS
   - Copy-paste ready code examples
   - TypeScript interfaces
   - Handler functions
   - Canvas drawing code
   - Dependency tree

**Total:** 1,886 lines of documentation (46KB)

---

## How to Use These Documents

### If you have 10 minutes
1. Read: SCOPE_BUILDER_INDEX.md (5 min)
2. Skim: SCOPE_BUILDER_SUMMARY.md "Quick Overview" section (5 min)

### If you have 30 minutes
1. Read: SCOPE_BUILDER_INDEX.md (5 min)
2. Read: SCOPE_BUILDER_SUMMARY.md (15 min)
3. Review: SCOPE_BUILDER_EXTRACTION_GUIDE.md "Quick Reference" (10 min)

### If you have 1-2 hours
1. Read: SCOPE_BUILDER_SUMMARY.md (20 min)
2. Study: SCOPE_BUILDER_ANALYSIS.md (40 min)
3. Reference: SCOPE_BUILDER_EXTRACTION_GUIDE.md (20 min)
4. Review: Actual source files (20 min)

### If you're extracting
1. Open: SCOPE_BUILDER_EXTRACTION_GUIDE.md for file list
2. Reference: SCOPE_BUILDER_ANALYSIS.md for file paths
3. Use: SCOPE_BUILDER_SUMMARY.md as checklist

---

## The Scope Builder at a Glance

### What It Does
- Users upload insurance documents (PDF or text)
- Claude AI parses and extracts scope items by trade
- Interactive UI for selecting/deselecting items
- Custom supplements can be added
- RCV calculations and deductible tracking
- Digital signature capture
- Final scope agreement generation

### Core Technology
- Next.js 15 (React framework)
- TypeScript (type safety)
- Shadcn UI + Tailwind CSS (styling)
- Anthropic Claude SDK (AI)
- pdf-parse-fork (PDF extraction)
- HTML5 Canvas (signature)

### Key Files (Extract These 19)

**Pages (3):**
- `/app/page.tsx` - Main ScopeBuilderView
- `/app/layout.tsx` - Root layout
- `/app/finalize/page.tsx` - Signature page

**API (1):**
- `/app/api/parse-scope/route.ts` - Document parsing

**Components (5):**
- `/components/ui/button.tsx`
- `/components/ui/card.tsx`
- `/components/ui/input.tsx`
- `/components/ui/label.tsx`
- `/components/ui/textarea.tsx`

**Config (7):**
- `package.json`
- `tsconfig.json`
- `next.config.ts`
- `components.json`
- `postcss.config.mjs`
- `.env.example`
- `README.md`

**Utilities (3):**
- `/lib/utils.ts`
- `/types/pdf-parse-fork.d.ts`
- `/app/globals.css`

---

## Core Data Flow

```
1. USER UPLOADS DOCUMENT (PDF or text)
                 ↓
2. PARSE DOCUMENT BUTTON
   → POST /api/parse-scope
                 ↓
3. CLAUDE AI EXTRACTION
   → Reads system prompt
   → Extracts all items
   → Organizes by trade
   → Returns JSON
                 ↓
4. SCOPEBUILDER VIEW
   → Displays trades
   → Shows line items
   → Allows selection
   → SessionStorage save
                 ↓
5. FINALIZE PAGE
   → Review selections
   → Add signature
   → Display totals
   → Submit
```

---

## Features Overview

### Input Phase
- File upload (PDF)
- Text paste (insurance document)
- Error handling with fallback

### Parsing Phase
- Claude AI integration
- Trade categorization (Roofing, Gutters, Siding, Windows, etc.)
- RCV value extraction
- JSON structured output

### Selection Phase
- Checkbox-based trade selection
- Checkbox-based line item selection
- Supplement management (add custom items)
- Notes per item
- Auto-save to sessionStorage

### Calculation Phase
- Real-time RCV totals
- Per-trade totals
- Supplement tracking
- Deductible calculation
- Insurance vs homeowner split

### Finalization Phase
- Work to complete display
- Work not included display
- Supplements display
- Digital signature canvas
- Customer information
- Final agreement generation

---

## Dependencies

### Required Runtime
```
@anthropic-ai/sdk@^0.65.0    # Claude API
pdf-parse-fork@^1.2.0         # PDF parsing
next@15.5.4                   # Framework
react@19.1.0                  # UI library
react-dom@19.1.0              # DOM rendering
```

### Required Styling
```
tailwindcss@^4                # Styling engine
@tailwindcss/postcss@^4       # PostCSS plugin
tailwind-merge@^3.3.1         # Class merging
```

### Required Components
```
@radix-ui/react-label@^2.1.7  # Form labels
@radix-ui/react-slot@^1.2.3   # Component slots
class-variance-authority@^0.7.1 # Component variants
clsx@^2.1.1                   # Class name utility
```

### Optional
```
lucide-react@^0.545.0         # Icons (if needed)
tw-animate-css@^1.4.0         # Animations
```

### Dev Tools
```
typescript@^5                 # Type checking
eslint@^9                     # Linting
```

---

## Environment Setup

1. Create `.env.local` in project root
2. Add: `ANTHROPIC_API_KEY=sk-ant-...`
3. Get API key from: https://console.anthropic.com/

---

## API Endpoint

**POST /api/parse-scope**

Request:
- Content-Type: multipart/form-data
- Either: file (PDF) OR text (document text)

Response:
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
          "description": "Install shingles",
          "rcv": 8500,
          "checked": true,
          "notes": ""
        }
      ]
    }
  ]
}
```

---

## Important Implementation Details

### State Management
- React hooks (useState, useEffect)
- Functional state updates
- sessionStorage for persistence
- Auto-save on every change

### Component Structure
- Shadcn UI for all components
- CVA (class-variance-authority) for variants
- Tailwind CSS for styling
- Responsive grid layout

### PDF Handling
- pdf-parse-fork for text extraction
- Fallback to text input if PDF fails
- Error messages guide user

### Claude Integration
- Detailed system prompt (150+ lines)
- Model: claude-sonnet-4-5-20250929
- Max tokens: 8192
- JSON validation

### Signature Canvas
- HTML5 Canvas API
- Mouse and touch support
- Data URL for storage
- Clear button functionality

---

## Document Map

```
SCOPE_BUILDER_INDEX.md ← Start here for navigation
    ├─→ SCOPE_BUILDER_SUMMARY.md (quick overview)
    ├─→ SCOPE_BUILDER_ANALYSIS.md (detailed reference)
    └─→ SCOPE_BUILDER_EXTRACTION_GUIDE.md (code snippets)

Each document is self-contained but cross-referenced
```

---

## What's Not Included

The following are part of the larger app but NOT part of Scope Builder:

- Job Summary Generator feature
- `/api/analyze` route
- JobSummaryView component
- Construction-analyzer folder
- Job summary specific code

These should be removed if creating a standalone scope builder app.

---

## Next Steps

1. **Read:** SCOPE_BUILDER_INDEX.md
2. **Review:** File inventory in SCOPE_BUILDER_SUMMARY.md
3. **Study:** SCOPE_BUILDER_ANALYSIS.md for understanding
4. **Extract:** Copy files listed in SCOPE_BUILDER_EXTRACTION_GUIDE.md
5. **Modify:** Remove job summary features from page.tsx
6. **Configure:** Set up environment variables
7. **Test:** With sample insurance documents
8. **Deploy:** Using deployment checklist

---

## Quick Reference

### Files to Extract: 19
### Total Lines of Code: ~2,300
### Documentation Lines: 1,886
### Code Examples: 20+
### Key Endpoints: 1 (`/api/parse-scope`)
### Pages: 3 (`/`, `/finalize`, `/api/parse-scope`)
### Main Dependencies: 7
### Configuration Files: 6

---

## Questions?

Refer to the FAQ section in **SCOPE_BUILDER_INDEX.md** for answers to common questions about:
- Removing job summary feature
- AI API integration
- Data persistence
- Signature security
- Deployment options

---

## Document Info

Created: November 6, 2025
Size: 46KB across 4 files
Format: Markdown
Language: English
Audience: Developers, Technical Leads, Project Managers

All documents are located in the project root directory and ready for reference during extraction and implementation.

