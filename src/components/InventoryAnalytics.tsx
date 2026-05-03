import React, { useState, useEffect } from 'react';
import { 
  collection, 
  onSnapshot, 
  query, 
  orderBy 
} from 'firebase/firestore';
import { db } from '../firebase';
import { 
  Thermometer, 
  Package, 
  AlertTriangle, 
  CheckCircle2, 
  BarChart3,
  Layers,
  ThermometerSun
} from 'lucide-react';
import { motion } from 'motion/react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { Batch } from '../types';
import { cn } from '../lib/utils';

export default function InventoryAnalytics() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [tempUnit, setTempUnit] = useState<'C' | 'F'>('C');
  const [inventoryStats, setInventoryStats] = useState({
    totalInventory: 0,
    readyForSale: 0,
    inProcessing: 0,
    tempAlerts: 0
  });

  useEffect(() => {
    const q = query(collection(db, 'batches'), orderBy('updatedAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const batchData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Batch));
      setBatches(batchData);

      const total = batchData.reduce((acc, b) => acc + b.weight, 0);
      const ready = batchData.filter(b => b.status === 'Ready').reduce((acc, b) => acc + b.weight, 0);
      const processing = total - ready;
      
      // Temperature alerts: Coffee should be around 35°C for optimal flavor
      // We'll flag anything outside 30-40°C as an alert if it's in Ready or Drying stage
      const alerts = batchData.filter(b => 
        (b.status === 'Ready' || b.status === 'Drying') && 
        (b.storageTemperature && (b.storageTemperature < 30 || b.storageTemperature > 40))
      ).length;

      setInventoryStats({
        totalInventory: total,
        readyForSale: ready,
        inProcessing: processing,
        tempAlerts: alerts
      });
    });

    return () => unsubscribe();
  }, []);

  const statusData = [
    { name: 'Ready', value: inventoryStats.readyForSale, color: '#10b981' },
    { name: 'Processing', value: inventoryStats.inProcessing, color: '#d97706' },
  ];

  const qualityData = [
    { name: 'Grade A', weight: batches.filter(b => b.quality === 'Grade A').reduce((acc, b) => acc + b.weight, 0) },
    { name: 'Grade B', weight: batches.filter(b => b.quality === 'Grade B').reduce((acc, b) => acc + b.weight, 0) },
    { name: 'Grade C', weight: batches.filter(b => b.quality === 'Grade C').reduce((acc, b) => acc + b.weight, 0) },
  ];

  const formatTemp = (celsius: number | undefined) => {
    if (celsius === undefined) return '--';
    if (tempUnit === 'F') {
      return Math.round((celsius * 9/5) + 32);
    }
    return Math.round(celsius);
  };

  return (
    <div className="space-y-8 relative">
      {/* Immersive Background Header */}
      <div className="absolute -top-12 -left-12 -right-12 h-80 overflow-hidden rounded-b-[4rem] z-0">
        <img 
          src="https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&q=80&w=1920" 
          alt="Coffee Beans"
          className="w-full h-full object-cover opacity-20 scale-105"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-stone-50/0 via-stone-50/40 to-stone-50" />
      </div>

      <header className="relative z-10 pt-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-1.5 bg-emerald-600 rounded-full" />
          <span className="text-xs font-black uppercase tracking-[0.2em] text-emerald-900 drop-shadow-sm">Quality Control</span>
        </div>
        <h1 className="text-4xl font-black text-stone-900 tracking-tight leading-tight">
          Inventory & <span className="text-emerald-700">Analytics</span>
        </h1>
        <p className="text-stone-600 mt-2 text-lg font-medium">
          Monitor storage conditions and stock levels for peak flavor preservation.
        </p>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
        <StatCard 
          title="Total Stock (kg)" 
          value={inventoryStats.totalInventory.toLocaleString()} 
          icon={<Package className="text-stone-600" />} 
        />
        <StatCard 
          title="Ready for Sale" 
          value={inventoryStats.readyForSale.toLocaleString() + ' kg'} 
          icon={<CheckCircle2 className="text-emerald-600" />} 
        />
        <StatCard 
          title="In Processing" 
          value={inventoryStats.inProcessing.toLocaleString() + ' kg'} 
          icon={<Layers className="text-amber-600" />} 
        />
        <StatCard 
          title="Temp. Alerts" 
          value={inventoryStats.tempAlerts.toString()} 
          icon={<AlertTriangle className={cn(inventoryStats.tempAlerts > 0 ? "text-red-600" : "text-stone-400")} />} 
          alert={inventoryStats.tempAlerts > 0}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 relative z-10">
        {/* Quality Distribution */}
        <div className="bg-white/80 backdrop-blur-md p-6 rounded-3xl border border-white/20 shadow-sm">
          <h2 className="text-lg font-bold text-stone-900 mb-6 flex items-center gap-2">
            <BarChart3 size={20} className="text-amber-600" />
            Stock by Quality Grade
          </h2>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={qualityData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e7e5e4" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#78716c', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#78716c', fontSize: 12}} />
                <Tooltip 
                  cursor={{fill: '#fafaf9'}}
                  contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(8px)', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.2)', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="weight" fill="#d97706" radius={[6, 6, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Temperature Monitoring */}
        <div className="bg-white/80 backdrop-blur-md p-6 rounded-3xl border border-white/20 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-stone-900 flex items-center gap-2">
              <ThermometerSun size={20} className="text-red-500" />
              Storage Temperature Monitoring
            </h2>
            <div className="flex bg-stone-100 p-1 rounded-xl border border-stone-200">
              <button 
                onClick={() => setTempUnit('C')}
                className={cn(
                  "px-3 py-1 text-xs font-bold rounded-lg transition-all",
                  tempUnit === 'C' ? "bg-white text-stone-900 shadow-sm" : "text-stone-400 hover:text-stone-600"
                )}
              >
                °C
              </button>
              <button 
                onClick={() => setTempUnit('F')}
                className={cn(
                  "px-3 py-1 text-xs font-bold rounded-lg transition-all",
                  tempUnit === 'F' ? "bg-white text-stone-900 shadow-sm" : "text-stone-400 hover:text-stone-600"
                )}
              >
                °F
              </button>
            </div>
          </div>
          <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
            {batches.filter(b => b.status === 'Ready' || b.status === 'Drying').map(batch => {
              const isOptimal = batch.storageTemperature && batch.storageTemperature >= 33 && batch.storageTemperature <= 37;
              const isAlert = batch.storageTemperature && (batch.storageTemperature < 30 || batch.storageTemperature > 40);
              
              return (
                <div key={batch.id} className="flex items-center justify-between p-4 bg-white/50 backdrop-blur-sm rounded-2xl border border-white/30">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center",
                      isAlert ? "bg-red-100 text-red-600" : isOptimal ? "bg-emerald-100 text-emerald-600" : "bg-stone-200 text-stone-500"
                    )}>
                      <Thermometer size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-stone-900">Batch #{batch.id.slice(0, 8)}</p>
                      <p className="text-xs text-stone-500">{batch.storageLocation || 'Unassigned Location'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={cn(
                      "text-lg font-black",
                      isAlert ? "text-red-600" : isOptimal ? "text-emerald-600" : "text-stone-900"
                    )}>
                      {formatTemp(batch.storageTemperature)}°{tempUnit}
                    </p>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                      {isOptimal ? 'Optimal' : isAlert ? 'Critical' : 'Monitoring'}
                    </p>
                  </div>
                </div>
              );
            })}
            {batches.filter(b => b.status === 'Ready' || b.status === 'Drying').length === 0 && (
              <div className="text-center py-12 text-stone-400 italic text-sm">
                No batches currently in storage monitoring.
              </div>
            )}
          </div>
          <div className="mt-6 p-4 bg-amber-50/80 backdrop-blur-sm rounded-2xl border border-amber-100">
            <div className="flex items-start gap-3">
              <AlertTriangle className="text-amber-600 shrink-0" size={18} />
              <p className="text-xs text-amber-800 leading-relaxed">
                <strong>Storage Standard:</strong> Coffee must be stored at approximately <strong>{tempUnit === 'C' ? '35°C' : '95°F'}</strong> to attain and preserve its full flavor profile. Maintain racks within the <strong>{tempUnit === 'C' ? '33°C - 37°C' : '91°F - 99°F'}</strong> range for optimal quality.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, alert }: any) {
  return (
    <div className={cn(
      "bg-white/80 backdrop-blur-md p-6 rounded-3xl border shadow-sm transition-all",
      alert ? "border-red-200 bg-red-50/30" : "border-white/20"
    )}>
      <div className="flex items-center justify-between mb-4">
        <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-sm">
          {icon}
        </div>
        {alert && (
          <span className="flex h-2 w-2 rounded-full bg-red-600 animate-ping" />
        )}
      </div>
      <p className="text-sm font-medium text-stone-500">{title}</p>
      <h3 className="text-2xl font-bold text-stone-900 mt-1">{value}</h3>
    </div>
  );
}
