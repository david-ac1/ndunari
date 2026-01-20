import { NextRequest, NextResponse } from "next/server";
import { emdexService } from "@/lib/services/emdex.service";

/**
 * GET /api/drugs?query=<search term>
 * Search drugs in EMDEX database
 */
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const query = searchParams.get("query");
        const category = searchParams.get("category");

        if (category) {
            // Get drugs by WHO AWaRe category
            const validCategories = ["ACCESS", "WATCH", "RESERVE"] as const;
            if (!validCategories.includes(category as any)) {
                return NextResponse.json(
                    { error: "Invalid category. Use ACCESS, WATCH, or RESERVE" },
                    { status: 400 }
                );
            }

            const drugs = await emdexService.getDrugsByCategory(
                category as "ACCESS" | "WATCH" | "RESERVE"
            );

            return NextResponse.json({
                success: true,
                data: drugs,
                count: drugs.length,
            });
        }

        if (query) {
            // Search by drug name or NAFDAC number
            const results = await emdexService.searchDrug(query);

            return NextResponse.json({
                success: true,
                data: results,
                count: results.length,
            });
        }

        // Return all drugs if no query specified
        const allDrugs = await emdexService.getAllDrugs();

        return NextResponse.json({
            success: true,
            data: allDrugs,
            count: allDrugs.length,
        });
    } catch (error) {
        console.error("Drugs API error:", error);

        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 }
        );
    }
}
