import React from 'react';

interface StatCardProps {
  label: string;
  value: string;
  change?: string;
  barWidth: string;
  barColor?: 'gold' | 'charcoal';
}

export default function StatCard({ label, value, change, barWidth, barColor = 'charcoal' }: StatCardProps) {
  const bgClass = barColor === 'gold' ? 'bg-gold' : 'bg-charcoal/20';
  
  return (
    <div className="border border-lines p-8 hover:bg-surface transition-colors duration-500">
      <div className="flex justify-between items-start mb-6">
        <h3 className="font-sans text-xs uppercase tracking-widest text-charcoal/60">{label}</h3>
        {change && (
          <span className="font-sans text-xs font-semibold text-green-700 bg-green-100/50 px-2 py-1">{change}</span>
        )}
      </div>
      <div className="font-serif text-5xl text-charcoal mb-4">{value}</div>
      <div className="w-full bg-lines h-1 mt-auto">
        <div className={`h-full ${bgClass}`} style={{ width: barWidth }}></div>
      </div>
    </div>
  );
}
