import fs from 'fs';
import path from 'path';

interface ForensicLog {
    timestamp: string;
    imageSize: number;
    mimeType: string;
    promptLength: number;
    responseTextLength: number;
    responseTextPreview: string;
    finishReason?: string;
    safetyRatings?: any[];
    promptFeedback?: any;
    error?: string;
    duration: number;
}

export class ForensicLogger {
    private static logPath = path.join(process.cwd(), 'forensic-debug.log');

    static log(entry: ForensicLog) {
        const logLine = JSON.stringify(entry, null, 2) + '\n---\n';

        try {
            fs.appendFileSync(this.logPath, logLine);
            console.log('📋 Forensic log written to:', this.logPath);
        } catch (error) {
            console.error('Failed to write forensic log:', error);
        }
    }

    static clear() {
        try {
            if (fs.existsSync(this.logPath)) {
                fs.unlinkSync(this.logPath);
                console.log('🗑️ Forensic debug log cleared');
            }
        } catch (error) {
            console.error('Failed to clear forensic log:', error);
        }
    }
}
