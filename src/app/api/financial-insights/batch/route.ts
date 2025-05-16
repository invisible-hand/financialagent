import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { loadInsightsFromDB, saveInsightToDB, getInsightsForUserType } from '@/lib/insights-db';

// Initialize OpenAI client using environment variable
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, 
});

// Prompt for batch analysis of all financial aspects
const BATCH_ANALYSIS_PROMPT = `
You are a financial analysis AI that will analyze transaction data and produce multiple financial insights in a single response.
You will need to generate FOUR separate analyses:

1. ACCOUNT HEALTH SNAPSHOT:
- Current balance across all accounts
- Income vs spending (last 30 days) with percentages
- Top 3 spending categories with amounts and percentages
- Financial health rating (Poor, Fair, Good, Excellent) with detailed explanation
- Month-over-month spending trend

2. UNUSUAL SPENDING DETECTION:
- Transactions that are significantly larger than usual in the same category
- Unusual merchants or spending categories compared to typical pattern
- Potential duplicate charges with exact same amount within 48 hours
- Spending spikes on particular dates

3. FAST FOOD SPENDING ANALYSIS:
- Total fast food spending with monthly breakdown
- Top 3 fast food merchants with spending amounts
- Day of week patterns (when spending occurs most)
- Average transaction amount
- Percentage of overall food budget
- Three specific saving tips with projected monthly savings

4. SUBSCRIPTION ANALYSIS:
- Detailed list of all likely subscriptions with monthly cost and annual projection
- Total monthly and annual subscription costs
- Categories of subscriptions (entertainment, productivity, etc.)
- Optimization suggestions with specific savings amounts

IMPORTANT: Your output must be visually appealing with rich formatting using markdown and emoji indicators:

VISUAL FORMATTING REQUIREMENTS:
- Use extensive color-coded emoji indicators:
  * 🔴 for negative/concerning items (high spending, over budget, etc.)
  * 🟢 for positive items (savings, under budget, good habits)
  * 🟠 for neutral or warning items
  * 🔵 for informational items
  * 💰 for money amounts
  * 📊 for percentages and trends
  * ⚠️ for alerts and warnings
  * ✅ for recommendations and action items
  * 💸 for spending categories
  * 📆 for date-related information
  * 📈 for increases
  * 📉 for decreases

- Use markdown formatting extensively:
  * ## for main headings
  * ### for section headings
  * ** for bold important figures
  * Use tables with aligned columns
  * Use bullet points and numbered lists
  * Format currency values consistently
  * Include dividers (--- or ***) between major sections
  * Use > blockquotes for summary sections

- Visual organization:
  * Group related information
  * Use white space effectively
  * Highlight key metrics 
  * Make critical alerts stand out
  * Create a visual hierarchy

IMPORTANT: Your output must be formatted in multiple markdown sections separated by "<<<SECTION_BREAK>>>" markers.
Each section should contain ONE of the analyses listed above in this exact order:
1. Account Health Snapshot
2. Unusual Spending Detection
3. Fast Food Spending
4. Subscription Analysis

Ensure each section is self-contained, comprehensive, visually appealing, and ready to be displayed separately.
`;

// Map client-side insight types to our API format
const insightTypeMapping = {
  snapshot: "snapshot",
  detective: "spending_habits",
  fastfood: "savings_potential",
  subscriptions: "subscription_analysis"
};

