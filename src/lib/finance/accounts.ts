import { Account, LIABILITY_TYPES } from "@/lib/types";

export function isLiability(type: Account["type"]) {
  return LIABILITY_TYPES.includes(type);
}

export function getTotalAssets(accounts: Account[]) {
  return accounts
    .filter((a) => !isLiability(a.type))
    .reduce((sum, a) => sum + a.balance, 0);
}

export function getTotalLiabilities(accounts: Account[]) {
  return accounts
    .filter((a) => isLiability(a.type))
    .reduce((sum, a) => sum + a.balance, 0);
}

export function getNetWorth(accounts: Account[]) {
  return getTotalAssets(accounts) - getTotalLiabilities(accounts);
}

/** Cash on hand: checking + savings balances. */
export function getTotalCash(accounts: Account[]) {
  return accounts
    .filter((a) => a.type === "checking" || a.type === "savings")
    .reduce((sum, a) => sum + a.balance, 0);
}
