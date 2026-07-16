import { useState } from 'react';
import { FileStack, FileText, Download, Eye, Upload, FileSignature, Loader2 } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

export default function EmployeeDocuments() {
 const { currentUser } = useAppContext();
 const [isUploading, setIsUploading] = useState(false);
 
 const documents = [];

 const handleUpload = (e) => {
 e.preventDefault();
 setIsUploading(true);
 // Simulate upload delay
 setTimeout(() => {
 setIsUploading(false);
 alert('Document uploaded successfully for HR review.');
 }, 2000);
 };

 return (
 <div className="max-w-7xl mx-auto pb-24 animate-in fade-in slide-in-from-bottom-2 duration-150">
 <div className="flex justify-between items-end mb-10">
 <div>
 <h1 className="page-title">My Documents</h1>
 <p className="text-[var(--text-secondary)] mt-2">Access your official HR documents, contracts, and policies.</p>
 </div>
 </div>

 <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
 
 {/* Document List */}
 <div className="lg:col-span-2 space-y-6">
 <div className="bg-white border border-[var(--border)] overflow-hidden">
 <div className="p-6 border-b border-[var(--border)] flex items-center justify-between bg-[var(--bg-secondary)]">
 <h2 className="section-title flex items-center gap-2">
 <FileStack className="w-5 h-5 text-[var(--text-primary)]" /> Official Documents
 </h2>
 </div>
 
 <div className="divide-y divide-slate-100">
 {documents.length === 0 ? (
 <div className="p-12 text-center text-[var(--text-secondary)]">
 <FileStack className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-3" />
 No documents found.
 </div>
 ) : (
 documents.map((doc) => (
 <div key={doc.id} className="p-5 flex items-center justify-between hover:bg-[var(--bg-secondary)] transition-colors group">
 <div className="flex items-center gap-6">
 <div className="w-10 h-10 bg-rose-100 flex items-center justify-center text-rose-600 shrink-0">
 <FileText className="w-5 h-5" />
 </div>
 <div>
 <h4 className="font-bold text-[var(--text-primary)] group-hover:text-[var(--text-primary)] transition-colors">{doc.name}</h4>
 <div className="flex items-center gap-2 mt-1">
 <span className="text-xs font-bold text-[var(--text-secondary)]">{doc.category}</span>
 <span className="text-[var(--text-muted)]">•</span>
 <span className="text-xs text-[var(--text-secondary)]">{new Date(doc.date).toLocaleDateString()}</span>
 <span className="text-[var(--text-muted)]">•</span>
 <span className="text-xs text-[var(--text-secondary)]">{doc.size}</span>
 </div>
 </div>
 </div>
 
 <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
 <button className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors">
 <Eye className="w-4 h-4" />
 </button>
 <button className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors">
 <Download className="w-4 h-4" />
 </button>
 </div>
 </div>
 ))
 )}
 </div>
 </div>
 </div>

 {/* Sidebar */}
 <div className="space-y-6">
 <div className="bg-white p-6 border border-[var(--border)]">
 <h2 className="card-title flex items-center gap-2 mb-6">
 <Upload className="w-5 h-5 text-[var(--text-primary)]" /> Upload Document
 </h2>
 <p className="text-sm text-[var(--text-secondary)] mb-6">Need to submit a sick leave certificate, expense receipt, or ID proof to HR?</p>
 
 <form onSubmit={handleUpload}>
 <div className="border-2 border-dashed border-[var(--border)] p-6 text-center hover:border-[var(--border)] hover:bg-[var(--bg-secondary)] transition-colors cursor-pointer mb-6">
 <FileSignature className="w-8 h-8 text-[var(--text-secondary)] mx-auto mb-2" />
 <p className="text-sm font-bold text-[var(--text-secondary)]">Click to browse or drag file here</p>
 <p className="text-xs text-[var(--text-secondary)] mt-1">PDF, JPG, or PNG (Max 5MB)</p>
 </div>
 
 <select className="w-full px-4 py-2 mb-6 border border-[var(--border)] focus:ring-[var(--ring-focus)] text-sm">
 <option value="">Select Document Type...</option>
 <option value="id">Identity Proof</option>
 <option value="medical">Medical Certificate</option>
 <option value="expense">Expense Receipt</option>
 <option value="other">Other</option>
 </select>

 <button 
 type="submit" 
 disabled={isUploading}
 className="btn-primary"
 >
 {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Upload Document'}
 </button>
 </form>
 </div>
 </div>
 
 </div>
 </div>
 );
}









