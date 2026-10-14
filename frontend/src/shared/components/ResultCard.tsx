import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '../utils/cn.ts';

interface ResultCardProps {
  result: any;
  error?: string | null;
  onReset?: () => void;
  resetLabel?: string;
}

export const ResultCard: React.FC<ResultCardProps> = ({
  result,
  error = null,
  onReset,
  resetLabel = 'Clear Result'
}) => {
  return (
    <AnimatePresence>
      {(result || error) && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6"
        >
          {error ? (
            <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-2xl flex items-start">
              <AlertCircle className="text-red-500 mr-4 shrink-0" />
              <div>
                <h3 className="text-red-500 font-bold">Error</h3>
                <p className="text-red-400 text-sm mt-1">{error}</p>
              </div>
            </div>
          ) : result && (
            <div className={cn(
              "p-6 rounded-3xl border",
              result.confidence < 0.8 ? "bg-amber-500/10 border-amber-500/20" : "bg-brand-green/10 border-brand-green/20"
            )}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  {result.confidence < 0.8 ? (
                    <AlertCircle className="text-amber-500 mr-2" />
                  ) : (
                    <CheckCircle2 className="text-brand-green mr-2" />
                  )}
                  <h3 className={cn(
                    "text-xl font-bold",
                    result.confidence < 0.8 ? "text-amber-500" : "text-brand-green"
                  )}>
                    {result.result}
                  </h3>
                </div>
                <div className="text-right">
                  <div className="text-[10px] uppercase font-bold text-stone-500">Confidence</div>
                  <div className="text-lg font-bold">{(result.confidence * 100).toFixed(1)}%</div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-sm font-bold text-stone-300">Recommendations:</h4>
                <div className="grid grid-cols-1 gap-2">
                  {result.recommendations.map((rec: string, i: number) => (
                    <div key={i} className="bg-dark-bg/50 p-3 rounded-xl border border-dark-border text-stone-400 text-xs leading-relaxed">
                      {rec}
                    </div>
                  ))}
                </div>
              </div>

              {onReset && (
                <button
                  type="button"
                  onClick={onReset}
                  className="mt-5 w-full rounded-2xl border border-dark-border px-4 py-3 text-sm font-bold text-stone-300 transition-colors hover:border-stone-500"
                >
                  {resetLabel}
                </button>
              )}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};
