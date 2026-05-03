import React, { useState, useEffect } from 'react';
import { 
  collection, 
  onSnapshot, 
  query, 
  orderBy, 
  doc,
  updateDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { 
  DollarSign, 
  Smartphone, 
  CreditCard, 
  Banknote, 
  CheckCircle2, 
  Clock, 
  Search,
  ArrowRight,
  ShieldCheck,
  Loader2,
  User,
  History
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { Batch, Farmer, PaymentMethod } from '../types';
import { cn } from '../lib/utils';
import EmptyState from './EmptyState';

export default function PaymentManager() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'All' | 'Pending' | 'Paid'>('Pending');

  useEffect(() => {
    const unsubscribeBatches = onSnapshot(
      query(collection(db, 'batches'), orderBy('createdAt', 'desc')),
      (snapshot) => setBatches(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Batch)))
    );

    const unsubscribeFarmers = onSnapshot(
      query(collection(db, 'farmers')),
      (snapshot) => setFarmers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Farmer)))
    );

    return () => {
      unsubscribeBatches();
      unsubscribeFarmers();
    };
  }, []);

  const handleProcessPayment = async (batch: Batch) => {
    setProcessingId(batch.id);
    try {
      const batchRef = doc(db, 'batches', batch.id);
      const reference = `PAY-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
      
      await updateDoc(batchRef, {
        paymentStatus: 'Paid',
        paymentReference: reference,
        updatedAt: serverTimestamp(),
        history: [
          ...batch.history,
          {
            status: batch.status,
            timestamp: new Date(),
            notes: `Payment processed via ${batch.paymentMethod || 'Cash'}. Ref: ${reference}`
          }
        ]
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'batches');
    } finally {
      setProcessingId(null);
    }
  };

  const filteredBatches = batches.filter(b => {
    const farmer = farmers.find(f => f.id === b.farmerId);
    const matchesSearch = farmer?.name.toLowerCase().includes(searchTerm.toLowerCase()) || b.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === 'All' || (filter === 'Pending' && b.paymentStatus !== 'Paid') || (filter === 'Paid' && b.paymentStatus === 'Paid');
    return matchesSearch && matchesFilter;
  });

  const getPaymentIcon = (method?: PaymentMethod) => {
    switch (method) {
      case 'MTN Mobile Money':
      case 'Airtel Money':
        return <Smartphone size={18} className="text-yellow-600" />;
      case 'Bank Transfer':
        return <CreditCard size={18} className="text-blue-600" />;
      case 'Cash':
        return <Banknote size={18} className="text-emerald-600" />;
      default:
        return <DollarSign size={18} className="text-stone-400" />;
    }
  };

  return (
    <div className="space-y-8 relative">
      {/* Immersive Background Header */}
      <div className="absolute -top-12 -left-12 -right-12 h-80 overflow-hidden rounded-b-[4rem] z-0">
        <img 
          src="https://images.unsplash.com/photo-1580519542036-c47de6196ba5?auto=format&fit=crop&q=80&w=1920" 
          alt="Payments"
          className="w-full h-full object-cover opacity-20 scale-105"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-stone-50/0 via-stone-50/40 to-stone-50" />
      </div>

      <header className="relative z-10 pt-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-1.5 bg-amber-600 rounded-full" />
          <span className="text-xs font-black uppercase tracking-[0.2em] text-amber-900 drop-shadow-sm">Financial Operations</span>
        </div>
        <h1 className="text-4xl font-black text-stone-900 tracking-tight leading-tight">
          Farmer <span className="text-amber-700">Disbursements</span>
        </h1>
        <p className="text-stone-600 mt-2 text-lg font-medium">
          Process payments to farmers via Mobile Money, Bank, or Cash.
        </p>
      </header>

      <div className="relative z-10 space-y-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={20} />
            <input 
              type="text"
              placeholder="Search by farmer name or batch ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white/80 backdrop-blur-md border border-white/20 rounded-2xl focus:ring-2 focus:ring-amber-500 outline-none transition-all shadow-sm"
            />
          </div>
          <div className="flex bg-white/80 backdrop-blur-md p-1 rounded-2xl border border-white/20 shadow-sm">
            {(['Pending', 'Paid', 'All'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "px-6 py-2 rounded-xl text-sm font-bold transition-all",
                  filter === f ? "bg-amber-600 text-white shadow-md" : "text-stone-500 hover:text-stone-900"
                )}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {filteredBatches.length > 0 ? (
            <AnimatePresence mode="popLayout">
              {filteredBatches.map((batch) => {
                const farmer = farmers.find(f => f.id === batch.farmerId);
                const isPaid = batch.paymentStatus === 'Paid';
                
                return (
                  <motion.div
                    key={batch.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white/80 backdrop-blur-md rounded-3xl border border-white/20 shadow-sm overflow-hidden hover:shadow-md transition-all group"
                  >
                    <div className="p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-stone-50 flex items-center justify-center shrink-0 group-hover:bg-amber-50 transition-colors">
                          <User className="text-stone-400 group-hover:text-amber-600 transition-colors" size={24} />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-stone-900">{farmer?.name || 'Unknown Farmer'}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs font-mono text-stone-400">Batch #{batch.id.slice(0, 8)}</span>
                            <span className="text-xs text-stone-300">•</span>
                            <span className="text-xs font-bold text-stone-500">{batch.weight}kg {batch.type}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-8">
                        <div className="flex flex-col">
                          <span className="text-xs font-black uppercase tracking-widest text-stone-400 mb-1">Payment Method</span>
                          <div className="flex items-center gap-2">
                            {getPaymentIcon(batch.paymentMethod)}
                            <span className="text-sm font-bold text-stone-700">{batch.paymentMethod || 'Cash'}</span>
                          </div>
                          {batch.paymentMethod === 'Bank Transfer' && farmer?.bankDetails && (
                            <span className="text-[10px] text-stone-400 mt-1">{farmer.bankDetails.bankName} • {farmer.bankDetails.accountNumber}</span>
                          )}
                          {(batch.paymentMethod === 'MTN Mobile Money' || batch.paymentMethod === 'Airtel Money') && farmer?.mobileMoneyNumber && (
                            <span className="text-[10px] text-stone-400 mt-1">{farmer.mobileMoneyNumber}</span>
                          )}
                        </div>

                        <div className="flex flex-col">
                          <span className="text-xs font-black uppercase tracking-widest text-stone-400 mb-1">Total Amount</span>
                          <span className="text-xl font-black text-emerald-700">UGX {batch.totalPrice.toLocaleString()}</span>
                        </div>

                        <div className="flex items-center gap-4">
                          {isPaid ? (
                            <div className="flex flex-col items-end">
                              <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100">
                                <ShieldCheck size={18} />
                                <span className="text-sm font-bold uppercase tracking-wider">Paid</span>
                              </div>
                              <span className="text-[10px] text-stone-400 mt-1 font-mono">{batch.paymentReference}</span>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleProcessPayment(batch)}
                              disabled={processingId === batch.id}
                              className="flex items-center gap-2 px-6 py-3 bg-amber-600 text-white rounded-2xl font-bold hover:bg-amber-700 transition-all shadow-lg shadow-amber-100 disabled:opacity-50"
                            >
                              {processingId === batch.id ? (
                                <Loader2 size={20} className="animate-spin" />
                              ) : (
                                <DollarSign size={20} />
                              )}
                              Disburse Funds
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          ) : (
            <EmptyState 
              icon={DollarSign}
              title={searchTerm || filter !== 'All' ? "No disbursements found" : "No pending payments"}
              description={searchTerm || filter !== 'All' ? "Try adjusting your search or filters to find the payment record." : "All farmer payouts are currently up to date. New batches will appear here for processing."}
            />
          )}
        </div>
      </div>
    </div>
  );
}
