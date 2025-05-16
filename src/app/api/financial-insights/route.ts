import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { getInsightsForUserType, saveInsightToDB } from '@/lib/insights-db';

// Initialize OpenAI client using environment variable
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Define prompts for different insight types
const PROMPTS = {
  snapshot: `
Provide a concise financial health snapshot based on transaction data.
Focus ONLY on these two sections:

1. Account Health Snapshot:
   - Current balance across all accounts
   - Income vs spending (last 30 days) with percentages
   - Top 3 spending categories with percentages
   - Financial health rating (Poor, Fair, Good, Excellent) with short explanation

2. Top Recommendations:
   - Provide 3 specific, actionable financial recommendations
   - Each should include potential savings or benefit amounts
   - Prioritize by potential impact

Format as markdown with:
- Use ## for "Account Health Snapshot" as main heading
- Use ## for "Top Recommendations" as second main heading
- Use ### for subsections if needed
- Bold key figures with **$amount**
- Use emoji indicators extensively:
  * 🔴 for negative/concerning items
  * 🟢 for positive items
  * 🟠 for neutral or warning items
  * 💰 for money amounts
  * ✅ for recommendations and action items

Do NOT include any other sections beyond these two.
`,

  detective: `
Perform in-depth analysis of transaction data to detect unusual or suspicious spending patterns.
Focus on:
1. Transactions that are significantly larger than usual in the same category (>50% above average)
2. Unusual merchants or spending categories compared to typical pattern
3. Potential duplicate charges with exact same amount within 48 hours
4. Spending spikes on particular dates
5. Unusual transaction timing or frequency

Provide:
1. Detailed list of unusual transactions with date, amount, merchant
2. Comprehensive explanation of why each transaction is flagged
3. Historical comparison where relevant
4. Security recommendations tailored to the specific issues found
5. Risk level assessment for each flagged item

Format as markdown with:
- Use ## for "Unusual Spending Detected" as main heading
- Use ### for each distinct section (not just one big section)
- Create visually distinct sections with proper spacing
- Bold key figures with **$amount**
- Use bullet points for lists
- Use 🚨 emoji for high priority alerts
- Use 🔍 emoji for general observations
- Use ⚠️ for warnings
- Use ✅ for recommendations
- Use tables for comparisons where helpful
- Use horizontal rules (---) between major sections

Be sure to create a visually structured report with clear section separation.
`,

  fastfood: `
Perform detailed analysis of transaction data for fast food spending.
Focus on: McDonald's, Burger King, Wendy's, KFC, Subway, Chipotle, UberEats, DoorDash, etc.

Provide:
1. Total fast food spending with monthly breakdown
2. Top 3 fast food merchants with spending amounts
3. Day of week patterns (when spending occurs most)
4. Average transaction amount
5. Percentage of overall food budget
6. Three specific saving tips with projected monthly savings
7. Health impact considerations

Format as markdown with:
- Use ## for "Fast Food Spending Analysis" as main heading
- Use ### for each section heading
- Leave blank lines between sections
- Bold key figures with **$amount**
- Use bullet points for lists
- Include a table with merchant breakdown
- Include a monthly trend analysis
`,

  subscriptions: `
Perform comprehensive analysis of transaction data to identify recurring subscriptions.
Look for regular payments to streaming services, software, memberships, and other subscription-based services.

Provide:
1. Detailed list of all likely subscriptions with monthly cost and annual projection
2. Total monthly and annual subscription costs
3. Categories of subscriptions (entertainment, productivity, etc.)
4. Comparison to average household spending on subscriptions
5. Three optimization suggestions with specific savings amounts
6. Potentially unused or forgotten subscriptions
7. Bundle opportunities to reduce costs

Format as markdown with:
- Use ## for "Subscription Radar" as main heading
- Use ### for each section heading
- Leave blank lines between sections
- Bold key figures with **$amount**
- Use bullet points for lists
- Use table for subscription list with columns: Service | Monthly Cost | Annual Cost | Category
- Include a pie chart description for category breakdown
`
};

