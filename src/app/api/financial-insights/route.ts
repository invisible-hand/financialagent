import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { getInsightsForUserType, saveInsightToDB } from '@/lib/insights-db';

// Initialize OpenAI client using environment variable
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Define simplified prompts for different insight types
const PROMPTS = {
  snapshot: `
Provide a concise financial health snapshot based on transaction data.
Focus ONLY on these key points:
- Current balance
- Income vs spending (last 30 days)
- Top 3 spending categories
- Financial health rating (Poor, Fair, Good, Excellent)
- 2-3 specific, actionable recommendations

Format as markdown with:
- ## Account Health Snapshot as heading
- Bold key figures
- Bullet points for clarity
- Keep response under 200 words total
`,

  detective: `
Analyze transaction data to detect unusual spending patterns.
Focus on:
- Transactions significantly larger than usual
- Unusual merchants or spending categories
- Potential duplicate charges
- Spending spikes

Provide:
- List of unusual transactions with date and amount
- Brief explanation of why each is flagged
- 2-3 security recommendations

Format as markdown with:
- ## Unusual Spending Detected as heading
- Bullet points for clarity
- Keep response under 200 words total
`,

  fastfood: `
Analyze transaction data for fast food spending.
Provide:
- Total fast food spending
- Top 3 fast food merchants
- Day of week patterns
- Three specific saving tips

Format as markdown with:
- ## Fast Food Spending Analysis as heading
- Bullet points for clarity
- Keep response under 200 words total
`,

  subscriptions: `
Analyze transaction data to identify recurring subscriptions.
Provide:
- List of likely subscriptions with monthly costs
- Total monthly subscription costs
- Categories of subscriptions
- 2-3 optimization suggestions

Format as markdown with:
- ## Subscription Radar as heading
- Simple table format for subscriptions
- Bullet points for clarity
- Keep response under 200 words total
`
};

export async function POST(request: Request) {
  if (!process.env.OPENAI_API_KEY) {
    console.error('OPENAI_API_KEY is not set for single insight processing.');
    return NextResponse.json({ error: 'Server configuration error: Missing API key.' }, { status: 500 });
  }
  try {
    const { contextData } = await request.json();
    const { transactions, userType, accountData, insightType } = contextData;

    // First check if this insight exists in the database
    const existingInsights = await getInsightsForUserType(userType);
    
    if (existingInsights && existingInsights[insightType]) {
      console.log(`Using pre-computed insight from database: ${userType}/${insightType}`);
      return NextResponse.json({ 
        response: existingInsights[insightType],
        source: 'database'
      });
    }

    // If not found in database, generate the insight
    const typedInsightType = insightType as keyof typeof PROMPTS;
    
    // Get the appropriate prompt template
    const promptTemplate = PROMPTS[typedInsightType] || PROMPTS.snapshot;
    
    // Prepare context for the API
    const formattedContext = `
USER CONTEXT:
User Type: ${userType}
${accountData ? `
Account: ${accountData.name} (${accountData.type})
Balance: $${accountData.balance.toFixed(2)}
` : 'No account data available'}

${transactions && transactions.length > 0 ? `
TRANSACTIONS:
${transactions.map((tx: any) => 
  `Date: ${tx.date}, Amount: $${tx.amount}, Category: ${tx.category}, Description: ${tx.description}`
).join('\n')}
` : 'No transaction data available'}
`;

    // Set up messages for the OpenAI API
    const formattedMessages = [
      { role: 'system' as const, content: promptTemplate },
      { role: 'system' as const, content: `Current context information:\n${formattedContext}` },
    ];

    try {
      // Call OpenAI API with token limit to ensure concise responses
      const completion = await openai.chat.completions.create({
        model: 'gpt-4.1-mini',
        messages: formattedMessages,
        max_tokens: 1000 // Limit token count for more concise responses
      });

      const response = completion.choices[0].message.content || "";
      
      // Save the generated insight to the database
      await saveInsightToDB(userType, insightType, response);
      console.log(`Saved new insight to database: ${userType}/${insightType}`);
      
      return NextResponse.json({ 
        response,
        source: 'model'
      });
    } catch (error) {
      console.error("OpenAI API error:", error);
      return NextResponse.json(
        { error: 'Failed to generate insights. Please try again later.' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error in Financial Insights API:", error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
} 