// Mock data for the banking app

export const mockAccounts = [
  {
    id: "acc-1234-5678",
    name: "Main Checking",
    type: "Checking",
    balance: 4250.65,
    currency: "USD",
    lastTransaction: {
      date: "May 14, 2024",
      amount: -58.42,
      description: "Coffee Shop",
    },
  },
  {
    id: "acc-8765-4321",
    name: "Savings",
    type: "Savings",
    balance: 12450.90,
    currency: "USD",
    lastTransaction: {
      date: "May 10, 2024",
      amount: 500.00,
      description: "Transfer from Checking",
    },
  },
  {
    id: "acc-9876-5432",
    name: "Joint Account",
    type: "Checking",
    balance: 7839.25,
    currency: "USD",
    lastTransaction: {
      date: "May 12, 2024",
      amount: -125.30,
      description: "Grocery Store",
    },
  },
];

export const mockTransactions = [
  {
    id: "tx-001",
    date: "May 14, 2024",
    description: "Coffee Shop",
    amount: -58.42,
    currency: "USD",
    category: "Food & Dining",
  },
  {
    id: "tx-002",
    date: "May 13, 2024",
    description: "Salary Deposit",
    amount: 3500.00,
    currency: "USD",
    category: "Income",
  },
  {
    id: "tx-003",
    date: "May 12, 2024",
    description: "Grocery Store",
    amount: -125.30,
    currency: "USD",
    category: "Groceries",
  },
  {
    id: "tx-004",
    date: "May 10, 2024",
    description: "Transfer to Savings",
    amount: -500.00,
    currency: "USD",
    category: "Transfer",
  },
  {
    id: "tx-005",
    date: "May 10, 2024",
    description: "Electric Bill",
    amount: -95.40,
    currency: "USD",
    category: "Utilities",
  },
  {
    id: "tx-006",
    date: "May 08, 2024",
    description: "Restaurant",
    amount: -76.25,
    currency: "USD",
    category: "Food & Dining",
  },
  {
    id: "tx-007",
    date: "May 05, 2024",
    description: "Gas Station",
    amount: -45.00,
    currency: "USD",
    category: "Transportation",
  },
  {
    id: "tx-008",
    date: "May 01, 2024",
    description: "Rent Payment",
    amount: -1800.00,
    currency: "USD",
    category: "Housing",
  },
];

export const mockDashboardSummary = {
  totalBalance: 24540.80,
  currency: "USD",
  savingsGoal: 20000,
  savingsProgress: 12450.90,
  pendingTransactions: 2,
}; 