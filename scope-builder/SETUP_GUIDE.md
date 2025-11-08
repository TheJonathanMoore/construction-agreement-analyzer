# Scope Builder - Quick Start Guide

## What You Have

A complete, standalone scope builder application extracted from your construction agreement analyzer. This is a production-ready Next.js application ready to deploy.

## Files Included

### Configuration Files
- `package.json` - Dependencies and scripts
- `tsconfig.json` - TypeScript configuration
- `next.config.ts` - Next.js configuration
- `tailwind.config.ts` - Tailwind CSS (auto-generated)
- `components.json` - Shadcn UI configuration
- `eslint.config.mjs` - ESLint configuration
- `.env.example` - Environment variables template

### Application Files
- `app/layout.tsx` - Root layout wrapper
- `app/page.tsx` - Main scope builder UI (~700 lines)
- `app/globals.css` - Tailwind CSS styles
- `app/api/parse-scope/route.ts` - AI parsing API endpoint

### Components
- `components/ui/button.tsx` - Button component
- `components/ui/card.tsx` - Card component
- `components/ui/input.tsx` - Input component
- `components/ui/label.tsx` - Label component
- `components/ui/textarea.tsx` - Textarea component

### Utilities
- `lib/utils.ts` - Helper functions (cn utility)

## Quick Start (5 Minutes)

### Step 1: Get Your API Key
1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Create account or sign in
3. Get your API key from settings

### Step 2: Configure Environment
```bash
cd scope-builder
cp .env.example .env.local
# Edit .env.local and add your API key
```

### Step 3: Install & Run
```bash
npm install
npm run dev
```

Open http://localhost:3000 in your browser!

## How It Works

1. **User uploads insurance document** (PDF or text)
2. **AI parsing API** (`/api/parse-scope`) sends to Claude
3. **Claude extracts** scope items and categorizes by trade
4. **UI displays** organized breakdown with checkboxes
5. **User customizes** items, adds supplements, calculates totals
6. **Data persists** in browser session storage

## Key Features You Get

✅ AI-powered document parsing
✅ Trade categorization (Roofing, Gutters, Siding, etc.)
✅ Line item selection with RCV tracking
✅ Custom supplement addition
✅ Deductible calculation
✅ Automatic session saving
✅ Professional UI with Tailwind CSS

## Dependencies (Auto-installed)

- **Next.js 15.5.4** - React framework
- **React 19.1.0** - UI library
- **TypeScript 5** - Type safety
- **Tailwind CSS 4** - Styling
- **Shadcn UI** - Component library
- **Anthropic SDK** - Claude AI integration
- **pdf-parse-fork** - PDF text extraction

## File Connections

```
User uploads document
    ↓
page.tsx (handleParse)
    ↓
/api/parse-scope/route.ts (Claude AI)
    ↓
Returns JSON with trades & lineItems
    ↓
page.tsx (setTrades state)
    ↓
UI renders with Shadcn components
    ↓
sessionStorage saves data
```

## Customization Points

### Change AI Model
Edit `app/api/parse-scope/route.ts`:
```typescript
model: 'your-model-name',  // Line 136
```

### Add More Trades
Edit SYSTEM_PROMPT in `app/api/parse-scope/route.ts` (line 9-100)

### Modify Styles
- Edit `app/globals.css` for color scheme
- Edit component files in `components/ui/` for styling

### Change Max Tokens
Edit in `app/api/parse-scope/route.ts`:
```typescript
max_tokens: 8192,  // Change this number
```

## Deployment

### Vercel (Recommended)
```bash
git init
git add .
git commit -m "Initial scope builder"
npm install -g vercel
vercel
```

### Self-Hosted
```bash
npm run build
npm start
```

## Testing

### Test Parsing
1. Copy sample insurance document text
2. Go to app
3. Select "Paste Text" mode
4. Paste sample text
5. Click "Parse Document"
6. Should extract trades and line items

### Test UI
- Toggle trades on/off
- Toggle line items
- Add supplements
- Change deductible
- Data should persist when you reload

## Environment Variables Reference

**Required:**
- `ANTHROPIC_API_KEY` - Your API key from Anthropic

**Optional:**
- `ANTHROPIC_BASE_URL` - Custom API endpoint

## Common Tasks

### Use Different Claude Model
Change line 136 in `app/api/parse-scope/route.ts`

### Extract Different Data
Modify system prompt (lines 9-100 in `app/api/parse-scope/route.ts`)

### Add New Trade Categories
Add to system prompt trade list (lines 15-23 in route.ts)

### Change UI Colors
Edit CSS variables in `app/globals.css` (lines 46-113)

### Add More Components
```bash
npx shadcn-ui@latest add [component]
```

## Security Notes

- API key should NEVER be in git (use .env.local)
- Document data processed server-side only
- Session data stored only in browser
- No external logging or persistence

## Troubleshooting

**"Cannot find module"**
→ Run `npm install`

**"ANTHROPIC_API_KEY not found"**
→ Check .env.local file has your key

**"PDF extraction failed"**
→ Use Paste Text mode instead

**Port 3000 in use**
→ Run `npm run dev -- -p 3001`

## Next Steps

1. ✅ Configure .env.local with API key
2. ✅ Run `npm install && npm run dev`
3. ✅ Test with sample insurance document
4. ✅ Customize UI/trades as needed
5. ✅ Deploy to Vercel or self-hosted server

## Support Resources

- **Anthropic Docs**: https://docs.anthropic.com
- **Next.js Docs**: https://nextjs.org/docs
- **Shadcn UI**: https://ui.shadcn.com
- **Tailwind CSS**: https://tailwindcss.com

---

You now have a complete, self-contained scope builder application! It's ready to run locally or deploy to production.
