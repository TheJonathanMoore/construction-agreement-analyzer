import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const SYSTEM_PROMPT = `You are an insurance document parser for construction projects. Your job is to extract scope items from insurance documents and organize them by trade.

Parse the insurance document and extract all line items, grouping them by trade/category (e.g., Roof, Gutters, Siding, Fencing, etc.).

For each line item, extract:
1. Quantity (number and unit, e.g., "120 LF", "1 EA", "45 SQ")
2. Description (the work to be done)
3. RCV value (Replacement Cost Value in dollars)

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
- Use descriptive trade names (capitalize properly)
- Parse RCV values carefully, removing any currency symbols or commas
- Generate unique IDs for trades and line items
- Group related items logically by trade
- If you can't determine the trade, use "Other" or "General"
- Return ONLY the JSON, no additional text or explanation`;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const text = formData.get('text') as string | null;

    let messageContent;

    if (file) {
      // Use Claude's native PDF vision capabilities
      const arrayBuffer = await file.arrayBuffer();
      const base64Pdf = Buffer.from(arrayBuffer).toString('base64');

      messageContent = [
        {
          type: 'document' as const,
          source: {
            type: 'base64' as const,
            media_type: 'application/pdf' as const,
            data: base64Pdf,
          },
        },
        {
          type: 'text' as const,
          text: 'Please parse this insurance document and extract the scope items.',
        },
      ];
    } else if (text) {
      messageContent = text;
    } else {
      return NextResponse.json(
        { error: 'Either file or text is required' },
        { status: 400 }
      );
    }

    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: messageContent as any, // eslint-disable-line @typescript-eslint/no-explicit-any
        },
      ],
    });

    const result = message.content[0].type === 'text'
      ? message.content[0].text
      : '';

    // Strip markdown code blocks if present
    let jsonString = result.trim();
    if (jsonString.startsWith('```json')) {
      jsonString = jsonString.replace(/^```json\n/, '').replace(/\n```$/, '');
    } else if (jsonString.startsWith('```')) {
      jsonString = jsonString.replace(/^```\n/, '').replace(/\n```$/, '');
    }

    // Parse the JSON response
    const parsedResult = JSON.parse(jsonString);

    return NextResponse.json(parsedResult);
  } catch (error) {
    console.error('Error parsing insurance document:', error);
    return NextResponse.json(
      { error: 'Failed to parse insurance document' },
      { status: 500 }
    );
  }
}
