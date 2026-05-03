import React from 'react';
import { LucideIcon, Plus } from 'lucide-react';
import { motion } from 'motion/react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function EmptyState({ icon: Icon, title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-20 px-4 text-center bg-white/40 backdrop-blur-md rounded-[3rem] border border-white/20 shadow-xl"
    >
      <div className="relative mb-8">
        <div className="absolute inset-0 bg-amber-200 blur-2xl opacity-20 rounded-full animate-pulse" />
        <div className="relative w-24 h-24 bg-gradient-to-br from-amber-50 to-amber-100 rounded-[2.5rem] flex items-center justify-center text-amber-600 shadow-inner border border-white/50">
          <Icon size={48} strokeWidth={1.2} />
        </div>
      </div>
      <h3 className="text-3xl font-black text-stone-900 mb-3 tracking-tight">{title}</h3>
      <p className="text-stone-500 max-w-sm mb-10 leading-relaxed font-medium">
        {description}
      </p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="group relative flex items-center gap-3 px-8 py-4 bg-stone-900 text-white rounded-2xl font-bold hover:bg-stone-800 transition-all shadow-xl shadow-stone-200 active:scale-95 overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-amber-500/0 via-amber-500/10 to-amber-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
          <Plus size={20} className="text-amber-400" />
          {actionLabel}
        </button>
      )}
    </motion.div>
  );
}
