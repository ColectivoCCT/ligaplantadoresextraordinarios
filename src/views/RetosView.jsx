import { Link } from 'react-router-dom';

const challengeTemplates = [
  {
    key: 'memory-grove',
    title: 'Bosque de Memoria',
    description: 'Encuentra parejas de hojas antes de que acabe el tiempo para ganar semillas.'
  },
  {
    key: 'drop-rhythm',
    title: 'Ritmo de Gotas',
    description: 'Pulsa al compás para llenar el depósito y desbloquear recompensas.'
  },
  {
    key: 'seed-quiz',
    title: 'Quiz Verde',
    description: 'Responde preguntas sobre medioambiente para subir el multiplicador de semillas.'
  }
];

const RetosView = () => {
  return (
    <div className="min-h-[100dvh] bg-[#020617] text-white p-6 md:p-10 font-sans">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between gap-3 mb-8">
          <div>
            <p className="text-emerald-300 uppercase text-xs tracking-[0.25em] font-black">Centro de Retos</p>
            <h1 className="text-3xl md:text-5xl font-black italic">Gana Semillas con Minijuegos</h1>
          </div>
          <Link
            to="/"
            className="bg-white/10 border border-white/20 px-4 py-2 rounded-xl text-xs uppercase font-black tracking-wider hover:bg-white/20 transition-colors"
          >
            Volver al Bosque
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-4 mb-8">
          {challengeTemplates.map((challenge) => (
            <article
              key={challenge.key}
              className="rounded-2xl border border-emerald-400/25 bg-slate-900/70 p-5 shadow-[0_0_25px_rgba(16,185,129,0.15)]"
            >
              <h2 className="text-lg font-black mb-2">{challenge.title}</h2>
              <p className="text-sm text-white/70 mb-4">{challenge.description}</p>
              <p className="text-[10px] uppercase tracking-[0.2em] text-emerald-300 font-black">Próximamente</p>
            </article>
          ))}
        </div>

        <div className="rounded-2xl border border-sky-400/25 bg-slate-900/70 p-6">
          <h3 className="text-xl font-black mb-2">Flujo rápido para añadir minijuegos con tus alumnos</h3>
          <ol className="list-decimal list-inside space-y-2 text-sm text-white/80">
            <li>Crear un archivo por reto en <code className="text-emerald-300">src/minigames/NombreReto.jsx</code>.</li>
            <li>Exportar un componente con props simples: <code className="text-emerald-300">onWin(seeds)</code> y <code className="text-emerald-300">onExit()</code>.</li>
            <li>Añadir una tarjeta en esta vista y un enlace al minijuego.</li>
            <li>Cuando el alumno gane, llamar a <code className="text-emerald-300">onWin</code> para otorgar semillas.</li>
            <li>Probar siempre con <code className="text-emerald-300">npm run check</code> antes de publicar cambios.</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default RetosView;
