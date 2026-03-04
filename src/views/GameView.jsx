import React, { useState, useEffect, useMemo, useRef } from 'react';
import { auth, db } from '../lib/firebase';
import { doc, updateDoc, increment, collection, query, onSnapshot, where, orderBy, limit } from 'firebase/firestore';
import { useGameEngine } from '../hooks/useGameEngine';
import beleafImg from '../assets/beleaf.png';
import sandyImg from '../assets/sandy.png';

const CustomCloud = ({ opacity = "0.9" }) => (
  <svg width="90" height="45" viewBox="0 0 120 60" style={{ opacity }}>
    <path d="M25,50 Q10,50 10,35 Q10,20 25,20 Q25,5 45,5 Q60,5 65,20 Q80,10 95,20 Q110,20 110,35 Q110,50 95,50 Z" fill="white" />
  </svg>
);

const playSound = (type) => {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;
  const ctx = new AudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  if (type === 'pop') {
    osc.type = 'sine'; osc.frequency.setValueAtTime(400, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.1);
  } else if (type === 'swoosh') {
    osc.type = 'sawtooth'; osc.frequency.setValueAtTime(100, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(600, ctx.currentTime + 0.3);
    gain.gain.setValueAtTime(0.05, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.3);
  } else if (type === 'achievement') {
    osc.type = 'triangle'; osc.frequency.setValueAtTime(300, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(600, ctx.currentTime + 0.4);
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.5);
  } else {
    osc.type = 'triangle'; osc.frequency.setValueAtTime(150, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.2);
  }
  gain.gain.setValueAtTime(0.1, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
  osc.connect(gain); gain.connect(ctx.destination);
  osc.start(); osc.stop(ctx.currentTime + 1.5);
};

const seededRandom = (seed) => {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
};

// --- ÁRBOL CON PERSPECTIVA MEJORADA ---
const MediterraneanTree = ({ level, yPos, zoomFactor, isRecentlyWatered = false }) => {
  const perspectiveScale = 0.35 + (Math.pow(yPos / 100, 1.5)) * 0.65;
  const growthLevel = Math.min((Math.sqrt(level) * 0.22) + Math.min(level * 0.045, 0.55), 1.9);
  const finalScale = (perspectiveScale + growthLevel) * zoomFactor;

  const brightness = 75 + (yPos / 100) * 25;
  const saturate = 80 + (yPos / 100) * 40;

  return (
    <div 
      className={`relative flex flex-col items-center transition-all duration-1000 ease-in-out ${isRecentlyWatered ? "animate-water-highlight" : ""}`} 
      style={{ 
        transform: `scale(${finalScale})`,
        filter: `brightness(${brightness}%) saturate(${saturate}%)`
      }}
    >
      {isRecentlyWatered && (
        <>
          <div className="absolute -top-7 left-1/2 -translate-x-1/2 w-16 h-10 pointer-events-none">
            {Array.from({ length: 14 }, (_, i) => (
              <span
                key={i}
                className="absolute top-0 rounded-full bg-sky-300/90 animate-pump-drop"
                style={{
                  left: `${4 + (i * 4)}px`,
                  width: `${2 + (i % 3)}px`,
                  height: `${4 + (i % 4)}px`,
                  animationDelay: `${i * 0.035}s`,
                  animationDuration: `${0.48 + (i % 4) * 0.07}s`
                }}
              />
            ))}
          </div>
          <div className="absolute -bottom-2 w-12 h-12 border border-sky-300/60 rounded-full animate-water-ring" />
        </>
      )}
      <div className="absolute -bottom-1 w-14 h-3 bg-black/10 rounded-[100%] blur-md" />
      <svg width="60" height="80" viewBox="0 0 120 140" className="filter drop-shadow-lg">
        <path d="M52 130 Q60 125 68 130 L64 90 Q60 85 56 90 Z" fill="#4a3728" />
        <path d="M58 95 L40 75 M62 95 L85 70 M60 90 L60 60" stroke="#4a3728" strokeWidth="5" strokeLinecap="round" fill="none" />
        <g>
          <ellipse cx="40" cy="70" rx="25" ry="20" fill="#14532d" /><ellipse cx="80" cy="70" rx="25" ry="20" fill="#14532d" />
          <ellipse cx="60" cy="45" r="28" fill="#166534" /><ellipse cx="45" cy="65" rx="22" ry="18" fill="#15803d" />
          <ellipse cx="75" cy="65" rx="22" ry="18" fill="#15803d" /><ellipse cx="60" cy="50" r="24" fill="#22c55e" />
        </g>
      </svg>
    </div>
  );
};


const IberianPeninsula = () => (
  <svg viewBox="0 0 1000 700" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
    <defs>
      <linearGradient id="iberiaLand" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#14532d" />
        <stop offset="100%" stopColor="#166534" />
      </linearGradient>
    </defs>
    <path
      d="M114 388 L126 327 L154 286 L212 242 L277 212 L365 198 L457 168 L534 142 L599 136 L667 173 L734 194 L805 228 L853 286 L865 352 L843 408 L807 466 L750 522 L673 564 L594 570 L525 552 L463 572 L387 589 L299 575 L236 546 L188 500 L148 452 Z"
      fill="url(#iberiaLand)"
      stroke="#86efac"
      strokeWidth="8"
      strokeLinejoin="round"
      className="drop-shadow-[0_0_20px_rgba(16,185,129,0.45)]"
    />
    <path d="M783 531 L854 557 L847 601 L771 592 Z" fill="#15803d" stroke="#86efac" strokeWidth="6" />
  </svg>
);

const GameView = ({ stats: initialStats }) => {
  const { plantTree, waterForest, syncKey } = useGameEngine();
  const [userData, setUserData] = useState(initialStats || {});
  const [tribeRanking, setTribeRanking] = useState([]);
  const [tribeData, setTribeData] = useState({ score: 0, members: 1, trees: 0, water: 0 });
  const [activities, setActivities] = useState([]);
  const [treeStates, setTreeStates] = useState([]);
  const [progress, setProgress] = useState(0);
  const [showPlusOne, setShowPlusOne] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showManageModal, setShowManageModal] = useState(false);
  const [showHeroAnim, setShowHeroAnim] = useState(false);
  const [isWatering, setIsWatering] = useState(false);
  
  // Estados para el Logro
  const [showAchievementModal, setShowAchievementModal] = useState(false);
  const [achievementSeen, setAchievementSeen] = useState(false); 

  const [copied, setCopied] = useState(false);
  const [recentlyWateredTreeIds, setRecentlyWateredTreeIds] = useState([]);
  
  const localTimerRef = useRef(0);
  const isSyncing = useRef(false);
  const prevWaterRef = useRef(tribeData.water || 0);
  const waterAnimTimeoutRef = useRef(null);
  const waterAnimQueueRef = useRef([]);

  const currentTribe = (userData.tribe || "Nómadas").trim();
  const isJefe = userData.role === 'leader';
  const myTribeRank = tribeRanking.findIndex(t => t.name === currentTribe) + 1;
  const inviteLink = `${window.location.origin}/register?token=INVITE&tribu=${currentTribe}`;
  const believersCount = tribeData.members || 1;

  useEffect(() => {
    if (!auth.currentUser) return;
    const userRef = doc(db, "users", auth.currentUser.uid);
    return onSnapshot(userRef, (docSnap) => { if (docSnap.exists()) setUserData(docSnap.data()); });
  }, []);

  useEffect(() => {
    const q = query(collection(db, "tribes"));
    return onSnapshot(q, (snapshot) => {
      const tribes = [];
      snapshot.forEach((doc) => tribes.push({ name: doc.id, ...doc.data() }));
      setTribeRanking(tribes.sort((a, b) => (b.score || 0) - (a.score || 0)));
    });
  }, [syncKey]);

  useEffect(() => {
    if (!currentTribe) return;
    const tribeRef = doc(db, "tribes", currentTribe);
    return onSnapshot(tribeRef, (docSnap) => { if (docSnap.exists()) setTribeData(docSnap.data()); });
  }, [currentTribe]);


  useEffect(() => {
    if (!currentTribe) return;
    const treesQuery = query(collection(db, 'tribes', currentTribe, 'trees'), orderBy('index'));
    return onSnapshot(treesQuery, (snapshot) => {
      const trees = [];
      snapshot.forEach((treeDoc) => {
        trees.push({ id: treeDoc.id, ...treeDoc.data() });
      });
      setTreeStates(trees);
    });
  }, [currentTribe]);

  useEffect(() => {
    const numTrees = tribeData.trees || 0;
    const currentWater = tribeData.water || 0;
    const previousWater = prevWaterRef.current || 0;

    if (numTrees <= 0) {
      prevWaterRef.current = currentWater;
      setRecentlyWateredTreeIds([]);
      return;
    }

    if (currentWater > previousWater) {
      const changedSequence = [];
      for (let waterStep = previousWater; waterStep < currentWater; waterStep += 1) {
        changedSequence.push(waterStep % numTrees);
      }

      // Limpiamos cualquier cola anterior para que cada riego se vea completo y ordenado.
      waterAnimQueueRef.current.forEach((timeoutId) => clearTimeout(timeoutId));
      waterAnimQueueRef.current = [];

      changedSequence.forEach((treeId, index) => {
        const timeoutId = setTimeout(() => {
          setRecentlyWateredTreeIds([treeId]);
        }, index * 170);
        waterAnimQueueRef.current.push(timeoutId);
      });

      if (waterAnimTimeoutRef.current) clearTimeout(waterAnimTimeoutRef.current);
      waterAnimTimeoutRef.current = setTimeout(() => {
        setRecentlyWateredTreeIds([]);
      }, changedSequence.length * 170 + 800);
    }

    prevWaterRef.current = currentWater;
  }, [tribeData.water, tribeData.trees]);

  useEffect(() => () => {
    if (waterAnimTimeoutRef.current) clearTimeout(waterAnimTimeoutRef.current);
    waterAnimQueueRef.current.forEach((timeoutId) => clearTimeout(timeoutId));
  }, []);

  // --- LÓGICA DE DETECCIÓN DE LOGRO CON LOCALSTORAGE ---
  useEffect(() => {
    const trees = tribeData.trees || 0;
    
    // Clave única para guardar en el móvil (Ej: achievement_100_LosVerdes)
    const storageKey = `achievement_100_${currentTribe.replace(/\s/g, '')}`;
    const alreadySeen = localStorage.getItem(storageKey);

    // Condición: Llegar a 100, no haberlo visto en esta sesión, y no tenerlo guardado en el móvil
    if (trees >= 100 && !achievementSeen && !alreadySeen) {
      setShowAchievementModal(true);
      playSound('achievement');
      setAchievementSeen(true);
      
      // Guardamos la marca para el futuro
      localStorage.setItem(storageKey, 'true');
    }
  }, [tribeData.trees, achievementSeen, currentTribe]);

  useEffect(() => {
    if (!currentTribe || !auth.currentUser) return;
    const q = query(
      collection(db, "activities"),
      where("tribeId", "==", currentTribe),
      where("userId", "!=", auth.currentUser.uid),
      orderBy("userId"),
      orderBy("timestamp", "desc"),
      limit(3)
    );
    
    return onSnapshot(q, (snapshot) => {
      const acts = [];
      snapshot.forEach(doc => acts.push({ id: doc.id, ...doc.data() }));
      setActivities(acts);
    });
  }, [currentTribe]);

  useEffect(() => {
    const interval = setInterval(() => {
      localTimerRef.current += 100;
      setProgress(Math.min((localTimerRef.current / 10000) * 100, 100));
      if (localTimerRef.current >= 10000) {
        localTimerRef.current = 0; setProgress(0);
        if (!isSyncing.current && auth.currentUser) {
          isSyncing.current = true;
          updateDoc(doc(db, 'users', auth.currentUser.uid), { drops: increment(1) }).then(() => {
            setShowPlusOne(true); setTimeout(() => setShowPlusOne(false), 2000);
            isSyncing.current = false;
          });
        }
      }
    }, 100);
    return () => clearInterval(interval);
  }, []);

  const handlePlantClick = async () => {
    if (userData.seeds <= 0) return;
    playSound('swoosh');
    setShowHeroAnim(true);
    setTimeout(async () => {
      try {
        await plantTree(userData.seeds, currentTribe, userData.name);
        playSound('pop');
      } catch (error) {
        console.error(error);
      }
      setTimeout(() => setShowHeroAnim(false), 200);
    }, 600);
  };

  const handleWaterClick = async () => {
    if (userData.drops < 5 || isWatering) return;

    setIsWatering(true);

    try {
      await waterForest(userData.drops, currentTribe, userData.name);
    } catch (error) {
      console.error(error);
      const msg = error?.code === 'permission-denied'
        ? 'No tienes permisos para regar en tiempo real (usuario/tribu/actividad). No se aplicó ningún cambio. Revisa reglas de Firestore.'
        : (error.message || 'No se pudo regar el bosque.');
      alert(msg);
    } finally {
      setIsWatering(false);
    }
  };

  const { forestTrees, zoomFactor, viewMode, forestLevel } = useMemo(() => {
    const numTrees = tribeData.trees || 0;
    const totalWater = tribeData.water || 0;

    const forestLevel = Math.floor(numTrees / 35);
    const viewMode = numTrees >= 180 ? 'iberia-map' : 'local-forest';

    let factor = 1.08;
    if (numTrees > 30) {
      factor = Math.max(0.3, 1.08 - Math.log1p(numTrees - 30) * 0.15);
    }

    const computedLevels = Array.from({ length: numTrees }, () => 1);
    for (let drop = 0; drop < totalWater; drop += 1) {
      const index = numTrees > 0 ? drop % numTrees : 0;
      if (computedLevels[index] !== undefined) computedLevels[index] += 1;
    }

    const levelByIndex = new Map();
    treeStates.forEach((treeDoc) => {
      if (typeof treeDoc.index === 'number') {
        levelByIndex.set(treeDoc.index, Number(treeDoc.level || 1));
      }
    });

    const trees = Array.from({ length: numTrees }, (_, i) => {
      const x = 5 + seededRandom(i * 105) * 90;
      const rawY = seededRandom(i * 210);
      const y = 10 + (Math.pow(rawY, 0.8)) * 85;
      const hybridLevel = levelByIndex.has(i) ? levelByIndex.get(i) : computedLevels[i];

      return { id: i, x, y, level: hybridLevel };
    }).sort((a, b) => a.y - b.y);

    return { forestTrees: trees, zoomFactor: factor, viewMode, forestLevel };
  }, [tribeData.trees, tribeData.water, treeStates]);

  return (
    <div className="h-[100dvh] w-full bg-[#020617] text-white flex flex-col overflow-hidden font-sans italic">
      
      {/* --- MODAL ÉPICO DE LOGRO (100 ÁRBOLES) --- */}
      {showAchievementModal && (
  <div className="absolute inset-0 z-[200] bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
    <div className="relative w-full max-w-lg bg-gradient-to-br from-emerald-900/40 to-slate-900 border-2 border-emerald-500/50 rounded-[40px] p-8 shadow-[0_0_80px_rgba(16,185,129,0.3)] min-h-[500px] flex flex-col justify-center overflow-hidden">
      
      {/* BeLeaf: Arriba a la Izquierda */}
      <div className="absolute top-4 left-4 w-40 h-40 z-10">
         <img 
           src={beleafImg} 
           alt="BeLeaf" 
           className="w-full h-full object-contain drop-shadow-[0_0_20px_rgba(52,211,153,0.5)]" 
         />
      </div>

      {/* Sandy: Abajo a la Derecha - Tamaño Reducido */}
      <div className="absolute bottom-0 right-0 w-40 h-56 z-10 translate-y-4">
         <img 
           src={sandyImg} 
           alt="Sandy" 
           className="w-full h-full object-contain object-bottom drop-shadow-[0_0_30px_rgba(0,0,0,0.6)]" 
         />
      </div>

      {/* Bloque de Contenido */}
      <div className="relative z-20 flex flex-col h-full">
        
        {/* Título y Bosque: Mantienen el margen para BeLeaf y alinean a la derecha */}
        <div className="pl-24 text-right pr-2 mb-6">
          <h2 className="text-3xl font-black uppercase italic text-white tracking-tighter mb-4 leading-none">
            ¡HITO <span className="text-emerald-400">DESBLOQUEADO!</span>
          </h2>
          
          <div className="space-y-4 text-emerald-100/90 font-medium text-sm italic">
            <p className="text-lg text-white font-black leading-tight">
              "¡Vuestra tribu ha superado los <br/>
              <span className="text-amber-400">100 árboles</span>!"
            </p>
            <p>
              Hemos tenido que <span className="text-emerald-400 font-bold uppercase">alejar la vista</span> porque vuestro bosque ya no cabe en una sola mirada.
            </p>
          </div>
        </div>

        {/* Bloque Sandy: Más a la izquierda (pl-6) y con ancho controlado para no tocarla */}
        <div className="pt-6 border-t border-white/10 mt-2 pl-6 text-left max-w-[240px]">
          <p className="text-emerald-100/90 font-medium text-sm italic leading-relaxed">
            "Esta inmensidad es la prueba viviente de la <span className="text-amber-400 font-black">épica del combate a la desertificación</span> que impulsa <span className="text-white font-black uppercase">Sandy</span>."
          </p>
        </div>
      </div>

      {/* Botón: Centrado al final */}
      <div className="relative z-30 mt-10">
        <button 
          onClick={() => setShowAchievementModal(false)} 
          className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black uppercase tracking-widest text-xs transition-transform active:scale-95 shadow-lg border-b-4 border-emerald-800"
        >
          CONTINUAR LA MISIÓN
        </button>
      </div>
    </div>
  </div>
)}

      {/* Animación Hero */}
      {showHeroAnim && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center pointer-events-none">
          <div className="absolute inset-0 bg-emerald-500/20 animate-pulse"></div>
          <img 
            src={beleafImg} 
            alt="BeLeaf Hero" 
            className="w-64 h-64 object-contain animate-hero-drop drop-shadow-[0_0_50px_rgba(52,211,153,1)]"
          />
        </div>
      )}

      {/* Modal Jefe */}
      {showManageModal && (
        <div className="absolute inset-0 z-[110] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="relative w-full max-w-lg">
            <h2 className="text-3xl font-black uppercase italic text-white tracking-tighter mb-4 ml-2">PANEL DE <span className="text-amber-500">JEFE DE TRIBU</span></h2>
            <div className="relative bg-slate-900/80 border-2 border-amber-500/50 rounded-[40px] p-8 overflow-hidden shadow-[0_0_50px_rgba(245,158,11,0.2)]">
              <div className="absolute top-0 right-[-20px] w-56 h-full flex items-end justify-end pointer-events-none z-10">
                <img src={beleafImg} alt="Jefe" className="w-full h-auto object-contain translate-y-4 scale-125 drop-shadow-[0_20px_30px_rgba(0,0,0,0.5)]" />
              </div>
              <div className="relative z-20 w-3/5 space-y-6">
                <div>
                  <p className="text-[10px] font-black text-white/70 uppercase mb-2 tracking-widest leading-none">INVITACIÓN BELIEVERS (LOCAL)</p>
                  <div className="flex gap-2 bg-black/60 rounded-full p-1 border border-white/10 overflow-hidden">
                    <p className="flex-1 text-[10px] text-emerald-400 truncate px-3 py-2 italic pt-2 leading-none">{inviteLink}</p>
                    <button onClick={() => { navigator.clipboard.writeText(inviteLink); setCopied(true); setTimeout(()=>setCopied(false),2000); }} className={`px-4 rounded-full font-black text-[9px] ${copied ? 'bg-emerald-500 text-white':'bg-amber-500 text-slate-950'}`}>{copied ? 'OK':'COPIAR'}</button>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="bg-black/40 border border-white/10 rounded-2xl p-3 flex-1 text-center">
                    <p className="text-2xl font-black text-white">{believersCount}</p>
                    <p className="text-[8px] text-white/40 uppercase font-black">Believers</p>
                  </div>
                  <div className="bg-black/40 border border-white/10 rounded-2xl p-3 flex-1 text-center">
                    <p className="text-2xl font-black text-amber-500">№{myTribeRank || 1}</p>
                    <p className="text-[8px] text-white/40 uppercase font-black">Ranking</p>
                  </div>
                </div>
                <div className="pt-4 border-t border-white/10">
                  <h3 className="text-4xl font-black text-white italic uppercase tracking-tighter leading-none">{currentTribe}</h3>
                  <p className="text-[9px] text-amber-500/80 font-bold uppercase tracking-widest mt-1">MI TRIBU</p>
                </div>
              </div>
            </div>
            <button onClick={() => setShowManageModal(false)} className="w-full mt-6 py-3 border-2 border-white/20 rounded-full font-black uppercase text-white text-[12px] active:scale-95">CERRAR PANEL</button>
          </div>
        </div>
      )}

      {showLeaderboard && (
        <div className="absolute inset-0 z-[120] bg-slate-950/95 flex flex-col p-6">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-black italic text-emerald-500 uppercase tracking-tighter">Ranking Global</h2>
            <button onClick={() => setShowLeaderboard(false)} className="w-10 h-10 flex items-center justify-center bg-white/10 rounded-full text-xl">✕</button>
          </div>
          <div className="space-y-4 overflow-y-auto pr-2">
            {tribeRanking.map((t, i) => (
              <div key={i} className={`flex items-center justify-between p-4 rounded-xl border ${t.name === currentTribe ? 'bg-emerald-500/20 border-emerald-500' : 'bg-white/5 border-white/10'}`}>
                <div className="flex items-center gap-4">
                  <span className="text-2xl font-black text-white/20">#{i + 1}</span>
                  <p className="font-black text-sm uppercase">{t.name}</p>
                </div>
                <p className="font-black text-emerald-400">{(t.score || 0).toLocaleString()} PTS</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <header className="bg-slate-950 z-50 pt-6 px-4 flex-shrink-0">
        <div className="flex justify-between items-center mb-4 h-10">
          <h1 className="text-[min(4vw,1.7rem)] font-black italic uppercase tracking-tighter text-emerald-500 leading-none">
            LA LIGA DE LOS <span className="text-white">PLANTADORES EXTRAORDINARIOS</span>
          </h1>
          <img src={beleafImg} alt="Beleaf" className="w-14 h-14 object-contain" />
        </div>

        <div className="flex justify-between items-center border-y border-white/5 py-2 px-1 mb-4 relative">
          <span className="text-[10px] font-bold uppercase tracking-widest text-white/90 italic flex items-center gap-2">
            {isJefe ? '👑' : '🛡️'} {userData.name}
          </span>
          <button onClick={() => setShowLeaderboard(true)} className="flex items-center gap-2 text-[10px] italic font-black uppercase tracking-tighter bg-white/5 px-3 py-1 rounded-full border border-white/10">
            <span className="text-white/60 uppercase tracking-tighter">Tribu de</span>
            <span className="text-white uppercase">{currentTribe}</span>
            <span className="text-emerald-500 font-black ml-1">#{myTribeRank || '--'}</span>
          </button>
        </div>

        <div className="grid grid-cols-4 border-x border-t border-dashed border-emerald-500/30 rounded-t-lg relative">
          {showPlusOne && (
            <div className="absolute left-[37%] -top-8 text-emerald-400 font-black animate-bounce text-sm z-[60] drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]">
              +1 💧
            </div>
          )}
          {[ 
            { label: 'SEMILLAS', val: userData.seeds || 0, icon: '🌰' },
            { label: 'GOTAS', val: userData.drops || 0, icon: '💧' },
            { label: 'MIEMBROS', val: believersCount, icon: '👥' },
            { label: 'PUNTOS', val: tribeData.score || 0, icon: '⭐' }      
          ].map((s, i) => (
            <div key={i} className={`flex flex-col items-center py-2 ${i < 3 ? 'border-r border-dashed border-emerald-500/30' : ''}`}>
              <p className="text-[7px] font-black text-emerald-500/60 uppercase tracking-widest mb-1">{s.label}</p>
              <div className="flex items-center gap-1.5 bg-emerald-600 px-2 py-0.5 rounded-sm shadow-lg border border-white/10">
                <span className="text-xs">{s.icon}</span>
                <span className="text-[11px] font-black text-white">{s.val}</span>
              </div>
            </div>
          ))}
        </div>
      </header>

      <div className="h-1 w-full bg-slate-900 z-40 relative flex-shrink-0">
        <div className="h-full bg-emerald-500 transition-all duration-100 ease-linear" style={{ width: `${progress}%` }} />
      </div>

      <main className={`flex-1 relative overflow-hidden min-h-0 ${viewMode === "iberia-map" ? "bg-gradient-to-b from-slate-900 via-slate-800 to-slate-700" : "bg-gradient-to-b from-sky-400 via-sky-200 to-sky-100"}`}>
        <div className="absolute top-4 w-[200%] flex animate-cloud-scroll pointer-events-none opacity-60 z-10">
           {[...Array(12)].map((_, i) => (
             <div key={i} className={`mx-8 ${i % 2 === 0 ? 'mt-0' : 'mt-6'}`}>
               <CustomCloud opacity={0.8} />
             </div>
           ))}
        </div>

        <div className="absolute top-4 left-4 z-[60] flex flex-col gap-2 pointer-events-none">
          {activities.map((act, i) => (
            <div key={act.id || i} className="bg-slate-950/40 backdrop-blur-sm border border-white/10 px-3 py-1.5 rounded-full animate-fade-in-left">
              <p className="text-[9px] font-bold italic uppercase tracking-tight">
                <span className="text-emerald-400">{act.userName}</span> 
                <span className="text-white/60 ml-1">{act.text}</span>
              </p>
            </div>
          ))}
        </div>

        <div className="absolute top-4 right-4 z-[70] bg-white/90 backdrop-blur px-4 py-2 rounded-2xl border-2 border-slate-900 shadow-xl flex flex-col items-center min-w-[65px]">
          <span className="text-xl">🌳</span>
          <span className="text-lg font-black text-slate-900 leading-none mt-0.5">{tribeData.trees || 0}</span>
          <span className="text-[9px] font-black uppercase text-emerald-700 mt-1">Nivel {forestLevel}</span>
        </div>

        {viewMode === 'iberia-map' ? (
          <div className="absolute bottom-0 w-full h-[78%] bg-gradient-to-t from-slate-950/80 to-transparent">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(59,130,246,0.25),transparent_60%)]" />
            <div className="relative w-full h-full max-w-5xl mx-auto">
              <div className="absolute inset-6 rounded-[2.2rem] border border-emerald-300/30 bg-slate-900/50 backdrop-blur-sm shadow-[0_0_50px_rgba(16,185,129,0.18)] p-4">
                <div className="absolute inset-0 opacity-90 pointer-events-none"><IberianPeninsula /></div>
                {forestTrees.map((tree) => (
                  <div
                    key={tree.id}
                    className="absolute origin-bottom transition-all duration-700"
                    style={{
                      left: `${16 + tree.x * 0.68}%`,
                      top: `${9 + tree.y * 0.62}%`,
                      transform: 'translate(-50%, -100%) scale(0.58)'
                    }}
                  >
                    <MediterraneanTree
                      level={tree.level}
                      yPos={tree.y}
                      zoomFactor={zoomFactor}
                      isRecentlyWatered={recentlyWateredTreeIds.includes(tree.id)}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="absolute bottom-0 w-full h-[70%] bg-[#f3e6d3]">
            <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-sky-100 to-transparent z-10 pointer-events-none" />

            <div className="relative w-full h-full max-w-7xl mx-auto overflow-visible">
              {forestTrees.map((tree) => (
                <div
                  key={tree.id}
                  className="absolute animate-pop-in origin-bottom transition-all duration-1000"
                  style={{
                    left: `${tree.x}%`,
                    top: `${tree.y}%`,
                    zIndex: Math.floor(tree.y),
                    transform: 'translate(-50%, -100%)'
                  }}
                >
                  <MediterraneanTree
                    level={tree.level}
                    yPos={tree.y}
                    zoomFactor={zoomFactor}
                    isRecentlyWatered={recentlyWateredTreeIds.includes(tree.id)}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <footer className="bg-slate-950 border-t border-white/5 flex flex-col items-center p-4 pb-10 z-50">
        <div className="flex w-full justify-center gap-4 mb-4">
          <button 
            disabled={userData.seeds <= 0 || showHeroAnim}
            onClick={handlePlantClick}
            className="flex-1 max-w-[140px] h-12 bg-emerald-600 disabled:bg-slate-800 disabled:opacity-50 text-white rounded-xl font-black uppercase text-[10px]"
          >
            SEMBRAR
          </button>
          <button 
            disabled={userData.drops < 5 || isWatering}
            onClick={handleWaterClick}
            className="flex-1 max-w-[140px] h-12 bg-emerald-600 disabled:bg-slate-800 disabled:opacity-50 text-white rounded-xl font-black uppercase text-[10px]"
          >
            {isWatering ? 'REGANDO...' : 'REGAR'}
          </button>
        </div>
        {isJefe && (
          <button onClick={() => setShowManageModal(true)} className="w-full max-w-[300px] h-10 bg-amber-500 text-slate-950 rounded-xl font-black uppercase text-[10px]">
            GESTIONAR TRIBU
          </button>
        )}
      </footer>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes pop-in { 0% { transform: translate(-50%, -100%) scale(0); opacity: 0; } 100% { transform: translate(-50%, -100%) scale(1); opacity: 1; } }
        @keyframes cloud-scroll { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        @keyframes fade-in-left { from { opacity: 0; transform: translateX(-20px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes hero-drop {
          0% { transform: translateY(-100vh) rotate(-180deg) scale(0.5); opacity: 0; }
          60% { transform: translateY(0) rotate(0deg) scale(1.5); opacity: 1; }
          80% { transform: scale(1.2); }
          100% { transform: scale(3); opacity: 0; }
        }
        .animate-pop-in { animation: pop-in 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
        .animate-cloud-scroll { animation: cloud-scroll 120s linear infinite; }
        .animate-fade-in-left { animation: fade-in-left 0.5s ease-out forwards; }
        @keyframes water-highlight {
          0% { transform: scale(1); filter: drop-shadow(0 0 0 rgba(34,197,94,0)); }
          30% { transform: scale(1.22); filter: drop-shadow(0 0 30px rgba(34,197,94,0.72)); }
          100% { transform: scale(1); filter: drop-shadow(0 0 0 rgba(34,197,94,0)); }
        }
        @keyframes pump-drop {
          0% { opacity: 0; transform: translateY(-2px) scale(0.75); }
          20% { opacity: 1; }
          100% { opacity: 0; transform: translateY(24px) scale(0.55); }
        }
        .animate-hero-drop { animation: hero-drop 0.8s ease-in-out forwards; }
        .animate-water-highlight { animation: water-highlight 0.9s ease-out; }
        .animate-pump-drop { animation-name: pump-drop; animation-timing-function: ease-out; animation-fill-mode: none; opacity: 0; }
        @keyframes water-ring {
          0% { opacity: 0.75; transform: scale(0.6); }
          100% { opacity: 0; transform: scale(1.5); }
        }
        .animate-water-ring { animation: water-ring 0.9s ease-out; }
      `}} />
    </div>
  );
};

export default GameView;
