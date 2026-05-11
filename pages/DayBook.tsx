
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Plus, 
  Search, 
  Calendar, 
  ArrowUpRight, 
  ArrowDownRight, 
  Filter, 
  IndianRupee, 
  Clock, 
  X, 
  Check, 
  Printer, 
  Download, 
  Trash2, 
  Wallet, 
  Briefcase, 
  History, 
  AlertCircle, 
  FileText, 
  Paperclip, 
  ImageIcon, 
  Eye, 
  Building2, 
  Hash, 
  Map as MapIcon, 
  Edit3, 
  Loader2, 
  ShieldCheck,
  ExternalLink,
  User,
  Tag,
  CreditCard
} from 'lucide-react';
import { Transaction, TransactionType, Trip } from '../types';
import { MOCK_TRIPS, BRAND_CONFIG } from '../constants';

import { safeLocalStorage, STORAGE_KEYS } from '../utils/storage';

const TRANSACTION_CATEGORIES = {
  INCOME: ['Client Advance', 'Final Payment', 'Misc Revenue', 'Incentive', 'Refund Recieved'],
  EXPENSE: ['Hotel Payout', 'Driver Payment', 'Activity Booking', 'Office Rent', 'Electricity', 'Internet', 'Marketing', 'Salary', 'Stationery', 'Tea/Meals', 'Fuel Cost', 'Misc Expense']
};

const generateTxId = () => `tx-${Math.floor(Math.random() * 1000000000)}`;

