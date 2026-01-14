/**
 * Scan History Item
 */
export interface ScanHistoryItem {
    id: string;
    timestamp: number;
    drugName: string;
    authenticityScore: number;
    riskLevel: "safe" | "suspicious" | "counterfeit";
    nafdacNumber?: string;
    imagePreview?: string; // Base64 preview
}

/**
 * Save scan to history
 */
export function saveScanToHistory(scan: ScanHistoryItem): void {
    if (typeof window === "undefined") return;

    try {
        const history = getScanHistory();

        // Add new scan to beginning of array
        history.unshift(scan);

        // Keep only last 50 scans
        const trimmedHistory = history.slice(0, 50);

        localStorage.setItem("ndunari_scan_history", JSON.stringify(trimmedHistory));
    } catch (error) {
        console.error("Failed to save scan to history:", error);
    }
}

/**
 * Get scan history
 */
export function getScanHistory(): ScanHistoryItem[] {
    if (typeof window === "undefined") return [];

    try {
        const historyJson = localStorage.getItem("ndunari_scan_history");
        if (!historyJson) return [];

        return JSON.parse(historyJson);
    } catch (error) {
        console.error("Failed to load scan history:", error);
        return [];
    }
}

/**
 * Clear all scan history
 */
export function clearScanHistory(): void {
    if (typeof window === "undefined") return;

    try {
        localStorage.removeItem("ndunari_scan_history");
    } catch (error) {
        console.error("Failed to clear scan history:", error);
    }
}

/**
 * Delete specific scan from history
 */
export function deleteScanFromHistory(scanId: string): void {
    if (typeof window === "undefined") return;

    try {
        const history = getScanHistory();
        const filtered = history.filter((scan) => scan.id !== scanId);
        localStorage.setItem("ndunari_scan_history", JSON.stringify(filtered));
    } catch (error) {
        console.error("Failed to delete scan from history:", error);
    }
}
