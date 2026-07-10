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
    <div className="max-w-7xl mx-auto pb-24 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">My Documents</h1>
          <p className="text-slate-500 mt-2">Access your official HR documents, contracts, and policies.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Document List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <FileStack className="w-5 h-5 text-brand-600" /> Official Documents
              </h2>
            </div>
            
            <div className="divide-y divide-slate-100">
              {documents.length === 0 ? (
                <div className="p-12 text-center text-slate-500">
                  <FileStack className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  No documents found.
                </div>
              ) : (
                documents.map((doc) => (
                  <div key={doc.id} className="p-5 flex items-center justify-between hover:bg-slate-50 transition-colors group">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-rose-100 rounded-lg flex items-center justify-center text-rose-600 shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 group-hover:text-brand-600 transition-colors">{doc.name}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs font-bold text-slate-500">{doc.category}</span>
                          <span className="text-slate-300">•</span>
                          <span className="text-xs text-slate-400">{new Date(doc.date).toLocaleDateString()}</span>
                          <span className="text-slate-300">•</span>
                          <span className="text-xs text-slate-400">{doc.size}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-2 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors">
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
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-4">
              <Upload className="w-5 h-5 text-brand-600" /> Upload Document
            </h2>
            <p className="text-sm text-slate-500 mb-6">Need to submit a sick leave certificate, expense receipt, or ID proof to HR?</p>
            
            <form onSubmit={handleUpload}>
              <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:border-brand-300 hover:bg-brand-50 transition-colors cursor-pointer mb-4">
                <FileSignature className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-sm font-bold text-slate-600">Click to browse or drag file here</p>
                <p className="text-xs text-slate-400 mt-1">PDF, JPG, or PNG (Max 5MB)</p>
              </div>
              
              <select className="w-full px-4 py-2 mb-4 rounded-lg border border-slate-300 focus:ring-brand-500 text-sm">
                <option value="">Select Document Type...</option>
                <option value="id">Identity Proof</option>
                <option value="medical">Medical Certificate</option>
                <option value="expense">Expense Receipt</option>
                <option value="other">Other</option>
              </select>

              <button 
                type="submit" 
                disabled={isUploading}
                className="w-full py-2.5 bg-brand-600 text-white font-bold rounded-lg hover:bg-brand-700 transition-colors shadow-sm disabled:bg-brand-400 flex items-center justify-center gap-2"
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