const DayBook: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    try {
      const saved = safeLocalStorage.getItem(STORAGE_KEYS.DAYBOOK);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error('Failed to parse daybook:', e);
      return [];
    }
  });
  const [allTrips, setAllTrips] = useState<Trip[]>(() => {
    try {
      const savedTrips = safeLocalStorage.getItem(STORAGE_KEYS.TRIPS);
      return savedTrips ? JSON.parse(savedTrips) : MOCK_TRIPS;
    } catch (e) {
      console.error('Failed to parse trips in DayBook:', e);
      return MOCK_TRIPS;
    }
  });
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewingTx, setViewingTx] = useState<Transaction | null>(null);
  const [viewingReceiptOnly, setViewingReceiptOnly] = useState<Transaction | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const receiptInputRef = useRef<HTMLInputElement>(null);
  const manifestRef = useRef<HTMLDivElement>(null);
  
  const [formData, setFormData] = useState<Partial<Transaction>>({
    type: 'INCOME',
    category: 'Client Advance',
    amount: 0,
    description: '',
    paymentMode: 'Bank Transfer',
    vendorName: '',
    billNumber: '',
    taxAmount: 0,
    tripReference: '',
    receiptData: '',
    receiptName: ''
  });


  const saveTransactions = (updated: Transaction[]) => {
    setTransactions(updated);
    safeLocalStorage.setItem(STORAGE_KEYS.DAYBOOK, JSON.stringify(updated));
  };

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const isSameDate = t.date === selectedDate;
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = t.description.toLowerCase().includes(searchLower) || 
                           t.category.toLowerCase().includes(searchLower) ||
                           t.vendorName?.toLowerCase().includes(searchLower) ||
                           t.billNumber?.toLowerCase().includes(searchLower) ||
                           t.tripReference?.toLowerCase().includes(searchLower) ||
                           t.author.toLowerCase().includes(searchLower) ||
                           t.amount.toString().includes(searchLower);
      return isSameDate && matchesSearch;
    }).sort((a, b) => b.id.localeCompare(a.id));
  }, [transactions, selectedDate, searchTerm]);

  const summary = useMemo(() => {
    const daily = transactions.filter(t => t.date === selectedDate);
    const income = daily.filter(t => t.type === 'INCOME').reduce((acc, t) => acc + t.amount, 0);
    const expense = daily.filter(t => t.type === 'EXPENSE').reduce((acc, t) => acc + t.amount, 0);
    return { income, expense, balance: income - expense };
  }, [transactions, selectedDate]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          receiptData: reader.result as string,
          receiptName: file.name
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const openAddModal = () => {
    setEditingId(null);
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (tx: Transaction) => {
    setEditingId(tx.id);
    setFormData({ ...tx });
    setIsModalOpen(true);
  };

  const handleSaveTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    const txData: Transaction = {
      ...formData,
      id: editingId || generateTxId(),
      date: selectedDate,
      author: formData.author || 'Executive Partner',
      type: formData.type as TransactionType,
      category: formData.category || 'Misc',
      amount: formData.amount || 0,
      description: formData.description || '',
      paymentMode: formData.paymentMode as any || 'Cash',
    } as Transaction;

    let updated: Transaction[];
    if (editingId) {
      updated = transactions.map(t => t.id === editingId ? txData : t);
    } else {
      updated = [...transactions, txData];
    }

    saveTransactions(updated);
    setIsModalOpen(false);
    setEditingId(null);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      type: 'INCOME',
      category: 'Client Advance',
      amount: 0,
      description: '',
      paymentMode: 'Bank Transfer',
      vendorName: '',
      billNumber: '',
      taxAmount: 0,
      tripReference: '',
      receiptData: '',
      receiptName: ''
    });
  };

  const deleteTransaction = (id: string) => {
    if (window.confirm("Permanently remove this ledger entry?")) {
      saveTransactions(transactions.filter(t => t.id !== id));
    }
  };

  const downloadManifestPDF = async () => {
    if (filteredTransactions.length === 0) return;
    setIsProcessing(true);
    try {
      const element = manifestRef.current;
      const opt = {
        margin: 10,
        filename: `EscapeTheory_DayBook_${selectedDate}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
      };
      await (window as any).html2pdf().from(element).set(opt).save();
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const printManifest = () => {
    window.print();
  };

  const downloadSingleReceipt = (tx: Transaction) => {
    if (!tx.receiptData) return;
    const link = document.createElement('a');
    link.href = tx.receiptData;
    link.download = `Receipt_${tx.billNumber || tx.id}_${tx.receiptName || 'document'}`;
    link.click();
  };

  const displayDate = new Date(selectedDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 no-print">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
             <div className="w-3 h-8 bg-blue-600 rounded-full" /> Finance Day Book
          </h1>
          <p className="text-slate-500 text-sm mt-1">Internal inventory of cash movement and vendor settlements.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="bg-slate-900 border-4 border-slate-950 rounded-2xl p-2.5 flex items-center gap-3 shadow-xl hover:bg-black group">
            <Calendar size={20} className="text-blue-400" />
            <input 
              type="date" 
              className="bg-transparent font-black text-sm uppercase tracking-widest outline-none border-none cursor-pointer text-white appearance-none"
              style={{ colorScheme: 'dark' }}
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>
          <button 
            onClick={openAddModal}
            className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] flex items-center gap-3 hover:bg-blue-700 shadow-2xl transition-all active:scale-95 border-2 border-blue-500"
          >
            <Plus size={20} strokeWidth={3} /> New Entry
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 no-print">
        <div className="bg-emerald-600 p-8 rounded-[40px] text-white shadow-xl shadow-emerald-500/10 relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
              <ArrowUpRight size={80} />
           </div>
           <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-100">Daily Incomings</p>
           <h3 className="text-4xl font-black mt-2">₹{summary.income.toLocaleString()}</h3>
           <div className="mt-4 flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
              <span className="text-[9px] font-black uppercase tracking-widest">Gross Revenue</span>
           </div>
        </div>

        <div className="bg-rose-600 p-8 rounded-[40px] text-white shadow-xl shadow-rose-500/10 relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
              <ArrowDownRight size={80} />
           </div>
           <p className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-100">Daily Expenses</p>
           <h3 className="text-4xl font-black mt-2">₹{summary.expense.toLocaleString()}</h3>
           <div className="mt-4 flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-white rounded-full" />
              <span className="text-[9px] font-black uppercase tracking-widest">Operational Outgo</span>
           </div>
        </div>

        <div className="bg-slate-950 p-8 rounded-[40px] text-white shadow-xl shadow-slate-950/20 relative overflow-hidden group border border-slate-800">
           <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
              <IndianRupee size={80} />
           </div>
           <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Day Closing Balance</p>
           <h3 className={`text-4xl font-black mt-2 ${summary.balance < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
              ₹{summary.balance.toLocaleString()}
           </h3>
           <div className="mt-4 flex items-center gap-2">
              <div className={`w-1.5 h-1.5 rounded-full ${summary.balance < 0 ? 'bg-rose-400' : 'bg-emerald-400'}`} />
              <span className="text-[9px] font-black uppercase tracking-widest">{summary.balance < 0 ? 'Cash Outflow' : 'Cash Positive'}</span>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-12 xl:col-span-8 space-y-6">
           <div className="bg-white p-5 rounded-[32px] border border-slate-200 shadow-sm flex items-center gap-6 no-print">
              <div className="flex-1 relative">
                 <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                 <input 
                   type="text" 
                   placeholder="Search by amount, vendor, trip, bill # or description..." 
                   className="w-full pl-14 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-black outline-none focus:ring-4 focus:ring-blue-50/50 transition-all text-slate-900"
                   value={searchTerm}
                   onChange={(e) => setSearchTerm(e.target.value)}
                 />
              </div>
              <button className="p-4 bg-slate-100 text-slate-600 rounded-2xl hover:bg-slate-200 transition-all"><Filter size={20}/></button>
           </div>

           <div className="bg-white rounded-[40px] border border-slate-200 shadow-sm overflow-hidden" ref={manifestRef}>
              <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                 <h3 className="text-xs font-black uppercase tracking-[0.3em] text-slate-600">Day Manifest: {displayDate}</h3>
                 <div className="flex items-center gap-3 no-print">
                    <button 
                      onClick={printManifest}
                      className="p-3 bg-white border border-slate-200 text-slate-900 rounded-xl hover:bg-slate-900 hover:text-white transition-all shadow-sm flex items-center gap-2 text-[10px] font-black uppercase tracking-widest"
                      title="Print Manifest"
                    >
                      <Printer size={18}/> PRINT
                    </button>
                    <button 
                      onClick={downloadManifestPDF}
                      disabled={isProcessing}
                      className="p-3 bg-white border border-slate-200 text-slate-900 rounded-xl hover:bg-slate-900 hover:text-white transition-all shadow-sm disabled:opacity-50 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest"
                      title="Download PDF"
                    >
                      {isProcessing ? <Loader2 size={18} className="animate-spin" /> : <Download size={18}/>} PDF
                    </button>
                 </div>
              </div>
              
              <div className="overflow-x-auto">
                 <table className="w-full text-left border-collapse">
                    <thead>
                       <tr className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] border-b border-slate-100">
                          <th className="px-8 py-6">Context/Ref</th>
                          <th className="px-8 py-6">Allocation</th>
                          <th className="px-8 py-6">Particulars</th>
                          <th className="px-8 py-6 text-right">Amount</th>
                          <th className="px-8 py-6 w-44 no-print text-center">Manage</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                       {filteredTransactions.map(tx => (
                          <tr key={tx.id} className="group hover:bg-slate-50/80 transition-all">
                             <td className="px-8 py-8">
                                <div className="space-y-2">
                                   <div className="flex items-center gap-2 text-[10px] font-black text-slate-600 uppercase">
                                      <Clock size={12} className="text-blue-600" /> {new Date(parseInt(tx.id.split('-')[1])).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                   </div>
                                   {tx.tripReference && (
                                     <div className="flex items-center gap-1.5 text-[9px] font-black text-blue-800 bg-blue-100/50 px-2.5 py-1 rounded-lg w-fit uppercase tracking-tighter border border-blue-200">
                                        <MapIcon size={10} /> {tx.tripReference}
                                     </div>
                                   )}
                                </div>
                             </td>
                             <td className="px-8 py-8">
                                <div className="flex items-center gap-3">
                                   <div className={`p-3 rounded-xl shadow-lg ${tx.type === 'INCOME' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'}`}>
                                      {tx.type === 'INCOME' ? <ArrowUpRight size={18} strokeWidth={3} /> : <ArrowDownRight size={18} strokeWidth={3} />}
                                   </div>
                                   <div>
                                      <p className="font-black text-slate-900 text-sm tracking-tight">{tx.category}</p>
                                      <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{tx.paymentMode}</p>
                                   </div>
                                </div>
                             </td>
                             <td className="px-8 py-8">
                                <div className="space-y-1.5">
                                  {tx.vendorName && <p className="text-[13px] font-black text-slate-900 flex items-center gap-2"><Building2 size={14} className="text-blue-600"/> {tx.vendorName}</p>}
                                  {tx.billNumber && <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5"><Hash size={10}/> Invoice: {tx.billNumber}</p>}
                                  {tx.receiptData && (
                                    <button 
                                      onClick={() => setViewingReceiptOnly(tx)}
                                      className="flex items-center gap-2 text-[10px] font-black text-blue-600 uppercase tracking-widest hover:text-blue-800 underline no-print mt-1"
                                    >
                                      <Paperclip size={12}/> Document Attached
                                    </button>
                                  )}
                                </div>
                             </td>
                             <td className="px-8 py-8 text-right">
                                <div className={`text-2xl font-black tracking-tighter ${tx.type === 'INCOME' ? 'text-emerald-700' : 'text-rose-700'}`}>
                                   {tx.type === 'INCOME' ? '+' : '-'} ₹{tx.amount.toLocaleString()}
                                </div>
                                {tx.taxAmount && tx.taxAmount > 0 && (
                                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Incl. ₹{tx.taxAmount.toLocaleString()} GST</p>
                                )}
                             </td>
                             <td className="px-8 py-8 no-print">
                                <div className="flex items-center justify-center gap-3">
                                  <button 
                                    onClick={() => setViewingTx(tx)}
                                    className="p-3 bg-slate-950 text-white rounded-2xl hover:bg-blue-600 transition-all shadow-lg active:scale-95 border border-slate-800"
                                    title="View Record Details"
                                  >
                                    <Eye size={18}/>
                                  </button>
                                  <button 
                                    onClick={() => openEditModal(tx)}
                                    className="p-3 bg-slate-950 text-white rounded-2xl hover:bg-amber-600 transition-all shadow-lg active:scale-95 border border-slate-800"
                                    title="Edit Record"
                                  >
                                    <Edit3 size={18}/>
                                  </button>
                                  <button 
                                    onClick={() => deleteTransaction(tx.id)}
                                    className="p-3 bg-slate-950 text-white rounded-2xl hover:bg-rose-600 transition-all shadow-lg active:scale-95 border border-slate-800"
                                    title="Delete Record"
                                  >
                                    <Trash2 size={18}/>
                                  </button>
                                </div>
                             </td>
                          </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
           </div>
        </div>

        <div className="col-span-12 xl:col-span-4 space-y-8 no-print">
           <div className="bg-slate-950 p-10 rounded-[48px] text-white space-y-8 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                 <Wallet size={200} />
              </div>
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
                 <Briefcase size={16} className="text-blue-500" /> Operational Context
              </h3>
              <div className="space-y-6 relative z-10">
                 <div className="bg-white/5 border border-white/10 p-8 rounded-[32px] space-y-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Inventory Policy</p>
                    <p className="text-sm font-bold text-slate-300 leading-relaxed italic">
                       "All daily settlements should include a digital receipt. Unaccounted expenses will flag for manual audit."
                    </p>
                 </div>
              </div>
           </div>
        </div>
      </div>

      {/* Entry Modal (Add/Edit) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[150] flex items-center justify-center p-6 animate-in fade-in duration-300 no-print">
           <div className="bg-white rounded-[48px] shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-300 border border-slate-200">
              <div className="bg-slate-950 p-8 flex items-center justify-between text-white shrink-0">
                 <div className="flex items-center gap-6">
                    <div className="bg-blue-600 p-4 rounded-[20px] shadow-2xl shadow-blue-900/40 border border-blue-500">
                       {editingId ? <Edit3 size={28}/> : <IndianRupee size={28} />}
                    </div>
                    <div>
                       <h2 className="text-2xl font-black tracking-tight uppercase">{editingId ? 'Edit Ledger Entry' : 'Ledger Registration'}</h2>
                       <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">{displayDate}</p>
                    </div>
                 </div>
                 <button onClick={() => { setIsModalOpen(false); setEditingId(null); resetForm(); }} className="p-2 text-slate-500 hover:text-white transition-colors"><X size={32}/></button>
              </div>

              <form onSubmit={handleSaveTransaction} className="flex-1 overflow-y-auto p-12 space-y-12 bg-slate-50/50">
                 <div className="flex gap-4 p-2 bg-white border border-slate-200 rounded-[28px] w-full shadow-sm">
                    <button 
                      type="button"
                      onClick={() => setFormData({...formData, type: 'INCOME', category: TRANSACTION_CATEGORIES.INCOME[0]})}
                      className={`flex-1 py-5 rounded-[22px] font-black text-[11px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 ${
                        formData.type === 'INCOME' ? 'bg-emerald-600 text-white shadow-xl shadow-emerald-900/20' : 'text-slate-400 hover:text-slate-900'
                      }`}
                    >
                      <ArrowUpRight size={18}/> Incoming Funds
                    </button>
                    <button 
                      type="button"
                      onClick={() => setFormData({...formData, type: 'EXPENSE', category: TRANSACTION_CATEGORIES.EXPENSE[0]})}
                      className={`flex-1 py-5 rounded-[22px] font-black text-[11px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 ${
                        formData.type === 'EXPENSE' ? 'bg-rose-600 text-white shadow-xl shadow-rose-900/20' : 'text-slate-400 hover:text-slate-900'
                      }`}
                    >
                      <ArrowDownRight size={18}/> Operational Payout
                    </button>
                 </div>

                 <div className="space-y-6">
                    <h4 className="text-[10px] font-black uppercase text-blue-600 tracking-[0.3em] border-b border-blue-50 pb-2 flex items-center gap-2">
                       <Wallet size={14}/> Core Financial Data
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                       <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Allocation Hub</label>
                          <select 
                            required
                            className="w-full p-4 bg-white border-2 border-slate-200 rounded-2xl font-black text-xs uppercase tracking-widest text-slate-900 outline-none focus:ring-4 focus:ring-blue-50 transition-all shadow-sm"
                            value={formData.category}
                            onChange={(e) => setFormData({...formData, category: e.target.value})}
                          >
                             {formData.type === 'INCOME' 
                               ? TRANSACTION_CATEGORIES.INCOME.map(c => <option key={c} value={c}>{c}</option>)
                               : TRANSACTION_CATEGORIES.EXPENSE.map(c => <option key={c} value={c}>{c}</option>)
                             }
                          </select>
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Net Amount (INR)</label>
                          <div className="relative">
                             <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-600" size={18} />
                             <input 
                               required
                               type="number" 
                               className="w-full pl-10 pr-4 py-4 bg-white border-2 border-slate-200 rounded-2xl font-black text-lg text-slate-900 outline-none focus:ring-4 focus:ring-blue-50 transition-all shadow-sm"
                               value={formData.amount || ''}
                               onChange={(e) => setFormData({...formData, amount: parseInt(e.target.value) || 0})}
                             />
                          </div>
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Included Tax / GST</label>
                          <div className="relative">
                             <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                             <input 
                               type="number" 
                               placeholder="0.00"
                               className="w-full pl-10 pr-4 py-4 bg-white border-2 border-slate-200 rounded-2xl font-black text-lg text-slate-900 outline-none focus:ring-4 focus:ring-blue-50 transition-all shadow-sm"
                               value={formData.taxAmount || ''}
                               onChange={(e) => setFormData({...formData, taxAmount: parseInt(e.target.value) || 0})}
                             />
                          </div>
                       </div>
                    </div>
                 </div>

                 <div className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                       <div className="space-y-4">
                          <h4 className="text-[10px] font-black uppercase text-blue-600 tracking-[0.3em] border-b border-blue-50 pb-2 flex items-center gap-2">
                             <Paperclip size={14}/> Evidence / Receipt
                          </h4>
                          <div className={`p-10 border-4 border-dashed rounded-[32px] flex flex-col items-center justify-center gap-4 transition-all ${
                            formData.receiptData ? 'bg-blue-50 border-blue-400' : 'bg-white border-slate-200 hover:bg-slate-50'
                          }`}>
                             {formData.receiptData ? (
                               <>
                                 <div className="bg-white p-4 rounded-2xl shadow-lg text-blue-600">
                                    <ImageIcon size={40} />
                                 </div>
                                 <div className="text-center">
                                    <p className="text-xs font-black text-blue-900 truncate max-w-[200px]">{formData.receiptName}</p>
                                    <button 
                                      type="button" 
                                      onClick={() => setFormData({...formData, receiptData: '', receiptName: ''})}
                                      className="text-[9px] font-black text-rose-600 uppercase tracking-widest mt-2 hover:underline"
                                    >
                                       Change File
                                    </button>
                                 </div>
                               </>
                             ) : (
                               <button 
                                 type="button" 
                                 onClick={() => receiptInputRef.current?.click()}
                                 className="flex flex-col items-center gap-4 text-slate-400 group"
                               >
                                  <div className="p-5 bg-slate-50 rounded-2xl border-2 border-slate-200 group-hover:bg-white transition-all shadow-sm">
                                     <Plus size={32} className="text-blue-600" strokeWidth={3} />
                                  </div>
                                  <span className="text-[10px] font-black uppercase tracking-widest">Upload Receipt Document</span>
                               </button>
                             )}
                             <input type="file" ref={receiptInputRef} className="hidden" accept="image/*,application/pdf" onChange={handleFileChange} />
                          </div>
                       </div>

                       <div className="space-y-4">
                          <h4 className="text-[10px] font-black uppercase text-blue-600 tracking-[0.3em] border-b border-blue-50 pb-2 flex items-center gap-2">
                             <FileText size={14}/> Internal Narrative
                          </h4>
                          <textarea 
                            rows={6} 
                            className="w-full p-8 bg-white border-2 border-slate-200 rounded-[32px] font-medium text-sm text-slate-900 outline-none focus:ring-4 focus:ring-blue-100 transition-all shadow-sm resize-none" 
                            placeholder="Add narrative context for this ledger entry..."
                            value={formData.description || ''}
                            onChange={(e) => setFormData({...formData, description: e.target.value})}
                          />
                       </div>
                    </div>
                 </div>

                 <div className="pt-8 flex gap-6 border-t border-slate-100">
                    <button 
                      type="button" 
                      onClick={() => { setIsModalOpen(false); setEditingId(null); resetForm(); }} 
                      className="flex-1 py-5 text-slate-400 font-black uppercase tracking-widest text-[11px] hover:bg-slate-100 rounded-3xl transition-all"
                    >
                       Discard
                    </button>
                    <button 
                      type="submit" 
                      className="flex-[2] py-5 bg-slate-950 text-white font-black uppercase tracking-[0.2em] text-[11px] rounded-3xl shadow-2xl hover:bg-blue-600 transition-all active:scale-95 flex items-center justify-center gap-3 border border-slate-800"
                    >
                       <Check size={20} strokeWidth={3}/> {editingId ? 'Save Changes' : 'Commit to Ledger'}
                    </button>
                 </div>
              </form>
           </div>
        </div>
      )}

      {/* FULL RECORD VIEWER (Details Panel) */}
      {viewingTx && (
        <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-xl z-[200] flex items-center justify-center p-6 animate-in fade-in duration-300 no-print">
           <div className="bg-white rounded-[48px] shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-300 border border-slate-200">
              
              {/* Header */}
              <div className="bg-slate-950 p-8 flex items-center justify-between text-white shrink-0">
                 <div className="flex items-center gap-6">
                    <div className={`p-4 rounded-[20px] shadow-2xl ${viewingTx.type === 'INCOME' ? 'bg-emerald-600' : 'bg-rose-600'} border border-white/20`}>
                       {viewingTx.type === 'INCOME' ? <ArrowUpRight size={28} /> : <ArrowDownRight size={28} />}
                    </div>
                    <div>
                       <h2 className="text-2xl font-black tracking-tight uppercase">Ledger Record Details</h2>
                       <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Record ID: {viewingTx.id} • Auth by {viewingTx.author}</p>
                    </div>
                 </div>
                 <div className="flex items-center gap-3">
                    <button 
                      onClick={() => downloadSingleReceipt(viewingTx)}
                      disabled={!viewingTx.receiptData}
                      className="p-3 bg-white/10 hover:bg-white/20 rounded-xl text-blue-400 transition-all disabled:opacity-30"
                      title="Download Attachment"
                    >
                      <Download size={20}/>
                    </button>
                    <button 
                      onClick={() => window.print()}
                      className="p-3 bg-white/10 hover:bg-white/20 rounded-xl text-blue-400 transition-all"
                      title="Print Entry"
                    >
                      <Printer size={20}/>
                    </button>
                    <button onClick={() => setViewingTx(null)} className="p-3 text-slate-500 hover:text-white transition-colors ml-4"><X size={32}/></button>
                 </div>
              </div>

              <div className="flex-1 overflow-hidden flex flex-col lg:flex-row bg-slate-50">
                 
                 {/* Details Panel */}
                 <div className="w-full lg:w-2/5 overflow-y-auto p-10 space-y-10 border-r border-slate-200 bg-white">
                    
                    <div className="space-y-10">
                       <div className="bg-slate-50 p-8 rounded-[40px] border border-slate-100 shadow-inner">
                          <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em] mb-2">Authenticated Total</p>
                          <div className={`text-5xl font-black tracking-tighter ${viewingTx.type === 'INCOME' ? 'text-emerald-600' : 'text-rose-600'}`}>
                             ₹{viewingTx.amount.toLocaleString()}
                          </div>
                          {viewingTx.taxAmount && viewingTx.taxAmount > 0 && (
                            <p className="text-xs font-bold text-slate-400 mt-2 uppercase tracking-widest flex items-center gap-1.5">
                               <ShieldCheck size={14} className="text-blue-500" /> Inclusive of ₹{viewingTx.taxAmount.toLocaleString()} GST
                            </p>
                          )}
                       </div>

                       <div className="grid grid-cols-2 gap-8">
                          <div className="space-y-1">
                             <span className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-1.5"><Tag size={12}/> Category</span>
                             <p className="font-black text-slate-900 text-lg">{viewingTx.category}</p>
                          </div>
                          <div className="space-y-1">
                             <span className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-1.5"><CreditCard size={12}/> Mode</span>
                             <p className="font-black text-slate-900 text-lg">{viewingTx.paymentMode}</p>
                          </div>
                       </div>

                       <div className="space-y-6 pt-6 border-t border-slate-50">
                          <div className="flex items-center gap-4">
                             <div className="bg-blue-50 p-2.5 rounded-xl text-blue-600"><Building2 size={20}/></div>
                             <div>
                                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Payee / Vendor</p>
                                <p className="font-black text-slate-900">{viewingTx.vendorName || 'General Operations'}</p>
                             </div>
                          </div>
                          <div className="flex items-center gap-4">
                             <div className="bg-amber-50 p-2.5 rounded-xl text-amber-600"><Hash size={20}/></div>
                             <div>
                                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Bill / Invoice #</p>
                                <p className="font-black text-slate-900">{viewingTx.billNumber || 'N/A'}</p>
                             </div>
                          </div>
                          <div className="flex items-center gap-4">
                             <div className="bg-emerald-50 p-2.5 rounded-xl text-emerald-600"><MapIcon size={20}/></div>
                             <div>
                                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Linked Itinerary</p>
                                <p className="font-black text-slate-900">{viewingTx.tripReference || 'Direct Office Expense'}</p>
                             </div>
                          </div>
                       </div>

                       <div className="space-y-3 pt-6 border-t border-slate-50">
                          <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-1.5"><FileText size={12}/> Internal Narrative</span>
                          <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 italic text-slate-600 text-sm leading-relaxed font-bold">
                             "{viewingTx.description || 'No detailed narrative provided for this entry.'}"
                          </div>
                       </div>
                    </div>
                 </div>

                 {/* Attachment View Area */}
                 <div className="flex-1 bg-slate-900 overflow-hidden flex flex-col">
                    <div className="p-4 bg-black/20 border-b border-white/5 flex items-center justify-between">
                       <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4 flex items-center gap-2">
                          <Paperclip size={14} /> Document Attachment
                       </span>
                    </div>
                    <div className="flex-1 p-8 flex items-center justify-center relative group">
                       {viewingTx.receiptData ? (
                          <img 
                            src={viewingTx.receiptData} 
                            className="max-w-full max-h-full object-contain rounded-2xl shadow-[0_0_100px_rgba(0,0,0,1)] border border-white/10" 
                            alt="Receipt Doc" 
                          />
                       ) : (
                          <div className="text-center space-y-4 opacity-20">
                             <ImageIcon size={100} className="mx-auto text-slate-300" />
                             <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-400">No Document Evidence Found</p>
                          </div>
                       )}
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* FOCUSED LIGHTBOX VIEWER (Only Attachment) */}
      {viewingReceiptOnly && (
        <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-3xl z-[300] flex flex-col animate-in fade-in duration-300 no-print p-6">
           <div className="flex items-center justify-between mb-6 shrink-0 bg-white/5 p-4 rounded-3xl border border-white/10">
              <div className="flex items-center gap-6">
                 <div className="bg-blue-600 p-3 rounded-2xl text-white shadow-xl">
                    <Paperclip size={24}/>
                 </div>
                 <div>
                    <h2 className="text-xl font-black text-white tracking-tight uppercase">Attached Evidence</h2>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Entry: {viewingReceiptOnly.category} • ₹{viewingReceiptOnly.amount.toLocaleString()}</p>
                 </div>
              </div>
              <div className="flex items-center gap-4">
                 <button 
                   onClick={() => downloadSingleReceipt(viewingReceiptOnly)}
                   className="p-4 bg-white/10 text-white rounded-2xl hover:bg-white/20 transition-all border border-white/10 flex items-center gap-3 text-[10px] font-black uppercase tracking-widest"
                 >
                    <Download size={20}/> Download
                 </button>
                 <button 
                   onClick={() => setViewingReceiptOnly(null)} 
                   className="p-4 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition-all shadow-2xl active:scale-95 border border-blue-500"
                 >
                    <X size={28} strokeWidth={3} />
                 </button>
              </div>
           </div>

           <div className="flex-1 rounded-[48px] overflow-hidden bg-black border border-white/5 flex items-center justify-center p-4 relative">
              {viewingReceiptOnly.receiptData ? (
                 <img 
                   src={viewingReceiptOnly.receiptData} 
                   className="max-w-full max-h-full object-contain rounded-2xl shadow-[0_0_150px_rgba(0,0,0,1)]" 
                   alt="Receipt Only" 
                 />
              ) : (
                 <div className="text-center opacity-30">
                    <ImageIcon size={120} className="mx-auto text-slate-700" />
                    <p className="text-sm font-black uppercase text-slate-600 tracking-widest mt-4">No Image Data</p>
                 </div>
              )}
           </div>
        </div>
      )}
    </div>
  );
};

export default DayBook;
