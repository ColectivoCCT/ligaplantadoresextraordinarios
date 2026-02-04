import React, { useState, useEffect } from 'react';
import { auth, db } from './lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';

// Vistas
import RegisterView from './views/RegisterView';
import AdminPanel from './views/AdminPanel';
import GameView from './views/GameView';

function App() {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let unsubscribeDoc = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      try {
        if (!currentUser) {
          // Caso: No hay nadie logueado o acaba de cerrar sesión
          if (unsubscribeDoc) unsubscribeDoc();
          setUser(null);
          setUserData(null);
          setLoading(false);
        } else {
          // Caso: Hay un usuario activo
          setUser(currentUser);
          
          const userRef = doc(db, "users", currentUser.uid);
          
          // Escuchamos Firestore en tiempo real
          unsubscribeDoc = onSnapshot(userRef, (docSnap) => {
            if (docSnap.exists()) {
              setUserData(docSnap.data());
            } else {
              // Si el usuario existe en Auth pero aún no en la DB
              setUserData({ name: "Believer", seeds: 5, level: 1 });
            }
            setLoading(false);
          }, (err) => {
            console.error("Error en Snapshot:", err);
            setLoading(false);
          });
        }
      } catch (err) {
        console.error("Error en Auth:", err);
        setError(err.message);
        setLoading(false);
      }
    });

    // Limpieza al desmontar
    return () => {
      unsubscribeAuth();
      if (unsubscribeDoc) unsubscribeDoc();
    };
  }, []);

  // 1. Pantalla de carga (Splash Screen)
  if (loading) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-emerald-500 font-mono text-xs tracking-[0.3em] uppercase">Sincronizando Frecuencias...</p>
        </div>
      </div>
    );
  }

  // 2. Pantalla de Error Crítico
  if (error) {
    return (
      <div className="min-h-screen bg-red-950 flex items-center justify-center p-6 text-center text-white font-mono">
        <div>
          <h1 className="text-2xl font-bold mb-2">ERROR DE SISTEMA</h1>
          <p className="text-xs opacity-70 mb-4">{error}</p>
          <button onClick={() => window.location.reload()} className="bg-white text-red-950 px-6 py-2 rounded-xl font-black uppercase text-xs">Reiniciar Protocolo</button>
        </div>
      </div>
    );
  }

  // 3. Lógica de Enrutamiento
  // Si no hay sesión iniciada, mostramos registro
  if (!user) {
    return <RegisterView />;
  }

  // Si es el admin, mostramos su panel
  if (user.email === "admin@colectivocrecet.com") {
    return <AdminPanel />;
  }

  // Para todo lo demás (Believers), mostramos el juego con sus stats
  return <GameView stats={userData} />;
}

export default App;