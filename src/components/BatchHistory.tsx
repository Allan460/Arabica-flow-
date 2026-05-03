import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { 
  Coffee, 
  ArrowLeft, 
  Clock, 
  CheckCircle2, 
  User,
  Calendar,
  ChevronRight,
  History as HistoryIcon
} from 'lucide-react';
import { motion } from 'motion/react';
import { format } from 'date-fns';
import { Batch, Farmer } from '../types';
import { cn } from '../lib/utils';

export default function BatchHistory() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [batch, setBatch] = useState<Batch | null>(null);
  const [farmer, setFarmer] = useState<Farmer | null>(null);

  useEffect(() => {
    if (!id) return;

    const unsubscribeBatch = onSnapshot(doc(db, 'batches', id), (snapshot) => {
      if (snapshot.exists()) {
        const batchData = { id: snapshot.id, ...snapshot.data() } as Batch;
        setBatch(batchData);

        // Fetch farmer info
        const unsubscribeFarmer = onSnapshot(doc(db, 'farmers', batchData.farmerId), (fSnapshot) => {
          if (fSnapshot.exists()) {
            setFarmer({ id: fSnapshot.id, ...fSnapshot.data() } as Farmer);
          }
        });
        return () => unsubscribeFarmer();
      }
    });

    return () => unsubscribeBatch();
  }, [id]);

  if (!batch) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-700"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 relative">
      {/* Immersive Background Header */}
      <div className="absolute -top-12 -left-12 -right-12 h-64 overflow-hidden rounded-b-[4rem] z-0">
        <img 
          src="https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&q=80&w=1920" 
          alt="Coffee Beans"
          className="w-full h-full object-cover opacity-10 scale-105"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-stone-50/0 via-stone-50/40 to-stone-50" />
      </div>

      <header className="relative z-10 pt-6">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-stone-500 hover:text-stone-900 transition-colors mb-6 font-bold text-sm"
        >
          <ArrowLeft size={18} />
          Back to Batches
        </button>
        
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-1.5 bg-amber-600 rounded-full" />
              <span className="text-xs font-black uppercase tracking-[0.2em] text-amber-900 drop-shadow-sm">Batch Tracking</span>
            </div>
            <h1 className="text-4xl font-black text-stone-900 tracking-tight leading-tight">
              Batch <span className="text-amber-700">#{batch.id.slice(0, 8)}</span>
            </h1>
            <p className="text-stone-600 mt-2 text-lg font-medium">
              Complete historical record of status changes and processing updates.
            </p>
          </div>
          
          <div className="bg-white/80 backdrop-blur-md p-4 rounded-2xl border border-white/20 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-stone-100 flex items-center justify-center text-stone-500">
              <User size={20} />
            </div>
            <div>
              <p className="text-xs font-bold text-stone-400 uppercase tracking-wider">Farmer</p>
              <p className="text-sm font-black text-stone-900">{farmer?.name || 'Loading...'}</p>
            </div>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">
        {/* Batch Summary */}
        <div className="space-y-6">
          <div className="bg-white/80 backdrop-blur-md p-6 rounded-3xl border border-white/20 shadow-sm">
            <h2 className="text-lg font-bold text-stone-900 mb-6 flex items-center gap-2">
              <Coffee size={20} className="text-amber-700" />
              Batch Specifications
            </h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-stone-50">
                <span className="text-sm text-stone-500">Type</span>
                <span className="text-sm font-bold text-stone-900">{batch.type}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-stone-50">
                <span className="text-sm text-stone-500">Quality</span>
                <span className="text-sm font-bold text-stone-900">{batch.quality}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-stone-50">
                <span className="text-sm text-stone-500">Weight</span>
                <span className="text-sm font-bold text-stone-900">{batch.weight} kg</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-stone-50">
                <span className="text-sm text-stone-500">Total Payout</span>
                <span className="text-sm font-bold text-emerald-600">UGX {batch.totalPrice.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-stone-500">Current Status</span>
                <StatusBadge status={batch.status} />
              </div>
            </div>
          </div>

          <div className="bg-amber-900 text-amber-50 p-6 rounded-3xl shadow-xl shadow-amber-900/20 relative overflow-hidden">
            <div className="relative z-10">
              <HistoryIcon size={32} className="mb-4 opacity-50" />
              <h3 className="text-xl font-black mb-2">Audit Trail</h3>
              <p className="text-amber-200/80 text-sm leading-relaxed">
                This historical record is immutable and serves as the official processing log for quality assurance and compliance.
              </p>
            </div>
            <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-amber-800 rounded-full blur-3xl opacity-50" />
          </div>
        </div>

        {/* Timeline */}
        <div className="lg:col-span-2 bg-white/80 backdrop-blur-md p-8 rounded-3xl border border-white/20 shadow-sm">
          <h2 className="text-xl font-black text-stone-900 mb-8 flex items-center gap-3">
            <Clock size={24} className="text-amber-600" />
            Processing Timeline
          </h2>

          <div className="relative space-y-8">
            {/* Vertical Line */}
            <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-stone-100" />

            {batch.history?.slice().reverse().map((entry, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="relative pl-12"
              >
                {/* Timeline Dot */}
                <div className={cn(
                  "absolute left-2 top-1.5 w-4.5 h-4.5 rounded-full border-4 border-white shadow-sm z-10",
                  idx === 0 ? "bg-amber-600 scale-125" : "bg-stone-300"
                )} />

                <div className={cn(
                  "p-5 rounded-2xl border transition-all",
                  idx === 0 ? "bg-amber-50 border-amber-100 shadow-md shadow-amber-900/5" : "bg-white border-stone-50"
                )}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                    <h3 className={cn(
                      "font-black text-lg",
                      idx === 0 ? "text-amber-900" : "text-stone-900"
                    )}>
                      {entry.status}
                    </h3>
                    <div className="flex items-center gap-2 text-xs font-bold text-stone-400">
                      <Calendar size={14} />
                      {entry.timestamp ? format(entry.timestamp.toDate ? entry.timestamp.toDate() : new Date(entry.timestamp), 'MMM d, yyyy • HH:mm') : 'N/A'}
                    </div>
                  </div>
                  <p className={cn(
                    "text-sm font-medium",
                    idx === 0 ? "text-amber-700/80" : "text-stone-500"
                  )}>
                    {entry.notes || 'Status updated in the processing workflow.'}
                  </p>
                </div>
              </motion.div>
            ))}

            {(!batch.history || batch.history.length === 0) && (
              <div className="text-center py-12 text-stone-400 italic">
                No history records found for this batch.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    'Intake': 'bg-blue-50 text-blue-600 border-blue-100',
    'Sorting': 'bg-amber-50 text-amber-600 border-amber-100',
    'Batching': 'bg-purple-50 text-purple-600 border-purple-100',
    'Hulling': 'bg-orange-50 text-orange-600 border-orange-100',
    'Washing': 'bg-cyan-50 text-cyan-600 border-cyan-100',
    'Drying': 'bg-yellow-50 text-yellow-600 border-yellow-100',
    'Ready': 'bg-emerald-50 text-emerald-600 border-emerald-100',
  };

  return (
    <span className={cn(
      "px-3 py-1 rounded-full text-xs font-black border uppercase tracking-wider",
      styles[status] || 'bg-stone-50 text-stone-600 border-stone-100'
    )}>
      {status}
    </span>
  );
}
