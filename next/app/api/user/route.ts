import { wasUserUpdated } from "@/lib/data/user";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const idString = params.get("id");
  if (idString) {
    const id = parseInt(idString, 10);
    if (!Number.isNaN(id)) {
      const userWasUpdated = await wasUserUpdated(id);
      if (userWasUpdated) {
        return NextResponse.json({ signOut: true }, { status: 200 });
      }
    }
  }
  return NextResponse.json({ signOut: false }, { status: 200 });
}
