"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/app/components/providers/AuthProvider";
import {
    Pill,
    Clock,
    CheckCircle,
    Trash2,
    Plus,
    ShieldAlert,
    X,
    Timer
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { interceptCourseAbandonmentAction } from "@/app/actions/medication";
import { AgentThoughtStream, type ReasoningStep } from "@/app/components/reasoning/AgentThoughtStream";

interface MedicationCourse {
    id: string;
    drug_name: string;
    category: 'ANTIBIOTIC' | 'ANTIMALARIAL' | 'ANTIVIRAL' | 'OTHER';
    total_doses: number;
    doses_taken: number;
    frequency: string;
    dose_interval_hours?: number;
    next_dose_due?: string;
    last_dose_time?: string;
    status: 'active' | 'completed' | 'abandoned';
    abandoned_at?: string;
    abandonment_reason?: string;
}

function getIntervalHours(freq: string): number {
    switch (freq) {
        case "1x Daily": return 24;
        case "2x Daily": return 12;
        case "3x Daily": return 8;
        case "4x Daily": return 6;
        default: return 24;
    }
}

function NextDoseTimer({ nextDue }: { nextDue?: string }) {
    const [timeLeft, setTimeLeft] = useState<string>("");
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        if (!nextDue) return;

        const interval = setInterval(() => {
            const now = new Date().getTime();
            const due = new Date(nextDue).getTime();
            const diff = due - now;

            if (diff <= 0) {
                setTimeLeft("Now");
                setIsReady(true);
            } else {
                const hours = Math.floor(diff / (1000 * 60 * 60));
                const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                setTimeLeft(`${hours}h ${minutes}m`);
                setIsReady(false);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [nextDue]);

    if (!nextDue) return <span className="text-xs text-gray-400">Not started</span>;

    return (
        <span className={`text-xs font-bold flex items-center gap-1 ${isReady ? "text-access-green animate-pulse" : "text-watch-orange"}`}>
            <Timer size={12} /> {isReady ? "Dose Ready!" : `Due in ${timeLeft}`}
        </span>
    );
}

export default function MedicationsPage() {
    const { user } = useAuth();
    const [courses, setCourses] = useState<MedicationCourse[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showInterceptModal, setShowInterceptModal] = useState(false);

    // Intercept State
    const [interceptData, setInterceptData] = useState<{
        riskLevel: 'CRITICAL' | 'HIGH' | 'MODERATE';
        warningTitle: string;
        scientificRationale: string;
        persuasionMessage: string;
        courseId: string;
        reasoningSteps?: ReasoningStep[];
    } | null>(null);

    // Add Form State
    const [newCourse, setNewCourse] = useState({
        drug_name: "",
        category: "ANTIBIOTIC",
        total_doses: 10,
        frequency: "2x Daily"
    });

    useEffect(() => {
        if (user) fetchCourses();
    }, [user]);

    async function fetchCourses() {
        try {
            const { data, error } = await supabase
                .from('medication_courses')
                .select('*')
                .eq('user_id', user?.id)
                .in('status', ['active', 'completed']) // Exclude abandoned from UI
                .order('created_at', { ascending: false });

            if (data) setCourses(data);
        } catch (error) {
            console.error("Error fetching courses:", error);
        } finally {
            setLoading(false);
        }
    }

    async function handleTakeDose(course: MedicationCourse) {
        if (course.doses_taken >= course.total_doses) return;

        const now = new Date();
        // Prevent taking dose if > 1 hour early (unless it's the first dose)
        if (course.next_dose_due && course.doses_taken > 0) {
            const due = new Date(course.next_dose_due);
            const diffHours = (due.getTime() - now.getTime()) / (1000 * 60 * 60);
            if (diffHours > 1) { // 1 hour buffer window
                alert(`Safety Lock: It is too early for your next dose. Please wait ${Math.floor(diffHours)} hours to avoid toxicity.`);
                return;
            }
        }

        // Calculate next dose time
        const interval = course.dose_interval_hours || getIntervalHours(course.frequency);
        const nextDue = new Date(now.getTime() + (interval * 60 * 60 * 1000));

        // Optimistic Update
        const updatedDoses = course.doses_taken + 1;
        const isCompleted = updatedDoses >= course.total_doses;

        setCourses(prev => prev.map(c => c.id === course.id ? {
            ...c,
            doses_taken: updatedDoses,
            last_dose_time: now.toISOString(),
            next_dose_due: nextDue.toISOString(),
            status: isCompleted ? 'completed' : 'active'
        } : c));

        await supabase
            .from('medication_courses')
            .update({
                doses_taken: updatedDoses,
                last_dose_time: now.toISOString(),
                next_dose_due: nextDue.toISOString(),
                status: isCompleted ? 'completed' : 'active'
            })
            .eq('id', course.id);
    }

    async function handleStopCourse(course: MedicationCourse) {
        // 1. If completed, just delete (already finished properly)
        if (course.status === 'completed' || course.doses_taken >= course.total_doses) {
            await deleteCourse(course.id);
            return;
        }

        // 2. AMR GUARDIAN INTERCEPT
        // If it's an antimicrobial and incomplete, trigger the Agent
        if (['ANTIBIOTIC', 'ANTIMALARIAL', 'ANTIVIRAL'].includes(course.category)) {
            setLoading(true); // Show loading while agent thinks
            try {
                const warning = await interceptCourseAbandonmentAction({
                    drugName: course.drug_name,
                    category: course.category,
                    dosesTaken: course.doses_taken,
                    totalDoses: course.total_doses
                });

                // Add timestamps to reasoning steps
                const stepsWithTimestamps = warning.reasoningSteps?.map((step, idx) => ({
                    ...step,
                    timestamp: new Date(Date.now() + idx * 100), // Stagger timestamps slightly
                    status: 'complete' as const
                }));

                setInterceptData({ ...warning, courseId: course.id, reasoningSteps: stepsWithTimestamps });
                setShowInterceptModal(true);
            } catch (error) {
                console.error('Error in AMR Guardian intercept:', error);
                // If intercept fails, still allow deletion
                await deleteCourse(course.id);
            } finally {
                setLoading(false);
            }
        } else {
            // Just delete simple meds (non-antimicrobials)
            await deleteCourse(course.id);
        }
    }

    async function proceedWithAbandonment() {
        if (!interceptData) return;

        try {
            console.log('[Medication Abandonment] User proceeded despite warning:', {
                courseId: interceptData.courseId,
                riskLevel: interceptData.riskLevel
            });

            // Find the course being abandoned
            const course = courses.find(c => c.id === interceptData.courseId);
            if (!course) {
                console.error('[Medication Abandonment] Course not found');
                return;
            }

            // **CRITICAL**: Mark as abandoned in database instead of deleting
            // This allows Sentinel and Stewardship to track abandonment patterns
            const { error } = await supabase
                .from('medication_courses')
                .update({
                    status: 'abandoned',
                    abandoned_at: new Date().toISOString(),
                    abandonment_reason: 'user_stopped_early'
                })
                .eq('id', interceptData.courseId);

            if (error) {
                console.error('[Medication Abandonment] Database update failed:', error);
                alert('Failed to update medication status. Please try again.');
                return;
            }

            console.log('[Medication Abandonment] Successfully logged to database', {
                drug: course.drug_name,
                progress: `${course.doses_taken}/${course.total_doses}`,
                category: course.category
            });

            // Remove from UI (optimistic update)
            setCourses(prev => prev.filter(c => c.id !== interceptData.courseId));

            // Close modal
            setShowInterceptModal(false);
            setInterceptData(null);
        } catch (error) {
            console.error('[Medication Abandonment] Unexpected error:', error);
            alert('An unexpected error occurred. Please try again.');
        }
    }

    async function deleteCourse(id: string) {
        await supabase.from('medication_courses').delete().eq('id', id);
        setCourses(prev => prev.filter(c => c.id !== id));
    }

    async function addCourse() {
        if (!user) return;

        console.log("Adding course:", newCourse);

        // Initial setup - First dose is due "Now" (or handled on first click)
        const interval = getIntervalHours(newCourse.frequency);

        try {
            const { data, error } = await supabase.from('medication_courses').insert({
                user_id: user.id,
                drug_name: newCourse.drug_name,
                category: newCourse.category,
                total_doses: newCourse.total_doses,
                frequency: newCourse.frequency,
                dose_interval_hours: interval,
                doses_taken: 0,
                status: 'active'
            }).select().single();

            if (error) {
                console.error("Supabase Error adding course:", error);
                alert(`Failed to add course: ${error.message}. Did you run the migration?`);
                return;
            }

            if (data) {
                setCourses([data, ...courses]);
                setShowAddModal(false);
            }
        } catch (e) {
            console.error("Unexpected error adding course:", e);
            alert("Unexpected error. Check console.");
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-background-light via-background-light to-primary/5 dark:from-background-dark dark:via-background-dark dark:to-primary/5 pb-24">
            {/* Gradient Accent Line */}
            <div className="absolute top-0 left-0 right-0 h-[2px] gradient-primary" />

            <div className="max-w-2xl mx-auto p-6 space-y-8">

                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-panel-strong p-6 rounded-3xl relative overflow-hidden"
                >
                    {/* Animated background gradient */}
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-access-green/10 animate-gradient-shift" />

                    <div className="relative flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-black text-forest-green dark:text-white flex items-center gap-3">
                                <div className="w-12 h-12 rounded-2xl gradient-primary flex items-center justify-center shadow-glow-primary animate-pulse-glow">
                                    <Pill className="text-white" size={24} />
                                </div>
                                Medication Steward
                            </h1>
                            <p className="text-xs font-bold text-primary uppercase tracking-widest mt-2 ml-1">
                                🛡️ Adherence & Resistance Guard
                            </p>
                        </div>
                        <motion.button
                            whileHover={{ scale: 1.1, rotate: 90 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setShowAddModal(true)}
                            className="w-14 h-14 gradient-primary text-white rounded-2xl shadow-glow-primary hover:shadow-glow-primary-lg transition-all font-bold relative overflow-hidden group"
                        >
                            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform" />
                            <Plus size={28} className="relative z-10" />
                        </motion.button>
                    </div>
                </motion.div>

                {/* Course List */}
                <div className="space-y-4">
                    {courses.length === 0 && !loading && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="glass-panel p-12 rounded-3xl text-center relative overflow-hidden"
                        >
                            {/* Animated background elements */}
                            <div className="absolute inset-0 opacity-10">
                                <div className="absolute top-10 left-10 w-32 h-32 bg-primary rounded-full blur-3xl animate-float" />
                                <div className="absolute bottom-10 right-10 w-40 h-40 bg-access-green rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />
                            </div>

                            <div className="relative">
                                <div className="w-20 h-20 mx-auto mb-6 rounded-3xl gradient-primary/20 flex items-center justify-center">
                                    <Pill size={40} className="text-primary" strokeWidth={2.5} />
                                </div>
                                <p className="text-xl font-black text-forest-green dark:text-white mb-2">No Active Medications</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto leading-relaxed">
                                    Track your prescriptions to enable smart adherence reminders and AMR Guardian protection.
                                </p>
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => setShowAddModal(true)}
                                    className="mt-6 px-6 py-3 gradient-primary text-white font-bold rounded-xl shadow-glow-primary hover:shadow-glow-primary-lg transition-all flex items-center gap-2 mx-auto"
                                >
                                    <Plus size={20} />
                                    Add Your First Medication
                                </motion.button>
                            </div>
                        </motion.div>
                    )}

                    {courses.map((course, index) => (
                        <motion.div
                            key={course.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="relative glass-panel p-6 rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group"
                        >
                            {/* Glassmorphic overlay on hover */}
                            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                            {/* Animated Progress Bar */}
                            <div className="absolute left-0 bottom-0 h-1.5 bg-gray-100 dark:bg-white/5 w-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${(course.doses_taken / course.total_doses) * 100}%` }}
                                    transition={{ duration: 1, ease: "easeOut" }}
                                    className={`h-full relative ${course.status === 'completed'
                                        ? 'gradient-primary'
                                        : 'bg-gradient-to-r from-primary to-access-green'
                                        }`}
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
                                </motion.div>
                            </div>

                            <div className="relative flex justify-between items-start mb-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className={`text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full ${course.category === 'ANTIBIOTIC' ? 'bg-gradient-to-r from-reserve-red/20 to-reserve-red/10 text-reserve-red border border-reserve-red/20' :
                                            course.category === 'ANTIMALARIAL' ? 'bg-gradient-to-r from-watch-orange/20 to-watch-orange/10 text-watch-orange border border-watch-orange/20' :
                                                course.category === 'ANTIVIRAL' ? 'bg-gradient-to-r from-access-green/20 to-access-green/10 text-access-green border border-access-green/20' :
                                                    'bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-400'
                                            }`}>
                                            {course.category}
                                        </span>
                                        {course.status === 'completed' && (
                                            <motion.span
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                className="text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full bg-access-green/10 text-access-green flex items-center gap-1 border border-access-green/20"
                                            >
                                                <CheckCircle size={12} /> Complete
                                            </motion.span>
                                        )}
                                    </div>
                                    <h3 className="text-2xl font-black text-forest-green dark:text-white mb-2">
                                        {course.drug_name}
                                    </h3>
                                    <div className="flex items-center gap-4">
                                        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium flex items-center gap-1.5">
                                            <Clock size={14} className="text-primary" />
                                            {course.frequency}
                                        </p>
                                        {course.status === 'active' && <NextDoseTimer nextDue={course.next_dose_due} />}
                                    </div>
                                </div>
                                <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => handleStopCourse(course)}
                                    className="text-gray-300 hover:text-reserve-red transition-colors p-2 rounded-xl hover:bg-reserve-red/10"
                                >
                                    <Trash2 size={20} />
                                </motion.button>
                            </div>

                            <div className="relative flex items-center justify-between mt-6">
                                <div className="flex items-center gap-3">
                                    <div className="text-sm font-bold text-forest-green dark:text-white">
                                        <span className="text-2xl">{course.doses_taken}</span>
                                        <span className="text-gray-400"> / {course.total_doses}</span>
                                    </div>
                                    <span className="text-xs text-gray-400 font-medium">doses</span>
                                </div>

                                {course.status === 'completed' ? (
                                    <motion.div
                                        initial={{ scale: 0, rotate: -180 }}
                                        animate={{ scale: 1, rotate: 0 }}
                                        className="flex items-center gap-2 px-4 py-2 rounded-xl gradient-primary text-white font-black uppercase text-xs tracking-widest shadow-glow-primary"
                                    >
                                        <CheckCircle size={18} />
                                        Course Complete
                                    </motion.div>
                                ) : (
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => handleTakeDose(course)}
                                        className="px-6 py-3 gradient-primary text-white rounded-xl text-sm font-bold shadow-glow-primary hover:shadow-glow-primary-lg transition-all flex items-center gap-2 group"
                                    >
                                        <CheckCircle size={18} className="group-hover:rotate-12 transition-transform" />
                                        Take Dose
                                    </motion.button>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* ADD MODAL */}
            <AnimatePresence>
                {showAddModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-md"
                        onClick={() => setShowAddModal(false)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="glass-panel-strong w-full max-w-md p-8 rounded-3xl shadow-2xl border-2 border-primary/20 relative overflow-hidden"
                        >
                            {/* Gradient accent */}
                            <div className="absolute top-0 left-0 right-0 h-1 gradient-primary" />

                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-black text-forest-green dark:text-white">New Prescription</h2>
                                <motion.button
                                    whileHover={{ scale: 1.1, rotate: 90 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => setShowAddModal(false)}
                                    className="w-10 h-10 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 flex items-center justify-center transition-colors"
                                >
                                    <X size={20} />
                                </motion.button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Drug Name</label>
                                    <input
                                        type="text"
                                        className="w-full p-3 rounded-xl bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 font-bold"
                                        placeholder="e.g. Amoxicillin"
                                        value={newCourse.drug_name}
                                        onChange={e => setNewCourse({ ...newCourse, drug_name: e.target.value })}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Category</label>
                                        <select
                                            className="w-full p-3 rounded-xl bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 font-bold"
                                            value={newCourse.category}
                                            onChange={e => setNewCourse({ ...newCourse, category: e.target.value as any })}
                                        >
                                            <option value="ANTIBIOTIC">Antibiotic</option>
                                            <option value="ANTIMALARIAL">Anti-malarial</option>
                                            <option value="ANTIVIRAL">Antiviral</option>
                                            <option value="OTHER">Other</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Frequency</label>
                                        <select
                                            className="w-full p-3 rounded-xl bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 font-bold"
                                            value={newCourse.frequency}
                                            onChange={e => setNewCourse({ ...newCourse, frequency: e.target.value })}
                                        >
                                            <option value="1x Daily">1x Daily (24h)</option>
                                            <option value="2x Daily">2x Daily (12h)</option>
                                            <option value="3x Daily">3x Daily (8h)</option>
                                            <option value="4x Daily">4x Daily (6h)</option>
                                        </select>
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Total Doses</label>
                                        <input
                                            type="number"
                                            className="w-full p-3 rounded-xl bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 font-bold"
                                            value={newCourse.total_doses}
                                            onChange={e => setNewCourse({ ...newCourse, total_doses: parseInt(e.target.value) })}
                                        />
                                    </div>
                                </div>

                                <button
                                    onClick={addCourse}
                                    className="w-full py-4 mt-4 bg-primary text-forest-green font-black rounded-xl hover:bg-primary/90 transition-all">
                                    Start Course
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* INTERCEPT MODAL (AMR GUARDIAN) */}
            <AnimatePresence>
                {showInterceptModal && interceptData && (
                    <div className="fixed inset-0 bg-reserve-red/20 z-50 flex items-center justify-center p-4 backdrop-blur-md">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                            className="bg-white dark:bg-surface-dark w-full max-w-lg p-0 rounded-3xl shadow-2xl overflow-hidden border-2 border-reserve-red">

                            {/* Warning Header */}
                            <div className="bg-reserve-red p-6 text-white text-center">
                                <ShieldAlert size={48} className="mx-auto mb-2" />
                                <h2 className="text-2xl font-black uppercase tracking-widest">Guardian Intercept</h2>
                                <p className="font-bold opacity-90">{interceptData.warningTitle}</p>
                            </div>

                            <div className="p-8 space-y-6">
                                {/* AI Reasoning Stream */}
                                {interceptData.reasoningSteps && interceptData.reasoningSteps.length > 0 && (
                                    <AgentThoughtStream
                                        agentName="AMR Guardian"
                                        agentType="guardian"
                                        steps={interceptData.reasoningSteps}
                                        isThinking={false}
                                        compact={true}
                                    />
                                )}

                                {/* Rationale */}
                                <div className="bg-reserve-red/5 p-4 rounded-xl border border-reserve-red/10">
                                    <h3 className="text-xs font-black uppercase text-reserve-red mb-2 text-center">Scientific Rationale</h3>
                                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 text-center leading-relaxed">
                                        {interceptData.scientificRationale}
                                    </p>
                                </div>

                                {/* Persuasion */}
                                <p className="text-center font-bold text-forest-green dark:text-white text-lg">
                                    {interceptData.persuasionMessage}
                                </p>

                                <div className="space-y-3 pt-4">
                                    <button
                                        onClick={() => setShowInterceptModal(false)}
                                        className="w-full py-4 bg-forest-green text-white font-black rounded-xl hover:scale-[1.02] transition-all shadow-lg text-lg">
                                        I Will Finish The Course
                                    </button>
                                    <button
                                        onClick={proceedWithAbandonment}
                                        className="w-full py-3 text-gray-400 font-bold hover:text-reserve-red text-sm transition-colors">
                                        I understand the risk, stop anyway
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

        </div>
    );
}
