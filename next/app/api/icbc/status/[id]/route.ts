import { getUserInfo } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userIsGov } = await getUserInfo();
  
  if (!userIsGov) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const icbcFileId = parseInt(id, 10);

  if (isNaN(icbcFileId)) {
    return NextResponse.json({ error: "Invalid file ID" }, { status: 400 });
  }

  const icbcFile = await prisma.icbcFile.findUnique({
    where: { id: icbcFileId },
    select: { status: true, timestamp: true },
  });

  if (!icbcFile) {
    return NextResponse.json({ error: "ICBC file not found" }, { status: 404 });
  }

  return NextResponse.json({
    status: icbcFile.status,
    timestamp: icbcFile.timestamp,
  });
}
