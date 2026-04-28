import { useState } from 'react';
import { ShieldAlert, CheckCircle2, Shield, Send } from 'lucide-react';
import { collection, addDoc, serverTimestamp, doc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';
import './index.css';

function App() {
  const [isEmergency, setIsEmergency] = useState(false);
  const [location, setLocation] = useState(null);
  const [statusText, setStatusText] = useState('System Ready');
  const [currentAlertId, setCurrentAlertId] = useState(null);
  
  // New state for AI feature
  const [description, setDescription] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiTag, setAiTag] = useState(null);

  const analyzeWithGemini = async (text) => {
    setIsAnalyzing(true);
    setStatusText('AI Analyzing Situation...');
    
    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      const prompt = `
        You are an emergency triage AI. Categorize the following emergency description.
        Return ONLY a raw JSON object with no markdown formatting.
        Fields required:
        - "category": Must be one of: MEDICAL, FIRE, SECURITY, OTHER
        - "severity": Number from 1 to 5 (5 being most critical)
        - "action": A 3-word instruction for responders (e.g. "Bring Defibrillator Now")
        
        Description: "${text}"
      `;

      // Using Local Gemma via Ollama!
      const response = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: "gemma:2b",
          prompt: prompt,
          stream: false,
          format: "json"
        })
      });

      const data = await response.json();
      console.log("Local Gemma Response:", data);

      if (!data.response) {
        throw new Error("Invalid local API response: " + JSON.stringify(data));
      }

      // Ollama returns the string in data.response
      const rawText = data.response;
      
      // Clean up markdown block if Gemma accidentally includes it
      const cleanedText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
      const aiResult = JSON.parse(cleanedText);
      
      setAiTag(aiResult);
      
      // Update Firebase with the AI analysis
      if (currentAlertId) {
        const alertRef = doc(db, 'alerts', currentAlertId);
        await updateDoc(alertRef, {
          ai_analysis: aiResult,
          description: text,
          updatedAt: serverTimestamp()
        });
      }
      
      setStatusText('Details Sent to Responders');
      setDescription(''); // Clear input

    } catch (error) {
      console.error("Gemini Error:", error);
      setStatusText('Failed to analyze, but text was logged.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const triggerSOS = async () => {
    if (isEmergency && currentAlertId) {
      // Cancel emergency
      setIsEmergency(false);
      setStatusText('System Ready');
      setAiTag(null);
      
      try {
        const alertRef = doc(db, 'alerts', currentAlertId);
        await updateDoc(alertRef, {
          status: 'resolved',
          resolvedAt: serverTimestamp()
        });
      } catch (e) {
        console.error("Error resolving alert:", e);
      }
      
      setCurrentAlertId(null);
      return;
    }

    setIsEmergency(true);
    setStatusText('Acquiring Location...');

    const sendAlertToFirebase = async (lat, lng) => {
      try {
        setStatusText('Sending Alert to Network...');
        const docRef = await addDoc(collection(db, "alerts"), {
          type: "GENERAL_SOS", 
          status: "active",
          room: "Room 102",
          location: { lat, lng },
          timestamp: serverTimestamp(),
        });
        setCurrentAlertId(docRef.id);
        setStatusText('Alert Broadcasted. Responders Dispatched.');
      } catch (e) {
        console.error("Error adding document: ", e);
        setStatusText('Error: Could not reach network');
      }
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setLocation({ lat, lng });
          sendAlertToFirebase(lat, lng);
        },
        (error) => {
          console.error("Error getting location", error);
          setStatusText('GPS Error. Sending without location.');
          sendAlertToFirebase(null, null);
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    } else {
      setStatusText('No GPS Support. Sending without location.');
      sendAlertToFirebase(null, null);
    }
  };

  return (
    <div className="app-container">
      <div className="glass-card">
        <Shield className="mb-4 text-slate-400" size={48} />
        <h1>Aegis Protocol</h1>
        <p>Guest Emergency Response System</p>

        <div className="sos-button-container">
          <div className="sos-pulse-ring" style={{ display: isEmergency ? 'block' : 'none' }}></div>
          <button 
            className={`sos-button ${isEmergency ? 'active-state' : ''}`}
            onClick={triggerSOS}
          >
            {isEmergency ? (
              <>
                <CheckCircle2 size={40} className="mb-2" />
                <span style={{ fontSize: '1.2rem' }}>Safe</span>
              </>
            ) : (
              <>
                <ShieldAlert size={48} className="mb-2" />
                <span>SOS</span>
              </>
            )}
          </button>
        </div>

        <div className="status-badge">
          <div className={`status-indicator ${isEmergency ? 'offline' : ''}`}></div>
          {statusText}
        </div>
        
        {/* New AI Input Section */}
        {isEmergency && currentAlertId && !aiTag && (
          <div className="mt-8 w-full animate-fade-in flex flex-col items-center">
             <p className="text-sm text-slate-300 mb-2 font-medium">Please describe the situation (Optional)</p>
             <div className="flex gap-2 w-full max-w-sm">
                <input 
                  type="text" 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g., Someone collapsed..."
                  className="w-full px-4 py-3 rounded-xl bg-slate-800/50 border border-slate-600 text-white placeholder-slate-400 focus:outline-none focus:border-red-400 transition-colors"
                />
                <button 
                  onClick={() => analyzeWithGemini(description)}
                  disabled={!description.trim() || isAnalyzing}
                  className="bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white px-4 py-3 rounded-xl transition-colors flex items-center justify-center"
                >
                  <Send size={20} />
                </button>
             </div>
          </div>
        )}

        {/* AI Tag Display */}
        {aiTag && (
           <div className="mt-6 p-4 rounded-xl border w-full max-w-sm bg-slate-800/80 border-slate-600 shadow-lg text-left">
              <div className="flex justify-between items-center mb-2">
                <span className={`text-xs font-bold px-2 py-1 rounded ${
                  aiTag.category === 'MEDICAL' ? 'bg-blue-500/20 text-blue-400' : 
                  aiTag.category === 'FIRE' ? 'bg-orange-500/20 text-orange-400' : 
                  aiTag.category === 'SECURITY' ? 'bg-red-500/20 text-red-400' : 
                  'bg-slate-500/20 text-slate-400'
                }`}>
                  {aiTag.category}
                </span>
                <span className="text-xs font-mono text-slate-400">Severity: {aiTag.severity}/5</span>
              </div>
              <p className="text-sm font-medium text-white">{aiTag.action}</p>
           </div>
        )}

        {location && isEmergency && (
          <div className="mt-6 text-xs text-slate-400 font-mono bg-slate-800/50 px-3 py-2 rounded-lg border border-slate-700">
            LOC: {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
