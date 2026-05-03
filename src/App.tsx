import React, { useState, useEffect } from 'react';
import { 
  BrowserRouter as Router, 
  Routes, 
  Route, 
  Navigate, 
  Link, 
  useLocation 
} from 'react-router-dom';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut,
  User
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  onSnapshot,
  collection,
  query,
  orderBy
} from 'firebase/firestore';
import { auth, db } from './firebase';
import { 
  LayoutDashboard, 
  Users, 
  Coffee, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  Plus,
  MapPin,
  TrendingUp,
  History,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShoppingBag,
  DollarSign,
  MessageSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// --- Types ---
import { UserProfile, Farmer, Batch, PriceConfig } from './types';

// --- Utils ---
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Components ---
import Dashboard from './components/Dashboard';
import FarmerList from './components/FarmerList';
import BatchList from './components/BatchList';
import ProcessingWorkflow from './components/ProcessingWorkflow';
import PriceManager from './components/PriceManager';
import InventoryAnalytics from './components/InventoryAnalytics';
import BatchHistory from './components/BatchHistory';
import SalesManager from './components/SalesManager';
import PaymentManager from './components/PaymentManager';
import FeedbackForm from './components/FeedbackForm';
import FeedbackList from './components/FeedbackList';
import ExpenseManager from './components/ExpenseManager';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        const docRef = doc(db, 'users', firebaseUser.uid);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setProfile({ id: firebaseUser.uid, ...docSnap.data() } as UserProfile);
        } else {
          // Default role for new users
          const newProfile: UserProfile = {
            id: firebaseUser.uid,
            email: firebaseUser.email || '',
            role: firebaseUser.email === 'ruhundaallan@gmail.com' ? 'admin' : 'staff',
            name: firebaseUser.displayName || ''
          };
          await setDoc(docRef, newProfile);
          setProfile(newProfile);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  const handleLogout = () => signOut(auth);

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-amber-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-stone-600 font-medium animate-pulse">ArabicaFlow Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-white rounded-3xl shadow-xl shadow-stone-200 p-8 border border-stone-100"
        >
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center">
              <Coffee className="w-10 h-10 text-amber-700" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-center text-stone-900 mb-2">ArabicaFlow</h1>
          <p className="text-stone-500 text-center mb-8"> Ugandan Coffee Processing Management System</p>
          
          <button
            onClick={handleLogin}
            className="w-full py-3 px-4 bg-amber-700 hover:bg-amber-800 text-white rounded-xl font-semibold transition-all flex items-center justify-center gap-3 shadow-lg shadow-amber-100"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5 bg-white rounded-full p-0.5" alt="Google" />
            Sign in with Google
          </button>
          
          <div className="mt-8 pt-8 border-t border-stone-100 text-center">
            <p className="text-xs text-stone-400 uppercase tracking-widest font-bold">Secure Access Only</p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-stone-50 flex">
        {/* Sidebar */}
        <aside 
          className={cn(
            "fixed inset-y-0 left-0 z-50 bg-stone-900 text-stone-300 transition-all duration-300 ease-in-out border-r border-stone-800",
            isSidebarOpen ? "w-64" : "w-20"
          )}
        >
          <div className="h-full flex flex-col">
            <div className="p-6 flex items-center gap-4">
              <div className="w-10 h-10 bg-amber-600 rounded-xl flex items-center justify-center shrink-0">
                <Coffee className="w-6 h-6 text-white" />
              </div>
              {isSidebarOpen && (
                <span className="text-xl font-bold text-white tracking-tight">ArabicaFlow</span>
              )}
            </div>

            <nav className="flex-1 px-4 space-y-2 mt-4">
              <SidebarLink to="/" icon={<LayoutDashboard />} label="Dashboard" isOpen={isSidebarOpen} />
              <SidebarLink to="/farmers" icon={<Users />} label="Farmers" isOpen={isSidebarOpen} />
              <SidebarLink to="/batches" icon={<Coffee />} label="Batches" isOpen={isSidebarOpen} />
              <SidebarLink to="/workflow" icon={<TrendingUp />} label="Workflow" isOpen={isSidebarOpen} />
              <SidebarLink to="/inventory" icon={<TrendingUp />} label="Inventory" isOpen={isSidebarOpen} />
              <SidebarLink to="/sales" icon={<ShoppingBag />} label="Sales" isOpen={isSidebarOpen} />
              <SidebarLink to="/expenses" icon={<DollarSign />} label="Expenses" isOpen={isSidebarOpen} />
              <SidebarLink to="/payments" icon={<DollarSign />} label="Payments" isOpen={isSidebarOpen} />
              {profile?.role === 'admin' && (
                <SidebarLink to="/feedback" icon={<MessageSquare />} label="User Feedback" isOpen={isSidebarOpen} />
              )}
              <SidebarLink to="/prices" icon={<Settings />} label="Pricing" isOpen={isSidebarOpen} />
              <button 
                onClick={() => setIsFeedbackOpen(true)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group text-stone-400 hover:bg-stone-800 hover:text-stone-200",
                  !isSidebarOpen && "justify-center"
                )}
              >
                <MessageSquare className="w-5 h-5 text-stone-500 group-hover:text-stone-300" />
                {isSidebarOpen && <span className="text-sm font-semibold">Feedback</span>}
              </button>
            </nav>

            <div className="p-4 border-t border-stone-800">
              <div className="flex items-center gap-3 mb-4 px-2">
                <div className="w-8 h-8 rounded-full bg-stone-700 flex items-center justify-center text-xs font-bold text-white shrink-0">
                  {user.displayName?.[0] || 'U'}
                </div>
                {isSidebarOpen && (
                  <div className="overflow-hidden">
                    <p className="text-sm font-medium text-white truncate">{user.displayName}</p>
                    <p className="text-xs text-stone-500 capitalize">{profile?.role}</p>
                  </div>
                )}
              </div>
              <button 
                onClick={handleLogout}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-red-900/20 hover:text-red-400 transition-colors",
                  !isSidebarOpen && "justify-center"
                )}
              >
                <LogOut className="w-5 h-5" />
                {isSidebarOpen && <span className="text-sm font-medium">Logout</span>}
              </button>
            </div>
          </div>

          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="absolute -right-3 top-20 w-6 h-6 bg-amber-600 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-amber-700 transition-colors"
          >
            {isSidebarOpen ? <X size={14} /> : <Menu size={14} />}
          </button>
        </aside>

        {/* Main Content */}
        <main className={cn(
          "flex-1 transition-all duration-300",
          isSidebarOpen ? "ml-64" : "ml-20"
        )}>
          <div className="p-8 max-w-7xl mx-auto">
            <Routes>
              <Route path="/" element={<Dashboard profile={profile} />} />
              <Route path="/farmers" element={<FarmerList />} />
              <Route path="/batches" element={<BatchList />} />
              <Route path="/batches/:id/history" element={<BatchHistory />} />
              <Route path="/workflow" element={<ProcessingWorkflow />} />
              <Route path="/inventory" element={<InventoryAnalytics />} />
              <Route path="/sales" element={<SalesManager />} />
              <Route path="/expenses" element={<ExpenseManager />} />
              <Route path="/payments" element={<PaymentManager />} />
              {profile?.role === 'admin' && (
                <Route path="/feedback" element={<FeedbackList />} />
              )}
              <Route path="/prices" element={<PriceManager isAdmin={profile?.role === 'admin'} />} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </div>
        </main>
      </div>
      <FeedbackForm isOpen={isFeedbackOpen} onClose={() => setIsFeedbackOpen(false)} />
    </Router>
  );
}

function SidebarLink({ to, icon, label, isOpen }: { to: string, icon: React.ReactNode, label: string, isOpen: boolean }) {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <Link 
      to={to}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group",
        isActive 
          ? "bg-amber-600 text-white shadow-lg shadow-amber-900/20" 
          : "text-stone-400 hover:bg-stone-800 hover:text-stone-200",
        !isOpen && "justify-center"
      )}
    >
      <span className={cn("shrink-0", isActive ? "text-white" : "text-stone-500 group-hover:text-stone-300")}>
        {icon}
      </span>
      {isOpen && <span className="text-sm font-semibold">{label}</span>}
    </Link>
  );
}
