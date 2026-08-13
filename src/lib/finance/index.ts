// Shared financial calculation layer. Every page — and, later, the AI
// chatbot — reads calculated financial values through these functions
// instead of recomputing them locally.
export * from "@/lib/finance/accounts";
export * from "@/lib/finance/transactions";
export * from "@/lib/finance/bills";
export * from "@/lib/finance/paycheck";
export * from "@/lib/finance/goals";
export * from "@/lib/finance/budgets";
export * from "@/lib/finance/affordability";
