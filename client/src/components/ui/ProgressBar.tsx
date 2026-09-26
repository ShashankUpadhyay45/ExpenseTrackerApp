import React from 'react';

interface ProgressBarProps {
  progress?: number;
  value?: number;
  max?: number;
  label?: string;
  showValue?: boolean;
  valueText?: string;
  color?: string;
  className?: string;
}

export function ProgressBar({ progress, value, max, label, showValue = true, valueText, color, className = '' }: ProgressBarProps) {
  let calcProgress = progress !== undefined ? progress : (value !== undefined && max && max > 0 ? (value / max) * 100 : 0);
  const clampedProgress = Math.min(Math.max(calcProgress, 0), 100);
  
  let barColor = 'bg-emerald-500';
  if (color) {
    barColor = color;
  } else if (clampedProgress >= 90) {
    barColor = 'bg-rose-500';
  } else if (clampedProgress >= 75) {
    barColor = 'bg-amber-500';
  }

  return (
    <div className={`w-full ${className}`}>
      {(label || showValue) && (
        <div className="flex justify-between items-center mb-1 text-sm">
          {label && <span className="font-medium text-slate-700 dark:text-slate-300">{label}</span>}
          {showValue && (
            <span className="text-slate-500 dark:text-slate-400 text-xs">
              {valueText || `${Math.round(clampedProgress)}%`}
            </span>
          )}
        </div>
      )}
      <div className="w-full h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
        <div
          className={`h-full ${barColor} transition-all duration-500 ease-out rounded-full`}
          style={{ width: `${clampedProgress}%` }}
        />
      </div>
    </div>
  );
}
