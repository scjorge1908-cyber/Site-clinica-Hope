import { useState } from 'react';
import { 
  Save, Eye, Sparkles, Layout, Image as ImageIcon, CheckCircle, 
  RefreshCw, ArrowRight, Star, HelpCircle, Check, HelpCircle as HelpIcon,
  Laptop, Smartphone, Palette, Globe, Settings
} from 'lucide-react';
import { AdminSettings, Room } from '../types';
import { getAmenityIcon, cleanAmenityLabel } from './BookingPageView';

interface EditorViewProps {
  adminSettings: AdminSettings;
  rooms: Room[];
  onUpdateSettings: (settings: AdminSettings) => void;
  setView: (view: string) => void;
}

export default function EditorView({ adminSettings, rooms, onUpdateSettings, setView }: EditorViewProps) {
  // Local editable copy states
  const [heroTitle, setHeroTitle] = useState(adminSettings.heroTitle || '');
  const [heroDescription, setHeroDescription] = useState(adminSettings.heroDescription || '');
  const [heroImage, setHeroImage] = useState(adminSettings.heroImage || '');
  
  const [landingRoomsHeading, setLandingRoomsHeading] = useState(adminSettings.landingRoomsHeading || '');
  const [landingRoomsSub, setLandingRoomsSub] = useState(adminSettings.landingRoomsSub || '');
  
  const [trustTitle, setTrustTitle] = useState(adminSettings.trustTitle || '97 Profissionais Credenciados');
  const [trustDesc, setTrustDesc] = useState(adminSettings.trustDesc || 'Confiam diariamente...');
  
  const [plan1Title, setPlan1Title] = useState(adminSettings.plan1Title || '');
  const [plan1Subtitle, setPlan1Subtitle] = useState(adminSettings.plan1Subtitle || '');
  const [plan1Desc, setPlan1Desc] = useState(adminSettings.plan1Desc || '');
  const [plan1PriceSuffix, setPlan1PriceSuffix] = useState(adminSettings.plan1PriceSuffix || '');
  const [plan1Price, setPlan1Price] = useState(adminSettings.plan1Price || '');
  
  const [plan2Title, setPlan2Title] = useState(adminSettings.plan2Title || '');
  const [plan2Subtitle, setPlan2Subtitle] = useState(adminSettings.plan2Subtitle || '');
  const [plan2Desc, setPlan2Desc] = useState(adminSettings.plan2Desc || '');
  const [plan2PriceSuffix, setPlan2PriceSuffix] = useState(adminSettings.plan2PriceSuffix || '');
  const [plan2Price, setPlan2Price] = useState(adminSettings.plan2Price || '');

  // Layout parameters
  const [heroLayout, setHeroLayout] = useState<'right-image' | 'left-image'>('right-image');
  const [accentColor, setAccentColor] = useState<'secondary' | 'indigo' | 'slate'>('secondary');
  const [showRatings, setShowRatings] = useState<boolean>(true);

  // Mode: edit vs quick preview
  const [editorMode, setEditorMode] = useState<'edit' | 'preview'>('edit');
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  const handleSave = () => {
    onUpdateSettings({
      ...adminSettings,
      heroTitle,
      heroDescription,
      heroImage,
      landingRoomsHeading,
      landingRoomsSub,
      trustTitle,
      trustDesc,
      plan1Title,
      plan1Subtitle,
      plan1Desc,
      plan1PriceSuffix,
      plan1Price,
      plan2Title,
      plan2Subtitle,
      plan2Desc,
      plan2PriceSuffix,
      plan2Price
    });

    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 3000);
  };

  // Accent badge mapping helper
  const getAccentBg = () => {
    if (accentColor === 'indigo') return 'bg-indigo-600';
    if (accentColor === 'slate') return 'bg-slate-900';
    return 'bg-secondary';
  };

  const getAccentText = () => {
    if (accentColor === 'indigo') return 'text-indigo-600';
    if (accentColor === 'slate') return 'text-slate-900';
    return 'text-secondary';
  };

  const getAccentBadge = () => {
    if (accentColor === 'indigo') return 'bg-indigo-50 text-indigo-700';
    if (accentColor === 'slate') return 'bg-slate-100 text-slate-800';
    return 'bg-secondary/15 text-secondary';
  };

  const getAccentButton = () => {
    if (accentColor === 'indigo') return 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-indigo-500/20';
    if (accentColor === 'slate') return 'bg-slate-900 hover:bg-slate-850 hover:shadow-slate-500/20';
    return 'bg-secondary hover:bg-secondary/95 hover:shadow-secondary/25';
  };

  const getAccentBorderFocus = () => {
    if (accentColor === 'indigo') return 'focus-within:border-indigo-600/80 focus-within:ring-2 focus-within:ring-indigo-100';
    if (accentColor === 'slate') return 'focus-within:border-slate-900/80 focus-within:ring-2 focus-within:ring-slate-100';
    return 'focus-within:border-secondary/80 focus-within:ring-2 focus-within:ring-secondary/10';
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12 relative text-left">
      {/* Visual Success Toast */}
      {showSuccessToast && (
        <div className="fixed top-20 right-6 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 z-50 animate-bounce">
          <CheckCircle className="w-5 h-5 text-emerald-400" />
          <span className="font-sans font-bold text-xs">Landing Page atualizada com sucesso!</span>
        </div>
      )}

      {/* Editor Controls bar */}
      <div className="bg-white border border-outline-alt/45 p-6 rounded-3xl shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-[10px] uppercase font-black text-secondary bg-secondary/15 px-2.5 py-1 rounded-full block w-fit">
            Landing Page Live Editor
          </span>
          <h2 className="font-sans font-extrabold text-lg text-primary mt-1.5 flex items-center gap-2">
            <Layout className="w-4 h-4 text-secondary" />
            <span>EditorView: Concepção de Copy & Layout</span>
          </h2>
          <p className="text-xs text-brand-variant mt-0.5">
            Personalize textos, planos de assinatura, banners e visualizações estéticas em tempo real.
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5 w-full md:w-auto">
          {/* Editor Mode Controller */}
          <div className="bg-slate-100 p-1 rounded-xl border border-slate-200 flex gap-1">
            <button
              onClick={() => setEditorMode('edit')}
              className={`px-3 py-1.5 rounded-lg font-bold text-[11px] font-sans transition-all flex items-center gap-1.5 cursor-pointer ${
                editorMode === 'edit'
                  ? 'bg-white text-primary shadow-xs'
                  : 'text-brand-variant hover:text-primary'
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Modo Edição</span>
            </button>
            <button
              onClick={() => setEditorMode('preview')}
              className={`px-3 py-1.5 rounded-lg font-bold text-[11px] font-sans transition-all flex items-center gap-1.5 cursor-pointer ${
                editorMode === 'preview'
                  ? 'bg-white text-primary shadow-xs'
                  : 'text-brand-variant hover:text-primary'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Preview Limpo</span>
            </button>
          </div>

          <button
            onClick={() => setView('home')}
            className="px-4 py-2 bg-slate-50 border border-slate-300 hover:bg-slate-100 text-primary font-bold text-[11px] rounded-xl transition cursor-pointer flex items-center gap-1.5"
          >
            <Globe className="w-4 h-4 text-brand-variant" />
            <span>Navegar no Site</span>
          </button>

          <button
            onClick={handleSave}
            className="px-5 py-2.5 bg-primary hover:bg-primary/95 text-white font-bold text-[11px] rounded-xl shadow-xs transition-transform active:scale-98 cursor-pointer flex items-center gap-1.5"
          >
            <Save className="w-4 h-4" />
            <span>Salvar & Publicar</span>
          </button>
        </div>
      </div>

      {/* Editor & Parity Preview Area */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        
        {/* Left column: Layout controls (only visible in edit mode) */}
        {editorMode === 'edit' && (
          <div className="xl:col-span-1 space-y-6">
            <div className="bg-white border border-outline-alt/45 p-6 rounded-3xl shadow-xs space-y-6">
              
              {/* Option 1: Accent Colors switcher */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Palette className="w-4 h-4 text-brand-variant" />
                  <span className="font-sans font-extrabold text-[11px] uppercase tracking-wide text-primary">Cor de Destaque</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setAccentColor('secondary')}
                    className={`p-2 rounded-xl border text-[10px] font-bold text-center flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                      accentColor === 'secondary'
                        ? 'border-secondary bg-secondary/5 font-extrabold text-secondary'
                        : 'border-[#c2c7cf] hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <span className="w-4 h-4 rounded-full bg-[#305c75] block"></span>
                    <span>Barão (Original)</span>
                  </button>

                  <button
                    onClick={() => setAccentColor('indigo')}
                    className={`p-2 rounded-xl border text-[10px] font-bold text-center flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                      accentColor === 'indigo'
                        ? 'border-indigo-600 bg-indigo-50 font-extrabold text-indigo-700'
                        : 'border-[#c2c7cf] hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <span className="w-4 h-4 rounded-full bg-indigo-600 block"></span>
                    <span>Indigo Royal</span>
                  </button>

                  <button
                    onClick={() => setAccentColor('slate')}
                    className={`p-2 rounded-xl border text-[10px] font-bold text-center flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                      accentColor === 'slate'
                        ? 'border-slate-800 bg-slate-50 font-extrabold text-slate-900'
                        : 'border-[#c2c7cf] hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <span className="w-4 h-4 rounded-full bg-slate-900 block"></span>
                    <span>Chapa Clean</span>
                  </button>
                </div>
              </div>

              {/* Option 2: Hero Layout alignment switcher */}
              <div className="space-y-3 pt-4 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <Layout className="w-4 h-4 text-brand-variant" />
                  <span className="font-sans font-extrabold text-[11px] uppercase tracking-wide text-primary">Disposição do Banner (Layout)</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setHeroLayout('right-image')}
                    className={`px-3 py-2.5 rounded-xl border text-[10px] font-bold text-left transition-all cursor-pointer ${
                      heroLayout === 'right-image'
                        ? 'border-secondary bg-secondary/5 text-secondary'
                        : 'border-[#c2c7cf] hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <span className="block text-xs mb-1">🖼️ Direita</span>
                    <span className="text-[9px] font-normal leading-normal text-slate-500 block">Imagem à direita, textos à esquerda</span>
                  </button>

                  <button
                    onClick={() => setHeroLayout('left-image')}
                    className={`px-3 py-2.5 rounded-xl border text-[10px] font-bold text-left transition-all cursor-pointer ${
                      heroLayout === 'left-image'
                        ? 'border-secondary bg-secondary/5 text-secondary'
                        : 'border-[#c2c7cf] hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <span className="block text-xs mb-1">🖼️ Esquerda</span>
                    <span className="text-[9px] font-normal leading-normal text-slate-500 block">Imagem à esquerda, textos à direita</span>
                  </button>
                </div>
              </div>

              {/* Option 3: Additional details toggles */}
              <div className="space-y-3 pt-4 border-t border-slate-100">
                <span className="font-sans font-extrabold text-[11px] uppercase tracking-wide text-primary block">Exibição de Elementos</span>
                
                <label className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer select-none">
                  <div className="text-left">
                    <span className="text-[10px] font-extrabold text-primary block leading-none">Pill de Estrelas</span>
                    <span className="text-[8px] text-brand-variant block mt-0.5">Mostrar (5,0★) nas salas do carrossel</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={showRatings}
                    onChange={(e) => setShowRatings(e.target.checked)}
                    className="w-4 h-4 text-secondary focus:ring-secondary/20 rounded cursor-pointer"
                  />
                </label>
              </div>

              {/* Tips block */}
              <div className="p-4 bg-slate-50 border border-slate-200/60 rounded-2xl">
                <span className="text-[9px] uppercase font-black text-secondary flex items-center gap-1">
                  💡 WYSIWYG Estilo Livre
                </span>
                <p className="text-[10px] text-slate-600 font-medium leading-relaxed mt-1">
                  Você pode editar os textos da landing page digitando diretamente nos campos tracejados na visualização à direita.
                </p>
                <p className="text-[10px] text-slate-500 leading-normal mt-1.5">
                  Os limites, botões, ícones e grids mimetizam exatamente o visual público, oferecendo excelente previsibilidade estética antes de mandar salvar.
                </p>
              </div>

            </div>
          </div>
        )}

        {/* Right column: High-fidelity Live visual layout builder (takes full width if preview mode) */}
        <div className={`${editorMode === 'edit' ? 'xl:col-span-3' : 'xl:col-span-4'} space-y-12`}>
          
          {/* 1. INTERACTIVE HERO CANVAS SECTION */}
          <div className="bg-slate-100/50 p-2 rounded-[3rem] border border-slate-200">
            <span className="text-[8px] uppercase font-extrabold px-3 py-1 font-sans text-slate-500 bg-white shadow-3xs rounded-full inline-block ml-6 mb-2">
              Seção 1: Hero Banner Principal
            </span>
            
            <section className="relative bg-white border border-outline-alt/45 rounded-[2.5rem] p-6 sm:p-10 md:p-12 overflow-hidden shadow-sm">
              <div className={`grid lg:grid-cols-12 gap-8 md:gap-12 items-center relative z-10 ${
                heroLayout === 'left-image' ? 'direction-rtl' : ''
              }`}>
                {/* Text Block */}
                <div className={`lg:col-span-7 space-y-5 text-left ${
                  heroLayout === 'left-image' ? 'lg:-order-1' : ''
                }`}>
                  <span className={`${getAccentBadge()} font-sans font-black text-[10px] rounded-full uppercase tracking-wider px-3.5 py-1`}>
                    Sublocação Inteligente de Consultórios 🏥
                  </span>

                  {editorMode === 'edit' ? (
                    <div className={`p-1.5 rounded-2xl border border-dashed border-slate-300 w-full hover:border-slate-400 focus-within:border-solid ${getAccentBorderFocus()} transition-all bg-slate-50/40`}>
                      <span className="text-[9px] uppercase tracking-wider font-extrabold text-slate-400 block px-1">Título Grande do Hero</span>
                      <textarea
                        value={heroTitle}
                        onChange={(e) => setHeroTitle(e.target.value)}
                        className="w-full bg-transparent border-none outline-none font-sans font-extrabold text-2xl sm:text-3xl text-primary leading-tight tracking-tight px-1 py-1 resize-none overflow-hidden"
                        rows={2}
                      />
                    </div>
                  ) : (
                    <h1 className="font-sans font-extrabold text-3xl sm:text-4xl text-primary leading-tight tracking-tight">
                      {heroTitle}
                    </h1>
                  )}

                  {editorMode === 'edit' ? (
                    <div className={`p-1.5 rounded-2xl border border-dashed border-slate-300 w-full hover:border-slate-400 focus-within:border-solid ${getAccentBorderFocus()} transition-all bg-slate-50/40`}>
                      <span className="text-[9px] uppercase tracking-wider font-extrabold text-slate-400 block px-1">Descrição Textual Secundária</span>
                      <textarea
                        value={heroDescription}
                        onChange={(e) => setHeroDescription(e.target.value)}
                        className="w-full bg-transparent border-none outline-none font-sans text-brand-variant text-xs sm:text-sm leading-relaxed px-1 py-1 resize-none"
                        rows={3}
                      />
                    </div>
                  ) : (
                    <p className="font-sans text-brand-variant text-sm leading-relaxed max-w-xl">
                      {heroDescription}
                    </p>
                  )}

                  <div className="flex flex-col sm:flex-row gap-3 pt-1">
                    <button
                      type="button"
                      className={`${getAccentButton()} text-white font-sans font-bold text-xs tracking-wide px-6 py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm`}
                    >
                      <span>Reservar um Horário</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      className="px-6 py-3.5 border border-[#a2a6ab] hover:bg-slate-50 text-primary rounded-xl font-sans font-bold text-xs transition-all"
                    >
                      Cadastrar Perfil Clínico
                    </button>
                  </div>
                </div>
                
                {/* Image Block */}
                <div className="lg:col-span-5 relative w-full h-[260px] sm:h-[320px] rounded-3xl overflow-hidden shadow-md border border-outline-alt/40 bg-slate-100 flex flex-col justify-between p-4 bg-cover bg-center"
                     style={{ backgroundImage: `url(${heroImage})` }}>
                  
                  {/* Floating Trust Card (Mock) */}
                  <div className="bg-white/95 backdrop-blur-md p-3 rounded-2xl shadow-lg border border-slate-200/40 w-fit text-left">
                    {editorMode === 'edit' ? (
                      <div className="space-y-1">
                        <input
                          type="text"
                          value={trustTitle}
                          onChange={(e) => setTrustTitle(e.target.value)}
                          className="font-sans font-extrabold text-[10px] text-primary bg-transparent border-b border-dashed border-slate-300 outline-none w-full"
                          placeholder="Card Título"
                        />
                        <input
                          type="text"
                          value={trustDesc}
                          onChange={(e) => setTrustDesc(e.target.value)}
                          className="font-sans text-[8px] text-brand-variant bg-transparent outline-none w-full block mt-0.5"
                          placeholder="Card Descrição"
                        />
                      </div>
                    ) : (
                      <>
                        <h6 className="font-sans font-extrabold text-[10px] text-primary">{trustTitle}</h6>
                        <p className="font-sans text-[8px] text-brand-variant leading-none mt-0.5">{trustDesc}</p>
                      </>
                    )}
                  </div>

                  {editorMode === 'edit' && (
                    <div className="bg-black/75 backdrop-blur-md p-2.5 rounded-xl border border-white/10 w-full text-left self-end animate-fade-in">
                      <span className="text-[8px] uppercase tracking-wider font-extrabold text-slate-300 block">URL da Foto de Capa (Hero Image)</span>
                      <div className="flex gap-1.5 mt-1.5">
                        <input
                          type="text"
                          value={heroImage}
                          onChange={(e) => setHeroImage(e.target.value)}
                          className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-[10px] text-white font-mono w-full outline-none focus:border-secondary"
                          placeholder="Cole a URL da Imagem..."
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
              {/* Overlay graphics */}
              <div className="absolute top-0 right-0 w-80 h-80 bg-secondary/5 rounded-full translate-x-1/3 -translate-y-1/3 blur-2xl pointer-events-none"></div>
            </section>
          </div>

          {/* 2. INTERACTIVE ROOMS TITLE SECTION */}
          <div className="bg-slate-100/50 p-2 rounded-[3rem] border border-slate-200 space-y-6">
            <span className="text-[8px] uppercase font-extrabold px-3 py-1 font-sans text-slate-500 bg-white shadow-3xs rounded-full inline-block ml-6">
              Seção 2: Carrossel de Consultórios do Catálogo
            </span>

            <div className="text-center space-y-3 px-6 pb-6">
              {editorMode === 'edit' ? (
                <div className="max-w-2xl mx-auto space-y-2 p-3 border-2 border-dashed border-slate-300 bg-white rounded-2xl hover:border-slate-400 focus-within:border-solid focus-within:ring-2 focus-within:ring-secondary/10 transition">
                  <span className="text-[9px] uppercase font-black text-slate-400 block">Título do Catálogo de Consultórios</span>
                  <input
                    type="text"
                    value={landingRoomsHeading}
                    onChange={(e) => setLandingRoomsHeading(e.target.value)}
                    className="w-full text-center bg-transparent border-none outline-none font-sans font-extrabold text-xl sm:text-2xl text-primary font-bold"
                  />
                  
                  <span className="text-[9px] uppercase font-black text-slate-400 block border-t border-slate-100 pt-1.5 mt-1">Slogan Secundário do Catálogo</span>
                  <input
                    type="text"
                    value={landingRoomsSub}
                    onChange={(e) => setLandingRoomsSub(e.target.value)}
                    className="w-full text-center bg-transparent border-none outline-none font-sans text-brand-text text-xs text-brand-variant"
                  />
                </div>
              ) : (
                <div className="space-y-1.5">
                  <h2 className="font-sans font-extrabold text-2xl sm:text-3xl text-primary leading-tight tracking-tight">
                    {landingRoomsHeading}
                  </h2>
                  <p className="font-sans text-brand-variant text-xs max-w-xl mx-auto font-medium">
                    {landingRoomsSub}
                  </p>
                </div>
              )}

              {/* High fidelity static mirror grid of 6 clinic cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
                {rooms.slice(0, 6).map((room) => {
                  const isStandard = room.type === 'standard';
                  const isPremium = room.type === 'premium';
                  const isExecutivo = room.type === 'executivo_luxo';

                  return (
                    <div
                      key={room.id}
                      className="bg-white rounded-3xl overflow-hidden border border-outline-alt/45 flex flex-col justify-between opacity-85"
                    >
                      <div>
                        {/* Image banner with Rating */}
                        <div className="h-40 overflow-hidden bg-slate-100 relative">
                          <img
                            src={room.images[0]}
                            alt={room.name}
                            className="w-full h-full object-cover transition-all"
                            style={room.imageSettings ? {
                              transform: `scale(${(room.imageSettings.zoom || 100) / 100}) rotate(${room.imageSettings.rotate || 0}deg)`,
                              objectPosition: `${room.imageSettings.posX ?? 50}% ${room.imageSettings.posY ?? 50}%`,
                              filter: `brightness(${room.imageSettings.brightness ?? 100}%) contrast(${room.imageSettings.contrast ?? 100}%)`
                            } : undefined}
                            referrerPolicy="no-referrer"
                          />
                          {showRatings && (
                            <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-md px-2 py-0.5 rounded-full text-[10px] font-bold text-secondary border border-secondary/10 flex items-center gap-0.5 shadow-xs">
                              <Star className="w-3 h-3 fill-secondary text-secondary" />
                              <span>{(room?.rating ?? 5.0).toFixed(1)}</span>
                            </div>
                          )}
                        </div>

                        {/* Text Metadata elements */}
                        <div className="p-4 text-left space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[8px] font-black text-secondary uppercase tracking-wider bg-secondary/10 px-2 py-0.5 rounded">
                              {isExecutivo ? 'Executivo Luxo' : (isPremium ? 'Premium' : 'Standard')}
                            </span>
                          </div>

                          <h4 className="font-sans font-extrabold text-[13px] text-primary truncate leading-tight">
                            {room.name}
                          </h4>

                          <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[10px] text-brand-variant font-medium">
                            {(room.features || []).slice(0, 3).map((feat, i) => (
                              <span key={i} className="flex items-center gap-1 whitespace-nowrap">
                                {getAmenityIcon(feat, "w-3 h-3 text-secondary")}
                                <span className="text-[9px]">{cleanAmenityLabel(feat)}</span>
                                {i < Math.min((room.features || []).length, 3) - 1 && <span className="text-black/10 select-none ml-0.5">•</span>}
                              </span>
                            ))}
                          </div>

                          <p className="font-sans text-[10px] text-brand-text text-brand-variant line-clamp-2 leading-relaxed">
                            {room.description}
                          </p>
                        </div>
                      </div>

                      {/* Card Footer Mirror with price */}
                      <div className="p-4 pt-0">
                        <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between">
                          <div className="text-left">
                            <span className="text-[8px] text-brand-variant font-extrabold uppercase leading-none block">Sublocação</span>
                            <span className="font-sans font-black text-xs text-primary block mt-0.5">
                              R$ {(room?.pricePerHour ?? 45).toFixed(2).replace('.', ',')} <span className="font-normal text-[9px] text-brand-variant">/h</span>
                            </span>
                          </div>
                          
                          <button
                            type="button"
                            className={`text-white font-sans font-extrabold text-[9px] px-3.5 py-2.5 rounded-lg font-bold leading-none ${getAccentBg()} active:scale-95`}
                          >
                            Reservar Sala
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 3. INTERACTIVE SUBSCRIPTION PLANS CANVAS */}
          <div className="bg-slate-100/50 p-2 rounded-[3rem] border border-slate-200 space-y-6">
            <span className="text-[8px] uppercase font-extrabold px-3 py-1 font-sans text-slate-500 bg-white shadow-3xs rounded-full inline-block ml-6">
              Seção 3: Planos e Condições Recorrentes
            </span>

            <div className="text-center space-y-12 px-6 pb-6 text-left">
              <div className="text-center space-y-1.5">
                <span className={`${getAccentText()} text-xs uppercase font-extrabold tracking-widest block`}>Condições Especiais</span>
                <h2 className="font-sans font-extrabold text-2xl sm:text-3xl text-primary tracking-tight">Planos e Pacotes de Recorrência</h2>
                <p className="font-sans text-brand-variant text-xs max-w-xl mx-auto font-medium">Reduza as tarifas operacionais e garanta horários prioritários em Palhoça, SC.</p>
              </div>

              {/* Double Plans Grid (Interactive Copy Editor inside Cards) */}
              <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                {/* Plan Card A */}
                <div className="bg-white p-6 sm:p-8 rounded-3xl border border-outline-alt/35 shadow-xs flex flex-col justify-between space-y-4">
                  <div className="space-y-4 w-full text-left">
                    {editorMode === 'edit' ? (
                      <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <div className="p-1.5 bg-slate-50 border border-dashed border-slate-300 rounded-lg">
                            <span className="text-[8px] text-slate-400 font-extrabold uppercase block">Título do Plano</span>
                            <input
                              type="text"
                              value={plan1Title}
                              onChange={(e) => setPlan1Title(e.target.value)}
                              className="w-full bg-transparent font-sans font-extrabold text-[11px] text-primary outline-none"
                            />
                          </div>
                          
                          <div className="p-1.5 bg-slate-50 border border-dashed border-slate-300 rounded-lg">
                            <span className="text-[8px] text-slate-400 font-extrabold uppercase block">Subtítulo do Plano</span>
                            <input
                              type="text"
                              value={plan1Subtitle}
                              onChange={(e) => setPlan1Subtitle(e.target.value)}
                              className="w-full bg-transparent font-sans text-[10px] text-brand-variant outline-none"
                            />
                          </div>
                        </div>

                        <div className="p-1.5 bg-slate-50 border border-dashed border-slate-300 rounded-lg">
                          <span className="text-[8px] text-slate-400 font-extrabold uppercase lg:block">Benefícios resumidos em uma frase</span>
                          <input
                            type="text"
                            value={plan1Desc}
                            onChange={(e) => setPlan1Desc(e.target.value)}
                            className="w-full bg-transparent font-sans text-[10px] text-brand-variant outline-none"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2 pb-1">
                          <div className="p-1.5 bg-slate-50 border border-dashed border-slate-300 rounded-lg">
                            <span className="text-[8px] text-slate-400 font-extrabold uppercase block">Prefixo/Sufixo</span>
                            <input
                              type="text"
                              value={plan1PriceSuffix}
                              onChange={(e) => setPlan1PriceSuffix(e.target.value)}
                              className="w-full bg-transparent font-sans text-[10px] text-brand-text outline-none"
                            />
                          </div>
                          
                          <div className="p-1.5 bg-slate-50 border border-dashed border-slate-300 rounded-lg">
                            <span className="text-[8px] text-slate-400 font-extrabold uppercase block">Valor Fixo</span>
                            <input
                              type="text"
                              value={plan1Price}
                              onChange={(e) => setPlan1Price(e.target.value)}
                              className="w-full bg-transparent font-sans font-black text-[11px] text-primary outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="border-b border-slate-100 pb-3">
                          <h4 className="font-sans font-extrabold text-base text-primary uppercase tracking-wide">{plan1Title}</h4>
                          <span className="text-[10px] font-bold text-secondary">{plan1Subtitle}</span>
                        </div>
                        <p className="font-sans text-xs text-brand-variant leading-relaxed">{plan1Desc}</p>
                      </>
                    )}

                    <ul className="space-y-2 pt-2.5 font-sans text-[11px] text-slate-600">
                      <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-secondary flex-shrink-0" /> Infraestrutura de ponta e Wi-Fi</li>
                      <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-secondary flex-shrink-0" /> Recepção integrada com café</li>
                      <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-secondary flex-shrink-0" /> Localização privilegiada de SC</li>
                    </ul>
                  </div>

                  {editorMode === 'preview' && (
                    <div className="pt-4 border-t border-slate-100 text-left">
                      <span className="text-[10px] text-brand-variant block font-semibold uppercase">{plan1PriceSuffix}</span>
                      <p className="font-sans font-black text-2xl text-primary mt-1">R$ {plan1Price} <span className="text-xs font-normal text-brand-variant">/hora</span></p>
                    </div>
                  )}
                </div>

                {/* Plan Card B */}
                <div className="bg-slate-55 relative p-6 sm:p-8 rounded-3xl border-2 border-secondary/45 shadow-sm flex flex-col justify-between space-y-4">
                  <div className="absolute top-3.5 right-4 bg-secondary text-white text-[8px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full shadow-2xs">
                    Recomendado ★
                  </div>
                  
                  <div className="space-y-4 w-full text-left">
                    {editorMode === 'edit' ? (
                      <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <div className="p-1.5 bg-slate-50 border border-dashed border-slate-300 rounded-lg">
                            <span className="text-[8px] text-slate-400 font-extrabold uppercase block">Título do Pacote</span>
                            <input
                              type="text"
                              value={plan2Title}
                              onChange={(e) => setPlan2Title(e.target.value)}
                              className="w-full bg-transparent font-sans font-extrabold text-[11px] text-primary outline-none"
                            />
                          </div>
                          
                          <div className="p-1.5 bg-slate-50 border border-dashed border-slate-300 rounded-lg">
                            <span className="text-[8px] text-slate-400 font-extrabold uppercase block">Subtítulo do Pacote</span>
                            <input
                              type="text"
                              value={plan2Subtitle}
                              onChange={(e) => setPlan2Subtitle(e.target.value)}
                              className="w-full bg-transparent font-sans text-[10px] text-brand-variant outline-none"
                            />
                          </div>
                        </div>

                        <div className="p-1.5 bg-slate-50 border border-dashed border-slate-300 rounded-lg">
                          <span className="text-[8px] text-slate-400 font-extrabold uppercase block">Frase curta descritiva de valor</span>
                          <input
                            type="text"
                            value={plan2Desc}
                            onChange={(e) => setPlan2Desc(e.target.value)}
                            className="w-full bg-transparent font-sans text-[10px] text-brand-variant outline-none"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2 pb-1">
                          <div className="p-1.5 bg-slate-50 border border-dashed border-slate-300 rounded-lg">
                            <span className="text-[8px] text-slate-400 font-extrabold uppercase block">Sufixo fixo recorrente</span>
                            <input
                              type="text"
                              value={plan2PriceSuffix}
                              onChange={(e) => setPlan2PriceSuffix(e.target.value)}
                              className="w-full bg-transparent font-sans text-[10px] text-brand-text outline-none"
                            />
                          </div>
                          
                          <div className="p-1.5 bg-slate-50 border border-dashed border-slate-300 rounded-lg">
                            <span className="text-[8px] text-slate-400 font-extrabold uppercase block">Valor Geral</span>
                            <input
                              type="text"
                              value={plan2Price}
                              onChange={(e) => setPlan2Price(e.target.value)}
                              className="w-full bg-transparent font-sans font-black text-[11px] text-primary outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="border-b border-secondary/15 pb-3">
                          <h4 className="font-sans font-extrabold text-base text-primary uppercase tracking-wide">{plan2Title}</h4>
                          <span className="text-[10px] font-extrabold text-[#305c75]">{plan2Subtitle}</span>
                        </div>
                        <p className="font-sans text-xs text-brand-variant leading-relaxed">{plan2Desc}</p>
                      </>
                    )}

                    <ul className="space-y-2 pt-2.5 font-sans text-[11px] text-slate-600">
                      <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-secondary flex-shrink-0" /> Desconto estendido de até 40% nas salas</li>
                      <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-secondary flex-shrink-0" /> Chaves eletrônicas na portaria do prédio</li>
                      <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-secondary flex-shrink-0" /> Prioridade de agendamento antecipado</li>
                    </ul>
                  </div>

                  {editorMode === 'preview' && (
                    <div className="pt-4 border-t border-slate-100 text-left">
                      <span className="text-[10px] text-[#305c75] block font-bold uppercase">{plan2PriceSuffix}</span>
                      <p className="font-sans font-black text-2xl text-primary mt-1">R$ {plan2Price} <span className="text-xs font-normal text-brand-variant">/mensal</span></p>
                    </div>
                  )}
                </div>

              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
