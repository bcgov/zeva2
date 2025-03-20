// app/api/unit-transactions/route.ts
import { NextResponse } from "next/server";
import { fetchUnitTransactions } from "@/app/credit-requests/data";
export async function GET() {
  const data = await fetchUnitTransactions();
  return NextResponse.json(data);
}
