import React, { useState, useEffect } from 'react';
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  query, 
  orderBy, 
  serverTimestamp,
  doc,
  updateDoc
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { 
  ShoppingBag, 
  Plus, 
  Globe, 
  Truck, 
  FileText, 
  CheckCircle2, 
  X, 
  Loader2,
  DollarSign,
  User,
  MapPin,
  Ship,
  ShieldCheck,
  Search
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { Batch, Buyer, Sale, ExportDetails } from '../types';
import { cn } from '../lib/utils';
import EmptyState from './EmptyState';

export default function SalesManager() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [isAddingBuyer, setIsAddingBuyer] = useState(false);
  const [isRecordingSale, setIsRecordingSale] = useState(false);
  const [selectedSaleForDetails, setSelectedSaleForDetails] = useState<Sale | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [newBuyer, setNewBuyer] = useState({
    name: '',
    type: 'Local' as 'Local' | 'Exporter',
    contact: '',
    address: ''
  });

  const [newSale, setNewSale] = useState({
    batchId: '',
    buyerId: '',
    pricePerKg: '',
    type: 'Local' as 'Local' | 'Export',
    status: 'Pending' as 'Pending' | 'Completed' | 'Shipped',
    exportDetails: {
      destinationCountry: '',
      portOfOrigin: 'Mombasa',
      shippingLine: '',
      containerNumber: '',
      phytosanitaryCert: false,
      certificateOfOrigin: false,
      billOfLadingRef: '',
      exportStatus: 'Pending Shipment'
    } as ExportDetails
  });

  useEffect(() => {
    const unsubscribeBatches = onSnapshot(
      query(collection(db, 'batches'), orderBy('createdAt', 'desc')),
      (snapshot) => setBatches(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Batch)))
    );

    const unsubscribeBuyers = onSnapshot(
      query(collection(db, 'buyers'), orderBy('name', 'asc')),
      (snapshot) => setBuyers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Buyer)))
    );

    const unsubscribeSales = onSnapshot(
      query(collection(db, 'sales'), orderBy('createdAt', 'desc')),
      (snapshot) => setSales(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Sale)))
    );

    return () => {
      unsubscribeBatches();
      unsubscribeBuyers();
      unsubscribeSales();
    };
  }, []);

  const handleAddBuyer = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await addDoc(collection(db, 'buyers'), {
        ...newBuyer,
        createdAt: serverTimestamp()
      });
      setIsAddingBuyer(false);
      setNewBuyer({ name: '', type: 'Local', contact: '', address: '' });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'buyers');
    } finally {
      setLoading(false);
    }
  };

  const handleRecordSale = async (e: React.FormEvent) => {
    e.preventDefault();
    const batch = batches.find(b => b.id === newSale.batchId);
    if (!batch || !newSale.buyerId || !newSale.pricePerKg) return;

    setLoading(true);
    try {
      const price = parseFloat(newSale.pricePerKg);
      const totalAmount = batch.weight * price;

      const saleData: any = {
        batchId: newSale.batchId,
        buyerId: newSale.buyerId,
        saleDate: serverTimestamp(),
        weight: batch.weight,
        pricePerKg: price,
        totalAmount: totalAmount,
        type: newSale.type,
        status: newSale.status,
        createdAt: serverTimestamp()
      };

      if (newSale.type === 'Export') {
        saleData.exportDetails = newSale.exportDetails;
      }

      await addDoc(collection(db, 'sales'), saleData);
      
      // Update batch status to 'Ready' (or perhaps a new 'Sold' status)
      // For now, we'll keep it as is or update a flag if we had one.
      
      setIsRecordingSale(false);
      setNewSale({
        batchId: '',
        buyerId: '',
        pricePerKg: '',
        type: 'Local',
        status: 'Pending',
        exportDetails: {
          destinationCountry: '',
          portOfOrigin: 'Mombasa',
          shippingLine: '',
          containerNumber: '',
          phytosanitaryCert: false,
          certificateOfOrigin: false,
          billOfLadingRef: '',
          exportStatus: 'Pending Shipment'
        }
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'sales');
    } finally {
      setLoading(false);
    }
  };

  const filteredSales = sales.filter(s => {
    const buyer = buyers.find(b => b.id === s.buyerId);
    return (
      buyer?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.batchId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.type.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <div className="space-y-8 relative">
      {/* Immersive Background Header */}
      <div className="absolute -top-12 -left-12 -right-12 h-80 overflow-hidden rounded-b-[4rem] z-0">
        <img 
          src="https://images.unsplash.com/photo-1459755484551-638ca549d84c?auto=format&fit=crop&q=80&w=1920" 
          alt="Coffee Trade"
          className="w-full h-full object-cover opacity-20 scale-105"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-stone-50/0 via-stone-50/40 to-stone-50" />
      </div>

      <header className="relative z-10 pt-6 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-1.5 bg-emerald-600 rounded-full" />
            <span className="text-xs font-black uppercase tracking-[0.2em] text-emerald-900 drop-shadow-sm">Market Operations</span>
          </div>
          <h1 className="text-4xl font-black text-stone-900 tracking-tight leading-tight">
            Sales & <span className="text-emerald-700">Distribution</span>
          </h1>
          <p className="text-stone-600 mt-2 text-lg font-medium">
            Manage local buyers and international export documentation.
          </p>
        </div>

        <div className="flex gap-3">
          <button 
            onClick={() => setIsAddingBuyer(true)}
            className="flex items-center gap-2 px-6 py-3 bg-white text-stone-900 rounded-2xl font-bold border border-stone-200 hover:bg-stone-50 transition-all shadow-sm"
          >
            <User size={20} />
            Add Buyer
          </button>
          <button 
            onClick={() => setIsRecordingSale(true)}
            className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100"
          >
            <ShoppingBag size={20} />
            Record Sale
          </button>
        </div>
      </header>

      <div className="relative z-10">
        <div className="relative mb-8">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={20} />
          <input 
            type="text"
            placeholder="Search sales by buyer, batch ID, or type..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white/80 backdrop-blur-md border border-white/20 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all shadow-sm"
          />
        </div>

        <div className="bg-white/80 backdrop-blur-md rounded-3xl border border-white/20 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-stone-50/50 border-b border-stone-100">
                  <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-wider">Sale Details</th>
                  <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-wider">Buyer</th>
                  <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-wider">Export Docs</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-50">
                {filteredSales.length > 0 ? (
                  filteredSales.map((sale) => {
                    const buyer = buyers.find(b => b.id === sale.buyerId);
                    return (
                      <tr key={sale.id} className="hover:bg-stone-50/30 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-stone-900">{sale.weight}kg Batch</span>
                            <span className="text-xs text-stone-400 font-mono">#{sale.batchId.slice(0, 8)}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "w-8 h-8 rounded-full flex items-center justify-center",
                              buyer?.type === 'Exporter' ? "bg-emerald-100 text-emerald-600" : "bg-blue-100 text-blue-600"
                            )}>
                              {buyer?.type === 'Exporter' ? <Globe size={14} /> : <User size={14} />}
                            </div>
                            <span className="text-sm font-bold text-stone-900">{buyer?.name || 'Unknown'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={cn(
                            "px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border",
                            sale.type === 'Export' ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-blue-50 text-blue-700 border-blue-100"
                          )}>
                            {sale.type}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="text-sm font-black text-stone-900">UGX {sale.totalAmount.toLocaleString()}</span>
                            <span className="text-[10px] text-stone-400 font-bold">UGX {sale.pricePerKg.toLocaleString()}/kg</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5">
                            <div className={cn(
                              "w-1.5 h-1.5 rounded-full",
                              sale.status === 'Shipped' ? "bg-emerald-500" : sale.status === 'Completed' ? "bg-blue-500" : "bg-amber-500"
                            )} />
                            <div className="flex flex-col">
                              <span className="text-xs font-bold text-stone-700">{sale.status}</span>
                              {sale.type === 'Export' && sale.exportDetails?.exportStatus && (
                                <span className="text-[10px] text-stone-400 font-medium">{sale.exportDetails.exportStatus}</span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {sale.type === 'Export' ? (
                            <div className="flex items-center gap-3">
                              <div className="flex gap-2">
                                {sale.exportDetails?.phytosanitaryCert && <ShieldCheck size={16} className="text-emerald-600" title="Phytosanitary Cert" />}
                                {sale.exportDetails?.certificateOfOrigin && <FileText size={16} className="text-emerald-600" title="Cert of Origin" />}
                                {sale.exportDetails?.billOfLadingRef && <Ship size={16} className="text-emerald-600" title="Bill of Lading" />}
                              </div>
                              <button 
                                onClick={() => setSelectedSaleForDetails(sale)}
                                className="p-1.5 hover:bg-emerald-50 text-emerald-600 rounded-lg transition-colors"
                                title="View Export Details"
                              >
                                <Plus size={16} />
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-stone-300 italic">N/A</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-12">
                      <EmptyState 
                        icon={ShoppingBag}
                        title={searchTerm ? "No sales found" : "No sales recorded"}
                        description={searchTerm ? "Try searching for a different buyer or batch ID." : "Record your first sale to track revenue and export documentation."}
                        actionLabel={searchTerm ? undefined : "Record Sale"}
                        onAction={searchTerm ? undefined : () => setIsRecordingSale(true)}
                      />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add Buyer Modal */}
      <AnimatePresence>
        {isAddingBuyer && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-stone-100 flex items-center justify-between">
                <h2 className="text-xl font-bold text-stone-900">Add New Buyer</h2>
                <button onClick={() => setIsAddingBuyer(false)} className="p-2 hover:bg-stone-100 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleAddBuyer} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-black text-stone-400 uppercase tracking-widest mb-2">Buyer Name</label>
                  <input 
                    required
                    type="text"
                    value={newBuyer.name}
                    onChange={(e) => setNewBuyer(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                    placeholder="e.g. Kampala Coffee Traders"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-stone-400 uppercase tracking-widest mb-2">Buyer Type</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      type="button"
                      onClick={() => setNewBuyer(prev => ({ ...prev, type: 'Local' }))}
                      className={cn(
                        "py-3 rounded-xl font-bold text-sm border transition-all",
                        newBuyer.type === 'Local' ? "bg-blue-50 border-blue-200 text-blue-700" : "bg-white border-stone-200 text-stone-500"
                      )}
                    >
                      Local Buyer
                    </button>
                    <button 
                      type="button"
                      onClick={() => setNewBuyer(prev => ({ ...prev, type: 'Exporter' }))}
                      className={cn(
                        "py-3 rounded-xl font-bold text-sm border transition-all",
                        newBuyer.type === 'Exporter' ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-white border-stone-200 text-stone-500"
                      )}
                    >
                      International Exporter
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-black text-stone-400 uppercase tracking-widest mb-2">Contact Info</label>
                  <input 
                    required
                    type="text"
                    value={newBuyer.contact}
                    onChange={(e) => setNewBuyer(prev => ({ ...prev, contact: e.target.value }))}
                    className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                    placeholder="Phone or Email"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-stone-400 uppercase tracking-widest mb-2">Address</label>
                  <textarea 
                    value={newBuyer.address}
                    onChange={(e) => setNewBuyer(prev => ({ ...prev, address: e.target.value }))}
                    className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all h-24 resize-none"
                    placeholder="Physical address or port details"
                  />
                </div>
                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-stone-900 text-white rounded-2xl font-bold hover:bg-stone-800 transition-all flex items-center justify-center gap-2"
                >
                  {loading && <Loader2 size={18} className="animate-spin" />}
                  Register Buyer
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* View Export Details Modal */}
      <AnimatePresence>
        {selectedSaleForDetails && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-stone-100 flex items-center justify-between bg-emerald-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600">
                    <Globe size={20} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-stone-900">Export Details</h2>
                    <p className="text-xs text-emerald-700 font-medium">Batch #{selectedSaleForDetails.batchId.slice(0, 8)}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedSaleForDetails(null)} className="p-2 hover:bg-emerald-100 rounded-full transition-colors text-emerald-600">
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Destination</span>
                    <p className="text-sm font-bold text-stone-900">{selectedSaleForDetails.exportDetails?.destinationCountry || 'Not Specified'}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Port of Origin</span>
                    <p className="text-sm font-bold text-stone-900">{selectedSaleForDetails.exportDetails?.portOfOrigin || 'Mombasa'}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Shipping Line</span>
                    <p className="text-sm font-bold text-stone-900">{selectedSaleForDetails.exportDetails?.shippingLine || 'Not Specified'}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Container #</span>
                    <p className="text-sm font-bold text-stone-900 font-mono">{selectedSaleForDetails.exportDetails?.containerNumber || 'Not Specified'}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Export Status</span>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500" />
                      <p className="text-sm font-bold text-emerald-700">{selectedSaleForDetails.exportDetails?.exportStatus || 'Pending'}</p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Bill of Lading</span>
                    <p className="text-sm font-bold text-stone-900">{selectedSaleForDetails.exportDetails?.billOfLadingRef || 'Pending'}</p>
                  </div>
                </div>

                <div className="pt-6 border-t border-stone-100">
                  <h3 className="text-xs font-black text-stone-400 uppercase tracking-widest mb-3">Documentation Status</h3>
                  <div className="grid grid-cols-1 gap-3">
                    <div className={cn(
                      "flex items-center justify-between p-3 rounded-xl border",
                      selectedSaleForDetails.exportDetails?.phytosanitaryCert ? "bg-emerald-50 border-emerald-100 text-emerald-700" : "bg-stone-50 border-stone-100 text-stone-400"
                    )}>
                      <div className="flex items-center gap-2">
                        <ShieldCheck size={18} />
                        <span className="text-sm font-bold">Phytosanitary Certificate</span>
                      </div>
                      {selectedSaleForDetails.exportDetails?.phytosanitaryCert ? <CheckCircle2 size={18} /> : <X size={18} />}
                    </div>
                    <div className={cn(
                      "flex items-center justify-between p-3 rounded-xl border",
                      selectedSaleForDetails.exportDetails?.certificateOfOrigin ? "bg-emerald-50 border-emerald-100 text-emerald-700" : "bg-stone-50 border-stone-100 text-stone-400"
                    )}>
                      <div className="flex items-center gap-2">
                        <FileText size={18} />
                        <span className="text-sm font-bold">Certificate of Origin</span>
                      </div>
                      {selectedSaleForDetails.exportDetails?.certificateOfOrigin ? <CheckCircle2 size={18} /> : <X size={18} />}
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => setSelectedSaleForDetails(null)}
                  className="w-full py-4 bg-stone-900 text-white rounded-2xl font-bold hover:bg-stone-800 transition-all"
                >
                  Close Details
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Record Sale Modal */}
      <AnimatePresence>
        {isRecordingSale && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-stone-100 flex items-center justify-between">
                <h2 className="text-xl font-bold text-stone-900">Record New Sale</h2>
                <button onClick={() => setIsRecordingSale(false)} className="p-2 hover:bg-stone-100 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleRecordSale} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto custom-scrollbar">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-black text-stone-400 uppercase tracking-widest mb-2">Select Batch</label>
                      <select 
                        required
                        value={newSale.batchId}
                        onChange={(e) => setNewSale(prev => ({ ...prev, batchId: e.target.value }))}
                        className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                      >
                        <option value="">Choose a batch...</option>
                        {batches.filter(b => b.status === 'Ready').map(b => (
                          <option key={b.id} value={b.id}>{b.weight}kg {b.type} (#{b.id.slice(0, 8)})</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-black text-stone-400 uppercase tracking-widest mb-2">Select Buyer</label>
                      <select 
                        required
                        value={newSale.buyerId}
                        onChange={(e) => setNewSale(prev => ({ ...prev, buyerId: e.target.value }))}
                        className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                      >
                        <option value="">Choose a buyer...</option>
                        {buyers.map(b => (
                          <option key={b.id} value={b.id}>{b.name} ({b.type})</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-black text-stone-400 uppercase tracking-widest mb-2">Sale Type</label>
                      <div className="grid grid-cols-2 gap-3">
                        <button 
                          type="button"
                          onClick={() => setNewSale(prev => ({ ...prev, type: 'Local' }))}
                          className={cn(
                            "py-3 rounded-xl font-bold text-sm border transition-all",
                            newSale.type === 'Local' ? "bg-blue-50 border-blue-200 text-blue-700" : "bg-white border-stone-200 text-stone-500"
                          )}
                        >
                          Local Sale
                        </button>
                        <button 
                          type="button"
                          onClick={() => setNewSale(prev => ({ ...prev, type: 'Export' }))}
                          className={cn(
                            "py-3 rounded-xl font-bold text-sm border transition-all",
                            newSale.type === 'Export' ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-white border-stone-200 text-stone-500"
                          )}
                        >
                          Export Sale
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-black text-stone-400 uppercase tracking-widest mb-2">Price per Kg (UGX)</label>
                      <input 
                        required
                        type="number"
                        value={newSale.pricePerKg}
                        onChange={(e) => setNewSale(prev => ({ ...prev, pricePerKg: e.target.value }))}
                        className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    {newSale.type === 'Export' ? (
                      <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 space-y-4">
                        <h3 className="text-sm font-black text-emerald-900 flex items-center gap-2">
                          <Globe size={16} />
                          Export Documentation
                        </h3>
                        <div>
                          <label className="block text-[10px] font-black text-emerald-700 uppercase tracking-widest mb-1">Destination Country</label>
                          <input 
                            type="text"
                            value={newSale.exportDetails.destinationCountry}
                            onChange={(e) => setNewSale(prev => ({ ...prev, exportDetails: { ...prev.exportDetails, destinationCountry: e.target.value } }))}
                            className="w-full px-3 py-2 bg-white border border-emerald-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                            placeholder="e.g. Germany"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[10px] font-black text-emerald-700 uppercase tracking-widest mb-1">Port of Origin</label>
                            <input 
                              type="text"
                              value={newSale.exportDetails.portOfOrigin}
                              onChange={(e) => setNewSale(prev => ({ ...prev, exportDetails: { ...prev.exportDetails, portOfOrigin: e.target.value } }))}
                              className="w-full px-3 py-2 bg-white border border-emerald-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-black text-emerald-700 uppercase tracking-widest mb-1">Shipping Line</label>
                            <input 
                              type="text"
                              value={newSale.exportDetails.shippingLine}
                              onChange={(e) => setNewSale(prev => ({ ...prev, exportDetails: { ...prev.exportDetails, shippingLine: e.target.value } }))}
                              className="w-full px-3 py-2 bg-white border border-emerald-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                              placeholder="e.g. Maersk"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-emerald-700 uppercase tracking-widest mb-1">Export Status</label>
                          <select 
                            value={newSale.exportDetails.exportStatus}
                            onChange={(e) => setNewSale(prev => ({ ...prev, exportDetails: { ...prev.exportDetails, exportStatus: e.target.value as any } }))}
                            className="w-full px-3 py-2 bg-white border border-emerald-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                          >
                            <option value="Pending Shipment">Pending Shipment</option>
                            <option value="In Transit">In Transit</option>
                            <option value="Delivered">Delivered</option>
                          </select>
                        </div>
                        <div className="flex flex-col gap-2">
                          <label className="flex items-center gap-2 cursor-pointer group">
                            <input 
                              type="checkbox"
                              checked={newSale.exportDetails.phytosanitaryCert}
                              onChange={(e) => setNewSale(prev => ({ ...prev, exportDetails: { ...prev.exportDetails, phytosanitaryCert: e.target.checked } }))}
                              className="w-4 h-4 rounded border-emerald-300 text-emerald-600 focus:ring-emerald-500"
                            />
                            <span className="text-xs font-bold text-emerald-800 group-hover:text-emerald-900 transition-colors">Phytosanitary Certificate Ready</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer group">
                            <input 
                              type="checkbox"
                              checked={newSale.exportDetails.certificateOfOrigin}
                              onChange={(e) => setNewSale(prev => ({ ...prev, exportDetails: { ...prev.exportDetails, certificateOfOrigin: e.target.checked } }))}
                              className="w-4 h-4 rounded border-emerald-300 text-emerald-600 focus:ring-emerald-500"
                            />
                            <span className="text-xs font-bold text-emerald-800 group-hover:text-emerald-900 transition-colors">Certificate of Origin Ready</span>
                          </label>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 flex flex-col items-center justify-center text-center h-full min-h-[200px]">
                        <Truck className="text-blue-400 mb-2" size={32} />
                        <h3 className="text-sm font-bold text-blue-900">Local Distribution</h3>
                        <p className="text-xs text-blue-600 mt-1">Standard local sale documentation will be generated.</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-6 bg-stone-900 rounded-3xl text-white">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-black uppercase tracking-widest text-stone-400">Total Sale Value</span>
                    <span className="text-2xl font-black text-emerald-400">
                      UGX {((parseFloat(newSale.pricePerKg) || 0) * (batches.find(b => b.id === newSale.batchId)?.weight || 0)).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-[10px] text-stone-500 italic">
                    Calculated based on batch weight and agreed price per kg.
                  </p>
                </div>

                <div className="flex gap-3">
                  <button 
                    type="button"
                    onClick={() => setIsRecordingSale(false)}
                    className="flex-1 py-4 bg-stone-100 text-stone-600 rounded-2xl font-bold hover:bg-stone-200 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={loading || !newSale.batchId || !newSale.buyerId || !newSale.pricePerKg}
                    className="flex-1 py-4 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {loading && <Loader2 size={18} className="animate-spin" />}
                    Complete Transaction
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
