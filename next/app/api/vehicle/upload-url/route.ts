import { NextResponse } from "next/server";
import { getPutObjectData } from "@/app/vehicle/lib/actions";

export async function GET() {
  const data = await getPutObjectData();
  if (data) {
    return NextResponse.json({
      url: data.url.toString(),
      objectName: data.objectName,
    });
  }
}