// Fallback mock responses in case API fails
const MOCK_RESPONSES = {
  snapshot: {
    family: `## Account Health Snapshot

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
    student: `## Account Health Snapshot

### Current Balance
- Main Account: **$1,542.67**
- Overall Financial Status: 🟠 Fair

### Income vs Spending (Last 30 Days)
- Income: **$2,100.00**
- Spending: **$1,875.33**
- Net Flow: **+$224.67**
- Savings Rate: **10.7%**

### Top Spending Categories
| Category | Amount | Percentage |
|----------|--------|------------|
| Housing | **$950.00** | 50.6% |
| Food & Dining | **$385.45** | 20.6% |
| Education | **$245.78** | 13.1% |

### Financial Health Assessment
🟠 **Fair**

You have a slightly positive cash flow but your savings rate is below the recommended 20%. Your current balance would only cover about 1 month of expenses in an emergency.

### Monthly Trend
Your spending increased by **5.2%** compared to last month, mainly due to higher food and entertainment costs.`
  },
  detective: {
    family: `## Unusual Spending Detected

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
    student: `## Unusual Spending Detected

### 🚨 High Priority Alerts

1. **Duplicate Food Delivery Charge**
   - Date: February 14, 2025
   - Merchant: Doordash Flower Delivery
   - Amount: **$45.00**
   - Risk Level: Medium
   
   This appears to be a duplicate charge for the same service on the same day.

2. **Excessive Electronic Purchase**
   - Date: April 12, 2025
   - Merchant: BestBuy Electronics
   - Amount: **$899.99**
   - Risk Level: Low
   
   This purchase is significantly larger than your typical discretionary spending.

### 🔍 Other Unusual Transactions

1. **Bank Fee**
   - Date: May 3, 2025
   - Merchant: University Credit Union
   - Amount: **$35.00**
   - Risk Level: Low
   
   This appears to be an overdraft fee, which is unusual for your account.

### Security Recommendations

1. Contact Doordash immediately about the duplicate charge
2. Set up balance alerts to avoid overdraft fees
3. Review your spending plan for large purchases to avoid account instability`
  },
  fastfood: {
    family: `## Fast Food Spending Analysis

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
    student: `## Fast Food Spending Analysis

### Monthly Breakdown
- Total Fast Food Spending: **$285.45**
- Monthly Average: **$95.15**
- Percentage of Total Food Budget: **38.2%**

### Top Fast Food Merchants
1. McDonald's: **$65.87**
2. Subway: **$58.42**
3. DoorDash: **$161.16**

### Spending Patterns
- Most frequent day: **Wednesday** (42% of purchases)
- Average transaction: **$12.98**
- Typical frequency: 7-8 times per month

### Optimization Opportunities

1. **Campus Meal Plan Utilization**
   - Potential monthly savings: **$75.00**
   - Using pre-paid meal plans more consistently

2. **DIY Coffee**
   - Potential monthly savings: **$35.00**
   - Making coffee at home vs. buying at campus shops

3. **Group Meal Prep**
   - Potential monthly savings: **$60.00**
   - Cooking with roommates to share costs and effort

### Health Considerations
Your current fast food consumption adds approximately 8,500 extra calories per month compared to home-cooked alternatives.`
  },
  subscriptions: {
    family: `## Subscription Radar

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
- Consider reviewing your gym membership usage (average 2 visits/month)`,
    student: `## Subscription Radar

### Current Subscriptions

| Service | Monthly Cost | Annual Cost | Category |
|---------|--------------|-------------|----------|
| Spotify Student | **$4.99** | **$59.88** | Entertainment |
| Netflix | **$9.99** | **$119.88** | Entertainment |
| YouTube Premium | **$11.99** | **$143.88** | Entertainment |
| Chegg Study | **$14.95** | **$179.40** | Education |
| iCloud Storage | **$2.99** | **$35.88** | Utilities |
| Amazon Student | **$7.49** | **$89.88** | Shopping |

### Subscription Overview
- Total Monthly Cost: **$52.40**
- Total Annual Cost: **$628.80**
- Number of Subscriptions: 6
- Average College Student: **$45.50** monthly

### Optimization Opportunities

1. **Student Discounts**
   - You're eligible for additional student discounts on Apple Music (**$4.99** vs Spotify)
   - Potential annual savings: **$59.88**

2. **Education Bundles**
   - Some universities provide free access to services like LinkedIn Learning
   - Check if Chegg is available through your university library

3. **Entertainment Consolidation**
   - Consider choosing between Netflix or YouTube Premium
   - Potential annual savings: **$119.88**

### Seasonal Optimization
- Consider pausing Chegg during summer months when not in school
- Potential savings: **$44.85**`
  }
};

export async function POST(request: Request) {
  if (!process.env.OPENAI_API_KEY) {
    console.error('OPENAI_API_KEY is not set for single insight processing.');
    return NextResponse.json({ error: 'Server configuration error: Missing API key.' }, { status: 500 });
  }
  try {
    const { contextData } = await request.json();
    const { transactions, userType, accountData, insightType, format = "markdown" } = contextData;

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
    const typedUserType = userType as "family" | "student";
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
      // Call OpenAI API without timeout
      const completion = await openai.chat.completions.create({
        model: 'o3-mini',
        messages: formattedMessages
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
      
      // For student accounts, don't use mock data
      if (userType === "student") {
        return NextResponse.json(
          { error: 'Failed to generate insights. Please try again later.' },
          { status: 500 }
        );
      }
      
      // For family accounts, fall back to mock data
      const mockResponse = (MOCK_RESPONSES[typedInsightType] && MOCK_RESPONSES[typedInsightType][typedUserType]) || 
        "Sorry, we couldn't generate insights at this time.";
      
      // Save the mock response to the database
      await saveInsightToDB(userType, insightType, mockResponse);
      console.log(`Saved mock insight to database: ${userType}/${insightType}`);
      
      return NextResponse.json({ 
        response: mockResponse,
        source: 'mock'
      });
    }
  } catch (error) {
    console.error("Error in Financial Insights API:", error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
} 