import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_KEY || '');

export async function POST(req: NextRequest) {
  try {
    const { image } = await req.json(); // base64 data url (data:image/png;base64,...)

    if (!process.env.GOOGLE_GEMINI_KEY || process.env.GOOGLE_GEMINI_KEY === 'your_gemini_key_here') {
      return NextResponse.json({ 
        error: 'Google Gemini Key not configured. Please add it to your .env.local file.' 
      }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Extract base64 data and mime type
    const [mimePart, base64Part] = image.split(',');
    const mimeType = mimePart.split(':')[1].split(';')[0];

    const prompt = "You are a specialized accounting assistant. Extract data from this receipt or invoice image. Return ONLY a JSON object with: vendor (string), total_amount (number), vat_amount (number), date (YYYY-MM-DD), category (string - one of: Travel, Office, Materials, Rent, Utilities, Salaries, Other), and items (array of {description, price}). Ensure amounts are numbers.";

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Part,
          mimeType: mimeType
        }
      }
    ]);

    const response = await result.response;
    let text = response.text();
    
    // Clean up potential markdown formatting in response
    text = text.replace(/```json|```/g, '').trim();
    
    const data = JSON.parse(text);
    
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Gemini Scan Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
