import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { doc, getDoc, setDoc, increment, serverTimestamp } from 'firebase/firestore'; // Añadidos imports para la nueva lógica
import { db } from '../lib/firebase'; 
import { useAuthActions } from '../hooks/useAuthActions';
import BeleafCharacter from '../components/BeleafCharacter';

const RegisterView = () => {
  const [searchParams] = useSearchParams();
  const { registerUser, loginUser } = useAuthActions();
  
  const token = searchParams.get('token');
  const tribeId = searchParams.get('tribu');

  const [inviteValid, setInviteValid] = useState(null); 
  const [isLogin, setIsLogin] = useState(false); 
  const [formData, setFormData] = useState({ name: '', email: '', pass: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const validateToken = async () => {
      if (tribeId) {
        setInviteValid(true);
        setIsLogin(false);
        return;
      }

      if (!token) { 
        setInviteValid(false); 
        setIsLogin(true); 
        return; 
      }

      try {
        const docRef = doc(db, 'invites', token);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && docSnap.data().used === false) {
          setInviteValid(true);
          setIsLogin(false);
        } else {
          setInviteValid(false);
          setIsLogin(true);
        }
      } catch (e) {
        setInviteValid(false);
        setIsLogin(true);
      }
    };
    validateToken();
  }, [token, tribeId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        await loginUser(formData.email, formData.pass);
      } else {
        // Registro del usuario en la colección 'users'
        await registerUser(formData, token, tribeId);

        // --- LÓGICA DE COLECCIÓN 'TRIBES' ---
        // Usamos el tribeId del link o "nómadas" por defecto
        const activeTribeId = (tribeId || "nómadas").trim();
        const tribeRef = doc(db, 'tribes', activeTribeId);

        // setDoc con { merge: true } asegura que si la tribu no existe se cree,
        // y si ya existe, solo incremente el contador de miembros sin borrar los puntos.
        await setDoc(tribeRef, {
          name: activeTribeId,
          members: increment(1),
          lastActivity: serverTimestamp()
        }, { merge: true });
      }
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-full bg-[#020617] text-white flex flex-col overflow-hidden relative font-sans">
      <header className="flex-none text-center pt-10 px-4 z-10">
        <h1 className="text-4xl md:text-7xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-sky-400 uppercase leading-[0.8]">
          La Liga de los <br/> Plantadores
        </h1>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 overflow-hidden py-4">
        <div className="w-full max-w-4xl transform scale-90 md:scale-100">
          <BeleafCharacter 
            paragraphs={
              isLogin 
                ? ["Identifícate, Believer.", "El acceso es restringido."] 
                : ["Tu invitación es válida.", tribeId ? `Te unirás a la tribu: ${tribeId.toUpperCase()}` : "Crea tu legado hoy."]
            } 
          />
        </div>
      </main>

      <footer className="flex-none w-full max-w-md mx-auto pb-10 px-6 z-20">
        <div className="bg-slate-900/90 border-2 border-emerald-500/20 p-6 rounded-[2rem] backdrop-blur-md">
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <input 
                type="text" 
                required
                className="bg-slate-800 border-2 border-slate-700 w-full h-12 px-4 rounded-xl focus:border-emerald-500 outline-none transition-all"
                placeholder="Nombre de Believer" 
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})} 
              />
            )}
            <input 
              type="email" 
              required
              className="bg-slate-800 border-2 border-slate-700 w-full h-12 px-4 rounded-xl focus:border-emerald-500 outline-none transition-all"
              placeholder="Email" 
              value={formData.email}
              onChange={e => setFormData({...formData, email: e.target.value})} 
            />
            <input 
              type="password" 
              required
              className="bg-slate-800 border-2 border-slate-700 w-full h-12 px-4 rounded-xl focus:border-emerald-500 outline-none transition-all"
              placeholder="Clave" 
              value={formData.pass}
              onChange={e => setFormData({...formData, pass: e.target.value})} 
            />
            <button 
              disabled={loading}
              className="w-full h-14 bg-emerald-500 text-slate-950 font-black rounded-xl uppercase hover:bg-emerald-400 transition-all disabled:opacity-50"
            >
              {loading ? "Sincronizando..." : (isLogin ? "Entrar" : "Unirse")}
            </button>
          </form>
          
          <button 
            onClick={() => setIsLogin(!isLogin)} 
            className="w-full mt-4 text-[10px] uppercase text-slate-500 hover:text-emerald-400 transition-colors tracking-widest font-bold"
          >
            {isLogin ? "¿No tienes cuenta? Usa una invitación" : "¿Ya tienes cuenta? Login"}
          </button>
        </div>
      </footer>
    </div>
  );
};

export default RegisterView;