// Fallback mock responses in case of API errors
const MOCK_RESPONSES = {
  "snapshot": `## Account Health Snapshot

### Current Balance
- Main Account: **$12,458.92**
- Overall Financial Status: 🟢 Good

### Income vs Spending (Last 30 Days)
- Income: **$8,250.00**
- Spending: **$5,893.45**
- Net Flow: **+$2,356.55**
- Savings Rate: **28.6%**

### Top Spending Categories
| Category | Amount | Percentage |
|----------|--------|------------|
| Housing | **$2,450.00** | 41.6% |
| Groceries | **$845.32** | 14.3% |
| Transportation | **$635.78** | 10.8% |

### Financial Health Assessment
🟢 **Good**

Your family has a positive cash flow and healthy savings rate above 25%. Your emergency fund covers approximately 3 months of expenses, which is on the right track but could be improved to reach the recommended 6-month level.

### Monthly Trend
Your spending has decreased by **8.3%** compared to last month, primarily due to reduced discretionary purchases.`,
  
  "detective": `## Unusual Spending Detected

### 🚨 High Priority Alerts

1. **Duplicate Subscription Charge**
   - Date: February 15, 2025
   - Merchant: Spotify Premium Family
   - Amount: **$16.99**
   - Risk Level: Medium
   
   This appears to be a duplicate charge for the same service on the same day. You're normally charged once monthly for this subscription.

2. **Unusually Large Auto Repair**
   - Date: January 16, 2025
   - Merchant: Auto Repair Specialists Engine
   - Amount: **$1,842.37**
   - Risk Level: Low
   
   This expense is 876% higher than your usual automotive expenses which average **$210.25** per transaction.

### 🔍 Other Unusual Transactions

1. **Medical Expense Spike**
   - Date: March 15, 2025
   - Merchant: Emerg Room Visit Memorial Hosp
   - Amount: **$1,250.00**
   - Risk Level: Low
   
   This is significantly higher than your typical medical expenses.

### Security Recommendations

1. Contact Spotify customer service about the duplicate charge
2. Set up purchase alerts for transactions over $500
3. Review all subscription charges monthly to catch unwanted renewals or duplicates`,
  
  "fastfood": `## Fast Food Spending Analysis

### Monthly Breakdown
- Total Fast Food Spending: **$426.83**
- Monthly Average: **$142.28**
- Percentage of Total Food Budget: **21.4%**

### Top Fast Food Merchants
1. McDonald's: **$182.45**
2. Chipotle: **$105.98**
3. DoorDash: **$138.40**

### Spending Patterns
- Most frequent day: **Friday** (38% of purchases)
- Average transaction: **$18.56**
- Typical frequency: 7-8 times per month

### Optimization Opportunities

1. **Meal Prep Sundays**
   - Potential monthly savings: **$80.00**
   - Cook larger batches on Sunday for weekday lunches

2. **Limit Delivery Services**
   - Potential monthly savings: **$45.00**
   - Delivery fees and markups add ~40% to meal costs

3. **Weekday Lunch Packing**
   - Potential monthly savings: **$95.00**
   - Bringing lunch from home 3 days/week can cut costs significantly

### Health Considerations
Reducing fast food could lower sodium intake by approximately 25% and reduce calories by an estimated 4,200 per month.`,
  
  "subscriptions": `## Subscription Radar

### Current Subscriptions

| Service | Monthly Cost | Annual Cost | Category |
|---------|--------------|-------------|----------|
| Netflix | **$19.99** | **$239.88** | Entertainment |
| Spotify Family | **$16.99** | **$203.88** | Entertainment |
| Amazon Prime | **$14.99** | **$179.88** | Shopping |
| Disney+ | **$7.99** | **$95.88** | Entertainment |
| iCloud Storage | **$9.99** | **$119.88** | Utilities |
| Gym Membership | **$85.00** | **$1,020.00** | Health |
| Home Security | **$35.00** | **$420.00** | Home |

### Subscription Overview
- Total Monthly Cost: **$189.95**
- Total Annual Cost: **$2,279.40**
- Number of Subscriptions: 7
- Average U.S. Household: **$273.00** monthly

### Optimization Opportunities

1. **Entertainment Bundle**
   - Disney+, Hulu, and ESPN+ bundle would save **$9.98** monthly
   - Annual savings: **$119.76**

2. **Annual Payment Discounts**
   - Paying annually for eligible services would save approximately **$83.00**

3. **Family Plan Sharing**
   - Sharing Spotify Family with in-laws could save them **$119.88** annually

### Potentially Underutilized
- Home security system shows minimal app logins in the past 3 months
- Consider reviewing your gym membership usage (average 2 visits/month)`
};

