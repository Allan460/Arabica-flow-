import React, { useState, useEffect } from 'react';
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  query, 
  orderBy, 
  serverTimestamp 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { 
  Users, 
  Plus, 
  Search, 
  MapPin, 
  Phone, 
  Calendar,
  X,
  Loader2,
  CheckCircle2,
  DollarSign
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { Farmer } from '../types';
import { cn } from '../lib/utils';
import EmptyState from './EmptyState';

export default function FarmerList() {
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newFarmer, setNewFarmer] = useState({
    name: '',
    gender: 'Male' as any,
    contact: '',
    address: '',
    latitude: 0,
    longitude: 0,
    paymentPreference: 'Cash' as any,
    mobileMoneyNumber: '',
    bankName: '',
    accountName: '',
    accountNumber: ''
  });

  useEffect(() => {
    const q = query(collection(db, 'farmers'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setFarmers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Farmer)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'farmers');
    });
    return () => unsubscribe();
  }, []);

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setNewFarmer(prev => ({
          ...prev,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        }));
        setLoading(false);
      },
      (error) => {
        console.error('Error getting location:', error);
        setLoading(false);
        alert('Could not get location. Please enter manually.');
      }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const generatedId = `RF-${Math.floor(1000 + Math.random() * 9000)}`;
      const farmerData: any = {
        farmerId: generatedId,
        name: newFarmer.name,
        gender: newFarmer.gender,
        contact: newFarmer.contact,
        location: {
          latitude: newFarmer.latitude,
          longitude: newFarmer.longitude,
          address: newFarmer.address
        },
        paymentPreference: newFarmer.paymentPreference,
        createdAt: serverTimestamp()
      };

      if (newFarmer.paymentPreference === 'MTN Mobile Money' || newFarmer.paymentPreference === 'Airtel Money') {
        if (newFarmer.mobileMoneyNumber) {
          farmerData.mobileMoneyNumber = newFarmer.mobileMoneyNumber;
        }
      }

      if (newFarmer.paymentPreference === 'Bank Transfer') {
        farmerData.bankDetails = {
          bankName: newFarmer.bankName,
          accountName: newFarmer.accountName,
          accountNumber: newFarmer.accountNumber
        };
      }

      await addDoc(collection(db, 'farmers'), farmerData);
      setIsAdding(false);
      setNewFarmer({ 
        name: '', 
        gender: 'Male',
        contact: '', 
        address: '', 
        latitude: 0, 
        longitude: 0,
        paymentPreference: 'Cash',
        mobileMoneyNumber: '',
        bankName: '',
        accountName: '',
        accountNumber: ''
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'farmers');
    } finally {
      setLoading(false);
    }
  };

  const filteredFarmers = farmers.filter(f => 
    f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.contact.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Farmer Registry</h1>
          <p className="text-stone-500 text-sm">Manage and track your coffee suppliers.</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-amber-700 text-white rounded-xl font-bold hover:bg-amber-800 transition-all shadow-lg shadow-amber-100"
        >
          <Plus size={20} />
          Register Farmer
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={20} />
        <input 
          type="text"
          placeholder="Search by name or contact..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-white border border-stone-100 rounded-2xl focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all shadow-sm"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {filteredFarmers.length > 0 ? (
            filteredFarmers.map((farmer) => (
              <motion.div 
                key={farmer.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-white p-6 rounded-3xl border border-stone-100 shadow-sm hover:shadow-md transition-all group"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-stone-50 flex items-center justify-center group-hover:bg-amber-50 transition-colors">
                    <Users className="text-stone-400 group-hover:text-amber-600 transition-colors" />
                  </div>
                  <div>
                    <h3 className="font-bold text-stone-900">{farmer.name}</h3>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">{farmer.farmerId}</span>
                      <span className="text-xs text-stone-500">{farmer.gender}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm text-stone-600">
                    <Phone size={16} className="text-stone-400" />
                    {farmer.contact}
                  </div>
                  <div className="flex items-center gap-3 text-sm text-stone-600">
                    <MapPin size={16} className="text-stone-400" />
                    <span className="truncate">{farmer.location.address || `${farmer.location.latitude.toFixed(4)}, ${farmer.location.longitude.toFixed(4)}`}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-stone-600">
                    <Calendar size={16} className="text-stone-400" />
                    Joined {farmer.createdAt ? format(farmer.createdAt.toDate(), 'MMM d, yyyy') : 'Recently'}
                  </div>
                  <div className="flex items-center gap-3 text-sm text-stone-600">
                    <DollarSign size={16} className="text-stone-400" />
                    <span className="font-medium text-emerald-700">{farmer.paymentPreference || 'Cash'}</span>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-stone-50 flex justify-between items-center">
                  <button className="text-xs font-bold text-amber-700 hover:underline">View History</button>
                  <div className="flex gap-2">
                    <a 
                      href={`https://www.google.com/maps?q=${farmer.location.latitude},${farmer.location.longitude}`}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 rounded-lg bg-stone-50 text-stone-400 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                    >
                      <MapPin size={16} />
                    </a>
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="col-span-full">
              <EmptyState 
                icon={Users}
                title={searchTerm ? "No farmers found" : "No farmers registered"}
                description={searchTerm ? "Try adjusting your search terms to find the farmer you're looking for." : "Start by registering your first coffee farmer to begin tracking coffee intake."}
                actionLabel={searchTerm ? undefined : "Register Farmer"}
                onAction={searchTerm ? undefined : () => setIsAdding(true)}
              />
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Add Farmer Modal */}
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
                <h2 className="text-xl font-bold text-stone-900">Register New Farmer</h2>
                <button onClick={() => setIsAdding(false)} className="p-2 hover:bg-stone-100 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-stone-700 mb-1">Full Name</label>
                    <input 
                      required
                      type="text"
                      value={newFarmer.name}
                      onChange={(e) => setNewFarmer(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none transition-all"
                      placeholder="e.g. John Okello"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-stone-700 mb-1">Gender</label>
                    <div className="flex gap-3">
                      {['Male', 'Female', 'Other'].map((g) => (
                        <button
                          key={g}
                          type="button"
                          onClick={() => setNewFarmer(prev => ({ ...prev, gender: g as any }))}
                          className={cn(
                            "flex-1 py-2 px-4 rounded-xl border font-bold transition-all",
                            newFarmer.gender === g 
                              ? "bg-amber-700 border-amber-700 text-white" 
                              : "bg-stone-50 border-stone-200 text-stone-500 hover:bg-stone-100"
                          )}
                        >
                          {g}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-stone-700 mb-1">Contact Number</label>
                    <input 
                      required
                      type="tel"
                      value={newFarmer.contact}
                      onChange={(e) => setNewFarmer(prev => ({ ...prev, contact: e.target.value }))}
                      className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none transition-all"
                      placeholder="+256..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-stone-700 mb-1">Address / Village</label>
                    <input 
                      type="text"
                      value={newFarmer.address}
                      onChange={(e) => setNewFarmer(prev => ({ ...prev, address: e.target.value }))}
                      className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none transition-all"
                      placeholder="e.g. Kayunga District"
                    />
                  </div>
                  
                  <div className="pt-2">
                    <label className="block text-sm font-bold text-stone-700 mb-2">Payment Preference</label>
                    <select 
                      value={newFarmer.paymentPreference}
                      onChange={(e) => setNewFarmer(prev => ({ ...prev, paymentPreference: e.target.value as any }))}
                      className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none transition-all"
                    >
                      <option value="Cash">Cash on Delivery</option>
                      <option value="MTN Mobile Money">MTN Mobile Money</option>
                      <option value="Airtel Money">Airtel Money</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                    </select>
                  </div>

                  {(newFarmer.paymentPreference === 'MTN Mobile Money' || newFarmer.paymentPreference === 'Airtel Money') && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                      <label className="block text-sm font-bold text-stone-700 mb-1">Mobile Money Number</label>
                      <input 
                        required
                        type="tel"
                        value={newFarmer.mobileMoneyNumber}
                        onChange={(e) => setNewFarmer(prev => ({ ...prev, mobileMoneyNumber: e.target.value }))}
                        className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none transition-all"
                        placeholder="07..."
                      />
                    </motion.div>
                  )}

                  {newFarmer.paymentPreference === 'Bank Transfer' && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                      <div>
                        <label className="block text-sm font-bold text-stone-700 mb-1">Bank Name</label>
                        <input 
                          required
                          type="text"
                          value={newFarmer.bankName}
                          onChange={(e) => setNewFarmer(prev => ({ ...prev, bankName: e.target.value }))}
                          className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none transition-all"
                          placeholder="e.g. Stanbic Bank"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-bold text-stone-700 mb-1">Account Name</label>
                          <input 
                            required
                            type="text"
                            value={newFarmer.accountName}
                            onChange={(e) => setNewFarmer(prev => ({ ...prev, accountName: e.target.value }))}
                            className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-stone-700 mb-1">Account Number</label>
                          <input 
                            required
                            type="text"
                            value={newFarmer.accountNumber}
                            onChange={(e) => setNewFarmer(prev => ({ ...prev, accountNumber: e.target.value }))}
                            className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none transition-all"
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}
                  
                  <div className="pt-2">
                    <label className="block text-sm font-bold text-stone-700 mb-2">Geolocation</label>
                    <div className="flex gap-3">
                      <div className="flex-1 px-4 py-2.5 bg-stone-100 border border-stone-200 rounded-xl text-stone-500 text-sm flex items-center gap-2">
                        <MapPin size={14} />
                        {newFarmer.latitude ? `${newFarmer.latitude.toFixed(4)}, ${newFarmer.longitude.toFixed(4)}` : 'No coordinates'}
                      </div>
                      <button 
                        type="button"
                        onClick={handleGetLocation}
                        disabled={loading}
                        className="px-4 py-2.5 bg-stone-900 text-white rounded-xl font-bold hover:bg-stone-800 transition-colors flex items-center gap-2 disabled:opacity-50"
                      >
                        {loading ? <Loader2 size={18} className="animate-spin" /> : <MapPin size={18} />}
                        Get Current
                      </button>
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
                    disabled={loading}
                    className="flex-1 py-3 px-4 bg-amber-700 text-white rounded-xl font-bold hover:bg-amber-800 transition-colors shadow-lg shadow-amber-100 flex items-center justify-center gap-2"
                  >
                    {loading && <Loader2 size={18} className="animate-spin" />}
                    Save Farmer
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
