import { useState } from 'react';
import { db, auth } from '../lib/firebase';
import { doc, updateDoc, increment, setDoc, serverTimestamp, addDoc, collection } from 'firebase/firestore';

export const useGameEngine = () => {
  const [syncKey, setSyncKey] = useState(0);

  const triggerSync = () => setSyncKey(prev => prev + 1);

  // 1. PLANTAR UN ÁRBOL
  const plantTree = async (currentSeeds, tribeName, userName) => {
    const user = auth.currentUser;
    if (!user) throw new Error("Debes iniciar sesión");
    if (currentSeeds <= 0) throw new Error("Saldo de semillas insuficiente.");

    const activeTribe = (tribeName || "nómadas").trim();
    const userRef = doc(db, "users", user.uid);
    const tribeRef = doc(db, "tribes", activeTribe);

    try {
      await updateDoc(userRef, {
        seeds: increment(-1),
        trees: increment(1),
        score: increment(10),
        lastUpdate: Date.now() 
      });

      await setDoc(tribeRef, {
        score: increment(10),
        trees: increment(1),
        lastActivity: serverTimestamp()
      }, { merge: true });

      await addDoc(collection(db, "activities"), {
        userId: user.uid,
        userName: userName || "Alguien",
        tribeId: activeTribe,
        type: 'plant',
        text: 'ha plantado un nuevo árbol',
        timestamp: serverTimestamp()
      });

      triggerSync(); 
    } catch (error) {
      console.error("Error al plantar:", error);
      throw error;
    }
  };

  // 2. REGAR EL BOSQUE
  const waterForest = async (currentDrops, tribeName, userName) => {
    const user = auth.currentUser;
    if (!user) throw new Error("Debes iniciar sesión");
    if (currentDrops < 5) throw new Error("Necesitas al menos 5 gotas.");

    const activeTribe = (tribeName || "nómadas").trim();
    const userRef = doc(db, "users", user.uid);
    const tribeRef = doc(db, "tribes", activeTribe);

    try {
      await updateDoc(userRef, {
        drops: increment(-5),
        forestLevel: increment(1),
        score: increment(25),
        lastUpdate: Date.now()
      });

      // MODIFICACIÓN: Añadimos 'water: increment(5)' para rastrear el riego total de la tribu
      await setDoc(tribeRef, {
        score: increment(25),
        water: increment(5), // <--- CAMBIO CLAVE PARA EL BOSQUE DETERMINISTA
        lastActivity: serverTimestamp()
      }, { merge: true });

      await addDoc(collection(db, "activities"), {
        userId: user.uid,
        userName: userName || "Alguien",
        tribeId: activeTribe,
        type: 'water',
        text: 'ha regado el bosque (+25 pts)',
        timestamp: serverTimestamp()
      });

      triggerSync();
    } catch (error) {
      console.error("Error al regar:", error);
      throw error;
    }
  };

  // 3. RECLAMAR GOTAS PASIVAS
  const claimPassiveDrops = async (lastUpdateTimestamp) => {
    const user = auth.currentUser;
    if (!user || !lastUpdateTimestamp) return 0;

    const userRef = doc(db, "users", user.uid);
    const now = new Date();
    const lastUpdate = lastUpdateTimestamp.toDate ? lastUpdateTimestamp.toDate() : new Date(lastUpdateTimestamp);
    const diffInMs = now - lastUpdate;
    const diffInHours = diffInMs / (1000 * 60 * 60);
    const earnedDrops = Math.floor(diffInHours * 10);

    if (earnedDrops > 0) {
      try {
        await updateDoc(userRef, {
          drops: increment(earnedDrops),
          lastUpdate: Date.now()
        });
        triggerSync();
        return earnedDrops;
      } catch (error) {
        console.error("Error al reclamar gotas pasivas:", error);
      }
    }
    return 0;
  };

  // 4. RESETEAR VALORES
  const resetStats = async () => {
    const user = auth.currentUser;
    if (!user) throw new Error("No hay usuario autenticado");
    const userRef = doc(db, "users", user.uid);

    try {
      await updateDoc(userRef, {
        seeds: 10,
        drops: 50,
        trees: 0,
        forestLevel: 1,
        score: 0,
        lastUpdate: Date.now()
      });
      triggerSync();
    } catch (error) {
      console.error("Error al resetear stats:", error);
      throw error;
    }
  };

  return {
    plantTree,
    waterForest,
    claimPassiveDrops,
    resetStats,
    syncKey
  };
};