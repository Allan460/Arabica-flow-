import { useState, useEffect } from 'react';
import { 
  collection, 
  onSnapshot, 
  updateDoc, 
  doc,
  query, 
  orderBy, 
  serverTimestamp 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { 
  Coffee, 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  Loader2,
  Filter,
  Search,
  ChevronRight,
  TrendingUp,
  History,
  Thermometer,
  MapPin,
  Save,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { Batch, Farmer, ProcessingStatus } from '../types';
import { cn } from '../lib/utils';

const STAGES: ProcessingStatus[] = ['Intake', 'Sorting', 'Batching', 'Hulling', 'Washing', 'Drying', 'Ready'];

export default function ProcessingWorkflow() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [loading, setLoading] = useState<string | null>(null);
  const [filter, setFilter] = useState<ProcessingStatus | 'All'>('All');

  useEffect(() => {
    const qBatches = query(collection(db, 'batches'), orderBy('updatedAt', 'desc'));
    const unsubscribeBatches = onSnapshot(qBatches, (snapshot) => {
      setBatches(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Batch)));
    });

    const qFarmers = query(collection(db, 'farmers'));
    const unsubscribeFarmers = onSnapshot(qFarmers, (snapshot) => {
      setFarmers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Farmer)));
    });

    return () => {
      unsubscribeBatches();
      unsubscribeFarmers();
    };
  }, []);

  const handleAdvance = async (batch: Batch) => {
    const currentIndex = STAGES.indexOf(batch.status);
    if (currentIndex === STAGES.length - 1) return;

    setLoading(batch.id);
    try {
      const nextStatus = STAGES[currentIndex + 1];
      const historyEntry = {
        status: nextStatus,
        timestamp: new Date(),
        notes: `Advanced to ${nextStatus} stage`
      };
      
      await updateDoc(doc(db, 'batches', batch.id), {
        status: nextStatus,
        history: [...(batch.history || []), historyEntry],
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `batches/${batch.id}`);
    } finally {
      setLoading(null);
    }
  };

  const handleUpdateStorage = async (batchId: string, temp: number, loc: string) => {
    setLoading(batchId);
    try {
      await updateDoc(doc(db, 'batches', batchId), {
        storageTemperature: temp,
        storageLocation: loc,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `batches/${batchId}`);
    } finally {
      setLoading(null);
    }
  };

  const filteredBatches = batches.filter(b => filter === 'All' || b.status === filter);

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Processing Workflow</h1>
          <p className="text-stone-500 text-sm">Track and advance coffee batches through processing stages.</p>
        </div>
        
        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
          <button 
            onClick={() => setFilter('All')}
            className={cn(
              "px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap",
              filter === 'All' ? "bg-stone-900 text-white" : "bg-white text-stone-500 hover:bg-stone-100"
            )}
          >
            All Batches
          </button>
          {STAGES.map(stage => (
            <button 
              key={stage}
              onClick={() => setFilter(stage)}
              className={cn(
                "px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap",
                filter === stage ? "bg-amber-600 text-white" : "bg-white text-stone-500 hover:bg-stone-100"
              )}
            >
              {stage}
            </button>
          ))}
        </div>
      </header>

      <div className="grid grid-cols-1 gap-6">
        <AnimatePresence mode="popLayout">
          {filteredBatches.map((batch) => {
            const farmer = farmers.find(f => f.id === batch.farmerId);
            const currentIndex = STAGES.indexOf(batch.status);
            const progress = ((currentIndex + 1) / STAGES.length) * 100;

            return (
              <motion.div 
                key={batch.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white p-6 rounded-3xl border border-stone-100 shadow-sm hover:shadow-md transition-all"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-stone-50 flex items-center justify-center shrink-0">
                      <Coffee className={cn(
                        "w-7 h-7 transition-colors",
                        batch.status === 'Ready' ? "text-emerald-600" : "text-amber-700"
                      )} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-stone-900">{batch.weight}kg {batch.type}</h3>
                        <span className="text-xs font-mono text-stone-400">#{batch.id.slice(0, 8)}</span>
                      </div>
                      <p className="text-sm text-stone-500 font-medium">
                        Farmer: <span className="text-stone-900">{farmer?.name || 'Unknown'}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex-1 max-w-md">
                    <div className="flex justify-between items-end mb-2">
                      <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">Progress</span>
                      <span className="text-xs font-bold text-amber-700">{Math.round(progress)}% Complete</span>
                    </div>
                    <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        className={cn(
                          "h-full transition-all duration-500",
                          batch.status === 'Ready' ? "bg-emerald-500" : "bg-amber-600"
                        )}
                      />
                    </div>
                    <div className="flex justify-between mt-2">
                      <span className="text-[10px] font-bold text-stone-400 uppercase">{STAGES[0]}</span>
                      <span className="text-[10px] font-bold text-stone-400 uppercase">{STAGES[STAGES.length - 1]}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right hidden sm:block">
                      <p className="text-xs font-bold text-stone-400 uppercase tracking-wider">Current Stage</p>
                      <p className="text-sm font-black text-stone-900">{batch.status}</p>
                    </div>
                    
                    {batch.status !== 'Ready' ? (
                      <button 
                        onClick={() => handleAdvance(batch)}
                        disabled={loading === batch.id}
                        className="flex items-center gap-2 px-6 py-3 bg-stone-900 text-white rounded-2xl font-bold hover:bg-stone-800 transition-all shadow-lg shadow-stone-200 disabled:opacity-50 group"
                      >
                        {loading === batch.id ? (
                          <Loader2 size={18} className="animate-spin" />
                        ) : (
                          <>
                            <span>Next Stage</span>
                            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                          </>
                        )}
                      </button>
                    ) : (
                      <div className="flex items-center gap-2 px-6 py-3 bg-emerald-50 text-emerald-700 rounded-2xl font-bold border border-emerald-100">
                        <CheckCircle2 size={18} />
                        <span>Ready for Sale</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-stone-50 flex flex-wrap gap-4 items-center text-xs text-stone-400">
                  <div className="flex items-center gap-1.5">
                    <Clock size={14} />
                    Last updated {format(batch.updatedAt?.toDate() || new Date(), 'MMM d, HH:mm')}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <TrendingUp size={14} />
                    Quality: <span className="text-stone-600 font-bold">{batch.quality}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <History size={14} />
                    Intake: {format(batch.createdAt?.toDate() || new Date(), 'MMM d, yyyy')}
                  </div>
                </div>

                {(batch.status === 'Drying' || batch.status === 'Ready') && (
                  <div className="mt-4 p-4 bg-stone-50 rounded-2xl border border-stone-100 flex flex-col sm:flex-row items-center gap-4">
                    <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="relative">
                        <Thermometer className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={14} />
                        <input 
                          type="number"
                          placeholder="Temp (°C)"
                          defaultValue={batch.storageTemperature}
                          onBlur={(e) => {
                            const val = parseFloat(e.target.value);
                            if (!isNaN(val) && val !== batch.storageTemperature) {
                              handleUpdateStorage(batch.id, val, batch.storageLocation || '');
                            }
                          }}
                          className="w-full pl-9 pr-3 py-2 bg-white border border-stone-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-amber-500"
                        />
                      </div>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={14} />
                        <input 
                          type="text"
                          placeholder="Storage Location (e.g. Rack A1)"
                          defaultValue={batch.storageLocation}
                          onBlur={(e) => {
                            const val = e.target.value;
                            if (val !== batch.storageLocation) {
                              handleUpdateStorage(batch.id, batch.storageTemperature || 0, val);
                            }
                          }}
                          className="w-full pl-9 pr-3 py-2 bg-white border border-stone-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-amber-500"
                        />
                      </div>
                    </div>
                    <div className="text-[10px] text-stone-400 font-bold uppercase flex items-center gap-1">
                      <Info size={12} />
                      Auto-saves on blur
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}
          {filteredBatches.length === 0 && (
            <div className="text-center py-20 bg-white rounded-3xl border border-stone-100 border-dashed">
              <div className="w-16 h-16 bg-stone-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Coffee className="text-stone-300" />
              </div>
              <h3 className="text-lg font-bold text-stone-900">No batches in this stage</h3>
              <p className="text-stone-500 mt-1">Try selecting a different stage or register a new intake.</p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
