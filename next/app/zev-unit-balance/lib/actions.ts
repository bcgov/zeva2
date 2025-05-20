"use server";

import { prisma } from "@/lib/prisma";
import {
    ZevUnitTransaction,
    TransactionType,
  } from "@/prisma/generated/client";

  export async function getComplianceYears(orgId: number): Promise<number[]> {
    const rows = await prisma.zevUnitTransaction.findMany({
      where: { organizationId: orgId },
      select: { timestamp: true },
    });
  
    const years = new Set<number>();
    for (const { timestamp } of rows) {
      const y = timestamp.getUTCFullYear();
      const m = timestamp.getUTCMonth();
      const complianceYear = m >= 9 ? y : y - 1;
      years.add(complianceYear);
    }
    return Array.from(years).sort((a, b) => b - a);
  }

  export async function getTransactionsByComplianceYear(
    orgId: number,
    year: number
  ): Promise<ZevUnitTransaction[]> {
    const rangeStart = new Date(Date.UTC(year,     9, 1));
    const rangeEnd   = new Date(Date.UTC(year + 1, 8, 30, 23, 59));
  
    return prisma.zevUnitTransaction.findMany({
      where: {
        organizationId: orgId,
        timestamp: { gte: rangeStart, lte: rangeEnd },
        type: { in: [TransactionType.CREDIT, TransactionType.TRANSFER_AWAY] },
      },
      orderBy: { timestamp: "asc" },
    });
  }
