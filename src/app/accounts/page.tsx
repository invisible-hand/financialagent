"use client";

import { Header } from "@/components/header";
import { AccountSummary } from "@/components/account-summary";
import { TransactionHistory } from "@/components/transaction-history";

export default function AccountsPage() {
  return (
    <main className="pb-16">
      <Header />
      
      <div className="mt-8">
        <h1 className="text-3xl font-bold">My Account</h1>
        <p className="text-muted-foreground mt-1">
          Manage your family banking account
        </p>
      </div>
      
      <div className="mt-8">
        <AccountSummary />
        <TransactionHistory />
      </div>
    </main>
  );
} 