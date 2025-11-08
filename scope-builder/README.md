# Scope Builder

An AI-powered insurance document parser for construction scope extraction built with Next.js 15 and Claude AI.

## Overview

Scope Builder helps construction companies quickly extract and organize scope items from insurance documents. It uses Claude AI to parse insurance documents (PDFs or text) and automatically categorizes line items by trade with RCV (Replacement Cost Value) amounts.

### Key Features

- **PDF & Text Input**: Upload PDF documents or paste text directly
- **AI-Powered Parsing**: Uses Claude Sonnet 4.5 to intelligently extract scope items
- **Trade Categorization**: Automatically organizes items by trade (Roofing, Gutters, Siding, etc.)
- **Line Item Management**: Select/deselect items, add notes, and customize descriptions
- **Supplements**: Add custom line items and supplements for incomplete quotes
- **Deductible Tracking**: Automatically calculates insurance vs. homeowner payment split
- **Session Persistence**: Auto-saves your work to browser session storage
- **Responsive Design**: Works great on desktop and tablet

## Tech Stack

- **Frontend**: React 19, Next.js 15
- **TypeScript**: Full type safety
- **Styling**: Tailwind CSS v4 + Shadcn UI
- **UI Components**: Radix UI
- **AI**: Anthropic Claude API (claude-sonnet-4-5-20250929)
- **PDF Processing**: pdf-parse-fork
- **Icons**: Lucide React

## Installation

### Prerequisites

- Node.js 18.0 or higher
- npm or yarn package manager
- Anthropic API key (get one at [console.anthropic.com](https://console.anthropic.com))

### Setup Steps

1. **Clone or extract the project**
   ```bash
   cd scope-builder
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env.local
   ```

   Then edit `.env.local` and add your Anthropic API key:
   ```
   ANTHROPIC_API_KEY=your_api_key_here
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open in browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Usage

### Basic Workflow

1. **Upload Document**
   - Choose between uploading a PDF or pasting text
   - Upload an insurance document or policy document

2. **Parse Document**
   - Click "Parse Document" button
   - Wait for AI to extract and organize scope items
   - Items are automatically categorized by trade

3. **Review & Edit**
   - Check all line items for accuracy
   - Expand items to add notes
   - Toggle items on/off to include/exclude from scope

4. **Add Supplements**
   - Click expand button on each trade to add supplements
   - Add custom items not found in the original document
   - Each supplement can have quantity and amount

5. **Calculate Totals**
   - View total RCV (Replacement Cost Value)
   - Enter deductible amount
   - See split between insurance and homeowner payment

### File Structure

```
scope-builder/
├── app/
│   ├── api/
│   │   └── parse-scope/
│   │       └── route.ts          # API endpoint for document parsing
│   ├── layout.tsx                # Root layout with metadata
│   ├── globals.css               # Tailwind CSS styles
│   └── page.tsx                  # Main app page
├── components/
│   └── ui/
│       ├── button.tsx            # Button component
│       ├── card.tsx              # Card component
│       ├── input.tsx             # Input component
│       ├── label.tsx             # Label component
│       └── textarea.tsx          # Textarea component
├── lib/
│   └── utils.ts                  # Utility functions (cn helper)
├── .env.example                  # Environment variables template
├── package.json                  # Dependencies
├── tsconfig.json                 # TypeScript config
├── next.config.ts                # Next.js config
├── tailwind.config.ts            # Tailwind config
├── components.json               # Shadcn config
└── README.md                     # This file
```

## API Documentation

### POST `/api/parse-scope`

Parses an insurance document and extracts scope items.

**Request:**
- Form data with either:
  - `file`: PDF file (application/pdf)
  - `text`: Plain text content

**Response:**
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
          "description": "Install GAF Timberline shingles",
          "rcv": 8500,
          "checked": true,
          "notes": ""
        }
      ]
    }
  ]
}
```

## Data Persistence

The app uses browser session storage (`sessionStorage`) to save your work. Data is automatically saved when you:
- Parse a document
- Update line items
- Add/remove supplements
- Change the deductible

**Note**: Session data is cleared when the browser tab is closed.

## Environment Variables

Required:
- `ANTHROPIC_API_KEY` - Your Anthropic API key

Optional:
- `ANTHROPIC_BASE_URL` - Custom API endpoint (defaults to https://api.anthropic.com)

## AI Parsing Details

The app uses Claude Sonnet 4.5 with the following specifications:
- **Model**: `claude-sonnet-4-5-20250929`
- **Max Tokens**: 8,192
- **System Prompt**: Detailed instructions for insurance document parsing

The system prompt ensures:
- All line items are extracted (including small items)
- Items are properly categorized by trade
- RCV values are accurately captured
- Quantities and units are preserved
- Supplemental items are identified

## Common Issues & Solutions

### "No text could be extracted from the PDF"
- The PDF may be scanned/image-based
- Solution: Use the "Paste Text" option instead and manually paste the content

### "API rate limit reached"
- Too many requests to Anthropic API
- Solution: Wait a few moments and try again

### Data not loading after refresh
- Session storage is cleared when tab closes
- Solution: Keep the tab open or implement persistent storage

### UI Components not rendering
- Missing dependencies
- Solution: Run `npm install` again to ensure all shadcn components are installed

## Development

### Adding New Components

This project uses shadcn/ui. To add new components:

```bash
npx shadcn-ui@latest add [component-name]
```

### Building for Production

```bash
npm run build
npm start
```

### TypeScript

Full TypeScript support is included. Type definitions are in `.d.ts` files and interfaces.

## Customization

### Changing Trade Categories

Edit the SYSTEM_PROMPT in `/app/api/parse-scope/route.ts` to modify which trade categories are recognized.

### Styling

- Tailwind CSS configuration in `tailwind.config.ts`
- CSS variables in `app/globals.css`
- Component styles use Shadcn UI with Tailwind classes

### Model Settings

To use a different Claude model, update the `model` field in `/app/api/parse-scope/route.ts`:

```typescript
const message = await anthropic.messages.create({
  model: 'your-preferred-model',  // Change this
  max_tokens: 8192,
  // ...
});
```

## Performance Tips

- Keep PDF files under 10 MB for faster parsing
- Complex documents may take 10-30 seconds to parse
- Consider splitting very large documents into sections

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers supported

## Security Considerations

- API keys are stored in environment variables only
- Document data is processed server-side
- Session data is stored locally in browser
- No data is logged or persisted to external databases

## Troubleshooting

### Check Logs

Server errors are logged to console. Check:
1. Browser console (F12 → Console tab) for client errors
2. Terminal output where you ran `npm run dev` for server errors

### Verify API Key

Ensure your Anthropic API key is:
1. Correctly set in `.env.local`
2. Active and has sufficient credits
3. Not accidentally committed to git

### Clear Cache

If experiencing issues:
```bash
rm -rf .next/
npm run dev
```

## Contributing

To extend this app:

1. **Add new trades**: Modify the system prompt in `route.ts`
2. **Enhance UI**: Add new shadcn components
3. **Custom parsing**: Create specialized parsing endpoints

## License

Private project. For authorized users only.

## Support

For issues or questions, refer to:
- [Anthropic Documentation](https://docs.anthropic.com)
- [Next.js Documentation](https://nextjs.org/docs)
- [Shadcn UI Documentation](https://ui.shadcn.com)

---

**Version**: 1.0.0
**Last Updated**: 2025-01-06
