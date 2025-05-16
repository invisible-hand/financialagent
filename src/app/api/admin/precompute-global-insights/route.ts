import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import OpenAI from 'openai';
import { loadInsightsFromDB, saveInsightsToDB, InsightsData } from '@/lib/insights-db'; 
import { defaultAccountData } from '@/lib/default-account-data';

// Ensure OPENAI_API_KEY is used from environment variables
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const INSIGHT_TYPES_TO_PRECOMPUTE = ['snapshot', 'spending_habits', 'subscription_analysis', 'savings_potential'];

// This should match the BATCH_ANALYSIS_PROMPT in your batch route, or be adapted
const BATCH_ANALYSIS_PROMPT = `
Analyze the provided financial data based on the user context and transaction list. 
Generate FOUR distinct financial insights based on the user context and transactions:
1.  **Account Snapshot**: Provide a concise overview of the current financial status, highlighting key balances, recent significant transactions, and any immediate alerts (e.g., low balance, unusual spending).
2.  **Spending Habits**: Analyze spending patterns, categorize expenditures, identify top spending categories, and point out any notable trends or potential areas for budgeting.
3.  **Subscription Analysis**: Identify recurring subscriptions, sum up their total monthly cost, and list them. Highlight any subscriptions that seem redundant or unusually expensive.
4.  **Savings Potential**: Based on income (if available, otherwise assume typical income based on user type) and spending habits, estimate potential monthly savings and suggest actionable tips to achieve these savings.

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

- Use rich markdown formatting:
  * ## for main headings
  * ### for section headings
  * ** for bold important figures
  * Use tables with aligned columns
  * Use bullet points and numbered lists
  * Format currency values consistently
  * Include dividers between major sections
  * Use blockquotes for summary sections

Make the output visually appealing and easy to scan with a clear hierarchy of information.
Present each insight clearly, separated by "---INSIGHT_SEPARATOR---".

USER CONTEXT:
Account: {accountName} ({accountType})
Balance: {accountBalance}

ALL TRANSACTIONS:
{transactions}
`;

async function parseTransactionsCSV(csvPath: string): Promise<any[]> {
  try {
    const filePath = path.join(process.cwd(), csvPath);
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const lines = fileContent.trim().split('\n');
    const headers = lines[0].split(',');
    return lines.slice(1).map(line => {
      const values = line.split(',');
      let transaction: any = {};
      headers.forEach((header, index) => {
        transaction[header.trim()] = values[index] ? values[index].trim() : '';
      });
      return transaction;
    });
  } catch (error) {
    console.error(`Error parsing CSV ${csvPath}:`, error);
    return []; // Return empty array on error
  }
}

export async function POST(request: Request) {
  // Optional: Add a simple secret key check for security if this is exposed
  // const authHeader = request.headers.get('Authorization');
  // if (authHeader !== `Bearer ${process.env.ADMIN_SECRET_KEY}`) {
  //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  // }

  if (!process.env.OPENAI_API_KEY) {
    console.error('OPENAI_API_KEY is not set.');
    return NextResponse.json({ error: 'Server configuration error: Missing API key.' }, { status: 500 });
  }

  try {
    let existingInsights = await loadInsightsFromDB();
    
    // Check if family insights already exist
    const familyInsights = existingInsights.family || {};
    const allInsightsPresent = INSIGHT_TYPES_TO_PRECOMPUTE.every(type => !!familyInsights[type]);

    if (allInsightsPresent) {
      console.log(`Insights are already complete. Skipping.`);
      return NextResponse.json({ message: 'All insights were already pre-computed.' });
    }

    console.log(`Pre-computing insights...`);

    // Load transactions from CSV
    const transactions = await parseTransactionsCSV('public/1.csv');
    if (!transactions || transactions.length === 0) {
      console.error(`Failed to load transactions from public/1.csv. Skipping.`);
      return NextResponse.json({ error: 'Failed to load transaction data.' }, { status: 500 });
    }
    
    const accountData = defaultAccountData;

    const formattedTransactions = transactions.map((tx: any) => 
      `Date: ${tx['Transaction Date']}, Amount: $${tx.Amount}, Category: ${tx.Category}, Description: ${tx.Description}`
    ).join('\n');

    const promptContent = BATCH_ANALYSIS_PROMPT
      .replace('{accountName}', accountData.name)
      .replace('{accountType}', accountData.type)
      .replace('{accountBalance}', accountData.balance.toFixed(2))
      .replace('{transactions}', formattedTransactions);

    const completion = await openai.chat.completions.create({
      model: 'gpt-4.1-mini', // Or your preferred model
      messages: [{ role: 'user', content: promptContent }],
      max_tokens: 8000, // Increased to ensure completion
    });

    const rawResponse = completion.choices[0]?.message?.content;
    if (!rawResponse) {
      console.error(`No response from OpenAI. Skipping.`);
      return NextResponse.json({ error: 'No response from AI service.' }, { status: 500 });
    }

    const generatedInsightsArray = rawResponse.split('---INSIGHT_SEPARATOR---');
    const parsedInsights: { [key: string]: string } = {};
    
    // Store insights with their original API keys
    if (generatedInsightsArray.length >= 4) {
      parsedInsights.snapshot = generatedInsightsArray[0]?.trim();
      parsedInsights.spending_habits = generatedInsightsArray[1]?.trim();
      parsedInsights.subscription_analysis = generatedInsightsArray[2]?.trim();
      parsedInsights.savings_potential = generatedInsightsArray[3]?.trim();
    } else {
      console.warn(`Could not parse all 4 insights. Found ${generatedInsightsArray.length}. Response: ${rawResponse}`);
      // Store whatever was generated
      INSIGHT_TYPES_TO_PRECOMPUTE.forEach((type, index) => {
          if(generatedInsightsArray[index]) parsedInsights[type] = generatedInsightsArray[index].trim();
      });
    }
    
    // Add UI-friendly insight mappings as well (duplicate data to ensure compatibility)
    if (parsedInsights.snapshot) {
      parsedInsights.detective = parsedInsights.spending_habits || '';
      parsedInsights.fastfood = parsedInsights.savings_potential || '';
      parsedInsights.subscriptions = parsedInsights.subscription_analysis || '';
    }
    
    // Update insights for family account
    if (!existingInsights.family) existingInsights.family = {};
    existingInsights.family = { ...existingInsights.family, ...parsedInsights };
    
    await saveInsightsToDB(existingInsights);
    console.log(`Successfully generated and processed insights.`);
    
    return NextResponse.json({ message: 'Global pre-computation completed.' });

  } catch (error: any) {
    console.error('Error during global pre-computation:', error);
    return NextResponse.json({ error: 'Failed to pre-compute global insights.', details: error.message }, { status: 500 });
  }
} 