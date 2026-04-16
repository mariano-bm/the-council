export default function LoadingScreen() {
  return (
    <div className="fixed inset-0 bg-council-dark flex items-center justify-center">
      <div className="text-center">
        <div className="relative w-16 h-16 mx-auto mb-6">
          <div className="absolute inset-0 rounded-full border-2 border-neon-violet/20" />
          <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-neon-violet animate-spin" />
          <div className="absolute inset-2 rounded-full border-2 border-transparent border-t-neon-cyan animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
        </div>
        <h2 className="text-xl font-bold neon-text">The Council</h2>
        <p className="text-white/40 text-sm mt-2">Cargando...</p>
      </div>
    </div>
  );
}
