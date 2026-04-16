import Sidebar from './Sidebar';
import TopBar from './TopBar';
import EmberBackground from '../ui/EmberBackground';

export default function Layout({ children }) {
  return (
    <div className="flex h-screen overflow-hidden">
      <EmberBackground count={25} />
      <Sidebar />
      <div className="flex-1 flex flex-col ml-64 h-screen">
        <TopBar />
        <main className="flex-1 p-8 overflow-y-auto">
          {children}
        </main>
        <footer className="border-t border-medieval-gold/[0.06] py-4 px-8 flex items-center justify-between">
          <p className="text-[10px] text-medieval-gold/[0.15] uppercase tracking-[0.2em] medieval-text">
            The Council / El Consejo
          </p>
          <p className="text-[10px] text-medieval-gold/[0.15] font-mono uppercase tracking-[0.2em]">
            Hecha por El Viejo
          </p>
        </footer>
      </div>
    </div>
  );
}
