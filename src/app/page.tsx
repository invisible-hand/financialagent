"use client";

import { Header } from "@/components/header";
import { AccountSummary } from "@/components/account-summary";
import { TransactionHistory } from "@/components/transaction-history";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PreGenerateButton } from "@/components/pre-generate-button";

export default function Home() {
  return (
    <main className="pb-16">
      <Header />
      
      <div className="mt-8">
        <h1 className="text-3xl font-bold">
          Welcome, Johnson Family
        </h1>
        <p className="text-muted-foreground mt-1">Here's your financial overview</p>
        <PreGenerateButton />
      </div>
      
      <div className="mt-10">
        <Tabs defaultValue="account">
          <TabsList>
            <TabsTrigger value="account">My Account</TabsTrigger>
            <TabsTrigger value="transactions">Recent Transactions</TabsTrigger>
          </TabsList>
          <TabsContent value="account" className="mt-6">
            <AccountSummary />
          </TabsContent>
          <TabsContent value="transactions" className="mt-6">
            <TransactionHistory />
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