// Map insight types from API format to component format
const mapInsightTypesToComponentKeys = (insights: Record<string, string>): Record<string, string> => {
  // Create empty result object
  const result: Record<string, string> = {};
  
  // Map insight types - check each field exists before mapping
  result.snapshot = insights.snapshot || '';
  
  // Map spending_habits to detective
  result.detective = insights.spending_habits || 
                     insights.detective || // Also check if detective already exists
                     '';
  
  // Map savings_potential to fastfood
  result.fastfood = insights.savings_potential || 
                    insights.fastfood || // Also check if fastfood already exists
                    '';
  
  // Map subscription_analysis to subscriptions
  result.subscriptions = insights.subscription_analysis ||
                         insights.subscriptions || // Also check if subscriptions already exists
                         '';
  
  console.log("Mapped insights from API format to component format:", result);
  
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
      let completion = await openai.chat.completions.create({
        model: 'o3-mini',
        messages: formattedMessages
      });

      const fullResponse = completion.choices[0].message.content || "";
      
      // Split the response by section markers
      const sections = fullResponse.split('<<<SECTION_BREAK>>>');
      
      // Map the sections to their insight types (ensure at least 4 sections exist)
      const insightMap = {
        snapshot: sections[0]?.trim() || MOCK_RESPONSES.snapshot,
        detective: sections[1]?.trim() || MOCK_RESPONSES.detective,
        fastfood: sections[2]?.trim() || MOCK_RESPONSES.fastfood,
        subscriptions: sections[3]?.trim() || MOCK_RESPONSES.subscriptions
      };
      
      // Save each insight to the database - store with BOTH naming conventions to ensure compatibility
      console.log(`Saving generated insights to database with both naming conventions`);
      await Promise.all([
        // Save with API naming convention
        saveInsightToDB('family', 'snapshot', insightMap.snapshot),
        saveInsightToDB('family', 'spending_habits', insightMap.detective),
        saveInsightToDB('family', 'savings_potential', insightMap.fastfood),
        saveInsightToDB('family', 'subscription_analysis', insightMap.subscriptions),
        
        // Also save with component naming convention for redundancy
        saveInsightToDB('family', 'detective', insightMap.detective),
        saveInsightToDB('family', 'fastfood', insightMap.fastfood),
        saveInsightToDB('family', 'subscriptions', insightMap.subscriptions),
      ]);
      
      return NextResponse.json({ 
        insights: insightMap,
        source: 'model'
      });
    } catch (apiError) {
      console.error('OpenAI API error, falling back to mock data:', apiError);
      
      // Fall back to mock data
      const mockInsights = {
        snapshot: MOCK_RESPONSES.snapshot,
        detective: MOCK_RESPONSES.detective,
        fastfood: MOCK_RESPONSES.fastfood,
        subscriptions: MOCK_RESPONSES.subscriptions
      };
      
      // Save mock data to database as well - with BOTH naming conventions
      console.log(`Saving mock insights to database with both naming conventions`);
      await Promise.all([
        // Save with API naming convention
        saveInsightToDB('family', 'snapshot', mockInsights.snapshot),
        saveInsightToDB('family', 'spending_habits', mockInsights.detective),
        saveInsightToDB('family', 'savings_potential', mockInsights.fastfood),
        saveInsightToDB('family', 'subscription_analysis', mockInsights.subscriptions),
        
        // Also save with component naming convention for redundancy
        saveInsightToDB('family', 'detective', mockInsights.detective),
        saveInsightToDB('family', 'fastfood', mockInsights.fastfood),
        saveInsightToDB('family', 'subscriptions', mockInsights.subscriptions),
      ]);
      
      return NextResponse.json({ 
        insights: mockInsights,
        source: 'mock'
      });
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