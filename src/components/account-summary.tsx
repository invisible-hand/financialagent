"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useUserContext } from "@/lib/user-context";
import { Skeleton } from "@/components/ui/skeleton";

export function AccountSummary() {
  const { userData } = useUserContext();
  const { accountData, isLoading } = userData;

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="mt-6">
        <Card className="overflow-hidden">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-6 w-24" />
            </div>
            <Skeleton className="h-4 w-32 mt-2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-32 mb-4" />
            <Skeleton className="h-4 w-full mt-4" />
            <Skeleton className="h-4 w-3/4 mt-2" />
          </CardContent>
          <CardFooter className="flex justify-between">
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-9 w-24" />
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (!accountData) {
    return (
      <div className="mt-6">
        <Card className="overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">No Account Data</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Unable to load account data at this time.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mt-6">
      <Card className="overflow-hidden">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">{accountData.name}</CardTitle>
            <Badge variant="outline">{accountData.type}</Badge>
          </div>
          <CardDescription>{accountData.id}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold mb-2">
            {formatCurrency(accountData.balance, accountData.currency)}
          </div>
          {accountData.lastTransaction && (
            <div className="text-sm text-muted-foreground mt-4">
              <p>Last transaction: {accountData.lastTransaction.date}</p>
              <p className="font-medium">
                {accountData.lastTransaction.description}
                <span className={accountData.lastTransaction.amount >= 0 ? "text-green-600" : "text-red-600"}>
                  {' '}{formatCurrency(accountData.lastTransaction.amount, accountData.currency)}
                </span>
              </p>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" size="sm">View Details</Button>
        </CardFooter>
      </Card>
    </div>
  );
} 