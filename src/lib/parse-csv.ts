export interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: string;
  currency: string;
  category: string;
}

export function parseTransactionData(csvText: string) {
  console.log("Starting CSV parsing...");
  const lines = csvText.split('\n');
  
  if (lines.length < 2) {
    console.error("CSV has insufficient data (needs header + at least one row)");
    return { transactions: [] };
  }
  
  const headers = lines[0].split(',');
  console.log("CSV headers:", headers);
  
  // Find indices for relevant columns
  const dateIndex = headers.findIndex(h => h.toLowerCase().includes('date') && !h.toLowerCase().includes('post'));
  const descIndex = headers.findIndex(h => h.toLowerCase().includes('description'));
  const amountIndex = headers.findIndex(h => h.toLowerCase().includes('amount'));
  const categoryIndex = headers.findIndex(h => h.toLowerCase().includes('category'));
  
  // Validate that we found all required columns
  if (dateIndex === -1 || descIndex === -1 || amountIndex === -1) {
    console.error("CSV is missing required columns. Found indices:", {
      dateIndex,
      descIndex,
      amountIndex,
      categoryIndex
    });
    return { transactions: [] };
  }
  
  console.log("Column indices:", {
    dateIndex, 
    descIndex, 
    amountIndex, 
    categoryIndex
  });
  
  const transactions: Transaction[] = [];
  
  // Start from index 1 to skip header row
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue; // Skip empty lines
    
    const columns = lines[i].split(',');
    
    // Skip malformed rows
    if (columns.length <= Math.max(dateIndex, descIndex, amountIndex)) {
      console.warn(`Skipping malformed row at line ${i+1}: insufficient columns`);
      continue;
    }
    
    // Generate a simple ID
    const id = `tx-${i}`;
    
    // Parse the transaction data
    const transaction: Transaction = {
      id,
      date: columns[dateIndex]?.trim() || "",
      description: columns[descIndex]?.trim() || "",
      // If it's a "Sale" transaction with negative amount, use as is
      amount: columns[amountIndex]?.trim() || "0",
      currency: "USD", // Assuming all are USD
      category: categoryIndex >= 0 && columns[categoryIndex] ? columns[categoryIndex].trim() : "Uncategorized"
    };
    
    // Skip transactions with invalid dates or amounts
    if (!transaction.date || !transaction.amount) {
      console.warn(`Skipping transaction at line ${i+1}: missing required data`);
      continue;
    }
    
    transactions.push(transaction);
  }
  
  console.log(`Successfully parsed ${transactions.length} transactions`);
  
  return {
    transactions
  };
} 