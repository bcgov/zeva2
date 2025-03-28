import type { NextApiRequest, NextApiResponse } from "next";
import { getZevUnitTransfers } from "../data";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  try {
    const transfers = await getZevUnitTransfers();
    res.status(200).json(transfers);
  } catch (error) {
    res.status(500).json({ error: "Failed to load transfers" });
  }
}
