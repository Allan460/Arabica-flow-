import React, { useState, useEffect } from 'react';
import { 
  collection, 
  onSnapshot, 
  query, 
  orderBy, 
  deleteDoc,
  doc
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { 
  MessageSquare, 
  Trash2, 
  Mail, 
  Clock, 
  User,
  Search,
  CheckCircle2,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { Feedback } from '../types';
import { cn } from '../lib/utils';
import EmptyState from './EmptyState';

export default function FeedbackList() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'feedback'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setFeedbacks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Feedback)));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'feedback');
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this feedback?')) return;
    try {
      await deleteDoc(doc(db, 'feedback', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'feedback');
    }
  };

  const filteredFeedbacks = feedbacks.filter(f => 
    f.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.message.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-stone-900">User Feedback</h1>
        <p className="text-stone-500 text-sm">Review comments and suggestions from system users.</p>
      </header>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={20} />
        <input 
          type="text"
          placeholder="Search feedback..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-white border border-stone-100 rounded-2xl focus:ring-2 focus:ring-amber-500 outline-none transition-all shadow-sm"
        />
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredFeedbacks.length > 0 ? (
          <AnimatePresence mode="popLayout">
            {filteredFeedbacks.map((feedback) => (
              <motion.div 
                key={feedback.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white p-6 rounded-3xl border border-stone-100 shadow-sm hover:shadow-md transition-all group"
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
                      <MessageSquare size={24} />
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-bold text-stone-900">{feedback.subject}</h3>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-stone-500">
                        <div className="flex items-center gap-1">
                          <User size={12} />
                          {feedback.userName}
                        </div>
                        <div className="flex items-center gap-1">
                          <Mail size={12} />
                          {feedback.userEmail}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock size={12} />
                          {feedback.createdAt ? format(feedback.createdAt.toDate(), 'MMM d, h:mm a') : 'Recently'}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <a 
                      href={`mailto:${feedback.userEmail}?subject=RE: ${encodeURIComponent(feedback.subject)}`}
                      className="p-2 rounded-xl bg-stone-50 text-stone-400 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                      title="Reply via Email"
                    >
                      <Mail size={18} />
                    </a>
                    <button 
                      onClick={() => handleDelete(feedback.id)}
                      className="p-2 rounded-xl bg-stone-50 text-stone-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                      title="Delete Feedback"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
                <div className="mt-4 p-4 bg-stone-50 rounded-2xl text-sm text-stone-700 whitespace-pre-wrap leading-relaxed">
                  {feedback.message}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        ) : !loading && (
          <EmptyState 
            icon={MessageSquare}
            title={searchTerm ? "No matching feedback" : "No feedback yet"}
            description={searchTerm ? "Try searching for a different keyword or user." : "User comments and suggestions will appear here once submitted."}
          />
        )}
      </div>
    </div>
  );
}
