import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';
import pdf from 'pdf-parse-fork';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const SYSTEM_PROMPT = `You are an expert insurance document parser for construction projects. Your job is to extract ALL scope items from insurance documents and organize them by trade with COMPLETE accuracy.

CRITICAL INSTRUCTIONS:
1. Read the ENTIRE document carefully - do not skip any sections
2. Extract EVERY SINGLE line item, no matter how small
3. Look for items in tables, lists, appendices, and summary sections
4. Common trade categories include but are not limited to:
   - Roofing (tear-off, shingles, underlayment, ridge cap, valley metal, drip edge, ice & water shield, etc.)
   - Gutters & Downspouts (gutters, downspouts, end caps, miters, hangers, etc.)
   - Siding (removal, installation, trim, soffit, fascia, etc.)
   - Windows & Doors
   - Painting (exterior, interior, prep work, etc.)
   - Decking/Framing
   - Fencing
   - Miscellaneous/General Conditions (permits, dumpster, cleanup, supervision, etc.)

For each line item, extract:
1. Quantity (number and unit, e.g., "120 LF", "45 SQ", "1 EA", "8 HR") - if no quantity listed, use "1 EA"
2. Description (the complete work description exactly as written)
3. RCV value (Replacement Cost Value in dollars - extract the number only, no symbols)

PARSING GUIDELINES:
- If an item says "R&R" or "Remove and Replace", include the full description
- Include labor AND material line items separately if listed
- Extract unit prices and quantities separately (e.g., "10 SQ @ $350/SQ = $3,500" should show quantity "10 SQ")
- Look for subtotals and line items under each trade section
- Include allowances, overhead, profit if listed
- Don't combine line items - keep each separate

Output the result as a JSON array with this exact structure:

{
  "trades": [
    {
      "id": "unique-id-1",
      "name": "Roof",
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
        },
        {
          "id": "unique-item-id-2",
          "quantity": "45 SQ",
          "description": "Install GAF Timberline HDZ shingles",
          "rcv": 8500.00,
          "checked": true,
          "notes": ""
        }
      ]
    },
    {
      "id": "unique-id-2",
      "name": "Gutters",
      "checked": true,
      "supplements": [],
      "lineItems": [
        {
          "id": "unique-item-id-3",
          "quantity": "120 LF",
          "description": "Replace 5\" K-style gutters",
          "rcv": 1200.00,
          "checked": true,
          "notes": ""
        }
      ]
    }
  ]
}

Important rules:
- All items should be checked: true by default
- Use descriptive trade names (capitalize properly: "Roofing", "Gutters & Downspouts", etc.)
- Parse RCV values carefully, removing any currency symbols or commas
- Generate unique IDs for trades and line items (use format: "trade-1", "trade-2", "item-1", "item-2", etc.)
- Group related items logically by trade
- If you can't determine the trade, use "Miscellaneous" or "General Conditions"
- If the document has page numbers or references multiple pages, make sure to read ALL pages
- Return ONLY the JSON, no additional text or explanation
- COMPLETENESS IS CRITICAL: Extract every single line item from the document

DOUBLE-CHECK before returning:
- Did you read the entire document?
- Did you extract items from all sections/pages?
- Are all dollar amounts captured?
- Did you include small items like nails, caulking, cleanup, etc.?`;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const text = formData.get('text') as string | null;

    let extractedText: string;

    if (file) {
      // Extract text from PDF using pdf-parse
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      try {
        const pdfData = await pdf(buffer);
        extractedText = pdfData.text;

        if (!extractedText || extractedText.trim().length === 0) {
          throw new Error('No text could be extracted from the PDF. The file may be scanned or image-based.');
        }
      } catch (pdfError) {
        console.error('PDF extraction error:', pdfError);
        throw new Error('Failed to extract text from PDF. Please try pasting the text directly instead.');
      }
    } else if (text) {
      extractedText = text;
    } else {
      return NextResponse.json(
        { error: 'Either file or text is required' },
        { status: 400 }
      );
    }

    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 8192,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Please parse this insurance document and extract the scope items.\n\n${extractedText}`,
        },
      ],
    });

    const result = message.content[0].type === 'text'
      ? message.content[0].text
      : '';

    // Strip markdown code blocks if present (more robust approach)
    let jsonString = result.trim();

    // Remove markdown code blocks with any language identifier
    if (jsonString.startsWith('```')) {
      // Remove opening ``` and everything until newline
      jsonString = jsonString.replace(/^```[a-z]*\n/i, '');
      // Remove closing ```
      jsonString = jsonString.replace(/\n```\s*$/, '');
    }

    // Parse the JSON response
    const parsedResult = JSON.parse(jsonString.trim());

    return NextResponse.json(parsedResult);
  } catch (error) {
    console.error('Error parsing insurance document:', error);

    // Provide more specific error messages
    let errorMessage = 'Failed to parse insurance document';

    if (error instanceof Error) {
      if (error.message.includes('429') || error.message.includes('rate_limit')) {
        errorMessage = 'API rate limit reached. Please wait a moment and try again.';
      } else if (error.message.includes('Unexpected token')) {
        errorMessage = 'Unable to parse the AI response. Please try again or use the text input method.';
      } else if (error.message.includes('No text could be extracted') || error.message.includes('Failed to extract text')) {
        errorMessage = error.message; // Use the specific PDF extraction error
      } else {
        errorMessage = `Error: ${error.message}`;
      }
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
