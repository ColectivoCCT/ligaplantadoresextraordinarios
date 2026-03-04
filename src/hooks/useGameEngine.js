import { useState } from 'react';
import { db, auth } from '../lib/firebase';
import { doc, updateDoc, increment, serverTimestamp, collection, runTransaction } from 'firebase/firestore';

export const useGameEngine = () => {
  const [syncKey, setSyncKey] = useState(0);

  const triggerSync = () => setSyncKey(prev => prev + 1);

  const getTreeDocRef = (tribeName, index) => {
    const safeIndex = Math.max(0, index);
    const treeId = `tree_${String(safeIndex).padStart(6, '0')}`;
    return doc(db, 'tribes', tribeName, 'trees', treeId);
  };



  // 1. PLANTAR UN ÁRBOL (modelo híbrido: agregados + árbol individual)
  const plantTree = async (currentSeeds, tribeName, userName) => {
    const user = auth.currentUser;
    if (!user) throw new Error('Debes iniciar sesión');
    if (currentSeeds <= 0) throw new Error('Saldo de semillas insuficiente.');

    const activeTribe = (tribeName || 'nómadas').trim();
    const userRef = doc(db, 'users', user.uid);
    const tribeRef = doc(db, 'tribes', activeTribe);
    const activityRef = doc(collection(db, 'activities'));

    try {
      await runTransaction(db, async (transaction) => {
        const userSnap = await transaction.get(userRef);
        if (!userSnap.exists()) throw new Error('No se encontró tu perfil de usuario.');

        const serverSeeds = Number(userSnap.data().seeds || 0);
        if (serverSeeds <= 0) throw new Error('Saldo de semillas insuficiente.');

        const tribeSnap = await transaction.get(tribeRef);
        const currentTrees = tribeSnap.exists() ? Number(tribeSnap.data().trees || 0) : 0;
        const nextTreeIndex = currentTrees;
        const treeRef = getTreeDocRef(activeTribe, nextTreeIndex);

        transaction.update(userRef, {
          seeds: increment(-1),
          trees: increment(1),
          score: increment(10),
          lastUpdate: Date.now()
        });

        transaction.set(tribeRef, {
          score: increment(10),
          trees: increment(1),
          nextTreeIndex: tribeSnap.exists() ? Number(tribeSnap.data().nextTreeIndex || 0) : 0,
          lastActivity: serverTimestamp()
        }, { merge: true });

        transaction.set(treeRef, {
          index: nextTreeIndex,
          level: 1,
          plantedBy: user.uid,
          plantedByName: userName || 'Alguien',
          tribeId: activeTribe,
          createdAt: serverTimestamp(),
          lastWateredAt: null
        }, { merge: true });

        transaction.set(activityRef, {
          userId: user.uid,
          userName: userName || 'Alguien',
          tribeId: activeTribe,
          type: 'plant',
          text: 'ha plantado un nuevo árbol',
          timestamp: serverTimestamp()
        });
      });

      triggerSync();
    } catch (error) {
      if (error?.code === 'permission-denied') {
        // Fallback temporal: si aún no están abiertas las reglas de /tribes/{id}/trees,
        // mantenemos la experiencia funcional con el modelo agregado.
        try {
          await runTransaction(db, async (transaction) => {
            const userSnap = await transaction.get(userRef);
            if (!userSnap.exists()) throw new Error('No se encontró tu perfil de usuario.');

            const serverSeeds = Number(userSnap.data().seeds || 0);
            if (serverSeeds <= 0) throw new Error('Saldo de semillas insuficiente.');

            transaction.update(userRef, {
              seeds: increment(-1),
              trees: increment(1),
              score: increment(10),
              lastUpdate: Date.now()
            });

            transaction.set(tribeRef, {
              score: increment(10),
              trees: increment(1),
              lastActivity: serverTimestamp()
            }, { merge: true });

            transaction.set(activityRef, {
              userId: user.uid,
              userName: userName || 'Alguien',
              tribeId: activeTribe,
              type: 'plant',
              text: 'ha plantado un nuevo árbol',
              timestamp: serverTimestamp()
            });
          });

          triggerSync();
          return;
        } catch (fallbackError) {
          console.error('Error en fallback al plantar:', fallbackError);
          throw fallbackError;
        }
      }

      console.error('Error al plantar:', error);
      throw error;
    }
  };

  // 2. REGAR EL BOSQUE (modelo híbrido: agregados + nivel por árbol)
  const waterForest = async (currentDrops, tribeName, userName) => {
    const user = auth.currentUser;
    if (!user) throw new Error('Debes iniciar sesión');
    if (currentDrops < 5) throw new Error('Necesitas al menos 5 gotas.');

    const activeTribe = (tribeName || 'nómadas').trim();
    const userRef = doc(db, 'users', user.uid);
    const tribeRef = doc(db, 'tribes', activeTribe);
    const activityRef = doc(collection(db, 'activities'));

    try {
      await runTransaction(db, async (transaction) => {
        const userSnap = await transaction.get(userRef);
        if (!userSnap.exists()) throw new Error('No se encontró tu perfil de usuario.');

        const serverDrops = Number(userSnap.data().drops || 0);
        if (serverDrops < 5) throw new Error('Necesitas al menos 5 gotas.');

        const tribeSnap = await transaction.get(tribeRef);
        const treeCount = tribeSnap.exists() ? Number(tribeSnap.data().trees || 0) : 0;
        if (treeCount <= 0) throw new Error('No hay árboles para regar todavía.');

        const startIndex = tribeSnap.exists() ? Number(tribeSnap.data().nextTreeIndex || 0) : 0;

        transaction.update(userRef, {
          drops: increment(-5),
          score: increment(25),
          lastUpdate: Date.now()
        });

        for (let i = 0; i < 5; i += 1) {
          const treeIndex = (startIndex + i) % treeCount;
          const treeRef = getTreeDocRef(activeTribe, treeIndex);

          transaction.set(treeRef, {
            index: treeIndex,
            level: increment(1),
            lastWateredAt: serverTimestamp(),
            lastWateredBy: user.uid,
            lastWateredByName: userName || 'Alguien'
          }, { merge: true });
        }

        transaction.set(tribeRef, {
          score: increment(25),
          water: increment(5),
          nextTreeIndex: (startIndex + 5) % treeCount,
          lastActivity: serverTimestamp()
        }, { merge: true });

        transaction.set(activityRef, {
          userId: user.uid,
          userName: userName || 'Alguien',
          tribeId: activeTribe,
          type: 'water',
          text: 'ha regado el bosque (+25 pts)',
          timestamp: serverTimestamp()
        });
      });

      triggerSync();
    } catch (error) {
      if (error?.code === 'permission-denied') {
        try {
          await runTransaction(db, async (transaction) => {
            const userSnap = await transaction.get(userRef);
            if (!userSnap.exists()) throw new Error('No se encontró tu perfil de usuario.');

            const serverDrops = Number(userSnap.data().drops || 0);
            if (serverDrops < 5) throw new Error('Necesitas al menos 5 gotas.');

            transaction.update(userRef, {
              drops: increment(-5),
              score: increment(25),
              lastUpdate: Date.now()
            });

            transaction.set(tribeRef, {
              score: increment(25),
              water: increment(5),
              lastActivity: serverTimestamp()
            }, { merge: true });

            transaction.set(activityRef, {
              userId: user.uid,
              userName: userName || 'Alguien',
              tribeId: activeTribe,
              type: 'water',
              text: 'ha regado el bosque (+25 pts)',
              timestamp: serverTimestamp()
            });
          });

          triggerSync();
          return;
        } catch (fallbackError) {
          console.error('Error en fallback al regar:', fallbackError);
          throw fallbackError;
        }
      }

      console.error('Error al regar:', error);
      throw error;
    }
  };

  // 3. RECLAMAR GOTAS PASIVAS
  const claimPassiveDrops = async (lastUpdateTimestamp) => {
    const user = auth.currentUser;
    if (!user || !lastUpdateTimestamp) return 0;

    const userRef = doc(db, 'users', user.uid);
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
        console.error('Error al reclamar gotas pasivas:', error);
      }
    }
    return 0;
  };

  // 4. RESETEAR VALORES
  const resetStats = async () => {
    const user = auth.currentUser;
    if (!user) throw new Error('No hay usuario autenticado');
    const userRef = doc(db, 'users', user.uid);

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
      console.error('Error al resetear stats:', error);
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
