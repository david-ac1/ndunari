'use server';

import { amrGuardian } from "@/lib/agents/amr-guardian";

export async function interceptCourseAbandonmentAction(course: {
    drugName: string;
    category: string;
    dosesTaken: number;
    totalDoses: number;
}) {
    console.log("[Server Action] Intercepting Course Abandonment:", course.drugName);

    // Call the Agent to generate a dynamic risk warning
    const warning = await amrGuardian.interceptAbandonment(
        course.drugName,
        course.category,
        course.dosesTaken,
        course.totalDoses
    );

    return warning;
}
