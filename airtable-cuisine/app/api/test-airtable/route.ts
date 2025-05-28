// app/api/test-airtable/route.ts
import { NextResponse } from "next/server";
import { getTableRecords } from "@/utils/airtable"; // adapte le chemin si besoin

export async function GET() {
  try {
    const records = await getTableRecords("Recipes"); // adapte le nom
    return NextResponse.json(records);
  } catch (error) {
    console.error("Erreur Airtable:", error);
    return NextResponse.json({ error: "Erreur Airtable" }, { status: 500 });
  }
}
