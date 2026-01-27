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
        // 1. If completed, just delete
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

                setInterceptData({ ...warning, courseId: course.id });
                setShowInterceptModal(true);
            } finally {
                setLoading(false);
            }
        } else {
            // Just delete simple meds
            await deleteCourse(course.id);
        }
    }

    async function proceedWithAbandonment() {
        if (interceptData) {
            await deleteCourse(interceptData.courseId);
            setShowInterceptModal(false);
            setInterceptData(null);
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
        <div className="min-h-screen bg-background-light dark:bg-background-dark p-6 pb-24">
            <div className="max-w-2xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-black text-forest-green dark:text-white flex items-center gap-2">
                            <Pill className="text-primary" /> Medication Steward
                        </h1>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">
                            Adherence & Resistance Guard
                        </p>
                    </div>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="p-3 bg-primary text-forest-green rounded-full shadow-lg hover:bg-primary/90 transition-all font-bold">
                        <Plus size={20} />
                    </button>
                </div>

                {/* Course List */}
                <div className="space-y-4">
                    {courses.length === 0 && !loading && (
                        <div className="text-center p-8 border-2 border-dashed border-gray-200 dark:border-white/10 rounded-2xl">
                            <p className="text-gray-400 font-bold">No active medications.</p>
                            <p className="text-xs text-gray-500 mt-2">Add a course to enable the AMR Guardian.</p>
                        </div>
                    )}

                    {courses.map(course => (
                        <div key={course.id} className="relative bg-white dark:bg-surface-dark p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-white/5 overflow-hidden group">
                            {/* Background Progress */}
                            <div className="absolute left-0 bottom-0 h-1 bg-gray-100 dark:bg-white/10 w-full">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${(course.doses_taken / course.total_doses) * 100}%` }}
                                    className={`h-full ${course.status === 'completed' ? 'bg-access-green' : 'bg-primary'}`}
                                />
                            </div>

                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${course.category === 'ANTIBIOTIC' ? 'bg-reserve-red/10 text-reserve-red' :
                                        course.category === 'ANTIMALARIAL' ? 'bg-watch-orange/10 text-watch-orange' :
                                            'bg-gray-100 text-gray-500'
                                        }`}>
                                        {course.category}
                                    </span>
                                    <h3 className="text-xl font-black text-forest-green dark:text-white mt-1">{course.drug_name}</h3>
                                    <div className="flex items-center gap-3 mt-1">
                                        <p className="text-sm text-gray-400 font-medium flex items-center gap-1">
                                            <Clock size={12} /> {course.frequency}
                                        </p>
                                        {/* Next Dose Timer */}
                                        {course.status === 'active' && <NextDoseTimer nextDue={course.next_dose_due} />}
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleStopCourse(course)}
                                    className="text-gray-300 hover:text-reserve-red transition-colors p-2">
                                    <Trash2 size={18} />
                                </button>
                            </div>

                            <div className="flex items-center justify-between mt-4">
                                <div className="text-sm font-bold text-forest-green dark:text-white">
                                    {course.doses_taken} / <span className="text-gray-400">{course.total_doses} Doses</span>
                                </div>

                                {course.status === 'completed' ? (
                                    <div className="flex items-center gap-2 text-access-green font-black uppercase text-xs tracking-widest">
                                        <CheckCircle size={16} /> Course Complete
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => handleTakeDose(course)}
                                        className="px-4 py-2 bg-forest-green dark:bg-white dark:text-forest-green text-white rounded-xl text-sm font-bold shadow-md hover:scale-105 active:scale-95 transition-all flex items-center gap-2">
                                        <CheckCircle size={16} /> Take Dose
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* ADD MODAL */}
            <AnimatePresence>
                {showAddModal && (
                    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white dark:bg-surface-dark w-full max-w-md p-6 rounded-3xl shadow-2xl border border-gray-100 dark:border-white/10">

                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-black text-forest-green dark:text-white">New Prescription</h2>
                                <button onClick={() => setShowAddModal(false)}><X /></button>
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
                    </div>
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
