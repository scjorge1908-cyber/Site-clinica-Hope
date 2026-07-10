import React, { useState, useEffect } from 'react';
import { 
  Calendar, CreditCard, ShieldCheck, User, Phone, 
  Trash2, QrCode, CheckCircle, Clock, MapPin, Receipt, 
  LogOut, ArrowRight, ShieldAlert, Sparkles, BookOpen, Smartphone,
  X, Check, Plus, Edit, FileText, ChevronRight, HelpCircle, Eye, AlertCircle, RefreshCw
} from 'lucide-react';
import { Booking, Room, ProfessionalProfile } from '../types';
import AppSimulatorView from './AppSimulatorView';

interface ProfessionalPortalProps {
  activeUser: ProfessionalProfile;
  bookings: Booking[];
  rooms: Room[];
  onCancelBooking: (id: string) => void;
  onAddBooking: (booking: Booking) => void;
  setView: (view: string) => void;
  onLogout: () => void;
  onUpdateProfile?: (profile: ProfessionalProfile) => void;
}

export default function ProfessionalPortalView({
  activeUser,
  bookings,
  rooms,
  onCancelBooking,
  onAddBooking,
  setView,
  onLogout,
  onUpdateProfile
}: ProfessionalPortalProps) {
  
  // Filter bookings belonging to this professional
  const myBookings = bookings.filter(
    (b) => b.professionalName === activeUser.name || b.professionalId === activeUser.registerNumber
  );

  // States
  const [selectedBookingForPayment, setSelectedBookingForPayment] = useState<Booking | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'credit_card' | 'pix'>('credit_card');
  const [copiedPix, setCopiedPix] = useState(false);
  const [simulatedCardName, setSimulatedCardName] = useState(activeUser.name);
  const [simulatedCardNum, setSimulatedCardNum] = useState('');
  const [simulatedCardExpiry, setSimulatedCardExpiry] = useState('');
  const [simulatedCardCvv, setSimulatedCardCvv] = useState('');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentSuccessToast, setPaymentSuccessToast] = useState(false);
  
  // Modals inside Redesign
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isAppSimulatorOpen, setIsAppSimulatorOpen] = useState(false);
  const [isAccessDetailsOpen, setIsAccessDetailsOpen] = useState<Booking | null>(null);
  const [isCardUpdateOpen, setIsCardUpdateOpen] = useState(false);
  const [cancellingBookingId, setCancellingBookingId] = useState<string | null>(null);

  // Profile Form States
  const [editName, setEditName] = useState(activeUser.name);
  const [editRegisterNumber, setEditRegisterNumber] = useState(activeUser.registerNumber);
  const [editEmail, setEditEmail] = useState(activeUser.email);
  const [editPhone, setEditPhone] = useState(activeUser.phone || '');
  const [editPhotoUrl, setEditPhotoUrl] = useState(activeUser.profilePhoto?.previewUrl || '');
  const [editApprovalStatus, setEditApprovalStatus] = useState(activeUser.approvalStatus || 'Pendente');

  // Simulated Card Info
  const [registeredCard, setRegisteredCard] = useState({
    num: '•••• •••• •••• 4578',
    brand: 'Visa',
    name: activeUser.name,
    expiry: '12/29'
  });

  // Track mock payment statuses specifically for simulated session
  const [paidBookingIds, setPaidBookingIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('sublocahope_paid_booking_ids');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn("Erro ao fazer parse dos ids de pagramentos:", e);
    }
    return [];
  });

  // Load and sync edit fields when activeUser changes
  useEffect(() => {
    setEditName(activeUser.name);
    setEditRegisterNumber(activeUser.registerNumber);
    setEditEmail(activeUser.email);
    setEditPhone(activeUser.phone || '');
    setEditPhotoUrl(activeUser.profilePhoto?.previewUrl || '');
    setEditApprovalStatus(activeUser.approvalStatus || 'Pendente');
  }, [activeUser]);

  const triggerPaymentSuccess = (bookingId: string) => {
    const updated = [...paidBookingIds, bookingId];
    setPaidBookingIds(updated);
    localStorage.setItem('sublocahope_paid_booking_ids', JSON.stringify(updated));
    setPaymentSuccessToast(true);
    setTimeout(() => setPaymentSuccessToast(false), 4000);
    setSelectedBookingForPayment(null);
  };

  const handleCopyPix = () => {
    setCopiedPix(true);
    navigator.clipboard.writeText(
      `00020101021226830014br.gov.bcb.pix2561api.mercadopago.com/v1/payments/sublocahope-${Date.now()}`
    );
    setTimeout(() => setCopiedPix(false), 2000);
  };

  const handleSimulatePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBookingForPayment) return;
    
    setIsProcessingPayment(true);
    setTimeout(() => {
      setIsProcessingPayment(false);
      triggerPaymentSuccess(selectedBookingForPayment.id);
    }, 1200);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (onUpdateProfile) {
      onUpdateProfile({
        ...activeUser,
        name: editName,
        registerNumber: editRegisterNumber,
        email: editEmail,
        phone: editPhone,
        profilePhoto: {
          name: 'profile.jpg',
          size: 150000,
          previewUrl: editPhotoUrl || undefined
        },
        approvalStatus: editApprovalStatus as 'Pendente' | 'Aprovado' | 'Rejeitado'
      });
    }
    setIsProfileModalOpen(false);
  };

  const handleSaveCard = (e: React.FormEvent) => {
    e.preventDefault();
    const ending = simulatedCardNum.slice(-4) || '1289';
    setRegisteredCard({
      num: `•••• •••• •••• ${ending}`,
      brand: 'Mastercard',
      name: simulatedCardName || activeUser.name,
      expiry: simulatedCardExpiry || '08/30'
    });
    setIsCardUpdateOpen(false);
  };

  // INDICATORS CALCULATION
  const activeBookings = myBookings.filter(b => b.status === 'Confirmado');
  const activeCount = activeBookings.length;
  
  const hoursCount = activeBookings.reduce((sum, b) => sum + (b.timeSlots?.length || 0), 0);
  const pendingPaymentsVal = activeBookings
    .filter(b => !paidBookingIds.includes(b.id))
    .reduce((sum, b) => sum + (b.totalValue ?? 0), 0);

  // FIND NEXT BOOKING (Chronological sorting based on standard dateKey "YYYY-MM-DD")
  const sortedUpcoming = [...activeBookings].sort((a, b) => {
    const dateA = a.dateKey || '';
    const dateB = b.dateKey || '';
    if (dateA !== dateB) return dateA.localeCompare(dateB);
    const slotA = a.timeSlots?.[0] || '';
    const slotB = b.timeSlots?.[0] || '';
    return slotA.localeCompare(slotB);
  });
  const nextBooking = sortedUpcoming[0];

  // Map next booking location
  const nextBookingRoom = nextBooking ? rooms.find(r => r.name === nextBooking.roomName) : null;
  const nextBookingLocation = nextBookingRoom ? nextBookingRoom.location : 'Unidade Centro - Palhoça, SC';

  return (
    <div className="space-y-8 animate-fade-in pb-16 text-left max-w-7xl mx-auto px-1 sm:px-4">
      
      {/* Toast Notification for Success Payments */}
      {paymentSuccessToast && (
        <div className="fixed top-6 right-6 z-50 bg-emerald-50 border border-emerald-200 p-4 rounded-xl shadow-xl flex items-center gap-3 animate-slide-up max-w-sm">
          <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <div>
            <p className="font-bold text-xs text-emerald-950 font-sans">Pagamento Confirmado!</p>
            <p className="text-[11px] text-emerald-700 font-sans mt-0.5">Sua reserva foi liquidada e o acesso eletrônico foi liberado para a portaria.</p>
          </div>
        </div>
      )}

      {/* HEADER SECTION */}
      <header className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-4 text-left">
          {/* Circular Professional Avatar */}
          <div className="relative">
            <div className="w-16 h-16 rounded-full overflow-hidden border border-slate-200 shadow-sm bg-slate-100 flex-shrink-0">
              <img 
                src={activeUser.profilePhoto?.previewUrl || "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=250&h=250"} 
                alt={activeUser.name} 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            {/* Tiny live indicator dot */}
            <span className="absolute bottom-0 right-0 block h-3.5 w-3.5 rounded-full ring-2 ring-white bg-emerald-500"></span>
          </div>

          <div className="space-y-1">
            <h1 className="font-sans font-extrabold text-xl text-slate-900 leading-tight">
              {activeUser.name}
            </h1>
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
              <span className="font-mono text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                {activeUser.registerNumber}
              </span>
              
              {/* Approval status badge linked to document validation modal */}
              {activeUser.approvalStatus === 'Aprovado' ? (
                <button
                  type="button"
                  onClick={() => setIsProfileModalOpen(true)}
                  className="bg-emerald-50 text-emerald-700 border border-emerald-200/50 hover:bg-emerald-100/70 font-sans font-bold text-[10px] rounded-full uppercase tracking-wider px-2.5 py-0.5 flex items-center gap-1 cursor-pointer transition active:scale-95"
                  title="Clique para ver validação de documentos"
                >
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                  Cadastro Ativo
                </button>
              ) : activeUser.approvalStatus === 'Rejeitado' ? (
                <button
                  type="button"
                  onClick={() => setIsProfileModalOpen(true)}
                  className="bg-rose-50 text-rose-700 border border-rose-200/50 hover:bg-rose-100/70 font-sans font-bold text-[10px] rounded-full uppercase tracking-wider px-2.5 py-0.5 flex items-center gap-1 cursor-pointer transition active:scale-95"
                  title="Clique para ver pendências de documentos"
                >
                  <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse"></span>
                  Ajustes Necessários
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsProfileModalOpen(true)}
                  className="bg-amber-50 text-amber-700 border border-amber-250/50 hover:bg-amber-100/70 font-sans font-bold text-[10px] rounded-full uppercase tracking-wider px-2.5 py-0.5 flex items-center gap-1 cursor-pointer transition active:scale-95"
                  title="Clique para ver status do envio de documentos"
                >
                  <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-ping"></span>
                  Documentação em Análise
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Profile Controls Header Panel */}
        <div className="flex gap-2.5 w-full md:w-auto">
          <button
            onClick={() => setIsProfileModalOpen(true)}
            id="btn_my_profile_header"
            className="flex-1 md:flex-initial px-4 py-2.5 bg-slate-55 border border-slate-250 hover:bg-slate-100 text-slate-800 rounded-xl font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1.5"
          >
            <User className="w-4 h-4 text-slate-500" />
            <span>Meu Perfil</span>
          </button>
          
          <button
            onClick={onLogout}
            id="btn_logout"
            className="px-4 py-2.5 border border-rose-200 hover:bg-rose-50/50 text-rose-600 rounded-xl font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1.5"
          >
            <LogOut className="w-4 h-4" />
            <span>Sair</span>
          </button>
        </div>
      </header>

      {/* QUICK STATUS INDICATOR GRID CARDS */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Reservas Ativas */}
        <div id="stat_active_bookings" className="bg-white border border-slate-200/60 p-5 rounded-2xl flex flex-col justify-between shadow-xs hover:border-slate-350 transition duration-200">
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Reservas Ativas</span>
            <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="font-sans font-extrabold text-2xl text-slate-900">{activeCount}</h3>
            <p className="text-[11px] text-slate-400 mt-1">Horários agendados e confirmados</p>
          </div>
        </div>

        {/* Card 2: Horas Reservadas no Mês */}
        <div id="stat_hours_moth" className="bg-white border border-slate-200/60 p-5 rounded-2xl flex flex-col justify-between shadow-xs hover:border-slate-350 transition duration-200">
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Horas no Mês</span>
            <div className="p-2 bg-sky-50 rounded-xl text-sky-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="font-sans font-extrabold text-2xl text-slate-900">{hoursCount}h</h3>
            <p className="text-[11px] text-slate-400 mt-1">Tempo reservado em clínica</p>
          </div>
        </div>

        {/* Card 3: Pendências Financeiras */}
        <div id="stat_pending_payments" className="bg-white border border-slate-200/60 p-5 rounded-2xl flex flex-col justify-between shadow-xs hover:border-slate-350 transition duration-200">
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Pendências Financeiras</span>
            <div className="p-2 bg-rose-50 rounded-xl text-rose-600">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="font-sans font-extrabold text-2xl text-rose-600">R$ {(pendingPaymentsVal ?? 0).toFixed(2).replace('.', ',')}</h3>
            <p className="text-[11px] text-slate-400 mt-1">Total a liquidar à vista</p>
          </div>
        </div>

        {/* Card 4: Status da Documentação */}
        <div id="stat_docs_status" className="bg-white border border-slate-200/60 p-5 rounded-2xl flex flex-col justify-between shadow-xs hover:border-slate-350 transition duration-200 cursor-pointer" onClick={() => setIsProfileModalOpen(true)}>
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Documentação</span>
            <div className={`p-2 rounded-xl ${
              activeUser.approvalStatus === 'Aprovado' ? 'bg-emerald-50 text-emerald-600' :
              activeUser.approvalStatus === 'Rejeitado' ? 'bg-rose-50 text-rose-650' : 'bg-amber-50 text-amber-600'
            }`}>
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="font-sans font-extrabold text-lg text-slate-900">
              {activeUser.approvalStatus || 'Pendente'}
            </h3>
            <p className="text-[11px] text-slate-400 mt-1">Status do cadastro profissional</p>
          </div>
        </div>
      </section>

      {/* MAIN COGNITIVE GRID (Upcoming booking & Quick Actions grid) */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Next Active Booking Detail Box */}
        <div id="panel_next_reservation" className="lg:col-span-8 bg-white border border-slate-200/60 rounded-3xl p-6 shadow-xs text-left">
          <div className="flex justify-between items-center pb-4 mb-4 border-b border-slate-100">
            <h2 className="font-sans font-extrabold text-lg text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Sua próxima reserva rápida</span>
            </h2>
            <span className="text-[10px] text-slate-400 uppercase tracking-widest font-mono">Próxima Atividade</span>
          </div>

          {nextBooking ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              <div className="space-y-4">
                <div className="space-y-1">
                  <span className="text-[9px] uppercase tracking-wider font-extrabold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full inline-block">
                    Agenda Confirmada
                  </span>
                  <h3 className="font-sans font-extrabold text-xl text-slate-900 mt-1">{nextBooking.roomName}</h3>
                </div>

                <div className="space-y-2 text-slate-600 text-xs font-sans leading-relaxed">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span><strong>Data:</strong> {nextBooking.date}</span>
                  </div>
                  <div className="flex items-center gap-2 animate-pulse-slow">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <span><strong>Horários:</strong> {(nextBooking.timeSlots || []).join(', ')} ({(nextBooking.timeSlots || []).length}h)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    <span className="truncate" title={nextBookingLocation}><strong>Endereço:</strong> {nextBookingLocation}</span>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => setIsAccessDetailsOpen(nextBooking)}
                    className="w-full sm:w-auto px-5 py-3 bg-slate-900 hover:bg-slate-800 text-white font-sans font-bold text-xs rounded-xl transition duration-150 flex items-center justify-center gap-2"
                  >
                    <QrCode className="w-4 h-4" />
                    <span>Ver detalhes de acesso</span>
                  </button>
                </div>
              </div>

              {/* Minimal aesthetics visual map panel */}
              <div className="hidden md:block h-44 rounded-2xl bg-slate-50 border border-slate-200 relative overflow-hidden flex items-center justify-center group">
                {/* Simulated clean stylized Minimalistic map background vector */}
                <div className="absolute inset-0 bg-cover bg-center opacity-65 group-hover:scale-102 transition" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&q=80&w=600&h=400')" }}></div>
                <div className="absolute inset-0 bg-gradient-to-t from-white via-white/40 to-transparent"></div>
                
                {/* Map Floating Pointer */}
                <div className="relative z-10 bg-white shadow-md p-3 rounded-xl border border-slate-200/50 flex flex-col items-center">
                  <MapPin className="w-5 h-5 text-emerald-600 animate-bounce" />
                  <span className="text-[9px] font-extrabold text-slate-800 mt-1 leading-none">{nextBooking.roomName}</span>
                  <span className="text-[7px] text-slate-400 leading-none mt-0.5">Palhoça, SC</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-10 space-y-4">
              <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center mx-auto text-slate-400">
                <Calendar className="w-5 h-5" />
              </div>
              <p className="text-slate-500 font-sans text-xs max-w-xs mx-auto leading-relaxed">
                Você não possui reservas futuras ativas no momento para este profissional.
              </p>
              <button
                onClick={() => setView('booking')}
                className="inline-flex items-center gap-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                <Plus className="w-4 h-4 text-slate-600" />
                <span>Solicitar Nova Sala</span>
              </button>
            </div>
          )}
        </div>

        {/* QUICK ACTIONS SAAS TILES (F-Pattern right side) */}
        <div id="quick_actions_panel" className="lg:col-span-4 bg-white border border-slate-200/60 rounded-3xl p-6 shadow-xs text-left">
          <h2 className="font-sans font-extrabold text-base text-slate-900 pb-3 mb-4 border-b border-slate-100 uppercase tracking-wider text-xs">
            Ações Rápidas de Produto
          </h2>

          <div className="grid grid-cols-1 gap-2.5">
            {/* Action 1: Nova Reserva */}
            <button
              onClick={() => setView('booking')}
              className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-850 font-sans font-bold text-xs text-left transition duration-150"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100/60 rounded-lg text-emerald-700">
                  <Plus className="w-4 h-4" />
                </div>
                <span>➕ Criar Nova Reserva</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>

            {/* Action 2: Minhas Reservas scroll */}
            <button
              onClick={() => {
                const element = document.getElementById('recent_reservations_table');
                if (element) element.scrollIntoView({ behavior: 'smooth' });
              }}
              className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-850 font-sans font-bold text-xs text-left transition duration-150"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-sky-100/60 rounded-lg text-sky-700">
                  <Calendar className="w-4 h-4" />
                </div>
                <span>📅 Minhas Reservas</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>

            {/* Action 3: Financeiro scroll */}
            <button
              onClick={() => {
                const element = document.getElementById('financial_overview_section');
                if (element) element.scrollIntoView({ behavior: 'smooth' });
              }}
              className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-850 font-sans font-bold text-xs text-left transition duration-150"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100/60 rounded-lg text-amber-700">
                  <Receipt className="w-4 h-4" />
                </div>
                <span>💰 Financeiro Simplificado</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>

            {/* Action 4: Meu Perfil Docs */}
            <button
              onClick={() => setIsProfileModalOpen(true)}
              className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-850 font-sans font-bold text-xs text-left transition duration-150"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100/60 rounded-lg text-purple-700">
                  <User className="w-4 h-4" />
                </div>
                <span>👤 Meu Perfil & Documentos</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>

            {/* Action 5: Aplicativo */}
            <button
              onClick={() => setIsAppSimulatorOpen(true)}
              className="flex items-center justify-between p-3 rounded-xl border border-emerald-200 bg-emerald-50/40 hover:bg-emerald-50/95 text-emerald-950 font-sans font-bold text-xs text-left transition duration-155"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 rounded-lg text-emerald-800">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div className="leading-tight">
                  <span className="block font-black">📱 Abrir Aplicativo Móvel</span>
                  <span className="text-[10px] text-emerald-700 font-normal">Sincronizador Híbrido</span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-emerald-600" />
            </button>
          </div>
        </div>
      </section>

      {/* RECENT RESERVATIONS & FINANCIAL SPLIT ROW */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Table of Reservation Records */}
        <div id="recent_reservations_table" className="lg:col-span-8 bg-white border border-slate-200/60 rounded-3xl p-6 shadow-xs text-left">
          <div className="flex justify-between items-center pb-4 mb-4 border-b border-slate-100">
            <div>
              <h2 className="font-sans font-extrabold text-base text-slate-900">Reservas Recentes</h2>
              <p className="text-[11px] text-slate-400 mt-0.5">Visão unificada das solicitações do conselho profissional</p>
            </div>
            <span className="font-mono text-[11px] text-slate-500 bg-slate-50 border border-slate-200 px-3 py-1 rounded-full font-bold">
              {myBookings.length} agendamento(s)
            </span>
          </div>

          {myBookings.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs font-sans">
              Nenhuma reserva listada neste profissional.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse table-auto text-xs">
                <thead>
                  <tr className="border-b border-slate-150 text-slate-450 uppercase text-[10px] font-black tracking-wider">
                    <th className="py-3 px-2">Data</th>
                    <th className="py-3 px-2">Consultório / Sala</th>
                    <th className="py-3 px-2">Slots / Horários</th>
                    <th className="py-3 px-2 text-center">Status</th>
                    <th className="py-3 px-2 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-sans text-slate-700">
                  {myBookings.map((b) => {
                    const isPaid = paidBookingIds.includes(b.id) || b.status === 'Confirmado' && b.totalValue === 0;
                    const isCancelled = b.status === 'Cancelado';

                    return (
                      <tr key={b.id} className={`hover:bg-slate-50/50 transition-colors ${isCancelled ? 'opacity-55' : ''}`}>
                        {/* Date field */}
                        <td className="py-3.5 px-2 font-bold">{b.date}</td>
                        {/* Room Name */}
                        <td className="py-3.5 px-2 font-semibold text-slate-900">{b.roomName}</td>
                        {/* Timing hours slots */}
                        <td className="py-3.5 px-2 font-mono text-slate-500">{(b.timeSlots || []).join(', ')}</td>
                        {/* Status elements */}
                        <td className="py-3.5 px-2 text-center">
                          {isCancelled ? (
                            <span className="py-0.5 px-2 bg-rose-50 text-rose-600 rounded-md text-[9px] font-black uppercase border border-rose-100">
                              Cancelado
                            </span>
                          ) : isPaid ? (
                            <span className="py-0.5 px-2 bg-emerald-50 text-emerald-700 rounded-md text-[9px] font-black uppercase border border-emerald-250 inline-flex items-center gap-0.5">
                              Pago
                            </span>
                          ) : (
                            <span className="py-0.5 px-2 bg-amber-50 text-amber-700 rounded-md text-[9px] font-black uppercase border border-amber-200">
                              Pendente
                            </span>
                          )}
                        </td>
                        {/* Custom actions buttons */}
                        <td className="py-3.5 px-2 text-right space-x-1.5 flex justify-end items-center">
                          {!isCancelled && (
                            <>
                              {!isPaid && (
                                <button
                                  type="button"
                                  onClick={() => setSelectedBookingForPayment(b)}
                                  className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-sans font-extrabold rounded-lg text-[10px] whitespace-nowrap"
                                >
                                  Pagar
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => setIsAccessDetailsOpen(b)}
                                className="px-2 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-sans font-bold rounded-lg text-[10px]"
                                title="Visualizar chave eletrônica"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              {cancellingBookingId === b.id ? (
                                <div className="inline-flex items-center gap-1 bg-red-50 border border-red-200 p-1 rounded-lg animate-fade-in">
                                  <span className="text-[8px] text-red-700 font-bold select-none whitespace-nowrap">Cancelar?</span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      onCancelBooking(b.id);
                                      setCancellingBookingId(null);
                                    }}
                                    className="px-1.5 py-0.5 bg-red-600 hover:bg-red-700 text-white font-sans font-bold text-[8px] rounded cursor-pointer transition-all"
                                  >
                                    Sim
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setCancellingBookingId(null)}
                                    className="px-1.5 py-0.5 bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 font-sans font-bold text-[8px] rounded cursor-pointer transition-all"
                                  >
                                    Não
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setCancellingBookingId(b.id)}
                                  className="px-2 py-1.5 border border-slate-200 text-rose-600 hover:bg-rose-50 rounded-lg text-[10px]"
                                  title="Cancelar reserva avulsa"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </>
                          )}
                          {isCancelled && (
                            <span className="text-[10px] italic text-slate-400">Nenhuma ação</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Financial Simplificado Overview Box (Pains Removed) */}
        <div id="financial_overview_section" className="lg:col-span-4 bg-white border border-slate-200/60 rounded-3xl p-6 shadow-xs text-left space-y-5">
          <div className="pb-3 border-b border-slate-100">
            <h2 className="font-sans font-extrabold text-base text-slate-900">Financeiro Portaria</h2>
            <p className="text-[11px] text-slate-400 mt-0.5">Gestão simplificada de pagamentos e reembolsos</p>
          </div>

          {/* Outstanding metrics display values */}
          <div className="space-y-4">
            <div className="p-4 bg-amber-50/50 border border-amber-250/30 rounded-2xl">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Saldo Pendente de Sublocações</span>
              <h4 className="text-xl font-sans font-black text-amber-800 mt-1">
                R$ {(pendingPaymentsVal ?? 0).toFixed(2).replace('.', ',')}
              </h4>
            </div>

            {/* Wallet Details Block */}
            <div className="space-y-3 pt-2">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Cartão de Crédito Ativo</span>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex justify-between items-center text-xs">
                <div>
                  <p className="font-extrabold text-slate-800 leading-none">{registeredCard.brand}</p>
                  <p className="font-mono text-[10px] text-slate-500 mt-1">{registeredCard.num}</p>
                </div>
                <button 
                  onClick={() => setIsCardUpdateOpen(true)}
                  className="px-2 py-1 border hover:bg-slate-100 text-slate-600 rounded font-bold text-[10px]"
                >
                  Alterar
                </button>
              </div>

              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Chave Pix Cadastrada</span>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex justify-between items-center text-xs">
                <div>
                  <p className="font-extrabold text-slate-800 leading-none">PIX E-mail</p>
                  <p className="text-[10px] text-slate-500 mt-1 truncate max-w-[170px]" title={activeUser.email}>
                    {activeUser.email}
                  </p>
                </div>
                <button
                  type="button" 
                  onClick={() => alert(`Chave Pix sincronizada com seu E-mail principal de cadastro.`)}
                  className="px-2 py-1 border hover:bg-slate-100 text-slate-600 rounded-none rounded-md font-bold text-[10px]"
                >
                  Sincronizado
                </button>
              </div>
            </div>

            {/* Paid receipts micro-history */}
            <div className="pt-2">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-2">Últimos Pagamentos</span>
              {activeBookings.filter(b => paidBookingIds.includes(b.id)).length === 0 ? (
                <p className="text-[10px] italic text-slate-400">Nenhum pagamento liquidado nesta sessão.</p>
              ) : (
                <div className="space-y-1.5">
                  {activeBookings.filter(b => paidBookingIds.includes(b.id)).slice(0, 3).map(b => (
                    <div key={b.id} className="p-2 border-b border-slate-100 flex justify-between items-center text-[11px]">
                      <div>
                        <p className="font-bold text-slate-800 truncate max-w-[130px]" title={b.roomName}>{b.roomName}</p>
                        <span className="text-[10px] text-slate-400">{b.date}</span>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-slate-900 leading-none">R$ {(b.totalValue ?? 0).toFixed(2).replace('.', ',')}</p>
                        <span className="text-[8px] uppercase font-bold text-emerald-600 inline-block mt-0.5">Aprovado</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>

      </section>

      {/* MODAL 1: MEU PERFIL & DOCUMENTOS UPDATE */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden border border-slate-200 shadow-2xl relative animate-scale-up text-left">
            <div className="bg-slate-900 text-white p-6 justify-between flex items-center">
              <div>
                <h3 className="font-sans font-extrabold text-lg">Meu Perfil Clínico</h3>
                <p className="text-xs text-slate-400">Sincronize sua documentação profissional e fotos</p>
              </div>
              <button 
                onClick={() => setIsProfileModalOpen(false)}
                className="text-white hover:opacity-80 p-2 rounded-xl bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-500 block">Nome Completo</label>
                <input 
                  type="text" 
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-slate-900 outline-none text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-500 block">Conselho (CRM/CRP)</label>
                  <input 
                    type="text" 
                    required
                    value={editRegisterNumber}
                    onChange={(e) => setEditRegisterNumber(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-slate-900 outline-none text-slate-800"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-500 block">WhatsApp de Contato</label>
                  <input 
                    type="text" 
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-slate-900 outline-none text-slate-800"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-500 block">E-mail Cadastrado</label>
                <input 
                  type="email" 
                  required
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 text-slate-500 outline-none cursor-not-allowed"
                  disabled
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-500 block">URL da Foto de Perfil</label>
                <input 
                  type="text" 
                  value={editPhotoUrl}
                  onChange={(e) => setEditPhotoUrl(e.target.value)}
                  placeholder="Selecione ou cole uma URL de imagem..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-slate-900 outline-none text-slate-800"
                />
              </div>

              {/* simulated document management */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <span className="text-[10px] font-bold uppercase text-slate-500 block">Upload de Documento Profissional (Atualizar Doc)</span>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-[11px] text-slate-700 flex items-center gap-1.5 font-medium">
                    <FileText className="w-4 h-4 text-slate-400" />
                    crm_signature_validate.pdf
                  </span>
                  <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-100">
                    Sincronizado
                  </span>
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <input 
                    type="file" 
                    id="doc_update" 
                    className="hidden" 
                    onChange={() => alert('Documento enviado! Em instantes a equipe sublocaHope analisará e atualizará seu Status.')}
                  />
                  <label 
                    htmlFor="doc_update"
                    className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 transition rounded text-[10px] font-bold cursor-pointer"
                  >
                    Fazer Upload de Nova Carteira Profissional / PDF
                  </label>
                </div>
              </div>

              {/* Sandbox controls: allow altering approvalStatus instantly for UI testing */}
              <div className="p-3 bg-purple-50/60 border border-purple-200 rounded-xl space-y-1.5">
                <span className="text-[9px] font-black uppercase text-purple-700 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  Ambiente de Simulação: Alterar Status cadastral
                </span>
                <select 
                  value={editApprovalStatus}
                  onChange={(e) => setEditApprovalStatus(e.target.value as 'Pendente' | 'Aprovado' | 'Rejeitado')}
                  className="w-full px-3 py-1.5 border border-purple-200 rounded bg-white text-xs font-bold text-purple-950 outline-none"
                >
                  <option value="Aprovado">Aprovado (Cadastro ativo)</option>
                  <option value="Pendente">Pendente (Em análise)</option>
                  <option value="Rejeitado">Rejeitado (Ajustes necessários)</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2.5">
                <button 
                  type="button" 
                  onClick={() => setIsProfileModalOpen(false)}
                  className="px-4 py-2 hover:bg-slate-100 rounded-xl text-xs font-bold"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold"
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: DETAIL RETRIEVEMENT & SMART ENTRY TOKEN ACCESSIBILITY */}
      {isAccessDetailsOpen && (
        <div className="fixed inset-0 bg-black/55 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden border border-slate-200 shadow-2xl relative animate-scale-up text-left">
            <div className="bg-slate-950 text-white p-6 relative">
              <button 
                onClick={() => setIsAccessDetailsOpen(null)}
                className="absolute top-4 right-4 text-white hover:opacity-85 text-xl font-bold cursor-pointer bg-slate-800 p-1.5 rounded-lg"
              >
                &times;
              </button>
              <h3 className="font-sans font-extrabold text-base">Token Eletrônico de Acesso</h3>
              <p className="text-[10px] text-slate-400">sublocaHope • Abertura automática de consultórios</p>
            </div>

            <div className="p-6 text-center space-y-6">
              <div className="space-y-1">
                <span className="text-[11px] text-slate-400 uppercase tracking-widest font-extrabold">Consultório Solicitado</span>
                <h4 className="font-sans font-black text-xl text-slate-900 leading-none">{isAccessDetailsOpen.roomName}</h4>
                <p className="text-xs text-slate-500 mt-1">{isAccessDetailsOpen.date}</p>
              </div>

              {/* Realistic QR Token display */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl max-w-[220px] mx-auto flex flex-col items-center">
                <div className="w-40 h-40 bg-white p-3 rounded-xl border border-slate-200 flex justify-center items-center shadow-inner">
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=HOPE-TOKEN-REG-${isAccessDetailsOpen.id}-${activeUser.registerNumber}`}
                    alt="Access Entry Token"
                    className="w-36 h-36"
                  />
                </div>
                <span className="text-[9px] text-emerald-700 font-extrabold bg-emerald-50 border border-emerald-100 rounded-full px-3 py-1 font-mono uppercase mt-3">
                  Check-in Liberado
                </span>
              </div>

              <div className="space-y-3.5 text-xs text-left max-w-sm mx-auto font-sans leading-relaxed border-t border-slate-100 pt-4">
                <div className="flex gap-2">
                  <MapPin className="w-5 h-5 text-slate-450 flex-shrink-0" />
                  <div>
                    <span className="font-bold text-slate-800 block">Endereço da Unidade:</span>
                    <span className="text-[11px] text-slate-500">
                      {rooms.find(r => r.name === isAccessDetailsOpen.roomName)?.location || 'Edifício Prime Offices, Palhoça/SC'}
                    </span>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <ShieldCheck className="w-5 h-5 text-slate-450 flex-shrink-0" />
                  <div>
                    <span className="font-bold text-slate-800 block">Instruções de acesso a sala:</span>
                    <span className="text-[11px] text-slate-500">Apresente este QR Code no scanner da portaria ou use o Bluetooth do celular nas portas eletrônicas das salas.</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setIsAccessDetailsOpen(null)}
                className="w-full py-3 bg-slate-100 hover:bg-slate-200 hover:text-slate-900 text-slate-700 font-bold rounded-xl text-xs transition transition-all cursor-pointer"
              >
                Fechar Detalhes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: IN LINE EXPANDED MOBILE APP SIMULATOR OVERLAY */}
      {isAppSimulatorOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in overflow-y-auto">
          <div className="bg-slate-50 rounded-[2.5rem] max-w-4xl w-full p-4 md:p-8 relative border border-slate-200 shadow-2xl my-8">
            <button 
              onClick={() => setIsAppSimulatorOpen(false)}
              className="absolute top-6 right-6 text-slate-700 hover:text-slate-900 bg-white shadow-2xs border border-slate-200 h-10 w-10 flex items-center justify-center rounded-full text-base font-extrabold cursor-pointer z-50"
            >
              &times;
            </button>
            
            <AppSimulatorView
              bookings={bookings}
              rooms={rooms}
              registeredUsers={[activeUser]}
              setView={setView}
              initialSelectedUser={activeUser}
              onClose={() => setIsAppSimulatorOpen(false)}
            />
          </div>
        </div>
      )}

      {/* MODAL 4: SIMULATED CREDIT CARD UPDATE */}
      {isCardUpdateOpen && (
        <div className="fixed inset-0 bg-black/55 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full overflow-hidden border border-slate-200 shadow-2xl relative animate-scale-up text-left">
            <div className="bg-slate-900 text-white p-5 justify-between flex items-center">
              <div>
                <h3 className="font-sans font-extrabold text-sm">Atualizar Cartão de Crédito</h3>
                <p className="text-[10px] text-slate-450 leading-none mt-1">Nenhum dado é salvo externamente</p>
              </div>
              <button 
                onClick={() => setIsCardUpdateOpen(false)}
                className="text-white hover:opacity-80 p-1.5 bg-slate-800 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCard} className="p-5 space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-[9px] uppercase font-bold text-slate-500 block">Número do Cartão</label>
                <input 
                  type="text" 
                  required
                  placeholder="4578 •••• •••• ••••"
                  maxLength={19}
                  value={simulatedCardNum}
                  onChange={(e) => {
                    let formatted = e.target.value.replace(/\D/g, '');
                    formatted = formatted.match(/.{1,4}/g)?.join(' ') || formatted;
                    setSimulatedCardNum(formatted.slice(0, 19));
                  }}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 outline-none text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-bold text-slate-500 block">Validade</label>
                  <input 
                    type="text" 
                    required
                    placeholder="MM/AA"
                    maxLength={5}
                    value={simulatedCardExpiry}
                    onChange={(e) => {
                      let formatted = e.target.value.replace(/\D/g, '');
                      if (formatted.length > 2) {
                        formatted = `${formatted.slice(0, 2)}/${formatted.slice(2, 4)}`;
                      }
                      setSimulatedCardExpiry(formatted.slice(0, 5));
                    }}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 outline-none text-center"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-bold text-slate-500 block">Código CVV</label>
                  <input 
                    type="password" 
                    required
                    placeholder="•••"
                    maxLength={3}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 outline-none text-center"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] uppercase font-bold text-slate-500 block">Nome Impresso</label>
                <input 
                  type="text" 
                  required
                  value={simulatedCardName}
                  onChange={(e) => setSimulatedCardName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 outline-none uppercase"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 text-[10px] font-bold">
                <button 
                  type="button" 
                  onClick={() => setIsCardUpdateOpen(false)}
                  className="px-3 py-1.5 hover:bg-slate-100 rounded text-slate-700"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-1.5 bg-slate-900 text-white rounded hover:bg-slate-800"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MERCADO PAGO SIMULATED GATEWAY CHECKOUT DIALOG */}
      {selectedBookingForPayment && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden border border-slate-200 shadow-2xl relative animate-scale-up text-left">
            
            {/* Header Dialog */}
            <div className="bg-[#009ee3] text-white p-6 relative">
              <button 
                onClick={() => setSelectedBookingForPayment(null)}
                className="absolute top-4 right-4 text-white hover:opacity-85 text-xl font-bold cursor-pointer"
              >
                &times;
              </button>
              <div className="flex items-center gap-3">
                <div className="bg-white/15 p-2 rounded-xl">
                  <CreditCard className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-sans font-extrabold text-base">Mercado Pago Gateway</h3>
                  <p className="text-[10px] text-white/90">Sessão protegida de sublocação clínica</p>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="p-6 space-y-6">
              
              {/* Payment Info Resume Banner */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex justify-between items-center text-xs">
                <div>
                  <span className="text-[9px] uppercase font-bold text-slate-400 block font-mono">Consultório Ativo</span>
                  <span className="text-slate-800 font-extrabold text-sm block mt-0.5">{selectedBookingForPayment.roomName}</span>
                  <span className="text-slate-500 block mt-0.5">{selectedBookingForPayment.date}</span>
                </div>
                <div className="text-right">
                  <span className="text-[9px] uppercase font-bold text-slate-400 block font-mono">Valor Líquido</span>
                  <span className="text-[#009ee3] font-sans font-black text-base block mt-0.5">
                    R$ {(selectedBookingForPayment?.totalValue ?? 0).toFixed(2).replace('.', ',')}
                  </span>
                </div>
              </div>

              {/* Selector Mode Tabs */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('credit_card')}
                  className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                    paymentMethod === 'credit_card' ? 'bg-white text-slate-900 shadow-sm font-bold' : 'text-slate-500'
                  }`}
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Cartão de Crédito</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('pix')}
                  className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                    paymentMethod === 'pix' ? 'bg-white text-slate-900 shadow-sm font-bold' : 'text-slate-500'
                  }`}
                >
                  <QrCode className="w-4 h-4" />
                  <span>Chave PIX</span>
                </button>
              </div>

              {/* PAYMENT METHOD FLOW 1: CREDIT CARD */}
              {paymentMethod === 'credit_card' ? (
                <form onSubmit={handleSimulatePayment} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-500 block">Número do Cartão de Crédito</label>
                    <input
                      type="text"
                      required
                      placeholder="4578 •••• •••• ••••"
                      maxLength={19}
                      value={simulatedCardNum}
                      onChange={(e) => {
                        let formattedValue = e.target.value.replace(/\D/g, '');
                        formattedValue = formattedValue.match(/.{1,4}/g)?.join(' ') || formattedValue;
                        setSimulatedCardNum(formattedValue.slice(0, 19));
                      }}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-250 bg-white text-slate-800 text-xs focus:ring-2 focus:ring-[#009ee3] outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-slate-500 block">Validade</label>
                      <input
                        type="text"
                        required
                        placeholder="MM/AA"
                        maxLength={5}
                        value={simulatedCardExpiry}
                        onChange={(e) => {
                          let formattedValue = e.target.value.replace(/\D/g, '');
                          if (formattedValue.length > 2) {
                            formattedValue = `${formattedValue.slice(0,2)}/${formattedValue.slice(2,4)}`;
                          }
                          setSimulatedCardExpiry(formattedValue.slice(0, 5));
                        }}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-250 bg-white text-slate-800 text-xs focus:ring-2 focus:ring-[#009ee3] outline-none text-center"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-slate-500 block">Código CVV</label>
                      <input
                        type="password"
                        required
                        placeholder="•••"
                        maxLength={3}
                        value={simulatedCardCvv}
                        onChange={(e) => setSimulatedCardCvv(e.target.value.replace(/\D/g, '').slice(0, 3))}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-250 bg-white text-slate-800 text-xs focus:ring-2 focus:ring-[#009ee3] outline-none text-center"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-500 block">Nome Impresso no Cartão</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Dr. Roberto Silva"
                      value={simulatedCardName}
                      onChange={(e) => setSimulatedCardName(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-250 bg-white text-slate-800 text-xs focus:ring-2 focus:ring-[#009ee3] outline-none uppercase"
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isProcessingPayment}
                      className="w-full bg-[#009ee3] hover:bg-[#008bd0] disabled:opacity-50 text-white font-sans font-bold text-xs py-3.5 rounded-xl shadow-md cursor-pointer transition-all flex items-center justify-center gap-2"
                    >
                      {isProcessingPayment ? (
                        <>
                          <Clock className="w-4 h-4 animate-spin" />
                          <span>Processando pelo Mercado Pago...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          <span>Pagar R$ {(selectedBookingForPayment?.totalValue ?? 0).toFixed(2).replace('.', ',')}</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              ) : (
                /* PAYMENT METHOD FLOW 2: PIX QR CODE */
                <div className="text-center space-y-5 animate-fade-in">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col items-center max-w-[240px] mx-auto space-y-3">
                    <div className="w-40 h-40 bg-white p-2.5 border border-slate-200 rounded-xl relative shadow-inner flex items-center justify-center">
                      <div className="bg-slate-50 flex flex-col justify-center items-center w-full h-full rounded border border-dashed border-slate-300">
                        <QrCode className="w-24 h-24 text-slate-800" />
                        <span className="text-[8px] bg-[#009ee3] text-white px-1.5 py-0.5 rounded uppercase mt-1 font-mono font-bold">PIX Mercado Pago</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h5 className="font-extrabold text-[11px] text-slate-800 font-sans leading-none">Copiar Código EMV Pixel</h5>
                    
                    <div className="flex gap-2 items-center max-w-sm mx-auto">
                      <input
                        type="text"
                        readOnly
                        value={`00020101021226830014br.gov.bcb.pix2561api.mercadopago.com/v1/payments/sublocahope-${selectedBookingForPayment.id}`}
                        className="flex-1 px-3 py-2 text-[10px] font-mono rounded-lg border border-slate-200 bg-slate-50 text-slate-500 outline-none truncate"
                      />
                      <button
                        type="button"
                        onClick={handleCopyPix}
                        className={`px-3 py-2 text-xs font-bold rounded-lg cursor-pointer transition-all flex-shrink-0 ${
                          copiedPix ? 'bg-emerald-600 text-white' : 'bg-slate-900 text-white hover:bg-slate-800'
                        }`}
                      >
                        {copiedPix ? 'Copiado!' : 'Copiar'}
                      </button>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => triggerPaymentSuccess(selectedBookingForPayment.id)}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-sans font-bold text-xs py-3 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>Confirmar Liquidação PIX</span>
                    </button>
                  </div>
                </div>
              )}

            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 text-center text-[10px] text-slate-550 flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Conexão Segura SSL 256-bit • Gateway Mercado Pago Clínico</span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
