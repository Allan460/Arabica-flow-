import React, { useState } from 'react';
import { 
  collection, 
  addDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { 
  MessageSquare, 
  Send, 
  Mail, 
  X, 
  Loader2, 
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface FeedbackFormProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function FeedbackForm({ isOpen, onClose }: FeedbackFormProps) {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;

    setLoading(true);
    try {
      // 1. Save to Firestore
      await addDoc(collection(db, 'feedback'), {
        userId: auth.currentUser.uid,
        userName: auth.currentUser.displayName || 'Anonymous',
        userEmail: auth.currentUser.email || 'No Email',
        subject,
        message,
        createdAt: serverTimestamp()
      });

      setSuccess(true);
      
      // Reset form after a delay
      setTimeout(() => {
        setSuccess(false);
        setSubject('');
        setMessage('');
        onClose();
      }, 3000);

    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'feedback');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailDirect = () => {
    const adminEmail = 'ruhundaallan@gmail.com';
    const mailtoUrl = `mailto:${adminEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
    window.location.href = mailtoUrl;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden"
          >
            <div className="p-6 border-b border-stone-100 flex items-center justify-between bg-amber-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center text-amber-700">
                  <MessageSquare size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-stone-900">System Feedback</h2>
                  <p className="text-xs text-amber-700 font-medium">Help us improve ArabicaFlow</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-amber-100 rounded-full transition-colors text-amber-700">
                <X size={20} />
              </button>
            </div>

            <div className="p-6">
              {success ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="py-12 text-center space-y-4"
                >
                  <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600">
                    <CheckCircle2 size={40} />
                  </div>
                  <h3 className="text-2xl font-bold text-stone-900">Thank You!</h3>
                  <p className="text-stone-500 max-w-xs mx-auto">
                    Your feedback has been recorded. We'll review it and get back to you if needed.
                  </p>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-black text-stone-400 uppercase tracking-widest mb-2">Subject</label>
                    <input 
                      required
                      type="text"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none transition-all"
                      placeholder="What is this about?"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-stone-400 uppercase tracking-widest mb-2">Message / Comment</label>
                    <textarea 
                      required
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none transition-all h-32 resize-none"
                      placeholder="Tell us what you think or report an issue..."
                    />
                  </div>

                  <div className="flex flex-col gap-3 pt-2">
                    <button 
                      type="submit"
                      disabled={loading}
                      className="w-full py-4 bg-stone-900 text-white rounded-2xl font-bold hover:bg-stone-800 transition-all flex items-center justify-center gap-2 shadow-lg shadow-stone-200"
                    >
                      {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                      Submit Feedback
                    </button>
                    
                    <div className="relative py-2">
                      <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-stone-100"></div></div>
                      <div className="relative flex justify-center text-xs uppercase tracking-widest font-bold text-stone-300 bg-white px-2">Or</div>
                    </div>

                    <button 
                      type="button"
                      onClick={handleEmailDirect}
                      className="w-full py-3 bg-white text-stone-600 border border-stone-200 rounded-2xl font-bold hover:bg-stone-50 transition-all flex items-center justify-center gap-2"
                    >
                      <Mail size={18} />
                      Send Direct Email
                    </button>
                  </div>

                  <div className="mt-4 p-3 bg-blue-50 rounded-xl flex items-start gap-3">
                    <AlertCircle className="text-blue-500 shrink-0 mt-0.5" size={16} />
                    <p className="text-[10px] text-blue-700 leading-relaxed">
                      Submitting feedback will save your comments to our database for the admin to review. 
                      "Send Direct Email" will open your default email app to message the developer directly.
                    </p>
                  </div>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
