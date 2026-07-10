import { LayoutGrid, Calendar, Settings, UserPlus, ShieldAlert, LogIn, Bell, ArrowLeft } from 'lucide-react';
import { ProfessionalProfile } from '../types';

interface NavbarProps {
  currentView: string;
  setView: (view: string) => void;
  activeUser: ProfessionalProfile | null;
  onBackToClinic: () => void;
}

export default function Navbar({ currentView, setView, activeUser, onBackToClinic }: NavbarProps) {
  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-outline-alt/40 shadow-sm transition-all duration-200">
      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
        {/* Brand Logo & Back Button */}
        <div className="flex items-center gap-4">
          <button
            onClick={onBackToClinic}
            className="flex items-center font-sans font-semibold text-xs tracking-wide text-brand-variant hover:text-primary bg-primary/5 hover:bg-primary/10 px-3.5 py-2 rounded-lg border border-primary/10 transition-all duration-200"
            title="Voltar para o site principal da clínica"
          >
            <span>Voltar à Clínica</span>
          </button>

          <div 
            onClick={() => setView('home')} 
            className="flex items-center gap-2 cursor-pointer group"
            id="nav-logo"
          >
            <div className="p-2 bg-primary/5 rounded-lg group-hover:bg-primary/10 transition-colors">
              <Calendar className="w-7 h-7 text-primary" />
            </div>
            <div>
              <span className="font-sans font-extrabold text-2xl tracking-tight text-primary">
                Subloca<span className="text-secondary">Hope</span>
              </span>
            </div>
          </div>
        </div>

        {/* Live Nav Menu */}
        <nav className="hidden md:flex items-center gap-8">
          <button
            onClick={() => setView('home')}
            id="nav-link-home"
            className={`font-sans font-semibold text-sm tracking-wide transition-all py-1.5 duration-200 ${
              currentView === 'home'
                ? 'text-primary border-b-2 border-primary'
                : 'text-brand-variant hover:text-primary hover:translate-y-[-1px]'
            }`}
          >
            Encontrar Salas
          </button>
          
          <button
            onClick={() => setView('booking')}
            id="nav-link-booking"
            className={`font-sans font-semibold text-sm tracking-wide transition-all py-1.5 duration-200 ${
              currentView === 'booking'
                ? 'text-primary border-b-2 border-primary'
                : 'text-brand-variant hover:text-primary hover:translate-y-[-1px]'
            }`}
          >
            Reservar Consultório
          </button>

          {activeUser ? (
            <button
              onClick={() => setView('professional-dashboard')}
              id="nav-link-professional-dashboard"
              className={`font-sans font-semibold text-sm tracking-wide transition-all py-1.5 duration-200 ${
                currentView === 'professional-dashboard'
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-secondary font-bold hover:text-primary hover:translate-y-[-1px]'
              }`}
            >
              Meu Painel Clínico
            </button>
          ) : (
            <button
              onClick={() => setView('register')}
              id="nav-link-register"
              className={`font-sans font-semibold text-sm tracking-wide transition-all py-1.5 duration-200 ${
                currentView === 'register'
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-brand-variant hover:text-primary hover:translate-y-[-1px]'
              }`}
            >
              Cadastrar Profissional
            </button>
          )}
        </nav>

        {/* Profile and Quick Status indicators */}
        <div className="flex items-center gap-4">
          <div className="relative cursor-pointer hover:opacity-85 transition-opacity" id="nav-notifications">
            <Bell className="w-5 h-5 text-brand-variant" />
            <span className="absolute top-[-4px] right-[-4px] w-2 h-2 rounded-full bg-secondary"></span>
          </div>

          <div
            onClick={() => setView(activeUser ? 'professional-dashboard' : 'register-login')}
            className="flex items-center gap-2.5 pl-3 border-l border-outline-alt/60 cursor-pointer group"
            id="nav-profile-trigger"
          >
            {activeUser ? (
              <div className="flex items-center gap-2">
                <div className="text-right hidden sm:block">
                  <p className="text-xs font-semibold text-brand-text truncate max-w-[120px]">
                    {activeUser.name}
                  </p>
                  <p className="text-[10px] text-brand-variant uppercase tracking-wider font-medium">
                    {activeUser.registerNumber ? activeUser.registerNumber : 'Membro'}
                  </p>
                </div>
                <div className="w-9 h-9 rounded-full bg-secondary-container border border-secondary/30 overflow-hidden shadow-sm shadow-secondary/10 group-hover:scale-105 transition-transform duration-200">
                  <img
                    src={activeUser.profilePhoto?.previewUrl || "https://lh3.googleusercontent.com/aida-public/AB6AXuC4yKk4QuxVls_8cXGWPLoRElTHEp_5wuE59K9at-PZ-VFXyCKxOQWDBGVYlbcs4U3Rl5Cxj4AdGL_lf71nnvGW5YeRqjFfX1xAKsFrMEj-QfrVcuxnOzDyrgvJxR06opDR8y8SrGghVfq45Z7hCeRVOuPsTduaUUz281CxuUeTFQ5cMsRp0Ov6C5OJy0xAo92RBOwMUxCkKR-gNWA4XLfFnmrD9IeReB-W8XNImOjong0nQPQJMsgPDL6-TSZuNLG7nwjzB8LBsns"}
                    alt="Usuário Ativo"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
              </div>
            ) : (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setView('register-login');
                }}
                className="flex items-center bg-secondary text-white font-sans font-bold text-xs tracking-wide py-2 px-4 rounded-lg hover:shadow-md hover:shadow-secondary/20 transition-all"
              >
                <span>Entrar / Registrar</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
