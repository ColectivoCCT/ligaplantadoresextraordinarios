import { useState, useEffect } from 'react';
import { collection, getDocs, writeBatch, doc, query, orderBy, serverTimestamp, limit } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { signOut } from 'firebase/auth';

const AdminPanel = () => {
  const [invites, setInvites] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Estados para los dos tipos de generación
  const [targetEmail, setTargetEmail] = useState("");
  const [batchQuantity, setBatchQuantity] = useState(5);

  const PHP_URL = "https://laligadelosplantadoresextraordinarios.colectivocrecet.com/send_invite.php";

  const fetchInvites = async () => {
    try {
      const q = query(collection(db, "invites"), orderBy("createdAt", "desc"), limit(50));
      const querySnapshot = await getDocs(q);
      setInvites(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error("Error cargando tokens:", error);
    }
  };

  useEffect(() => { fetchInvites(); }, []);

  // --- LÓGICA DE ENVÍO PHP ---
  const sendEmailViaPHP = async (token, email) => {
    try {
      const response = await fetch(PHP_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email,
          token: token,
          link: `${window.location.origin}/register?token=${token}`
        })
      });
      return response.ok;
    } catch (e) { return false; }
  };

  // --- OPCIÓN 1: GENERAR Y ENVIAR ---
  const handleSingleInvite = async (e) => {
    e.preventDefault();
    if (!targetEmail) return;
    setLoading(true);
    
    const newToken = Math.random().toString(36).substring(2, 8).toUpperCase();
    try {
      const batch = writeBatch(db);
      batch.set(doc(db, "invites", newToken), {
        used: false,
        createdAt: serverTimestamp(),
        sentTo: targetEmail,
        type: 'direct_mail'
      });
      await batch.commit();

      const success = await sendEmailViaPHP(newToken, targetEmail);
      if (success) {
        alert(`Token ${newToken} enviado a ${targetEmail}`);
        setTargetEmail("");
        fetchInvites();
      } else {
        alert("Token creado pero fallo el envío PHP. Revisa el archivo en el servidor.");
      }
    } catch (err) { alert("Error en Firebase"); }
    setLoading(false);
  };

  // --- OPCIÓN 2: GENERAR LOTES ---
  const handleBatchGenerate = async () => {
    if (batchQuantity < 1 || batchQuantity > 50) return;
    setLoading(true);
    const batch = writeBatch(db);
    
    for (let i = 0; i < batchQuantity; i++) {
      const token = Math.random().toString(36).substring(2, 8).toUpperCase();
      batch.set(doc(db, "invites", token), {
        used: false,
        createdAt: serverTimestamp(),
        type: 'batch_manual'
      });
    }

    try {
      await batch.commit();
      alert(`¡Lote de ${batchQuantity} tokens creado con éxito!`);
      fetchInvites();
    } catch (err) { alert("Error al crear lote"); }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#020617] text-white p-6 md:p-12 font-sans">
      <div className="max-w-5xl mx-auto">
        
        {/* HEADER */}
        <header className="flex justify-between items-end mb-12 border-b border-emerald-500/20 pb-6">
          <div>
            <h1 className="text-4xl font-black italic tracking-tighter text-emerald-500 uppercase leading-none">Panel de Control</h1>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.3em] mt-2">Protocolo de Reclutamiento • {auth.currentUser?.email}</p>
          </div>
          <button onClick={() => signOut(auth)} className="text-[10px] border border-red-500/40 text-red-500 px-4 py-2 rounded-lg hover:bg-red-500 hover:text-white transition-all font-bold">CERRAR SESIÓN</button>
        </header>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          
          {/* BLOQUE: ENVÍO DIRECTO */}
          <div className="bg-slate-900/50 border border-emerald-500/20 p-8 rounded-[2rem] shadow-xl">
            <h2 className="text-emerald-400 font-black italic uppercase text-sm mb-6 tracking-widest">Reclutamiento Directo (Email)</h2>
            <form onSubmit={handleSingleInvite} className="space-y-4">
              <input 
                type="email" 
                placeholder="Email del invitado..."
                value={targetEmail}
                onChange={e => setTargetEmail(e.target.value)}
                className="w-full bg-slate-800 border-2 border-slate-700 p-4 rounded-xl focus:border-emerald-500 outline-none transition-all"
              />
              <button disabled={loading} className="w-full bg-emerald-500 text-slate-950 font-black py-4 rounded-xl hover:bg-emerald-400 transition-all uppercase tracking-tighter">
                {loading ? "Procesando..." : "Generar y Enviar Email"}
              </button>
            </form>
          </div>

          {/* BLOQUE: GENERACIÓN POR LOTES */}
          <div className="bg-slate-900/50 border border-slate-800 p-8 rounded-[2rem] shadow-xl">
            <h2 className="text-slate-400 font-black italic uppercase text-sm mb-6 tracking-widest">Generación Masiva</h2>
            <div className="space-y-4">
              <div className="flex items-center gap-4 bg-slate-800 p-4 rounded-xl border-2 border-slate-700">
                <span className="text-xs font-bold text-slate-500 uppercase">Cantidad:</span>
                <input 
                  type="number" 
                  value={batchQuantity}
                  onChange={e => setBatchQuantity(e.target.value)}
                  className="bg-transparent text-xl font-bold text-emerald-400 outline-none w-full"
                />
              </div>
              <button onClick={handleBatchGenerate} disabled={loading} className="w-full bg-slate-700 text-white font-black py-4 rounded-xl hover:bg-slate-600 transition-all uppercase tracking-tighter">
                {loading ? "Creando..." : `Crear ${batchQuantity} Tokens Manuales`}
              </button>
            </div>
          </div>

        </div>

        {/* LISTADO DE TOKENS */}
        <section className="bg-slate-900/30 rounded-[2rem] p-8 border border-slate-800">
          <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.4em] mb-8 text-center">Registro de Frecuencias de Invitación</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {invites.map((inv) => (
              <div key={inv.id} className={`p-5 rounded-2xl border flex flex-col justify-between ${inv.used ? 'bg-slate-950/50 border-slate-900 opacity-30' : 'bg-slate-900 border-emerald-500/10'}`}>
                <div className="flex justify-between items-start mb-4">
                  <span className="text-xl font-mono font-black text-emerald-400 tracking-widest">{inv.id}</span>
                  <span className={`text-[8px] px-2 py-1 rounded font-bold uppercase ${inv.used ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                    {inv.used ? 'Usado' : 'Libre'}
                  </span>
                </div>
                {inv.sentTo && <p className="text-[9px] text-slate-500 mb-4 truncate italic">Enviado a: {inv.sentTo}</p>}
                {!inv.used && (
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/register?token=${inv.id}`);
                      alert("Link copiado");
                    }}
                    className="w-full py-2 bg-slate-800 text-slate-400 text-[9px] font-bold uppercase rounded-lg hover:text-emerald-400 transition-colors border border-slate-700"
                  >
                    Copiar Enlace
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
};

export default AdminPanel;