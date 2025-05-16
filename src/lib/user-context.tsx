"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { parseTransactionData, Transaction } from "./parse-csv";

interface AccountData {
  id: string;
  name: string;
  type: string;
  balance: number;
  currency: string;
  lastTransaction?: {
    date: string;
    amount: number;
    description: string;
  };
}

interface UserContextType {
  userData: {
    accountData: AccountData | null;
    transactions: Transaction[] | null;
    isLoading: boolean;
  };
}

const defaultContext: UserContextType = {
  userData: {
    accountData: null,
    transactions: null,
    isLoading: true,
  },
};

const UserContext = createContext<UserContextType>(defaultContext);

export const useUserContext = () => useContext(UserContext);

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const [userData, setUserData] = useState({
    accountData: null as AccountData | null,
    transactions: null as Transaction[] | null,
    isLoading: true,
  });

  useEffect(() => {
    const fetchData = async () => {
      setUserData(prev => ({ ...prev, isLoading: true }));
      
      try {
        console.log("Fetching user transaction data from CSV...");
        const response = await fetch(`/1.csv`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch CSV: ${response.status} ${response.statusText}`);
        }
        
        const csvText = await response.text();
        
        if (!csvText || csvText.trim() === '') {
          throw new Error('CSV file is empty');
        }
        
        console.log("CSV data loaded, parsing transactions...");
        const { transactions } = parseTransactionData(csvText);
        
        if (!transactions || transactions.length === 0) {
          throw new Error('No transactions found in CSV data');
        }
        
        console.log(`Successfully parsed ${transactions.length} transactions`);
        
        // Create account data from transactions
        let balance = 0;
        let accountName = "Family Joint Account";
        let accountType = "Checking";
        let accountId = "acc-fam-1234";
        
        // Calculate balance from transactions
        transactions.forEach((tx: Transaction) => {
          balance += parseFloat(tx.amount);
        });
        
        // Get the most recent transaction for "last transaction"
        const sortedTransactions = [...transactions].sort((a, b) => {
          const dateA = new Date(a.date);
          const dateB = new Date(b.date);
          return dateB.getTime() - dateA.getTime();
        });
        
        const lastTransaction = sortedTransactions[0] ? {
          date: sortedTransactions[0].date,
          amount: parseFloat(sortedTransactions[0].amount),
          description: sortedTransactions[0].description,
        } : undefined;
        
        const accountData: AccountData = {
          id: accountId,
          name: accountName,
          type: accountType,
          balance: balance,
          currency: "USD",
          lastTransaction: lastTransaction,
        };
        
        console.log("Setting user data in context...");
        setUserData({
          accountData,
          transactions,
          isLoading: false,
        });
        
      } catch (error) {
        console.error("Error loading user data:", error);
        setUserData({
          accountData: null,
          transactions: null,
          isLoading: false,
        });
        
        // Try to recover with default data if needed
        setTimeout(() => {
          console.log("Attempting to recover with default data...");
          try {
            // Create default account data
            const defaultAccountData: AccountData = {
              id: "acc-fam-1234",
              name: "Family Joint Account",
              type: "Checking",
              balance: 12580.75,
              currency: "USD"
            };
            
            // Set at least the account data so basic features work
            setUserData(prev => ({
              ...prev,
              accountData: defaultAccountData,
              isLoading: false
            }));
          } catch (recoverError) {
            console.error("Recovery failed:", recoverError);
          }
        }, 1000);
      }
    };
    
    fetchData();
  }, []);

  return (
    <UserContext.Provider value={{ userData }}>
      {children}
    </UserContext.Provider>
  );
}; 