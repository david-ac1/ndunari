'use client';

import { X, MapPin, TrendingUp, AlertCircle } from 'lucide-react';

interface DirectiveModalProps {
    notification: any;
    onClose: () => void;
}

export default function DirectiveModal({ notification, onClose }: DirectiveModalProps) {
    const directive = notification.directive_data;
    const isDirective = notification.type === 'directive';

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-gray-900 border border-gray-800 rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
                {/* Header */}
                <div className="p-6 border-b border-gray-800 bg-gradient-to-r from-gray-800/50 to-gray-900">
                    <div className="flex items-start justify-between">
                        <div>
                            {isDirective && (
                                <span className="text-xs font-semibold text-green-400 uppercase tracking-wider flex items-center gap-2">
                                    <AlertCircle size={14} />
                                    Autonomous Directive
                                </span>
                            )}
                            <h2 className="text-2xl font-bold mt-2 text-white">{notification.title}</h2>
                            <p className="text-sm text-gray-400 mt-1">
                                {new Date(notification.created_at).toLocaleString('en-US', {
                                    dateStyle: 'full',
                                    timeStyle: 'short'
                                })}
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-800 rounded-lg"
                        >
                            <X size={24} />
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6">
                    {/* Main Message */}
                    <div className="bg-gradient-to-br from-red-500/10 to-orange-500/10 border border-red-500/20 rounded-lg p-4">
                        <h3 className="text-sm font-semibold text-red-400 mb-2 uppercase tracking-wide">
                            Public Health Alert
                        </h3>
                        <p className="text-gray-200 leading-relaxed">{notification.message}</p>
                    </div>

                    {/* Statistics */}
                    {directive?.statistics && (
                        <div className="bg-gray-800/50 rounded-lg p-5 border border-gray-700">
                            <h3 className="text-sm font-semibold mb-4 text-gray-300 flex items-center gap-2">
                                <TrendingUp size={16} />
                                Analysis Statistics
                            </h3>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="text-center">
                                    <p className="text-3xl font-bold text-red-400">
                                        {directive.statistics.total_counterfeits}
                                    </p>
                                    <p className="text-xs text-gray-400 mt-1">Total Counterfeits</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-3xl font-bold text-yellow-400">
                                        {Object.keys(directive.statistics.hotspots || {}).length}
                                    </p>
                                    <p className="text-xs text-gray-400 mt-1">Hotspot Regions</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-3xl font-bold text-blue-400">
                                        {directive.statistics.top_drugs?.length || 0}
                                    </p>
                                    <p className="text-xs text-gray-400 mt-1">Drugs Affected</p>
                                </div>
                            </div>

                            {/* Top Drugs */}
                            {directive.statistics.top_drugs && directive.statistics.top_drugs.length > 0 && (
                                <div className="mt-4 pt-4 border-t border-gray-700">
                                    <p className="text-xs text-gray-400 mb-2">Most Affected Drugs:</p>
                                    <div className="flex flex-wrap gap-2">
                                        {directive.statistics.top_drugs.map((drug: string, i: number) => (
                                            <span key={i} className="text-xs px-2 py-1 bg-blue-500/20 text-blue-300 rounded">
                                                {drug}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Affected Regions */}
                    {notification.affected_regions && notification.affected_regions.length > 0 && (
                        <div>
                            <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
                                <MapPin size={16} />
                                Affected Regions
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {notification.affected_regions.map((region: string) => (
                                    <span
                                        key={region}
                                        className="px-3 py-1.5 bg-red-500/20 text-red-400 rounded-full text-sm font-medium border border-red-500/30"
                                    >
                                        {region}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Python Execution Insights */}
                    {directive?.python_execution?.insights && directive.python_execution.insights.length > 0 && (
                        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                            <h3 className="text-sm font-semibold text-green-400 mb-2">
                                AI-Powered Insights
                            </h3>
                            <ul className="space-y-1.5">
                                {directive.python_execution.insights.map((insight: string, i: number) => (
                                    <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                                        <span className="text-green-400 mt-0.5">●</span>
                                        <span>{insight}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Recommendations */}
                    {directive?.recommendations && directive.recommendations.length > 0 && (
                        <div>
                            <h3 className="text-sm font-semibold text-gray-300 mb-3">
                                Recommended Actions for NAFDAC
                            </h3>
                            <ul className="space-y-2">
                                {directive.recommendations.map((rec: string, i: number) => (
                                    <li key={i} className="flex items-start gap-3 bg-gray-800/30 p-3 rounded-lg border border-gray-700/50">
                                        <span className="text-green-400 font-bold text-lg flex-shrink-0">{i + 1}.</span>
                                        <span className="text-gray-200 text-sm">{rec}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-800 bg-gray-800/30 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
