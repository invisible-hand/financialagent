// Script to load transaction data from CSV and regenerate financial insights
async function regenerateInsights() {
  try {
    console.log("Loading CSV data from public/1.csv...");
    const csvResponse = await fetch("/1.csv");
    const csvText = await csvResponse.text();
    
    // Basic CSV parsing
    const lines = csvText.split('\n');
    const headers = lines[0].split(',');
    
    // Find indices for relevant columns
    const dateIndex = headers.findIndex(h => h.includes('Transaction Date'));
    const descIndex = headers.findIndex(h => h.includes('Description'));
    const amountIndex = headers.findIndex(h => h.includes('Amount'));
    const categoryIndex = headers.findIndex(h => h.includes('Category'));
    
    const transactions = [];
    
    // Parse each line of the CSV
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue; // Skip empty lines
      
      const columns = lines[i].split(',');
      if (columns.length < Math.max(dateIndex, descIndex, amountIndex, categoryIndex) + 1) {
        continue; // Skip malformed lines
      }
      
      transactions.push({
        id: `tx-${i}`,
        date: columns[dateIndex],
        description: columns[descIndex],
        amount: columns[amountIndex],
        currency: "USD",
        category: columns[categoryIndex]
      });
    }
    
    console.log(`Parsed ${transactions.length} transactions from CSV`);
    
    // Create account data
    const accountData = {
      id: "acc-fam-1234",
      name: "Family Joint Account",
      type: "Checking",
      balance: 12580.75,
      currency: "USD"
    };
    
    // Delete current insights database to force regeneration
    if (window.indexedDB) {
      console.log("Attempting to clear IndexedDB storage...");
      try {
        indexedDB.deleteDatabase("insights-db");
        console.log("IndexedDB storage cleared");
      } catch (e) {
        console.warn("Could not clear IndexedDB:", e);
      }
    }
    
    // Call the batch endpoint to generate all insights
    console.log("Sending transaction data to API...");
    console.log(`First few transactions: ${JSON.stringify(transactions.slice(0, 3), null, 2)}`);
    
    const response = await fetch("/api/financial-insights/batch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        contextData: {
          accountData,
          transactions,
          userType: "family"
        }
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log("Success! Insights have been regenerated.");
      console.log("Generated insights:", data.insights ? Object.keys(data.insights) : "No insights returned");
      
      // Reload the page to see the updated insights
      window.location.reload();
    } else {
      console.error("Failed to regenerate insights:", await response.text());
    }
  } catch (error) {
    console.error("Error during insights regeneration:", error);
  }
}

// Execute the function when script is loaded
regenerateInsights(); 