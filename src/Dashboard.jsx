import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';
import { Shield, AlertTriangle, MapPin, CheckCircle } from 'lucide-react';
import './index.css';

function Dashboard() {
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    // Listen for real-time updates where status is active
    const q = query(collection(db, "alerts"), where("status", "==", "active"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const activeAlerts = [];
      snapshot.forEach((doc) => {
        activeAlerts.push({ id: doc.id, ...doc.data() });
      });
      // Sort by newest first (descending timestamp)
      activeAlerts.sort((a, b) => b.timestamp?.toMillis() - a.timestamp?.toMillis());
      setAlerts(activeAlerts);
    });

    return () => unsubscribe();
  }, []);

  const resolveAlert = async (id) => {
    try {
      const alertRef = doc(db, 'alerts', id);
      await updateDoc(alertRef, {
        status: 'resolved',
        resolvedAt: serverTimestamp()
      });
    } catch (e) {
      console.error("Error resolving:", e);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white p-8 font-sans">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <header className="flex items-center justify-between mb-8 pb-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <Shield size={32} className="text-blue-500" />
            <div>
              <h1 className="text-2xl font-bold">Aegis Command Center</h1>
              <p className="text-sm text-slate-400">Live Incident Monitoring</p>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-slate-800 px-4 py-2 rounded-full border border-slate-700">
            <div className={`w-3 h-3 rounded-full ${alerts.length > 0 ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`}></div>
            <span className="text-sm font-medium">{alerts.length} Active Incidents</span>
          </div>
        </header>

        {/* Dashboard Grid */}
        {alerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500 bg-slate-800/20 rounded-2xl border border-slate-800 border-dashed">
            <CheckCircle size={48} className="mb-4 text-emerald-500/50" />
            <h2 className="text-xl font-medium">All Clear</h2>
            <p>No active emergencies reported across the property.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {alerts.map((alert) => (
              <div key={alert.id} className="bg-slate-800/80 backdrop-blur-md rounded-2xl p-6 border border-slate-700 shadow-xl relative overflow-hidden flex flex-col h-full">
                
                {/* Red warning bar at top */}
                <div className={`absolute top-0 left-0 w-full h-1 ${alert.ai_analysis ? (alert.ai_analysis.severity >= 4 ? 'bg-red-500' : 'bg-orange-500') : 'bg-red-500'}`}></div>

                {/* Card Header */}
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold flex items-center gap-2">
                      <AlertTriangle size={18} className="text-red-400" />
                      {alert.ai_analysis ? alert.ai_analysis.category : alert.type}
                    </h3>
                    <p className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                      <MapPin size={12} /> {alert.room}
                    </p>
                  </div>
                  {alert.ai_analysis && (
                    <span className="bg-slate-700 text-xs px-2 py-1 rounded font-mono border border-slate-600">
                      Sev: {alert.ai_analysis.severity}/5
                    </span>
                  )}
                </div>

                {/* Description (If Gemini parsed it) */}
                {alert.description && (
                  <div className="mb-4 bg-slate-900/50 p-3 rounded-lg border border-slate-700/50 flex-grow">
                    <p className="text-sm text-slate-300 italic">"{alert.description}"</p>
                  </div>
                )}

                {/* AI Action Plan */}
                {alert.ai_analysis && (
                  <div className="mb-6">
                    <p className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-1">AI Recommendation</p>
                    <p className="text-sm font-medium text-emerald-400 bg-emerald-500/10 inline-block px-2 py-1 rounded">
                      {alert.ai_analysis.action}
                    </p>
                  </div>
                )}

                {/* Footer Data */}
                <div className="flex justify-between items-end mt-auto pt-4 border-t border-slate-700/50">
                  <div className="text-xs font-mono text-slate-500">
                    {alert.location?.lat ? `GPS: ${alert.location.lat.toFixed(4)}, ${alert.location.lng.toFixed(4)}` : 'No GPS Data'}
                  </div>
                  <button 
                    onClick={() => resolveAlert(alert.id)}
                    className="bg-slate-700 hover:bg-emerald-600 transition-colors text-white text-xs px-4 py-2 rounded-lg font-medium"
                  >
                    Mark Resolved
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
