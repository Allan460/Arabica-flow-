import React, { useState, useEffect } from 'react';
import { 
  collection, 
  onSnapshot, 
  query, 
  orderBy, 
  addDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import { 
  Wallet, 
  Plus, 
  Trash2, 
  Search, 
  Filter, 
  Calendar,
  DollarSign,
  TrendingDown,
  Droplets,
  Zap,
  Users as UsersIcon,
  Wrench,
  Package,
  MoreHorizontal,
  Download,
  FileSpreadsheet
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { Expense, ExpenseCategory } from '../types';
import { cn } from '../lib/utils';
import EmptyState from './EmptyState';

const CATEGORIES: ExpenseCategory[] = ['Water', 'Electricity', 'Salary', 'Maintenance', 'Fuel', 'Packaging', 'Other'];

const CATEGORY_ICONS: Record<ExpenseCategory, React.ReactNode> = {
  Water: <Droplets size={18} />,
  Electricity: <Zap size={18} />,
  Salary: <UsersIcon size={18} />,
  Maintenance: <Wrench size={18} />,
  Fuel: <TrendingDown size={18} />,
  Packaging: <Package size={18} />,
  Other: <MoreHorizontal size={18} />
};

export default function ExpenseManager() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ExpenseCategory | 'All'>('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    category: 'Water' as ExpenseCategory,
    amount: '',
    description: '',
    date: format(new Date(), 'yyyy-MM-dd')
  });

  useEffect(() => {
    const q = query(collection(db, 'expenses'), orderBy('date', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const expenseData = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      } as Expense));
      setExpenses(expenseData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;

    try {
      await addDoc(collection(db, 'expenses'), {
        ...formData,
        amount: Number(formData.amount),
        date: Timestamp.fromDate(new Date(formData.date)),
        recordedBy: auth.currentUser.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      setIsModalOpen(false);
      setFormData({
        category: 'Water',
        amount: '',
        description: '',
        date: format(new Date(), 'yyyy-MM-dd')
      });
    } catch (error) {
      console.error('Error adding expense:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this record?')) {
      try {
        await deleteDoc(doc(db, 'expenses', id));
      } catch (error) {
        console.error('Error deleting expense:', error);
      }
    }
  };

  const filteredExpenses = expenses.filter(exp => {
    const matchesSearch = exp.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         exp.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || exp.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const totalExpenses = filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0);

  const categoryBreakdown = CATEGORIES.map(cat => ({
    category: cat,
    amount: expenses.filter(e => e.category === cat).reduce((sum, e) => sum + e.amount, 0)
  })).sort((a, b) => b.amount - a.amount);

  const downloadCSVReport = () => {
    if (expenses.length === 0) return;

    const headers = ['Date', 'Category', 'Description', 'Amount (UGX)'];
    const rows = filteredExpenses.map(exp => [
      exp.date ? format(exp.date.toDate(), 'yyyy-MM-dd') : 'N/A',
      exp.category,
      `"${exp.description.replace(/"/g, '""')}"`,
      exp.amount
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `ArabicaFlow_Expense_Report_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-stone-900 tracking-tight">Factory <span className="text-emerald-700">Expenses</span></h1>
          <p className="text-stone-500 font-medium">Track operational costs and factory overheads.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={downloadCSVReport}
            className="flex items-center gap-2 px-6 py-3 bg-white border border-stone-200 text-stone-700 rounded-2xl font-bold hover:bg-stone-50 transition-all shadow-sm active:scale-95"
          >
            <FileSpreadsheet size={20} className="text-emerald-600" />
            Export Report
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-6 py-3 bg-stone-900 text-white rounded-2xl font-bold hover:bg-stone-800 transition-all shadow-xl shadow-stone-200 active:scale-95"
          >
            <Plus size={20} />
            Record Expense
          </button>
        </div>
      </header>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-[2rem] border border-stone-100 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600">
              <DollarSign size={24} />
            </div>
            <div>
              <p className="text-sm font-bold text-stone-500 uppercase tracking-wider">Total Expenses</p>
              <h3 className="text-2xl font-black text-stone-900">UGX {totalExpenses.toLocaleString()}</h3>
            </div>
          </div>
          <div className="h-1.5 w-full bg-stone-100 rounded-full overflow-hidden">
            <div className="h-full bg-amber-500 rounded-full w-full" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-[2rem] border border-stone-100 shadow-sm md:col-span-2">
          <p className="text-sm font-bold text-stone-500 uppercase tracking-wider mb-4">Category Breakdown</p>
          <div className="flex flex-wrap gap-4">
            {categoryBreakdown.filter(c => c.amount > 0).map(cat => (
              <div key={cat.category} className="flex items-center gap-3 bg-stone-50 px-4 py-2 rounded-xl">
                <div className="text-amber-600">{CATEGORY_ICONS[cat.category]}</div>
                <div>
                  <p className="text-xs font-bold text-stone-900">{cat.category}</p>
                  <p className="text-[10px] text-stone-500">UGX {cat.amount.toLocaleString()}</p>
                </div>
              </div>
            ))}
            {categoryBreakdown.every(c => c.amount === 0) && (
              <p className="text-sm text-stone-400 italic">No expense data available</p>
            )}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={20} />
          <input
            type="text"
            placeholder="Search expenses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-stone-100 rounded-2xl focus:ring-2 focus:ring-amber-500 outline-none transition-all"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          <button 
            onClick={() => setSelectedCategory('All')}
            className={cn(
              "px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap",
              selectedCategory === 'All' ? "bg-amber-600 text-white shadow-lg shadow-amber-100" : "bg-white text-stone-600 border border-stone-100"
            )}
          >
            All
          </button>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={cn(
                "px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap flex items-center gap-2",
                selectedCategory === cat ? "bg-amber-600 text-white shadow-lg shadow-amber-100" : "bg-white text-stone-600 border border-stone-100"
              )}
            >
              {CATEGORY_ICONS[cat]}
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Expenses Table/List */}
      <div className="grid grid-cols-1 gap-4">
        {filteredExpenses.length > 0 ? (
          <AnimatePresence mode="popLayout" initial={false}>
            {filteredExpenses.map((expense) => (
              <motion.div
                key={expense.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white p-6 rounded-3xl border border-stone-100 shadow-sm hover:shadow-md transition-all group"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-stone-50 flex items-center justify-center text-stone-600 group-hover:bg-amber-50 group-hover:text-amber-600 transition-colors">
                      {CATEGORY_ICONS[expense.category]}
                    </div>
                    <div>
                      <h3 className="font-bold text-stone-900">{expense.description}</h3>
                      <div className="flex items-center gap-3 text-xs text-stone-500 mt-1">
                        <span className="bg-stone-100 px-2 py-0.5 rounded-full font-bold text-stone-600">{expense.category}</span>
                        <div className="flex items-center gap-1">
                          <Calendar size={12} />
                          {expense.date ? format(expense.date.toDate(), 'PPP') : 'No date'}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between md:justify-end gap-6">
                    <div className="text-right">
                      <p className="text-lg font-black text-stone-900">UGX {expense.amount.toLocaleString()}</p>
                      <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Amount Paid</p>
                    </div>
                    <button
                      onClick={() => handleDelete(expense.id)}
                      className="p-3 bg-stone-50 text-stone-400 hover:bg-red-50 hover:text-red-500 rounded-xl transition-all"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        ) : !loading && (
          <EmptyState 
            icon={Wallet}
            title={searchTerm ? "No matching expenses" : "No expenses yet"}
            description={searchTerm ? "Try searching for a different keyword or category." : "Factory costs like water, electricity, and salaries will appear here."}
            actionLabel="Record Your First Expense"
            onAction={() => setIsModalOpen(true)}
          />
        )}
      </div>

      {/* Record Expense Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-[2.5rem] p-8 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-black text-stone-900">Record <span className="text-amber-700">Expense</span></h2>
                  <p className="text-stone-500 text-sm font-medium">Add a new factory cost record.</p>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 hover:bg-stone-50 rounded-xl text-stone-400"
                >
                  <Plus size={24} className="rotate-45" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-stone-700">Category</label>
                    <select
                      required
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value as ExpenseCategory })}
                      className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-2xl focus:ring-2 focus:ring-amber-500 outline-none font-medium"
                    >
                      {CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-stone-700">Amount (UGX)</label>
                    <input
                      type="number"
                      required
                      placeholder="e.g. 50000"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-2xl focus:ring-2 focus:ring-amber-500 outline-none font-medium"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-stone-700">Description</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. March Electricity Bill"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-2xl focus:ring-2 focus:ring-amber-500 outline-none font-medium"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-stone-700">Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
                    <input
                      type="date"
                      required
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="w-full pl-12 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-2xl focus:ring-2 focus:ring-amber-500 outline-none font-medium"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-4 bg-stone-900 text-white rounded-2xl font-black text-lg hover:bg-stone-800 transition-all shadow-xl shadow-stone-200 active:scale-[0.98] mt-4"
                >
                  Save Record
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
