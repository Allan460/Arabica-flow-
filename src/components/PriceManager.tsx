import React, { useState, useEffect } from 'react';
import { 
  collection, 
  onSnapshot, 
  updateDoc, 
  doc,
  setDoc,
  query, 
  orderBy, 
  serverTimestamp 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { 
  TrendingUp, 
  Save, 
  AlertCircle, 
  Loader2,
  Sparkles,
  RefreshCw,
  Info,
  DollarSign,
  Coffee
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { PriceConfig, CoffeeType } from '../types';
import { cn } from '../lib/utils';
import { GoogleGenAI } from "@google/genai";

export default function PriceManager({ isAdmin }: { isAdmin: boolean }) {
  const [prices, setPrices] = useState<PriceConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [geminiLoading, setGeminiLoading] = useState(false);
  const [geminiInsight, setGeminiInsight] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'prices'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const priceData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PriceConfig));
      setPrices(priceData);

      // Initialize if empty
      if (snapshot.empty && isAdmin) {
        const initialPrices = [
          { type: 'Arabica', pricePerKg: 7200, lastUpdated: serverTimestamp() },
          { type: 'Robusta', pricePerKg: 4500, lastUpdated: serverTimestamp() }
        ];
        initialPrices.forEach(p => setDoc(doc(db, 'prices', p.type), p));
      }
    });

    return () => unsubscribe();
  }, [isAdmin]);

  const handleUpdatePrice = async (type: string, newPrice: number) => {
    if (!isAdmin) return;
    setLoading(true);
    try {
      await updateDoc(doc(db, 'prices', type), {
        pricePerKg: newPrice,
        lastUpdated: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `prices/${type}`);
    } finally {
      setLoading(false);
    }
  };

  const getMarketInsight = async () => {
    setGeminiLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: "Provide a brief (2-3 sentences) market insight for coffee prices in Uganda (Robusta and Arabica) for today. Mention potential trends or factors affecting prices like weather or global demand. Keep it professional and helpful for a processing plant manager."
      });
      setGeminiInsight(response.text || "Market stable. High demand for quality Robusta in Europe.");
    } catch (error) {
      console.error('Gemini error:', error);
      setGeminiInsight("Unable to fetch live insights. Local demand remains strong.");
    } finally {
      setGeminiLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-bold text-stone-900">Standard Coffee Pricing</h1>
        <p className="text-stone-500 text-sm">Set and manage the standard payout rates for Ugandan coffee.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Price Cards */}
        <div className="space-y-6">
          {['Arabica', 'Robusta'].map(type => {
            const price = prices.find(p => p.type === type);
            return (
              <PriceCard 
                key={type}
                type={type as CoffeeType}
                price={price?.pricePerKg || 0}
                lastUpdated={price?.lastUpdated}
                onUpdate={(val) => handleUpdatePrice(type, val)}
                isAdmin={isAdmin}
                loading={loading}
              />
            );
          })}
        </div>

        {/* AI Insight */}
        <div className="bg-stone-900 rounded-3xl p-8 text-white shadow-2xl shadow-stone-200 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-600/10 blur-3xl rounded-full -mr-32 -mt-32" />
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-amber-600 rounded-xl flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-xl font-bold">Market Insights</h2>
            </div>

            <AnimatePresence mode="wait">
              {geminiInsight ? (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  <p className="text-stone-300 leading-relaxed italic">
                    "{geminiInsight}"
                  </p>
                  <div className="pt-4 flex items-center gap-2 text-xs text-stone-500 font-bold uppercase tracking-widest">
                    <Info size={14} />
                    Powered by Gemini AI
                  </div>
                  <button 
                    onClick={getMarketInsight}
                    disabled={geminiLoading}
                    className="mt-4 flex items-center gap-2 text-amber-500 hover:text-amber-400 font-bold transition-colors"
                  >
                    <RefreshCw size={16} className={geminiLoading ? "animate-spin" : ""} />
                    Refresh Insight
                  </button>
                </motion.div>
              ) : (
                <div className="space-y-6">
                  <p className="text-stone-400">Get real-time market trends and pricing suggestions for the Ugandan coffee market.</p>
                  <button 
                    onClick={getMarketInsight}
                    disabled={geminiLoading}
                    className="w-full py-4 bg-amber-600 hover:bg-amber-700 text-white rounded-2xl font-bold transition-all flex items-center justify-center gap-3 shadow-lg shadow-amber-900/40"
                  >
                    {geminiLoading ? <Loader2 className="animate-spin" /> : <Sparkles size={20} />}
                    Generate Market Report
                  </button>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {!isAdmin && (
        <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex items-center gap-3 text-amber-800">
          <AlertCircle size={20} />
          <p className="text-sm font-medium">You are in View-Only mode. Only administrators can update standard pricing.</p>
        </div>
      )}
    </div>
  );
}

function PriceCard({ type, price, lastUpdated, onUpdate, isAdmin, loading }: any) {
  const [val, setVal] = useState(price);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    setVal(price);
  }, [price]);

  return (
    <div className="bg-white p-8 rounded-3xl border border-stone-100 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className={cn(
            "w-14 h-14 rounded-2xl flex items-center justify-center",
            type === 'Robusta' ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"
          )}>
            <Coffee size={28} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-stone-900">{type} Coffee</h3>
            <p className="text-xs text-stone-500 font-bold uppercase tracking-widest">Uganda Standard</p>
          </div>
        </div>
        {isAdmin && !isEditing && (
          <button 
            onClick={() => setIsEditing(true)}
            className="text-sm font-bold text-amber-700 hover:underline"
          >
            Update Price
          </button>
        )}
      </div>

      <div className="flex items-end gap-2 mb-6">
        {isEditing ? (
          <div className="flex items-center gap-3 w-full">
            <div className="relative flex-1">
              <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={20} />
              <input 
                type="number"
                value={val}
                onChange={(e) => setVal(parseInt(e.target.value))}
                className="w-full pl-12 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-2xl focus:ring-2 focus:ring-amber-500 outline-none font-bold text-xl"
              />
            </div>
            <button 
              onClick={() => {
                onUpdate(val);
                setIsEditing(false);
              }}
              disabled={loading}
              className="p-3 bg-stone-900 text-white rounded-2xl hover:bg-stone-800 transition-colors"
            >
              {loading ? <Loader2 size={24} className="animate-spin" /> : <Save size={24} />}
            </button>
            <button 
              onClick={() => {
                setVal(price);
                setIsEditing(false);
              }}
              className="p-3 bg-stone-100 text-stone-500 rounded-2xl hover:bg-stone-200 transition-colors"
            >
              <RefreshCw size={24} />
            </button>
          </div>
        ) : (
          <>
            <span className="text-4xl font-black text-stone-900">UGX {price.toLocaleString()}</span>
            <span className="text-stone-400 font-bold mb-1">/ per kg</span>
          </>
        )}
      </div>

      <div className="pt-6 border-t border-stone-50 flex items-center justify-between text-xs text-stone-400 font-medium">
        <div className="flex items-center gap-1.5">
          <TrendingUp size={14} />
          Market Trend: Stable
        </div>
        <span>Last updated {lastUpdated ? format(lastUpdated.toDate(), 'MMM d, yyyy') : 'Recently'}</span>
      </div>
    </div>
  );
}
