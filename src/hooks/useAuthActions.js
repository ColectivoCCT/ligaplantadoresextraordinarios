import { auth, db } from '../lib/firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword 
} from 'firebase/auth';
import { doc, setDoc, updateDoc, serverTimestamp, increment } from 'firebase/firestore';

export const useAuthActions = () => {
  
  // 1. LOGUEAR USUARIO
  const loginUser = async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return userCredential.user;
    } catch (error) {
      throw error;
    }
  };

  // 2. REGISTRAR USUARIO
const registerUser = async (formData, token, tribeId) => {
    try {
      // 1. Crear usuario en Auth
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.pass);
      const user = userCredential.user;

      // 2. Lógica de Tribu (Tu regla: o eres jefe creando tribu o invitado uniéndote)
      const isGuest = Boolean(tribeId);
      // Si es invitado, usa tribeId. Si es jefe, su tribu se llama como él (o lo que elijas)
      const assignedTribe = isGuest ? tribeId.trim() : formData.name.trim();
      const userRole = isGuest ? 'member' : 'leader';

      // 3. Crear Perfil de Usuario
      await setDoc(doc(db, "users", user.uid), {
        name: formData.name,
        email: formData.email,
        seeds: 10,
        drops: 50,
        trees: 0,
        score: 0,
        forestLevel: 1,
        tribe: assignedTribe,
        role: userRole,
        createdAt: serverTimestamp(),
        lastUpdate: Date.now()
      });

      // 4. Sincronizar con Colección Global (Se crea sola aquí si no existe)
      const tribeRef = doc(db, "tribes", assignedTribe);
      await setDoc(tribeRef, {
        name: assignedTribe,
        members: increment(1),
        lastActivity: serverTimestamp()
      }, { merge: true });

      // 5. Quemar el token de invitación
      if (token) {
        await updateDoc(doc(db, "invites", token), {
          used: true,
          usedBy: user.email,
          usedAt: serverTimestamp()
        });
      }

      return user;
    } catch (error) {
      console.error("Error en registro:", error);
      throw error;
    }
  };

  return {
    loginUser,
    registerUser
  };
};