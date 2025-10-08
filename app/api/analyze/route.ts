import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';
import * as pdfParse from 'pdf-parse';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const SYSTEM_PROMPT = `You are a construction agreement analyzer for an exteriors company. Extract information from construction agreements and format them according to the template below.

Output Format:

Job Summary – [Company Name]

Client: [Client Name]
Address: [Job Address]
Project #: [#]
Sales Rep: [Rep Name]
Signed: [Date]

✅ Work to Complete

Roof
• Full tear-off and replacement with [shingle brand + color]
• Include starter, ridge, felt (synthetic if noted)
• Replace drip edge, vents, flashings, etc.
• [Any pending supplements or material notes]
• Debris removal + final clean-up

Gutters & Downspouts
• Replace ~[LF] of 5" K-style aluminum gutters – [Color]
• Replace ~[LF] of 3×4" downspouts – [Color]
• Include rain diverters

Upgrades (No Charge)
• List complimentary or upgraded materials

🚫 Not Doing
• List only the excluded line items with clear notes (e.g., windows, paint, decking, etc.)

🧾 Job Notes
• Color selections
• Deposit requirement
• Cleanup expectations
• Supplement reminders or crew instructions

🧰 Warranty
• Labor: [X years]
• Material: Manufacturer warranty

Contract Total: $[amount]

Instructions:
- Extract all relevant information from the agreement
- Use "N/A" or "Not specified" for missing information
- Format the output exactly as shown above
- Be thorough and include all details found in the agreement`;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const textInput = formData.get('text') as string;

    let agreementText = '';

    if (file) {
      // Handle PDF upload
      const buffer = Buffer.from(await file.arrayBuffer());
      const data = await pdfParse.default(buffer);
      agreementText = data.text;
    } else if (textInput) {
      // Handle text input
      agreementText = textInput;
    } else {
      return NextResponse.json(
        { error: 'Either a PDF file or text input is required' },
        { status: 400 }
      );
    }

    if (!agreementText.trim()) {
      return NextResponse.json(
        { error: 'No text could be extracted from the input' },
        { status: 400 }
      );
    }

    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: agreementText,
        },
      ],
    });

    const analysisResult = message.content[0].type === 'text'
      ? message.content[0].text
      : '';

    return NextResponse.json({ analysis: analysisResult });
  } catch (error) {
    console.error('Error analyzing agreement:', error);
    return NextResponse.json(
      { error: 'Failed to analyze agreement' },
      { status: 500 }
    );
  }
}
