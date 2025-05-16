"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface DashboardSummaryProps {
  totalBalance: number;
  currency: string;
  savingsGoal: number;
  savingsProgress: number;
  pendingTransactions: number;
}

export function DashboardSummary({
  totalBalance,
  currency,
  savingsGoal,
  savingsProgress,
  pendingTransactions,
}: DashboardSummaryProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const savingsPercentage = Math.min(100, Math.round((savingsProgress / savingsGoal) * 100));

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Total Balance</CardDescription>
          <CardTitle className="text-2xl">{formatCurrency(totalBalance)}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-xs text-muted-foreground">
            Across all accounts
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Savings Goal</CardDescription>
          <CardTitle className="text-2xl">{formatCurrency(savingsProgress)} / {formatCurrency(savingsGoal)}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-600 rounded-full"
              style={{ width: `${savingsPercentage}%` }}
            ></div>
          </div>
          <div className="text-xs text-muted-foreground mt-2">
            {savingsPercentage}% of your goal reached
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Pending Transactions</CardDescription>
          <CardTitle className="text-2xl">{pendingTransactions}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-xs text-muted-foreground">
            Not yet cleared
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 