import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// Initialize OpenAI client using environment variable
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, 
});

// The Robo Advisor system prompt
const ROBO_ADVISOR_PROMPT = `
You are a financial assistant AI integrated into a banking application. Your role is to provide helpful, accurate, and personalized financial advice based on the user's account data.

Guidelines:
- Focus ONLY on providing financial assessments, budgeting advice, and insights based on transaction patterns
- Analyze spending habits, income sources, and financial behaviors from the provided context
- Offer practical tips for saving money based on the user's transaction history
- Suggest potential investment strategies appropriate for the user's financial situation
- Provide commentary on spending categories that seem high or low compared to typical patterns
- Identify potential areas of concern in financial habits
- Maintain a professional, helpful, and friendly tone
- Keep responses concise and focused on financial matters
- Respect privacy and confidentiality of the user's financial data
- DO NOT offer advice on non-financial matters
- DO NOT discuss political, social, or controversial topics
- DO NOT pretend to be human - acknowledge that you are an AI financial assistant
- DO NOT make up information - rely only on the provided context

You have access to:
1. User type (family or student)
2. Account data (balance, account type, name)
3. ALL transactions (date, description, amount, category)

Use this information to provide personalized financial guidance.
`;

// Fallback responses when API fails
const FALLBACK_RESPONSES = [
  "I notice your spending on eating out has increased recently. Consider meal planning to reduce these expenses and increase your savings rate.",
  
  "Based on your transaction history, you might want to create a monthly budget for discretionary spending. This can help you track and control your expenses more effectively.",
  
  "I see several subscription services in your transactions. It might be worth reviewing these to ensure you're using all of them regularly. Canceling unused subscriptions could save you money monthly.",
  
  "Your account shows regular income deposits. Have you considered setting up automatic transfers to a savings account? Even small amounts can add up over time.",
  
  "Looking at your transaction patterns, you might benefit from using a 50/30/20 budget rule - 50% for needs, 30% for wants, and 20% for savings and debt repayment.",
  
  "I notice some larger than usual expenses recently. If these were unplanned purchases, consider implementing a 24-hour rule before making non-essential purchases over a certain amount.",
  
  "Your transaction history shows you might be spending more than the recommended 30% of income on housing costs. This could limit your ability to save and invest for the future."
];

export async function POST(request: Request) {
  if (!process.env.OPENAI_API_KEY) {
    console.error('OPENAI_API_KEY is not set for Robo Advisor.');
    return NextResponse.json({ error: 'Server configuration error: Missing API key.' }, { status: 500 });
  }
  try {
    const { messages, contextData } = await request.json();

    // Prepare the context information as a formatted string
    const formattedContext = `
USER CONTEXT:
User Type: ${contextData.userType}
${contextData.accountData ? `
Account: ${contextData.accountData.name} (${contextData.accountData.type})
Balance: $${contextData.accountData.balance.toFixed(2)}
` : 'No account data available'}

${contextData.transactions && contextData.transactions.length > 0 ? `
ALL TRANSACTIONS:
${contextData.transactions.map((tx: any) => 
  `Date: ${tx.date}, Amount: $${tx.amount}, Category: ${tx.category}, Description: ${tx.description}`
).join('\n')}
` : 'No transaction data available'}
`;

    // Format messages for the OpenAI API
    const formattedMessages = [
      { role: 'system', content: ROBO_ADVISOR_PROMPT },
      { role: 'system', content: `Current context information:\n${formattedContext}` },
      ...messages.map((msg: any) => ({ 
        role: msg.role, 
        content: msg.content 
      })),
    ];

    try {
      // Call OpenAI API with timeout
      const completion = await Promise.race([
        openai.chat.completions.create({
          model: 'gpt-4.1-nano',
          messages: formattedMessages
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('API request timeout')), 30000)
        )
      ]) as any;

      const response = completion.choices[0].message.content;
      return NextResponse.json({ response });
    } catch (apiError) {
      console.error('OpenAI API error, falling back to standard response:', apiError);
      
      // Get a random fallback response
      const fallbackResponse = FALLBACK_RESPONSES[Math.floor(Math.random() * FALLBACK_RESPONSES.length)];
      
      // Add context about the error
      const errorPrefix = "I'm having trouble analyzing your specific financial data right now. Here's a general tip that might be helpful: ";
      
      return NextResponse.json({ 
        response: errorPrefix + fallbackResponse 
      });
    }
  } catch (error) {
    console.error('Error in Robo Advisor API:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
} 