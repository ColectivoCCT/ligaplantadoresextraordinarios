import { useState } from 'react';
import { motion } from 'framer-motion';
import Typewriter from './Typewriter';
import beleafImg from '../assets/beleaf.png';

const BeleafCharacter = ({ paragraphs = [] }) => {
  const [visibleParagraphs, setVisibleParagraphs] = useState(1);

  return (
    <div className="w-full grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-8 items-center max-w-[1400px] mx-auto">
      
      {/* BOCADILLO: En móvil reducimos fuente y padding para ganar espacio */}
      <div className="md:col-span-7 lg:col-span-8 relative bg-white rounded-[2rem] md:rounded-[3rem] p-5 md:p-12 shadow-xl border-[4px] md:border-[6px] border-emerald-500 order-1">
        <div className="text-[#0f172a] text-base sm:text-lg md:text-2xl lg:text-3xl leading-tight text-left space-y-2 md:space-y-4 font-mono font-bold tracking-tight">
          {paragraphs.slice(0, visibleParagraphs).map((text, index) => (
            <p key={index}>
              <Typewriter 
                text={text} 
                onComplete={() => {
                  if (visibleParagraphs < paragraphs.length) setVisibleParagraphs(prev => prev + 1);
                }} 
              />
            </p>
          ))}
        </div>
        
        {/* Triángulo: Lo ocultamos en móvil para limpiar la interfaz */}
        <div className="hidden md:block absolute top-1/2 -right-10 -translate-y-1/2 w-0 h-0 border-t-[30px] border-t-transparent border-b-[30px] border-b-transparent border-l-[40px] border-l-emerald-500"></div>
        <div className="hidden md:block absolute top-1/2 -right-7 -translate-y-1/2 w-0 h-0 border-t-[25px] border-t-transparent border-b-[25px] border-b-transparent border-l-[32px] border-l-white"></div>
      </div>

      {/* PERSONAJE: Más pequeño en móvil para que no haga scroll */}
      <div className="md:col-span-5 lg:col-span-4 flex justify-center md:justify-end order-2 mt-[-20px] md:mt-0">
        <motion.img 
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          src={beleafImg} 
          className="w-32 sm:w-40 md:w-full max-w-[450px] drop-shadow-[0_20px_40px_rgba(16,185,129,0.5)] object-contain"
          alt="Beleaf"
        />
      </div>
    </div>
  );
};

export default BeleafCharacter;