export interface AccountData {
  name: string;
  type: string;
  balance: number;
  currency: string;
}

export const defaultAccountData: AccountData = {
  name: "Family Checking Account",
  type: "Checking",
  balance: 12580.75,
  currency: "USD",
}; 