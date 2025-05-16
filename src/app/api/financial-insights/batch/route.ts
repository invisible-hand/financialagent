import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { loadInsightsFromDB, saveInsightToDB, getInsightsForUserType } from '@/lib/insights-db';

// Initialize OpenAI client using environment variable
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, 
});

// Simplified prompt for batch analysis of all financial aspects
const BATCH_ANALYSIS_PROMPT = `
You are a financial analysis AI that analyzes transaction data and produces four concise financial insights.
Generate these FOUR separate analyses, each limited to 200 words maximum:

1. ACCOUNT HEALTH SNAPSHOT:
- Current balance across all accounts
- Income vs spending (last 30 days) with percentages
- Top 3 spending categories
- Financial health rating (Poor, Fair, Good, Excellent)

2. UNUSUAL SPENDING DETECTION:
- Transactions that are significantly larger than usual
- Unusual merchants or spending categories
- Potential duplicate charges
- Spending spikes on particular dates

3. FAST FOOD SPENDING ANALYSIS:
- Total fast food spending
- Top 3 fast food merchants
- Day of week patterns
- Three specific saving tips

4. SUBSCRIPTION ANALYSIS:
- List of likely subscriptions with monthly costs
- Total monthly subscription costs
- Categories of subscriptions
- Optimization suggestions

Use concise markdown formatting with:
- ## for headings
- Tables for structured data
- Bullet points for lists
- Brief, actionable insights

Your output must be formatted in four sections separated by "<<<SECTION_BREAK>>>" markers in this exact order:
1. Account Health Snapshot
2. Unusual Spending Detection
3. Fast Food Spending
4. Subscription Analysis

Keep each section brief, informative, and clearly formatted.
`;

// Map insight types from API format to component format
const mapInsightTypesToComponentKeys = (insights: Record<string, string>): Record<string, string> => {
  // Create empty result object
  const result: Record<string, string> = {};
  
  // First try to use component format directly if available
  if (insights.snapshot) result.snapshot = insights.snapshot;
  if (insights.detective) result.detective = insights.detective;
  if (insights.fastfood) result.fastfood = insights.fastfood;
  if (insights.subscriptions) result.subscriptions = insights.subscriptions;
  
  // Fallback to API format keys if direct keys are not available
  if (!result.snapshot && insights.snapshot) result.snapshot = insights.snapshot;
  if (!result.detective && insights.spending_habits) result.detective = insights.spending_habits;
  if (!result.fastfood && insights.savings_potential) result.fastfood = insights.savings_potential;
  if (!result.subscriptions && insights.subscription_analysis) result.subscriptions = insights.subscription_analysis;
  
  console.log("Mapped insights from API format to component format:", {
    hasSnapshot: !!result.snapshot?.substring(0, 20),
    hasDetective: !!result.detective?.substring(0, 20),
    hasFastfood: !!result.fastfood?.substring(0, 20),
    hasSubscriptions: !!result.subscriptions?.substring(0, 20)
  });
  
  return result;
};

