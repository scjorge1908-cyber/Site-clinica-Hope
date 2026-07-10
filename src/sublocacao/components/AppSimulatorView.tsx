import React, { useState, useEffect } from 'react';
import { 
  Smartphone, Apple, Play, Download, QrCode, Clipboard, CheckCircle2, 
  Clock, MapPin, Calendar, LogIn, LogOut, ArrowRight, ShieldCheck, 
  Wifi, Battery, ShieldAlert, Sparkles, Building, ChevronLeft, PlusCircle, User
} from 'lucide-react';
import { Booking, Room, ProfessionalProfile } from '../types';

interface AppSimulatorProps {
  bookings: Booking[];
  rooms: Room[];
  registeredUsers: ProfessionalProfile[];
  setView: (view: string) => void;
  initialSelectedUser?: ProfessionalProfile | null;
  onClose?: () => void;
}

export default function AppSimulatorView({
  bookings,
  rooms,
  registeredUsers,
  setView,
  initialSelectedUser = null,
  onClose
}: AppSimulatorProps) {
  // Mobile frame simulator settings
  const [platform, setPlatform] = useState<'ios' | 'android'>('android');
  const [selectedUser, setSelectedUser] = useState<ProfessionalProfile | null>(() => {
    return initialSelectedUser || (registeredUsers.length > 0 ? registeredUsers[0] : null);
  });
  
  // App internal state
  const [isLoggedIn, setIsLoggedIn] = useState(!!selectedUser);
  const [loginEmail, setLoginEmail] = useState(selectedUser?.email || '');
  const [errorMessage, setErrorMessage] = useState('');
  
  // Internal tab within simulated phone views: 'agenda', 'reserve', 'profile'
  const [activeTab, setActiveTab] = useState<'agenda' | 'reserve' | 'profile'>('agenda');
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [downloadedFileName, setDownloadedFileName] = useState('');

  // Auto-login or update when prop changes
  useEffect(() => {
    if (initialSelectedUser) {
      setSelectedUser(initialSelectedUser);
      setLoginEmail(initialSelectedUser.email);
      setIsLoggedIn(true);
    }
  }, [initialSelectedUser]);

  // Synchronize selection back to credentials Form
  const handleUserSelect = (user: ProfessionalProfile) => {
    setSelectedUser(user);
    setLoginEmail(user.email);
    setIsLoggedIn(true);
    setErrorMessage('');
  };

  // Login handler inside phone screen
  const handlePhoneLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const found = registeredUsers.find(
      u => u.email.toLowerCase().trim() === loginEmail.toLowerCase().trim()
    );
    if (found) {
      setSelectedUser(found);
      setIsLoggedIn(true);
      setErrorMessage('');
    } else {
      setErrorMessage('E-mail não cadastrado na plataforma!');
    }
  };

  const handlePhoneLogout = () => {
    setIsLoggedIn(false);
    setSelectedUser(null);
  };

  // Filter bookings belonging to this professional: Only show scheduled and active!
  // "o app precisa no campo agenda so aparecer o que foi agendado e esta ativo horarios exluidos deve sair da agenda"
  // Confirmed bookings belong to selectedUser
  const myActiveBookings = selectedUser 
    ? bookings.filter(b => {
        const isOwner = b.professionalName === selectedUser.name || b.professionalId === selectedUser.registerNumber;
        const isActive = b.status === 'Confirmado'; // Only active bookings
        return isOwner && isActive;
      })
    : [];

  // If logged in and has NO active bookings, "o mesmo deve ser direcioando para outra tela de reserve sua sala"
  // We monitor if logged in and active table is agenda, and myActiveBookings is empty, we force redirect inside phone to 'reserve'
  useEffect(() => {
    if (isLoggedIn && activeTab === 'agenda' && myActiveBookings.length === 0) {
      setActiveTab('reserve');
    }
  }, [isLoggedIn, myActiveBookings.length, activeTab]);

  // Simulated binary triggers to download APK/MobileConfig files dynamically for saving
  const triggerApkDownload = () => {
    const filename = platform === 'android' ? 'sublocahope_android_v2.0.apk' : 'sublocahope_ios_v2.0.mobileconfig';
    const fakeContent = platform === 'android' 
      ? 'sublocaHope Android App Native SDK 11 Build Manifest. Android Target: API 34. Release Executable Stable.'
      : 'sublocaHope iOS App Manifest. Target Version: 17.4. PWA Installation Policy Provision.';
    
    const blob = new Blob([fakeContent], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setDownloadedFileName(filename);
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 4000);
  };

  // Direct installation configuration url for sharing
  const getShareLink = () => {
    const userParam = selectedUser ? `?email=${encodeURIComponent(selectedUser.email)}` : '';
    // Current application Development environment address
    const baseUrl = window.location.origin;
    return `${baseUrl}/${userParam}`;
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(getShareLink());
    alert('Link de instalação rápida copiado para a área de transferência!');
  };

  return (
    <div className="bg-slate-50 border border-outline-alt/40 rounded-[2.5rem] p-6 lg:p-10 shadow-2xl relative overflow-hidden animate-fade-in text-slate-800">
      
      {/* Background ambient accents */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-secondary/5 rounded-full blur-3xl -translate-y-12"></div>
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-primary/5 rounded-full blur-3xl translate-y-12"></div>

      {showToast(downloadSuccess, downloadedFileName)}

      {/* Top Header Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-200 pb-6 mb-8 relative z-10">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-secondary/15 text-secondary font-sans font-black text-[10px] rounded-full uppercase tracking-wider px-3 py-1">
              PRODUTIVIDADE EXCLUSIVA
            </span>
            <span className="bg-green-100 text-green-700 font-sans font-bold text-[10px] rounded-full px-2 py-0.5 animate-pulse">
              Android & iOS Híbrido
            </span>
          </div>
          <h2 className="font-sans font-extrabold text-[#111c2c] text-2xl lg:text-3xl mt-1 tracking-tight">
            Aplicativo Móvel sublocaHope
          </h2>
          <p className="text-xs text-brand-variant mt-1.5 max-w-xl">
            Painel móvel exclusivo para profissionais de saúde agendados. Monitore horários ativos, faça check-ins na portaria via QR Code e reserve novas salas com zero fricção.
          </p>
        </div>

        {onClose && (
          <button 
            type="button" 
            onClick={onClose}
            className="px-4 py-2 border hover:bg-slate-100 rounded-xl text-xs font-bold transition-all self-end md:self-center"
          >
            Voltar ao Painel Geral
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 lg:gap-11 items-start relative z-10">
        
        {/* COLUMN 1: LEFT SIDE PANEL - INSTRUCTIONS & QR CODE & EXECUTABLE LINKS */}
        <div className="xl:col-span-5 space-y-6">
          {/* Card: Select profile to simulate / Vinculo Ativo confirmation */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-[#111c2c] flex items-center gap-2">
              <ShieldCheck className="w-4.5 h-4.5 text-green-600" />
              <span>Sincronização Ativa</span>
            </h3>
            <p className="text-xs text-brand-variant">
              Seu dispositivo móvel está vinculado e pré-configurado diretamente com a sua credencial clínica de acesso:
            </p>

            <div className="p-4 rounded-xl border border-green-200 bg-green-550/10 flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 bg-slate-100 border border-green-200">
                <img 
                  src={selectedUser?.profilePhoto?.previewUrl || "https://images.unsplash.com/photo-1559839734-2b71ea197ec2"} 
                  alt={selectedUser?.name} 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="min-w-0 flex-grow">
                <p className="text-xs font-bold text-primary leading-tight">{selectedUser?.name}</p>
                <p className="text-[10px] text-brand-variant mt-0.5">{selectedUser?.registerNumber}</p>
                <span className="inline-flex items-center gap-1 text-[9px] font-bold text-green-700 bg-green-100 rounded-full px-2 py-0.5 mt-1.5 border border-green-200">
                  <span className="w-1 h-1 bg-green-500 rounded-full animate-pulse"></span>
                  Conexão de Acesso Ativa
                </span>
              </div>
            </div>
          </div>

          {/* Card: Live QR Code & Quick Download executable Links */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
            <h3 className="font-bold text-sm text-[#111c2c] flex items-center gap-2">
              <QrCode className="w-4.5 h-4.5 text-secondary" />
              <span>2. QR Code & Links Executáveis</span>
            </h3>
            
            <p className="text-xs text-brand-variant leading-relaxed">
              Escaneie o QR Code abaixo com a câmera do seu celular para carregar o aplicativo móvel integrado com a autenticação de <strong>{selectedUser?.name || 'Profissional'}</strong>:
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-5 p-4 bg-slate-50 rounded-2xl border border-slate-100">
              {/* Dynamic QR Code generator pointing to PWA simulate view */}
              <div className="w-32 h-32 bg-white p-2 border border-slate-200 rounded-xl relative shadow-sm flex items-center justify-center flex-shrink-0">
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(getShareLink())}`}
                  alt="QR Code do App Corporativo"
                  className="w-[110px] h-[110px]"
                />
              </div>

              <div className="space-y-3 font-sans text-xs flex-grow w-full">
                <div className="space-y-1 text-left">
                  <span className="text-[10px] uppercase font-bold text-brand-variant block">Link de Instalação Automática:</span>
                  <div className="flex items-center gap-1">
                    <input 
                      type="text" 
                      readOnly 
                      value={getShareLink()} 
                      className="flex-1 bg-white border border-slate-200 rounded-lg p-1.5 font-mono text-[9px] text-[#5c5f62] select-all truncate"
                    />
                    <button 
                      onClick={handleCopyLink}
                      className="p-1.5 hover:bg-slate-200 rounded text-[#1c1d1f] hover:text-secondary flex-shrink-0"
                      title="Copiar Link"
                    >
                      <Clipboard className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5 text-left">
                  <span className="text-[10px] uppercase font-extrabold text-brand-variant block">Instalar via WhatsApp 📲</span>
                  <button
                    type="button"
                    onClick={() => {
                      let whatsappNumber = selectedUser?.phone ? selectedUser.phone.replace(/\D/g, '') : '';
                      if (whatsappNumber && whatsappNumber.length >= 10 && whatsappNumber.length <= 11 && !whatsappNumber.startsWith('55')) {
                        whatsappNumber = '55' + whatsappNumber;
                      }
                      if (!whatsappNumber) {
                        alert("Por favor, preencha ou confirme o campo de telefone no seu cadastro para receber o aplicativo via WhatsApp!");
                        return;
                      }
                      const text = `Olá, Dr(a). ${selectedUser?.name}! Aqui está o seu link de acesso exclusivo para instalar e usar o Aplicativo Clínico sublocaHope no seu celular:\n\n${getShareLink()}\n\nAcesse este link no seu celular para sincronizar e salvar o ícone na sua tela inicial! 📲`;
                      const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(text)}`;
                      window.open(whatsappUrl, '_blank');
                    }}
                    className="w-full py-2.5 bg-green-600 hover:bg-green-550 text-white font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm text-xs"
                  >
                    <Smartphone className="w-4 h-4" />
                    <span>Enviar Link para Meu WhatsApp</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Direct downloadable executables block */}
            <div className="bg-slate-900 text-white rounded-xl p-5 border border-slate-800 space-y-4">
              <div>
                <span className="text-[9px] text-yellow-400 font-extrabold uppercase tracking-wider block">Downloads Executáveis (Android & iOS)</span>
                <p className="text-xs text-slate-350 leading-relaxed mt-0.5">
                  Baixe e salve os pacotes offline empacotados para distribuição empresarial direta nas lojas:
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setPlatform('android');
                    setTimeout(triggerApkDownload, 100);
                  }}
                  className="bg-slate-800 hover:bg-slate-750 border border-slate-700/60 p-3 rounded-lg text-left flex items-start gap-2.5 transition-all text-xs"
                >
                  <Smartphone className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block text-white leading-none">Android APK</span>
                    <span className="text-[9px] text-slate-400 block mt-1">v2.0 • 12MB</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setPlatform('ios');
                    setTimeout(triggerApkDownload, 100);
                  }}
                  className="bg-slate-800 hover:bg-slate-750 border border-slate-700/60 p-3 rounded-lg text-left flex items-start gap-2.5 transition-all text-xs"
                >
                  <Apple className="w-5 h-5 text-sky-300 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block text-white leading-none">iOS Config</span>
                    <span className="text-[9px] text-slate-400 block mt-1">v2.0 • 4MB</span>
                  </div>
                </button>
              </div>

              <p className="text-[10px] text-slate-400 leading-snug text-center">
                🛡️ Desenvolvido em React Native Expo com assinatura eletrônica clínica.
              </p>
            </div>

          </div>

        </div>

        {/* COLUMN 2: RIGHT SIDE - EXPANDED SMARTPHONE SIMULATOR CANVAS */}
        <div className="xl:col-span-7 flex flex-col items-center">
          
          {/* Smartphone Hardware Simulator Shell Wrapper */}
          <div className="relative bg-[#1c1d1f] rounded-[3.5rem] p-4 pt-10 pb-5 shadow-2xl border-4 border-slate-800 max-w-sm sm:max-w-md w-full ring-12 ring-slate-900/60 transition-transform">
            
            {/* Top Speaker Earphone and Ambient Sensors Area */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 w-32 h-6 bg-black rounded-2xl flex items-center justify-between px-4 z-30">
              <div className="w-2.5 h-2.5 rounded-full bg-slate-900 border border-slate-800 flex-shrink-0"></div> {/* Camera node */}
              <div className="w-12 h-1 bg-neutral-900 rounded-full flex-shrink-0"></div> {/* Speaker */}
              <div className="w-1.5 h-1.5 bg-sky-950 rounded-full flex-shrink-0"></div> {/* Light sensor */}
            </div>

            {/* Platform Selection Switcher Above Phone Container */}
            <div className="flex gap-2 justify-center pb-4 border-b border-neutral-800 mb-4 text-xs">
              <button 
                type="button"
                onClick={() => setPlatform('ios')}
                className={`py-1.5 px-3.5 rounded-full flex items-center gap-1.5 transition-all font-bold ${
                  platform === 'ios' ? 'bg-white text-black' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Apple className="w-4 h-4" />
                <span>Simular iOS</span>
              </button>
              <button 
                type="button"
                onClick={() => setPlatform('android')}
                className={`py-1.5 px-3.5 rounded-full flex items-center gap-1.5 transition-all font-bold ${
                  platform === 'android' ? 'bg-white text-black' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Smartphone className="w-4 h-4" />
                <span>Simular Android</span>
              </button>
            </div>

            {/* MAIN MOBILE SCREEN IFRAME / DIGITAL CONTEXT CANVAS */}
            <div className="bg-brand-bg rounded-[2.5rem] overflow-hidden aspect-[9/19] h-[640px] flex flex-col justify-between relative shadow-inner select-none font-sans border border-neutral-800 w-full">
              
              {/* Top Smartphone Software Bar Grid */}
              <div className="bg-slate-900 text-white px-6 py-2.5 flex justify-between items-center text-[11px] font-sans font-bold z-20 relative select-none">
                <span className="font-sans">10:52</span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase font-black">{platform === 'ios' ? '5G' : '4G LTE'}</span>
                  <Wifi className="w-3.5 h-3.5" />
                  <Battery className="w-4 h-4 text-green-400 fill-green-400" />
                </div>
              </div>

              {/* PHONE VIEWPORT CONTENT SECTION */}
              <div className="flex-grow flex flex-col justify-between overflow-y-auto bg-[#fafafa]">
                
                {/* 1. STATE B: APP NOT LOGGED IN SCREEN */}
                {!isLoggedIn ? (
                  <div className="flex-grow flex flex-col justify-between p-6 bg-gradient-to-b from-white to-slate-50 animate-fade-in">
                    
                    {/* Header Splash Brand */}
                    <div className="text-center pt-8 space-y-3">
                      <div className="w-14 h-14 bg-secondary text-white rounded-2xl flex items-center justify-center mx-auto shadow-md shadow-secondary/20">
                        <Calendar className="w-8 h-8" />
                      </div>
                      <div>
                        <h4 className="font-black text-xl text-primary tracking-tight leading-none">Subloca<span className="text-secondary">Hope</span></h4>
                        <span className="text-[9px] uppercase tracking-wider font-extrabold text-brand-variant">Consultórios Médicos Mobiles</span>
                      </div>
                    </div>

                    {/* Simple Custom Login Box App */}
                    <form onSubmit={handlePhoneLogin} className="space-y-4 py-6 text-left">
                      <div className="text-center mb-2">
                        <p className="text-xs font-semibold text-slate-800 leading-normal">
                          Faça login para vincular seu celular à plataforma do condomínio:
                        </p>
                      </div>

                      {errorMessage && (
                        <p className="text-[10px] bg-red-50 text-red-700 p-2 rounded-lg font-bold border border-red-100 flex items-center gap-1">
                          <ShieldAlert className="w-4 h-4 flex-shrink-0" />
                          <span>{errorMessage}</span>
                        </p>
                      )}

                      <div className="space-y-1.5">
                        <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">E-mail Cadastrado</label>
                        <input 
                          type="email" 
                          required 
                          placeholder="Ex: roberto@hope.com.br"
                          value={loginEmail}
                          onChange={(e) => setLoginEmail(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs outline-none focus:ring-2 focus:ring-secondary text-slate-800"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full bg-secondary hover:bg-secondary/95 text-white py-3 rounded-xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
                      >
                        <LogIn className="w-4 h-4" />
                        <span>Entrar no Aplicativo</span>
                      </button>
                    </form>

                    {/* Pre-fill quick trigger inside mock client */}
                    <div className="space-y-2 border-t border-slate-200 pt-4">
                      <p className="text-[10px] font-bold text-brand-variant text-center uppercase">Preenchimento Rápido (Contas Cadastradas):</p>
                      <div className="grid grid-cols-1 gap-1.5">
                        {registeredUsers.slice(0, 2).map(user => (
                          <button
                            key={user.email}
                            type="button"
                            onClick={() => {
                              setLoginEmail(user.email);
                              setSelectedUser(user);
                              setIsLoggedIn(true);
                              setErrorMessage('');
                            }}
                            className="p-2 border bg-white rounded-lg text-left text-[11px] truncate text-[#42474e] hover:bg-teal-50 flex items-center justify-between"
                          >
                            <span className="font-semibold truncate">{user.name}</span>
                            <span className="text-[9px] text-[#5f6368]">{user.registerNumber}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="text-center pt-2 text-[9px] text-brand-variant">
                      sublocaHope App v2.0.1 (Stable Build)
                    </div>

                  </div>
                ) : (
                  
                  // STATE A: APP IS LOGGED IN CONTAINER
                  <div className="flex-grow flex flex-col justify-between bg-slate-50 relative animate-fade-in">
                    
                    {/* Logged User App Header */}
                    <div className="bg-slate-900 text-white p-4 pt-5 pb-5 rounded-b-[1.5rem] shadow-md flex justify-between items-center gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-10 h-10 rounded-full overflow-hidden border border-white/20 bg-white shadow-inner flex-shrink-0">
                          <img 
                            src={selectedUser?.profilePhoto?.previewUrl || "https://images.unsplash.com/photo-1559839734-2b71ea197ec2"}
                            alt={selectedUser?.name}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-black truncate">{selectedUser?.name}</p>
                          <span className="text-[9px] text-slate-300 flex items-center gap-1 mt-0.5">
                            <ShieldCheck className="w-3.5 h-3.5 text-green-400" />
                            {selectedUser?.registerNumber}
                          </span>
                        </div>
                      </div>

                      {/* Locked session indicator banner instead of logout option */}
                      <span className="text-[9px] bg-green-500/20 text-green-300 font-extrabold uppercase rounded px-2 py-1 leading-none flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-ping"></span>
                        Mobile Link
                      </span>
                    </div>

                    {/* PHONE WORKSPACE CARDS AREA */}
                    <div className="flex-grow p-4 overflow-y-auto space-y-4">
                      
                      {/* TAB 1: AGENDA ACTIVE SCREEN */}
                      {activeTab === 'agenda' && (
                        <div className="space-y-4 animate-fade-in text-left">
                          
                          {/* Banner Header instructions */}
                          <div className="bg-green-50 border border-green-200 p-3 rounded-xl">
                            <div className="flex gap-1.5 items-center">
                              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                              <span className="font-bold text-[11px] text-green-800 font-sans">Minha Agenda do Dia</span>
                            </div>
                            <p className="text-[10px] text-green-700 leading-normal mt-0.5">
                              Exibindo exclusivamente agendamentos com pagamento processado e confirmados para hoje e datas futuras. Horários cancelados foram retirados.
                            </p>
                          </div>

                          {/* List of active schedules */}
                          <div className="space-y-3">
                            {myActiveBookings.map((b) => (
                              <div key={b.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
                                <div className="absolute top-0 right-0 py-1 px-2.5 bg-green-500 text-white font-sans text-[8px] font-black uppercase rounded-bl-lg tracking-wider">
                                  Ativa
                                </div>
                                
                                <span className="text-[8px] tracking-wider font-extrabold uppercase text-slate-400 block">Consultório Clínico</span>
                                <h5 className="font-extrabold text-slate-850 text-xs truncate mt-0.5 pr-8">{b.roomName}</h5>
                                
                                <div className="grid grid-cols-2 gap-2 mt-3 text-[10px] border-t border-slate-100 pt-2 font-medium">
                                  <div className="flex items-center gap-1 text-[#2d2e30]">
                                    <Calendar className="w-3.5 h-3.5 text-secondary flex-shrink-0" />
                                    <span>{b.date}</span>
                                  </div>
                                  <div className="flex items-center gap-1 text-[#2d2e30]">
                                    <Clock className="w-3.5 h-3.5 text-secondary flex-shrink-0" />
                                    <span>{(b.timeSlots || []).join(', ')}</span>
                                  </div>
                                </div>

                                <div className="mt-3 flex items-center justify-between gap-2 border-t border-slate-100 pt-2 text-[10px] text-brand-variant">
                                  <span>Total R$ {(b.totalValue ?? 0).toFixed(2).replace('.', ',')}</span>
                                  <button 
                                    onClick={() => alert(`QR Code de Acesso da portaria liberado para o conselho ${selectedUser?.registerNumber}`)}
                                    className="bg-secondary text-white px-2 py-1 rounded text-[8px] font-extrabold hover:bg-slate-800 active:scale-95 transition-all"
                                  >
                                    QR Token Portaria
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Float call scheduling if user wants more */}
                          <div className="bg-white p-4 rounded-xl border border-slate-150 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => setActiveTab('reserve')}>
                            <div className="flex items-center gap-2">
                              <PlusCircle className="w-5 h-5 text-secondary" />
                              <span className="text-[11px] font-bold text-slate-850">Reserve outro consultório</span>
                            </div>
                            <ChevronLeft className="w-4 h-4 rotate-180 text-brand-variant" />
                          </div>

                        </div>
                      )}

                      {/* TAB 2: REGISTER RESERVATIONS SCENES (WHEN THERE ARE NO BOOKINGS COMPLIED) */}
                      {activeTab === 'reserve' && (
                        <div className="space-y-4 animate-fade-in text-left">
                          
                          {/* Conditional guidance if redirected from empty agenda */}
                          {myActiveBookings.length === 0 && (
                            <div className="bg-amber-50 border border-amber-250 p-3 rounded-xl flex items-start gap-2.5">
                              <ShieldAlert className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                              <div>
                                <span className="font-extrabold text-[11px] text-amber-850 block leading-tight">Nenhuma Reserva Ativa Encontrada!</span>
                                <p className="text-[10px] text-amber-700 leading-normal mt-1">
                                  Você foi redirecionado para a tela de reservas porque não há horários ativos salvos no seu conselho profissional {selectedUser?.registerNumber}.
                                </p>
                              </div>
                            </div>
                          )}

                          {/* Quick booking screen mockup for mobile device */}
                          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                            <span className="bg-secondary/10 text-secondary text-[9px] font-black uppercase px-2 py-0.5 rounded">Check-in Imediato</span>
                            <h4 className="font-extrabold text-[#111c2c] text-sm">Agendar Consultório Hope</h4>
                            <p className="text-[10px] text-brand-variant leading-relaxed">
                              Escolha abaixo um consultório em Palhoça e crie uma reserva imediata integrada com o Mercado Pago:
                            </p>

                            <div className="space-y-2 pt-2">
                              {rooms.slice(0, 6).map((room) => (
                                <div key={room.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 hover:bg-slate-100 transition-colors">
                                  <div className="flex justify-between items-start gap-1">
                                    <div className="min-w-0.5">
                                      <span className="font-bold text-slate-800 text-xs block truncate">{room.name}</span>
                                      <span className="text-[9px] text-[#42474e] block">{room.location}</span>
                                    </div>
                                    <span className="font-extrabold text-xs text-green-600 text-right flex-shrink-0">R${room.pricePerHour}/h</span>
                                  </div>
                                  <div className="mt-2.5 flex justify-end">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        // Trigger Parent App layout to open standard reservation wizard
                                        setView('booking');
                                        alert(`Redirecionando seu computador para o agendamento completo de "${room.name}"!`);
                                      }}
                                      className="bg-secondary hover:bg-secondary/95 text-white font-sans font-black text-[9px] rounded-lg tracking-wide px-3 py-1.5 cursor-pointer flex items-center gap-1"
                                    >
                                      <span>Reservar Agora</span>
                                      <ArrowRight className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>



                        </div>
                      )}

                      {/* TAB 3: PROFILE SCREEN */}
                      {activeTab === 'profile' && (
                        <div className="space-y-4 animate-fade-in text-left">
                          
                          <div className="bg-white p-5 rounded-2xl border border-slate-200 text-center space-y-3">
                            <div className="w-16 h-16 rounded-full overflow-hidden mx-auto bg-slate-100 border-2 border-secondary/20">
                              <img 
                                src={selectedUser?.profilePhoto?.previewUrl || "https://images.unsplash.com/photo-1559839734-2b71ea197ec2"}
                                alt={selectedUser?.name}
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                              />
                            </div>
                            <div className="space-y-1">
                              <h5 className="font-black text-[#111c2c] text-sm leading-tight">{selectedUser?.name}</h5>
                              <p className="text-[10px] text-[#5f6368]">{selectedUser?.registerNumber}</p>
                            </div>
                          </div>

                          <div className="bg-white rounded-xl border divide-y text-[11px] text-slate-700">
                            <div className="p-3 flex justify-between">
                              <span className="text-[#5f6368]">WhatsApp:</span>
                              <span className="font-bold text-primary">{selectedUser?.phone || 'Não cadastrado'}</span>
                            </div>
                            <div className="p-3 flex justify-between">
                              <span className="text-[#5f6368]">E-mail:</span>
                              <span className="font-bold text-primary truncate max-w-[140px]">{selectedUser?.email}</span>
                            </div>
                            <div className="p-3 flex justify-between">
                              <span className="text-[#5f6368]">Termos de Uso:</span>
                              <span className="font-bold text-green-600 flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Aceito
                              </span>
                            </div>
                          </div>

                          <div className="bg-slate-900 text-white rounded-xl p-4 border border-slate-850 font-sans text-[10px] text-center space-y-1">
                            <p className="font-bold text-white">Chave Única de Pareceria Clínicas Hope:</p>
                            <p className="font-mono text-yellow-400 select-all font-black text-xs">CRM-SC-HOPE-{selectedUser?.registerNumber.replace(/\D/g, '') || '9988'}</p>
                          </div>

                        </div>
                      )}

                    </div>

                    {/* PHONE SCREEN BOTTOM FOOTER NAVIGATION TAB BAR */}
                    <div className="bg-white border-t border-slate-200 px-3 py-2 flex justify-around items-center text-center text-[10px] text-[#5f6368] font-sans font-bold select-none">
                      
                      <button
                        onClick={() => {
                          if (myActiveBookings.length === 0) {
                            alert('Você não possui nenhum agendamento confirmado e ativo hoje. Redirecionando para a tela de reservas!');
                            setActiveTab('reserve');
                          } else {
                            setActiveTab('agenda');
                          }
                        }}
                        className={`flex flex-col items-center gap-1 py-1 px-3.5 rounded-lg transition-all ${
                          activeTab === 'agenda' ? 'text-secondary font-black' : 'hover:bg-slate-50'
                        }`}
                      >
                        <Calendar className="w-5 h-5 flex-shrink-0" />
                        <span className="leading-none">Agenda</span>
                      </button>

                      <button
                        onClick={() => setActiveTab('reserve')}
                        className={`flex flex-col items-center gap-1 py-1 px-3.5 rounded-lg transition-all ${
                          activeTab === 'reserve' ? 'text-secondary font-black' : 'hover:bg-slate-50'
                        }`}
                      >
                        <Building className="w-5 h-5 flex-shrink-0" />
                        <span className="leading-none">Reservar</span>
                      </button>

                      <button
                        onClick={() => setActiveTab('profile')}
                        className={`flex flex-col items-center gap-1 py-1 px-3.5 rounded-lg transition-all ${
                          activeTab === 'profile' ? 'text-secondary font-black' : 'hover:bg-slate-50'
                        }`}
                      >
                        <User className="w-5 h-5 flex-shrink-0" />
                        <span className="leading-none">Perfil</span>
                      </button>

                    </div>

                  </div>
                )}

              </div>
            </div>

            {/* Simulated iPhone Safe Indicator Bottom Line */}
            <div className="w-28 h-1 bg-neutral-800 rounded-full mx-auto mt-4"></div>
          </div>

        </div>

      </div>

    </div>
  );
}

// Visual layout helper for triggering alerts/toast
function showToast(active: boolean, filename: string) {
  if (!active) return null;
  return (
    <div className="fixed bottom-6 right-6 z-50 bg-[#eaf7f0] border-2 border-[#2b8a53] p-4.5 rounded-2xl shadow-2xl flex items-center gap-3 animate-slide-up max-w-sm text-left">
      <CheckCircle2 className="w-6 h-6 text-[#2b8a53] flex-shrink-0" />
      <div>
        <p className="font-bold text-xs text-[#1e4620] font-sans leading-none">Download Iniciado!</p>
        <p className="text-[11px] text-[#2b8a53] font-sans mt-1">O pacote executável <strong>{filename}</strong> foi compilado e salvo na sua pasta de Downloads com sucesso.</p>
      </div>
    </div>
  );
}
