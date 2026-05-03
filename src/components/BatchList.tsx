import React, { useState, useEffect } from 'react';
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  query, 
  orderBy, 
  serverTimestamp,
  getDocs,
  where
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { 
  Coffee, 
  Plus, 
  Search, 
  Scale, 
  Award, 
  Tag, 
  Calendar,
  X,
  Loader2,
  CheckCircle2,
  ArrowRight,
  User,
  History
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { Batch, Farmer, PriceConfig, CoffeeQuality, CoffeeType } from '../types';
import { cn } from '../lib/utils';
import EmptyState from './EmptyState';

export default function BatchList() {
  const navigate = useNavigate();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [prices, setPrices] = useState<PriceConfig[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [farmerFilter, setFarmerFilter] = useState<string>('All');
  const [qualityFilter, setQualityFilter] = useState<string>('All');
  const [isAdding, setIsAdding] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [newBatch, setNewBatch] = useState({
    farmerId: '',
    weight: '',
    quality: 'Grade A' as CoffeeQuality,
    type: 'Arabica' as CoffeeType
  });

  useEffect(() => {
    const qBatches = query(collection(db, 'batches'), orderBy('createdAt', 'desc'));
    const unsubscribeBatches = onSnapshot(qBatches, (snapshot) => {
      setBatches(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Batch)));
    });

    const qFarmers = query(collection(db, 'farmers'), orderBy('name', 'asc'));
    const unsubscribeFarmers = onSnapshot(qFarmers, (snapshot) => {
      setFarmers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Farmer)));
    });

    const qPrices = query(collection(db, 'prices'));
    const unsubscribePrices = onSnapshot(qPrices, (snapshot) => {
      setPrices(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PriceConfig)));
    });

    return () => {
      unsubscribeBatches();
      unsubscribeFarmers();
      unsubscribePrices();
    };
  }, []);

  const currentPrice = prices.find(p => p.type === newBatch.type)?.pricePerKg || 0;
  const totalPrice = (parseFloat(newBatch.weight) || 0) * currentPrice;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBatch.farmerId || !newBatch.weight) return;

    setLoading(true);
    try {
      await addDoc(collection(db, 'batches'), {
        farmerId: newBatch.farmerId,
        weight: parseFloat(newBatch.weight),
        quality: newBatch.quality,
        type: newBatch.type,
        status: 'Intake',
        pricePerKg: currentPrice,
        totalPrice: totalPrice,
        paymentStatus: 'Pending',
        paymentMethod: farmers.find(f => f.id === newBatch.farmerId)?.paymentPreference || 'Cash',
        history: [{
          status: 'Intake',
          timestamp: new Date(),
          notes: 'Initial intake recorded'
        }],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      setIsAdding(false);
      setNewBatch({ farmerId: '', weight: '', quality: 'Grade A', type: 'Robusta' });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'batches');
    } finally {
      setLoading(false);
    }
  };

  const filteredBatches = batches.filter(b => {
    const farmer = farmers.find(f => f.id === b.farmerId);
    
    const matchesSearch = 
      farmer?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.status.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'All' || b.status === statusFilter;
    const matchesFarmer = farmerFilter === 'All' || b.farmerId === farmerFilter;
    const matchesQuality = qualityFilter === 'All' || b.quality === qualityFilter;

    return matchesSearch && matchesStatus && matchesFarmer && matchesQuality;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Coffee Intake</h1>
          <p className="text-stone-500 text-sm">Record new coffee arrivals and calculate payouts.</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-amber-700 text-white rounded-xl font-bold hover:bg-amber-800 transition-all shadow-lg shadow-amber-100"
        >
          <Plus size={20} />
          New Intake
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={20} />
          <input 
            type="text"
            placeholder="Search by farmer name, batch ID, or status..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-stone-100 rounded-2xl focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all shadow-sm"
          />
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:flex gap-3">
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-3 bg-white border border-stone-100 rounded-2xl text-sm font-medium text-stone-600 focus:ring-2 focus:ring-amber-500 outline-none transition-all shadow-sm"
          >
            <option value="All">All Statuses</option>
            {['Intake', 'Sorting', 'Batching', 'Hulling', 'Washing', 'Drying', 'Ready'].map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          <select 
            value={farmerFilter}
            onChange={(e) => setFarmerFilter(e.target.value)}
            className="px-4 py-3 bg-white border border-stone-100 rounded-2xl text-sm font-medium text-stone-600 focus:ring-2 focus:ring-amber-500 outline-none transition-all shadow-sm"
          >
            <option value="All">All Farmers</option>
            {farmers.map(f => (
              <option key={f.id} value={f.id}>{f.name}</option>
            ))}
          </select>

          <select 
            value={qualityFilter}
            onChange={(e) => setQualityFilter(e.target.value)}
            className="px-4 py-3 bg-white border border-stone-100 rounded-2xl text-sm font-medium text-stone-600 focus:ring-2 focus:ring-amber-500 outline-none transition-all shadow-sm"
          >
            <option value="All">All Qualities</option>
            {['Grade A', 'Grade B', 'Grade C'].map(q => (
              <option key={q} value={q}>{q}</option>
            ))}
          </select>

          {(searchTerm || statusFilter !== 'All' || farmerFilter !== 'All' || qualityFilter !== 'All') && (
            <button 
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('All');
                setFarmerFilter('All');
                setQualityFilter('All');
              }}
              className="px-4 py-3 bg-stone-100 text-stone-600 rounded-2xl text-sm font-bold hover:bg-stone-200 transition-all flex items-center gap-2"
            >
              <X size={16} />
              Clear
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-stone-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-100">
                <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-wider">Batch ID</th>
                <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-wider">Farmer</th>
                <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-wider">Type / Quality</th>
                <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-wider">Weight</th>
                <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-wider">Total Payout</th>
                <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50">
              {filteredBatches.length > 0 ? (
                filteredBatches.map((batch) => {
                  const farmer = farmers.find(f => f.id === batch.farmerId);
                  return (
                    <tr key={batch.id} className="hover:bg-stone-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <span className="font-mono text-xs text-stone-400">#{batch.id.slice(0, 8)}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-500">
                            <User size={14} />
                          </div>
                          <span className="text-sm font-bold text-stone-900">{farmer?.name || 'Unknown'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-stone-900">{batch.type}</span>
                          <span className="text-xs text-stone-500">{batch.quality}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-bold text-stone-900">{batch.weight} kg</span>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={batch.status} />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-emerald-600">UGX {batch.totalPrice.toLocaleString()}</span>
                          <div className="flex items-center gap-1 mt-1">
                            <div className={cn(
                              "w-1.5 h-1.5 rounded-full",
                              batch.paymentStatus === 'Paid' ? "bg-emerald-500" : "bg-amber-500"
                            )} />
                            <span className="text-[10px] font-bold text-stone-500 uppercase">{batch.paymentStatus || 'Pending'}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs text-stone-500">
                          {batch.createdAt ? format(batch.createdAt.toDate(), 'MMM d, HH:mm') : 'Recent'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => navigate(`/batches/${batch.id}/history`)}
                          className="p-2 hover:bg-stone-100 rounded-lg transition-colors text-stone-400 hover:text-amber-700"
                          title="View History"
                        >
                          <History size={18} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="px-6 py-12">
                    <EmptyState 
                      icon={Coffee}
                      title={searchTerm || statusFilter !== 'All' || farmerFilter !== 'All' || qualityFilter !== 'All' ? "No batches found" : "No coffee batches"}
                      description={searchTerm || statusFilter !== 'All' || farmerFilter !== 'All' || qualityFilter !== 'All' ? "Try clearing your filters to see all coffee batches." : "Record your first coffee intake to start tracking processing and payments."}
                      actionLabel={searchTerm || statusFilter !== 'All' || farmerFilter !== 'All' || qualityFilter !== 'All' ? undefined : "New Intake"}
                      onAction={searchTerm || statusFilter !== 'All' || farmerFilter !== 'All' || qualityFilter !== 'All' ? undefined : () => setIsAdding(true)}
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Batch Modal */}
      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-stone-100 flex items-center justify-between">
                <h2 className="text-xl font-bold text-stone-900">New Coffee Intake</h2>
                <button onClick={() => setIsAdding(false)} className="p-2 hover:bg-stone-100 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-stone-700 mb-1">Select Farmer</label>
                    <select 
                      required
                      value={newBatch.farmerId}
                      onChange={(e) => setNewBatch(prev => ({ ...prev, farmerId: e.target.value }))}
                      className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none transition-all"
                    >
                      <option value="">Choose a farmer...</option>
                      {farmers.map(f => (
                        <option key={f.id} value={f.id}>{f.name} ({f.contact})</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-stone-700 mb-1">Coffee Type</label>
                      <select 
                        value={newBatch.type}
                        onChange={(e) => setNewBatch(prev => ({ ...prev, type: e.target.value as CoffeeType }))}
                        className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none transition-all"
                      >
                        <option value="Robusta">Robusta</option>
                        <option value="Arabica">Arabica</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-stone-700 mb-1">Quality Grade</label>
                      <select 
                        value={newBatch.quality}
                        onChange={(e) => setNewBatch(prev => ({ ...prev, quality: e.target.value as CoffeeQuality }))}
                        className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none transition-all"
                      >
                        <option value="Grade A">Grade A</option>
                        <option value="Grade B">Grade B</option>
                        <option value="Grade C">Grade C</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-stone-700 mb-1">Weight (kg)</label>
                    <div className="relative">
                      <Scale className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
                      <input 
                        required
                        type="number"
                        step="0.1"
                        value={newBatch.weight}
                        onChange={(e) => setNewBatch(prev => ({ ...prev, weight: e.target.value }))}
                        className="w-full pl-12 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none transition-all"
                        placeholder="0.0"
                      />
                    </div>
                  </div>

                  <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">Current Price</span>
                      <span className="text-sm font-bold text-amber-900">UGX {currentPrice.toLocaleString()} / kg</span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-amber-200">
                      <span className="text-sm font-bold text-stone-700">Estimated Payout</span>
                      <span className="text-lg font-black text-emerald-700">UGX {totalPrice.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex gap-3">
                  <button 
                    type="button"
                    onClick={() => setIsAdding(false)}
                    className="flex-1 py-3 px-4 bg-stone-100 text-stone-600 rounded-xl font-bold hover:bg-stone-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={loading || !newBatch.farmerId || !newBatch.weight}
                    className="flex-1 py-3 px-4 bg-amber-700 text-white rounded-xl font-bold hover:bg-amber-800 transition-colors shadow-lg shadow-amber-100 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {loading && <Loader2 size={18} className="animate-spin" />}
                    Confirm Intake
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
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

  const dotColors: Record<string, string> = {
    'Intake': 'bg-blue-400',
    'Sorting': 'bg-amber-400',
    'Batching': 'bg-purple-400',
    'Hulling': 'bg-orange-400',
    'Washing': 'bg-cyan-400',
    'Drying': 'bg-yellow-400',
    'Ready': 'bg-emerald-400',
  };

  return (
    <span className={cn(
      "px-2.5 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 w-fit",
      styles[status] || 'bg-stone-50 text-stone-600 border-stone-100'
    )}>
      <span className={cn("w-1.5 h-1.5 rounded-full", dotColors[status] || 'bg-stone-400')} />
      {status}
    </span>
  );
}
