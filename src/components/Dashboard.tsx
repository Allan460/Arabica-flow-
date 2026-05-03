import { useState, useEffect } from 'react';
import { 
  collection, 
  onSnapshot, 
  query, 
  orderBy, 
  limit 
} from 'firebase/firestore';
import { db } from '../firebase';
import { 
  Users, 
  Coffee, 
  TrendingUp, 
  Clock, 
  ArrowUpRight, 
  ArrowDownRight,
  MapPin,
  Wallet
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
  AreaChart,
  Area
} from 'recharts';
import { format } from 'date-fns';
import { Farmer, Batch, UserProfile, Expense } from '../types';
import { cn } from '../lib/utils';

export default function Dashboard({ profile }: { profile: UserProfile | null }) {
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [stats, setStats] = useState({
    totalWeight: 0,
    totalPayout: 0,
    activeBatches: 0,
    totalExpenses: 0,
    growth: 12.5
  });

  useEffect(() => {
    const qFarmers = query(collection(db, 'farmers'), orderBy('createdAt', 'desc'));
    const unsubscribeFarmers = onSnapshot(qFarmers, (snapshot) => {
      setFarmers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Farmer)));
    });

    const qBatches = query(collection(db, 'batches'), orderBy('createdAt', 'desc'));
    const unsubscribeBatches = onSnapshot(qBatches, (snapshot) => {
      const batchData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Batch));
      setBatches(batchData);

      const totalWeight = batchData.reduce((acc, b) => acc + b.weight, 0);
      const totalPayout = batchData.reduce((acc, b) => acc + b.totalPrice, 0);
      const activeBatches = batchData.filter(b => b.status !== 'Ready').length;

      setStats(prev => ({ ...prev, totalWeight, totalPayout, activeBatches }));
    });

    const qExpenses = query(collection(db, 'expenses'));
    const unsubscribeExpenses = onSnapshot(qExpenses, (snapshot) => {
      const expenseData = snapshot.docs.map(doc => doc.data() as Expense);
      const totalExpenses = expenseData.reduce((acc, e) => acc + e.amount, 0);
      setStats(prev => ({ ...prev, totalExpenses }));
    });

    return () => {
      unsubscribeFarmers();
      unsubscribeBatches();
      unsubscribeExpenses();
    };
  }, []);

  const chartData = [
    { name: 'Mon', weight: 400 },
    { name: 'Tue', weight: 300 },
    { name: 'Wed', weight: 600 },
    { name: 'Thu', weight: 800 },
    { name: 'Fri', weight: 500 },
    { name: 'Sat', weight: 900 },
    { name: 'Sun', weight: 700 },
  ];

  return (
    <div className="space-y-8 relative">
      {/* Immersive Background Header */}
      <div className="absolute -top-12 -left-12 -right-12 h-96 overflow-hidden rounded-b-[4rem] z-0">
        <img 
          src="https://images.unsplash.com/photo-1559056199-641a0ac8b55e?auto=format&fit=crop&q=80&w=1920" 
          alt="Coffee Cherries"
          className="w-full h-full object-cover opacity-25 scale-105"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-stone-50/0 via-stone-50/40 to-stone-50" />
      </div>

      <header className="relative z-10 pt-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-1.5 bg-amber-600 rounded-full" />
          <span className="text-xs font-black uppercase tracking-[0.2em] text-amber-900 drop-shadow-sm">Processing Hub</span>
        </div>
        <h1 className="text-5xl font-black text-stone-900 tracking-tight leading-tight">
          Welcome back, <span className="text-amber-700">{profile?.name?.split(' ')[0] || 'User'}</span>
        </h1>
        <p className="text-stone-600 mt-3 text-xl font-medium max-w-2xl">
          Your Ugandan coffee processing operations are running at peak efficiency.
        </p>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
        <StatCard 
          title="Total Farmers" 
          value={farmers.length.toString()} 
          icon={<Users className="text-blue-600" />} 
          trend="+4.5%" 
          trendUp={true}
        />
        <StatCard 
          title="Total Weight (kg)" 
          value={stats.totalWeight.toLocaleString()} 
          icon={<Coffee className="text-amber-600" />} 
          trend="+12.2%" 
          trendUp={true}
        />
        <StatCard 
          title="Active Batches" 
          value={stats.activeBatches.toString()} 
          icon={<Clock className="text-emerald-600" />} 
          trend="-2" 
          trendUp={false}
        />
        <StatCard 
          title="Factory Expenses" 
          value={"UGX " + stats.totalExpenses.toLocaleString()} 
          icon={<Wallet className="text-red-500" />} 
          trend="Costs" 
          trendUp={false}
        />
        <StatCard 
          title="Total Payout (UGX)" 
          value={stats.totalPayout.toLocaleString()} 
          icon={<TrendingUp className="text-purple-600" />} 
          trend="+8.1%" 
          trendUp={true}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-white/80 backdrop-blur-md p-6 rounded-3xl border border-white/20 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-lg font-bold text-stone-900">Processing Volume</h2>
            <select className="bg-white/50 border-none text-sm font-medium text-stone-600 rounded-lg px-3 py-1 focus:ring-2 focus:ring-amber-500">
              <option>Last 7 Days</option>
              <option>Last 30 Days</option>
            </select>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#d97706" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#d97706" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e7e5e4" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#78716c', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#78716c', fontSize: 12}} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(8px)', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.2)', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Area type="monotone" dataKey="weight" stroke="#d97706" strokeWidth={3} fillOpacity={1} fill="url(#colorWeight)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white/80 backdrop-blur-md p-6 rounded-3xl border border-white/20 shadow-sm">
          <h2 className="text-lg font-bold text-stone-900 mb-6">Recent Batches</h2>
          <div className="space-y-6">
            {batches.slice(0, 5).map((batch, idx) => (
              <div key={batch.id} className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shrink-0 shadow-sm">
                  <Coffee className="w-5 h-5 text-amber-700" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-stone-900 truncate">
                    {batch.weight}kg {batch.type}
                  </p>
                  <p className="text-xs text-stone-500 mt-0.5">
                    {batch.status} • {format(batch.createdAt?.toDate() || new Date(), 'HH:mm')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-emerald-600">UGX {batch.totalPrice.toLocaleString()}</p>
                </div>
              </div>
            ))}
            {batches.length === 0 && (
              <div className="text-center py-8">
                <p className="text-sm text-stone-400 italic">No activity yet</p>
              </div>
            )}
          </div>
          <button className="w-full mt-6 py-2 text-sm font-bold text-amber-700 hover:text-amber-800 transition-colors">
            View All Activity
          </button>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, trend, trendUp }: any) {
  return (
    <motion.div 
      whileHover={{ y: -4 }}
      className="bg-white/80 backdrop-blur-md p-6 rounded-3xl border border-white/20 shadow-sm"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-sm">
          {icon}
        </div>
        <div className={cn(
          "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold",
          trendUp ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
        )}>
          {trendUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
          {trend}
        </div>
      </div>
      <p className="text-sm font-medium text-stone-500">{title}</p>
      <h3 className="text-2xl font-bold text-stone-900 mt-1">{value}</h3>
    </motion.div>
  );
}
