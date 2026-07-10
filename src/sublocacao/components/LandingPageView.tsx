import { Star, ArrowRight, ShieldCheck } from 'lucide-react';
import { Room, AdminSettings } from '../types';
import { getAmenityIcon, cleanAmenityLabel } from './BookingPageView';

interface LandingPageViewProps {
  rooms: Room[];
  adminSettings: AdminSettings;
  setView: (view: string) => void;
  onSelectRoom: (roomId: string) => void;
}

export default function LandingPageView({ rooms, adminSettings, setView, onSelectRoom }: LandingPageViewProps) {
  
  const handleSelectRoom = (roomId: string) => {
    onSelectRoom(roomId);
    setView('booking');
  };

  return (
    <div className="space-y-16 animate-fade-in pb-16">
      {/* 1. HERO SECTION */}
      <section className="relative bg-white border border-outline-alt/45 rounded-[2.5rem] p-8 sm:p-12 md:p-16 overflow-hidden shadow-sm">
        <div className="grid lg:grid-cols-12 gap-12 items-center relative z-10">
          {/* Left Block */}
          <div className="lg:col-span-7 space-y-6 text-left">
            <span className="bg-secondary/15 text-secondary font-sans font-black text-xs rounded-full uppercase tracking-wider px-3.5 py-1">
              Sublocação Inteligente de Consultórios 🏥
            </span>
            <h1 className="font-sans font-extrabold text-4xl sm:text-5xl lg:text-6xl text-primary leading-tight tracking-tight">
              {adminSettings.heroTitle}
            </h1>
            <p className="font-sans text-brand-variant text-base sm:text-lg leading-relaxed max-w-xl">
              {adminSettings.heroDescription}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pt-2">
              <button
                onClick={() => setView('booking')}
                className="bg-secondary hover:bg-secondary/95 text-white font-sans font-bold text-sm tracking-wide px-8 py-4 rounded-xl hover:shadow-lg hover:shadow-secondary/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Reservar um Horário</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => setView('register')}
                className="px-8 py-4 border border-[#a2a6ab] hover:bg-slate-50 text-primary rounded-xl font-sans font-bold text-sm transition-all"
              >
                Cadastrar Perfil Clínico
              </button>
            </div>
          </div>
          
          {/* Right Image Block */}
          <div className="lg:col-span-5 relative w-full h-[320px] sm:h-[400px] rounded-3xl overflow-hidden shadow-lg border border-outline-alt/40 bg-zinc-100 flex items-center justify-center">
            <img
              src={adminSettings.heroImage}
              alt="Consultório elegante sublocaHope"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-secondary/5 rounded-full translate-x-1/3 -translate-y-1/3 blur-3xl"></div>
      </section>

      {/* 3. NOSSOS CONSULTÓRIOS PRONTOS */}
      <section className="space-y-12" id="salas">
        <div className="text-center space-y-2">
          <h2 className="font-sans font-extrabold text-3xl sm:text-4xl text-primary leading-tight tracking-tight">
            {adminSettings.landingRoomsHeading}
          </h2>
          <p className="font-sans text-brand-variant text-sm max-w-2xl mx-auto">
            {adminSettings.landingRoomsSub}
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {rooms.slice(0, 6).map((room) => {
            return (
              <div
                key={room.id}
                className="group bg-white rounded-3xl overflow-hidden border border-outline-alt/35 hover:border-secondary/35 hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  {/* Room Image */}
                  <div className="h-48 overflow-hidden bg-slate-100 relative">
                    <img
                      src={room.images && room.images.length > 0 ? room.images[0] : "https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&q=80&w=1200"}
                      alt={room.name}
                      className="w-full h-full object-cover transition-all"
                      style={room.imageSettings ? {
                        transform: `scale(${(room.imageSettings.zoom || 100) / 100}) rotate(${room.imageSettings.rotate || 0}deg)`,
                        objectPosition: `${room.imageSettings.posX ?? 50}% ${room.imageSettings.posY ?? 50}%`,
                        filter: `brightness(${room.imageSettings.brightness ?? 100}%) contrast(${room.imageSettings.contrast ?? 100}%)`
                      } : undefined}
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-full text-xs font-bold text-secondary border border-secondary/10 flex items-center gap-1 shadow-sm">
                      <Star className="w-3.5 h-3.5 fill-secondary text-secondary" />
                      <span>{(room.rating ?? 5.0).toFixed(1)}</span>
                    </div>
                  </div>

                  {/* Content details */}
                  <div className="p-6 text-left space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-secondary uppercase tracking-wider bg-secondary/10 px-2.5 py-0.5 rounded-md">
                        {room.type === 'executivo_luxo' ? 'Executivo Luxo' : (room.type === 'premium' ? 'Premium' : 'Standard')}
                      </span>
                    </div>
                    <h3 className="font-sans font-extrabold text-lg text-primary leading-snug">
                      {room.name}
                    </h3>
                    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-brand-variant font-medium">
                      {(room.features || []).map((feat, i) => (
                        <span key={i} className="flex items-center gap-1.5 whitespace-nowrap">
                          {getAmenityIcon(feat, "w-3.5 h-3.5 text-secondary")}
                          <span>{cleanAmenityLabel(feat)}</span>
                          {i < (room.features || []).length - 1 && <span className="text-black/15 ml-1 select-none">•</span>}
                        </span>
                      ))}
                    </div>
                    <p className="font-sans text-xs text-brand-variant leading-relaxed">
                      {room.description}
                    </p>
                  </div>
                </div>

                <div className="p-6 pt-0">
                  <div className="pt-4 border-t border-outline-alt/15 flex items-center justify-between">
                    <div className="text-left">
                      <span className="text-[10px] text-brand-variant font-extrabold uppercase tracking-widest block">Sublocação</span>
                      <p className="font-sans font-black text-xl text-primary">
                        R$ {(room.pricePerHour ?? 45).toFixed(2).replace('.', ',')} <span className="text-xs font-normal text-brand-variant">/h</span>
                      </p>
                    </div>
                    <button
                      onClick={() => handleSelectRoom(room.id)}
                      className="bg-secondary hover:bg-secondary/95 text-white font-sans font-bold text-xs tracking-wider px-5 py-3 rounded-xl transition-all shadow-sm active:scale-95 cursor-pointer"
                    >
                      Reservar Sala
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. SUBSCRIPTION PLANS SECTION */}
      <section className="space-y-12" id="planos">
        <div className="text-center space-y-3">
          <h2 className="font-sans font-extrabold text-3xl sm:text-4xl text-primary tracking-tight">
            Escolha o plano ideal para sua rotina de atendimentos
          </h2>
          <p className="font-sans text-brand-variant text-base max-w-2xl mx-auto font-medium">
            Tenha uma estrutura profissional sem os custos de manter uma clínica própria.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto items-stretch">
          {/* Plan 1 - Reserva Avulsa (Featured / Highest Prominence) */}
          <div className="bg-gradient-to-br from-white to-primary/[0.02] p-8 sm:p-10 rounded-3xl border-2 border-primary shadow-xl hover:shadow-2xl flex flex-col justify-between space-y-6 relative overflow-hidden text-left transition-all duration-300 transform hover:-translate-y-1">
            <div className="absolute top-0 right-0 bg-primary text-white text-[9px] font-black uppercase tracking-widest px-4 py-1.5 rounded-bl-xl shadow-xs">
              MAIS FLEXÍVEL
            </div>
            <div className="space-y-5">
              <div className="flex justify-between items-center">
                <span className="bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full">
                  Sem Fidelidade
                </span>
                <span className="text-xs text-primary font-bold">Mais Prático</span>
              </div>
              <h3 className="font-sans font-black text-2xl text-primary">Reserva Avulsa</h3>
              <p className="font-sans text-sm text-brand-variant leading-relaxed">
                Tenha uma sala profissional pronta para atender seus pacientes, pagando apenas pelo tempo que utilizar.
              </p>
              
              <ul className="text-sm text-brand-variant space-y-2.5 pt-2 flex flex-col">
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">✓</span>
                  <span>Sala pronta para atendimento</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">✓</span>
                  <span>Reserve quando precisar</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">✓</span>
                  <span>Sem mensalidade ou contrato longo</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">✓</span>
                  <span>Ambiente profissional para receber seus pacientes</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">✓</span>
                  <span>Wi-Fi e estrutura inclusos</span>
                </li>
              </ul>
            </div>
            
            <div className="pt-6 border-t border-primary/10 flex flex-col gap-4">
              <div>
                <span className="text-xs text-brand-variant font-medium block uppercase tracking-wider">A partir de</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-sans font-black text-primary">R$ 32,90</span>
                  <span className="text-sm text-brand-variant font-semibold">/ hora</span>
                </div>
              </div>
              <button
                onClick={() => setView('booking')}
                className="w-full bg-primary hover:bg-primary/95 text-white font-sans font-extrabold text-sm tracking-wider py-4 px-4 rounded-xl transition-all shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 active:scale-[0.98] text-center cursor-pointer"
              >
                Reservar minha sala
              </button>
            </div>
          </div>

          {/* Plan 2 */}
          <div className="bg-white p-8 sm:p-10 rounded-3xl border border-outline-alt/35 hover:border-outline-alt shadow-sm hover:shadow-md flex flex-col justify-between space-y-6 relative overflow-hidden text-left transition-all duration-300">
            <div className="absolute top-0 right-0 bg-secondary text-white text-[9px] font-black uppercase tracking-widest px-4 py-1.5 rounded-bl-xl shadow-xs">
              RECOMENDADO
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="bg-secondary/15 text-secondary text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full">
                  Agenda Fixa
                </span>
                <span className="text-xs text-[#2e7d32] font-bold">Melhor Custo-Benefício</span>
              </div>
              <div className="space-y-1">
                <h3 className="font-sans font-black text-2xl text-primary">Plano Profissional</h3>
                <span className="text-xs font-extrabold text-secondary tracking-wide uppercase block">16 Horas Mensais</span>
              </div>
              <p className="font-sans text-sm text-brand-variant leading-relaxed">
                Para profissionais que possuem pacientes recorrentes e querem garantir horários fixos com melhor custo.
              </p>
              
              <ul className="text-sm text-brand-variant space-y-2.5 pt-2 flex flex-col">
                <li className="flex items-start gap-2">
                  <span className="text-[#2e7d32] font-bold">✓</span>
                  <span>Horários garantidos todos os meses</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#2e7d32] font-bold">✓</span>
                  <span>Mais organização para sua agenda</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#2e7d32] font-bold">✓</span>
                  <span>Atendimento em ambiente profissional</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#2e7d32] font-bold">✓</span>
                  <span>Melhor custo por hora</span>
                </li>
              </ul>
            </div>
            
            <div className="pt-6 border-t border-outline-alt/15 flex flex-col gap-4">
              <div className="flex justify-between items-end">
                <div>
                  <span className="text-xs text-brand-variant font-medium block uppercase tracking-wider">Somente</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-sans font-black text-primary">R$ 480</span>
                    <span className="text-sm text-brand-variant font-semibold">/ mês</span>
                  </div>
                </div>
                <div className="bg-[#eefcf4] px-3 py-1.5 rounded-lg border border-green-200">
                  <span className="text-xs font-extrabold text-[#1e4620]">Você economiza até 30%</span>
                </div>
              </div>
              <button
                onClick={() => setView('booking')}
                className="w-full bg-secondary hover:bg-secondary/95 text-white font-sans font-bold text-xs tracking-wider py-3.5 px-4 rounded-xl transition-all shadow-md shadow-secondary/10 active:scale-[0.98] text-center cursor-pointer"
              >
                Reservar horário
              </button>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