export async function POST(request: Request) {
  if (!process.env.OPENAI_API_KEY) {
    console.error('OPENAI_API_KEY is not set for batch processing.');
    return NextResponse.json({ error: 'Server configuration error: Missing API key.' }, { status: 500 });
  }
  try {
    const { contextData } = await request.json();
    const { transactions, accountData } = contextData;
    
    // Check if insights already exist in the database
    const existingInsights = await getInsightsForUserType('family');
    
    // If we have all required insights in the database, return them
    if (existingInsights && 
        existingInsights.snapshot && 
        (existingInsights.spending_habits || existingInsights.detective) && 
        (existingInsights.savings_potential || existingInsights.fastfood) && 
        (existingInsights.subscription_analysis || existingInsights.subscriptions)) {
          
      console.log(`Using pre-computed insights from database`);
      
      return NextResponse.json({ 
        insights: mapInsightTypesToComponentKeys(existingInsights),
        source: 'database'
      });
    }
    
    // Prepare the context information as a formatted string
    const formattedContext = `
USER CONTEXT:
Account: ${accountData ? `${accountData.name} (${accountData.type})` : 'Family Account'}
Balance: ${accountData ? `$${accountData.balance.toFixed(2)}` : '$0.00'}

${transactions && transactions.length > 0 ? `
ALL TRANSACTIONS:
${transactions.map((tx: any) => 
  `Date: ${tx.date}, Amount: $${tx.amount}, Category: ${tx.category}, Description: ${tx.description}`
).join('\n')}
` : 'No transaction data available'}
`;

    // Format messages for the OpenAI API
    const formattedMessages = [
      { role: 'system' as const, content: BATCH_ANALYSIS_PROMPT },
      { role: 'system' as const, content: `Current context information:\n${formattedContext}` },
    ];

    try {
      // Run without a timeout
      const completion = await openai.chat.completions.create({
        model: 'gpt-4.1-mini',
        messages: formattedMessages,
        max_tokens: 2000 // Limit token count for more concise responses
      });

      const fullResponse = completion.choices[0].message.content || "";
      
      // Debug logging
      console.log("Full response (first 200 chars):", fullResponse.substring(0, 200) + "...");
      
      // Split the response by section markers and log each section
      const sections = fullResponse.split('<<<SECTION_BREAK>>>');
      
      console.log(`Got ${sections.length} sections from the response`);
      // Log first 50 chars of each section for debugging
      sections.forEach((section, i) => {
        console.log(`Section ${i+1}: ${section.trim().substring(0, 50)}...`);
      });
      
      // Ensure we have exactly 4 sections
      while (sections.length < 4) {
        console.log(`Adding missing section ${sections.length+1}`);
        sections.push(`## Missing Section ${sections.length+1}\nNo data available for this insight.`);
      }
      
      // Only use the first 4 sections if we got more
      if (sections.length > 4) {
        console.log(`Truncating excess sections (got ${sections.length}, using first 4)`);
        sections.length = 4;
      }
      
      // Map the sections to their insight types 
      const insightMap = {
        snapshot: sections[0]?.trim() || "No snapshot data available.",
        detective: sections[1]?.trim() || "No unusual spending data available.",
        fastfood: sections[2]?.trim() || "No fast food spending data available.",
        subscriptions: sections[3]?.trim() || "No subscription data available."
      };
      
      console.log("Insight map keys:", Object.keys(insightMap));
      console.log("Insight map snapshot first 50 chars:", insightMap.snapshot.substring(0, 50) + "...");
      
      // Save each insight to the database - store with BOTH naming conventions to ensure compatibility
      console.log(`Saving generated insights to database with both naming conventions`);
      
      // Save each insight type individually to ensure all are saved
      try {
        // Save snapshot insight
        await saveInsightToDB('family', 'snapshot', insightMap.snapshot);
        console.log("Saved snapshot insight");
        
        // Save detective insight
        await saveInsightToDB('family', 'detective', insightMap.detective);
        await saveInsightToDB('family', 'spending_habits', insightMap.detective);
        console.log("Saved detective insight");
        
        // Save fastfood insight
        await saveInsightToDB('family', 'fastfood', insightMap.fastfood);
        await saveInsightToDB('family', 'savings_potential', insightMap.fastfood);
        console.log("Saved fastfood insight");
        
        // Save subscriptions insight
        await saveInsightToDB('family', 'subscriptions', insightMap.subscriptions);
        await saveInsightToDB('family', 'subscription_analysis', insightMap.subscriptions);
        console.log("Saved subscriptions insight");
      } catch (dbError) {
        console.error("Error saving insights to database:", dbError);
      }

      return NextResponse.json({ 
        insights: insightMap,
        source: 'model'
      });
    } catch (apiError) {
      console.error('OpenAI API error:', apiError);
      return NextResponse.json(
        { error: 'Failed to generate insights from OpenAI API' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in Financial Insights Batch API:', error);
    return NextResponse.json(
      { error: 'Failed to process batch request' },
      { status: 500 }
    );
  }
}

// In the GET handler, modify the return data
export async function GET(request: Request) {
  try {
    // Check if insights exist for family account in the DB
    const insights = await getInsightsForUserType('family');
    
    if (insights && Object.keys(insights).length > 0) {
      console.log(`Returning pre-computed insights from database`);
      
      // Map the database insight names to the component expected names
      const mappedInsights = mapInsightTypesToComponentKeys(insights);
      
      // Check if all required insights exist
      const allPresent = mappedInsights.snapshot && 
                         mappedInsights.detective && 
                         mappedInsights.fastfood && 
                         mappedInsights.subscriptions;
      
      if (!allPresent) {
        console.log("Not all insights are available. Returning what we have:", mappedInsights);
      }
      
      return NextResponse.json({
        insights: mappedInsights,
        source: 'database',
        complete: allPresent
      });
    } else {
      return NextResponse.json({ 
        insights: null,
        message: `No pre-computed insights available`
      });
    }
  } catch (error) {
    console.error(`Error retrieving batch insights:`, error);
    return NextResponse.json({ error: 'Failed to retrieve insights' }, { status: 500 });
  }
} 