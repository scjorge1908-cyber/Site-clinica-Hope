import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Psychology, 
  LocationOn, 
  ArrowForward, 
  VerifiedUser, 
  MoodBad, 
  ChildCare, 
  SentimentVeryDissatisfied, 
  Chat, 
  CalendarMonth, 
  Spa, 
  CheckCircle,
  Share,
  Star,
  PhotoCamera,
  PinDrop,
  Send,
  Home as HomeIcon,
  MedicalServices,
  Group,
  Favorite,
  Verified,
  Settings,
  Public,
  Add,
  Delete,
  Edit,
  Close,
  Info,
  AssignmentTurnedIn,
  MenuIcon
} from './components/Icons';
import { 
  Instagram, 
  Facebook, 
  Linkedin as LinkedIn, 
  Wifi, 
  ConciergeBell, 
  Volume2, 
  Snowflake, 
  ParkingCircle, 
  ShieldCheck, 
  LogOut,
  User,
  Baby,
  Heart,
  Brain,
  Briefcase,
  Users,
  Stethoscope,
  GraduationCap,
  Sun,
  CloudSun,
  Moon,
  Trash2,
  Edit2,
  RefreshCw
} from 'lucide-react';
import Cropper from 'react-easy-crop';
import { Screen, TransitionType, Specialist, Approach, HomeSettings, AgeGroup, Shift, InsurancePlan } from './types';
import { DEFAULT_HOME_SETTINGS, DEFAULT_SPECIALISTS, DEFAULT_APPROACHES, DEFAULT_TESTIMONIALS, CLINICA_LOGO_URL } from './constants';
import { 
  getHomeSettings, 
  saveHomeSettings, 
  getSpecialists, 
  saveSpecialists, 
  getApproaches, 
  saveApproaches, 
  getInsurancePlans, 
  saveInsurancePlans,
  loginWithGoogle,
  logout as firebaseLogout,
  auth,
  COLLECTIONS,
  DOCS
} from './lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { onSnapshot, collection, doc } from 'firebase/firestore';
import { db } from './lib/firebase';

// Helper for Local Storage
const LS_KEYS = {
  SETTINGS: 'clinica_hope_settings',
  SPECIALISTS: 'clinica_hope_specialists',
  APPROACHES: 'clinica_hope_approaches',
  INSURANCE: 'clinica_hope_insurance',
  AUTH: 'clinica_hope_auth'
};

const saveToLS = (key: string, data: any) => {
  localStorage.setItem(key, JSON.stringify(data));
};

const loadFromLS = (key: string, defaultValue: any) => {
  const saved = localStorage.getItem(key);
  if (!saved) return defaultValue;
  try {
    return JSON.parse(saved);
  } catch {
    return defaultValue;
  }
};

const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous');
    image.src = url;
  });

const getCroppedImg = async (
  imageSrc: string,
  pixelCrop: { x: number; y: number; width: number; height: number }
): Promise<string> => {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) return '';

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.drawImage(
    image,
    pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height,
    0, 0, pixelCrop.width, pixelCrop.height
  );

  return canvas.toDataURL('image/jpeg', 0.8);
};

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>(Screen.Home);
  const [direction, setDirection] = useState<number>(0);
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Data State
  const [homeSettings, setHomeSettings] = useState<HomeSettings>(DEFAULT_HOME_SETTINGS);
  const [specialists, setSpecialists] = useState<Specialist[]>(DEFAULT_SPECIALISTS);
  const [approaches, setApproaches] = useState<Approach[]>(DEFAULT_APPROACHES);
  const [insurancePlans, setInsurancePlans] = useState<InsurancePlan[]>([]);
  
  const [scrollIntent, setScrollIntent] = useState(false);

  // Initial Load from Firebase (Real-time Sync) and Auth check
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user && user.email === 'scjorge1908@gmail.com') {
        setIsAdminUnlocked(true);
      } else {
        setIsAdminUnlocked(false);
      }
    });

    // Real-time listeners
    const unsubHome = onSnapshot(doc(db, COLLECTIONS.SETTINGS, DOCS.HOME_SETTINGS), (doc) => {
      if (doc.exists()) setHomeSettings(doc.data() as HomeSettings);
      setIsLoading(false);
    }, (error) => {
      console.error("Erro no listener de HomeSettings:", error);
      setIsLoading(false);
    });

    const unsubSpecs = onSnapshot(collection(db, COLLECTIONS.SPECIALISTS), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Specialist[];
      setSpecialists(data);
    }, (error) => {
      console.error("Erro no listener de especialistas:", error);
    });

    const unsubApproaches = onSnapshot(collection(db, COLLECTIONS.APPROACHES), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Approach[];
      setApproaches(data);
    }, (error) => {
      console.error("Erro no listener de abordagens:", error);
    });

    const unsubInsurance = onSnapshot(collection(db, COLLECTIONS.INSURANCE), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as InsurancePlan[];
      setInsurancePlans(data);
    }, (error) => {
      console.error("Erro no listener de convênios:", error);
    });

    return () => {
      unsubscribeAuth();
      unsubHome();
      unsubSpecs();
      unsubApproaches();
      unsubInsurance();
    };
  }, []);

  const updateSettings = async (newSettings: HomeSettings) => {
    const { insurancePlans: _, ...cleanSettings } = newSettings;
    setHomeSettings(cleanSettings as HomeSettings);
    await saveHomeSettings(cleanSettings);
  };

  const updateSpecialists = async (newSpecialists: Specialist[]) => {
    setSpecialists(newSpecialists);
    await saveSpecialists(newSpecialists);
  };

  const updateApproaches = async (newApproaches: Approach[]) => {
    setApproaches(newApproaches);
    await saveApproaches(newApproaches);
  };

  const updateInsurancePlans = async (newPlans: InsurancePlan[]) => {
    setInsurancePlans(newPlans);
    await saveInsurancePlans(newPlans);
  };

  const handleLogout = async () => {
    await firebaseLogout();
    setIsAdminUnlocked(false);
    navigateTo(Screen.Home, 'push_back');
  };

  const navigateTo = (screen: Screen, transition: TransitionType = 'none', scroll: boolean = false) => {
    setScrollIntent(scroll);
    if (screen === Screen.Admin && !isAdminUnlocked) {
      setCurrentScreen(Screen.Login);
      setDirection(1);
      return;
    }
    if (transition === 'push') setDirection(1);
    else if (transition === 'push_back') setDirection(-1);
    else setDirection(0);
    setCurrentScreen(screen);
  };

  const variants = {
    enter: (dir: number) => ({
      x: dir > 0 ? '100%' : dir < 0 ? '-100%' : 0,
      opacity: dir === 0 ? 0 : 1,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (dir: number) => ({
      x: dir > 0 ? '-100%' : dir < 0 ? '100%' : 0,
      opacity: dir === 0 ? 0 : 1,
    }),
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-6">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full shadow-lg shadow-primary/10"
        />
        <div className="flex flex-col items-center gap-2">
          <p className="text-primary font-bold text-lg tracking-tight">Clínica Hope</p>
          <div className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                className="w-1.5 h-1.5 bg-primary/40 rounded-full"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden min-h-screen">
      <AnimatePresence initial={false} custom={direction} mode="wait">
        <motion.div
          key={currentScreen}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{
            x: { type: 'spring', stiffness: 300, damping: 30 },
            opacity: { duration: 0.2 }
          }}
          className="min-h-screen"
        >
          {currentScreen === Screen.Home && (
            <HomeScreen 
              onNavigate={navigateTo} 
              settings={{ ...homeSettings, insurancePlans }} 
              approaches={approaches}
              specialists={specialists}
              isAdminUnlocked={isAdminUnlocked}
            />
          )}
          {currentScreen === Screen.SEO && <SEOScreen onNavigate={navigateTo} settings={homeSettings} />}
          {currentScreen === Screen.CorpoClinico && (
            <CorpoClinicoScreen 
              onNavigate={navigateTo} 
              specialists={specialists} 
              approaches={approaches}
              settings={{ ...homeSettings, insurancePlans }}
              isAdminUnlocked={isAdminUnlocked}
              shouldScrollToList={scrollIntent}
            />
          )}
          {currentScreen === Screen.Agendamento && <AgendamentoScreen onNavigate={navigateTo} settings={homeSettings} />}
          {currentScreen === Screen.Abordagens && <AbordagensScreen onNavigate={navigateTo} approaches={approaches} settings={homeSettings} />}
          {currentScreen === Screen.Login && (
            <LoginScreen 
              onNavigate={navigateTo} 
              onUnlock={() => setIsAdminUnlocked(true)} 
              settings={homeSettings}
            />
          )}
          {currentScreen === Screen.Admin && (
            <AdminScreen 
              onNavigate={navigateTo}
              settings={{ ...homeSettings, insurancePlans }}
              onUpdateSettings={updateSettings}
              specialists={specialists}
              onUpdateSpecialists={updateSpecialists}
              approaches={approaches}
              onUpdateApproaches={updateApproaches}
              onLogout={handleLogout}
              insurancePlans={insurancePlans}
              onUpdateInsurance={updateInsurancePlans}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// --- Layout Components ---

interface LayoutProps {
  children: React.ReactNode;
  activeScreen: Screen;
  onNavigate: (screen: Screen, transition?: TransitionType) => void;
  settings?: HomeSettings;
}

function Layout({ children, activeScreen, onNavigate, settings }: LayoutProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { id: Screen.Home, label: 'Início' },
    { id: Screen.SEO, label: 'A Clínica' },
    { id: Screen.Abordagens, label: 'Abordagens' },
    { id: Screen.CorpoClinico, label: 'Especialistas' },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans selection:bg-secondary-container selection:text-on-secondary-container overflow-x-hidden">
      {/* Material 3 TopAppBar */}
      <header className={`fixed top-0 w-full z-50 transition-all duration-300 ${isScrolled ? 'glass-nav py-2 shadow-lg' : 'bg-transparent py-4'}`}>
        <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
          <button 
            onClick={() => { onNavigate(Screen.Home, 'push_back'); setMenuOpen(false); }}
            className="flex items-center gap-3 group shrink-0"
          >
            <div className="w-10 h-10 bg-primary/10 rounded-xl overflow-hidden flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all shadow-sm">
              {settings?.logoUrl ? (
                <img src={settings.logoUrl} className="w-full h-full object-cover" alt="Logo" />
              ) : (
                <Spa size={24} />
              )}
            </div>
            <span className="text-xl font-bold tracking-tight text-primary hidden sm:block">
              {settings?.clinicName || 'Clínica Hope'}
            </span>
          </button>
          
          <nav className="hidden lg:flex gap-8 items-center">
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id, activeScreen === Screen.Home ? 'push' : 'none')}
                className={`text-sm font-bold transition-all hover:text-primary tracking-tight ${
                  activeScreen === item.id 
                    ? 'text-primary' 
                    : 'text-on-surface-variant/70'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            <button 
              onClick={() => onNavigate(Screen.CorpoClinico, 'push', true)}
              className="hidden md:block bg-primary text-white text-sm font-bold px-7 py-3 rounded-full hover:shadow-xl active:scale-95 transition-all shadow-lg shadow-primary/20"
            >
              Agendar Consulta
            </button>
            
            <button 
              onClick={() => setMenuOpen(!menuOpen)}
              className="lg:hidden p-3 rounded-2xl bg-surface-container-high text-primary hover:bg-primary hover:text-white transition-all active:scale-90"
              aria-label="Menu"
            >
              {menuOpen ? <Close size={24} /> : <MenuIcon size={24} />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile & Tablet Drawer Menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] lg:hidden mt-20"
          >
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute right-0 top-0 h-[calc(100vh-5rem)] w-full sm:w-80 bg-white shadow-2xl border-l border-outline-variant/30 flex flex-col p-8 overflow-y-auto"
            >
              <div className="flex flex-col gap-4">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-secondary/60 mb-2">Navegação</p>
                {navItems.map(item => (
                  <button
                    key={item.id}
                    onClick={() => { onNavigate(item.id); setMenuOpen(false); }}
                    className={`flex items-center justify-between p-5 rounded-3xl text-lg font-bold transition-all ${
                      activeScreen === item.id 
                      ? 'bg-primary text-white shadow-lg' 
                      : 'bg-surface-container-low text-primary hover:bg-surface-container'
                    }`}
                  >
                    {item.label}
                    <ArrowForward size={20} />
                  </button>
                ))}
              </div>
              
              <div className="mt-auto pt-10 space-y-6">
                <button 
                  onClick={() => { onNavigate(Screen.CorpoClinico, 'push', true); setMenuOpen(false); }}
                  className="w-full bg-secondary text-white py-5 rounded-[2rem] font-bold text-lg shadow-xl shadow-secondary/20 flex items-center justify-center gap-3"
                >
                  <CalendarMonth size={24} />
                  Agendar Agora
                </button>
                
                <div className="flex justify-center gap-6 text-primary/40">
                  <Instagram size={20} />
                  <Facebook size={20} />
                  <LinkedIn size={20} />
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="flex-grow">{children}</main>

      <footer className="py-20 bg-surface-container-low border-t border-outline-variant/30">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary/10 rounded-lg overflow-hidden flex items-center justify-center text-primary">
                {settings?.logoUrl ? (
                  <img src={settings.logoUrl} className="w-full h-full object-cover" alt="Logo" />
                ) : (
                  <Spa size={18} />
                )}
              </div>
              <span className="font-bold text-primary text-xl tracking-tight">{settings?.clinicName || 'Clínica Hope'}</span>
            </div>
            <div className="flex flex-wrap gap-6 text-on-surface-variant text-sm font-medium">
              {navItems.map(item => (
                <button key={item.id} onClick={() => onNavigate(item.id)} className="hover:text-primary hover:underline transition-all">
                  {item.label}
                </button>
              ))}
              <button 
                onClick={() => onNavigate(Screen.Admin, 'push')}
                className="hover:text-primary transition-colors italic opacity-50"
              >
                Painel Admin
              </button>
            </div>
            
            {settings?.insurancePlans && settings.insurancePlans.length > 0 && (
              <div className="flex flex-wrap gap-6 pt-6 border-t border-outline-variant/20">
                {settings.insurancePlans.map(plan => (
                  <div key={plan.id} className="flex flex-col items-center gap-1 group">
                    <img 
                      src={plan.logo} 
                      alt={plan.name} 
                      className="h-8 md:h-10 w-auto object-contain transition-all group-hover:scale-110" 
                      title={plan.name}
                    />
                    <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/70 group-hover:text-primary transition-colors">
                      {plan.name}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="md:text-right space-y-4">
            <p className="text-on-surface-variant text-sm">{settings?.footerRights || '© 2022 Clínica Hope. Todos os direitos reservados.'}</p>
            <p className="text-[10px] uppercase tracking-widest text-on-surface-variant/40">{settings?.address || 'Pagani, Palhoça – SC'}</p>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 mt-12 pt-8 border-t border-outline-variant/10">
          <p className="text-[11px] text-on-surface-variant/50 text-center max-w-5xl mx-auto leading-relaxed">
            Todos os profissionais atuam de forma autônoma e independente, sendo responsáveis por seus próprios atendimentos, conduzidos em conformidade com o Código de Ética Profissional do Psicólogo e com respeito ao sigilo profissional.
            A responsabilidade técnica e ética pelos atendimentos é exclusiva de cada profissional, não cabendo à clínica ingerência sobre a condução dos casos.
          </p>
        </div>
      </footer>
    </div>
  );
}


// ---
interface ScreenProps {
  onNavigate: (screen: Screen, transition?: TransitionType, scroll?: boolean) => void;
}

interface HomeProps extends ScreenProps {
  settings: HomeSettings;
  approaches: Approach[];
  isAdminUnlocked: boolean;
}

function HomeScreen({ onNavigate, settings, approaches, specialists, isAdminUnlocked }: HomeProps & { specialists: Specialist[] }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (specialists.length === 0) return;
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % specialists.length);
    }, 3000); // 3 segundos conforme solicitado
    return () => clearInterval(timer);
  }, [specialists.length]);

  return (
    <Layout activeScreen={Screen.Home} onNavigate={onNavigate} settings={settings}>
      {/* Modern Hero Section */}
      <section className="relative px-6 py-12 md:py-24 lg:py-32 overflow-hidden bg-background">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 lg:gap-16 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -30 }} 
            animate={{ opacity: 1, x: 0 }}
            className="z-10 space-y-8"
          >
            <span className="inline-block px-4 py-1.5 rounded-full bg-secondary-container text-on-secondary-container text-xs font-bold uppercase tracking-widest shadow-sm">
              {settings.heroSubtitle}
            </span>
            <h1 className="text-5xl md:text-7xl font-extrabold text-primary leading-[1.1] tracking-tight">
              {settings.heroTitle}
            </h1>
            <p className="text-lg md:text-xl text-on-surface-variant font-medium leading-relaxed max-w-lg">
              {settings.heroText}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button 
                onClick={() => onNavigate(Screen.CorpoClinico, 'push', true)}
                className="btn-primary shadow-xl"
              >
                Agendar Consulta
              </button>
              <button 
                onClick={() => onNavigate(Screen.Abordagens, 'push')}
                className="btn-secondary"
              >
                Abordagens
              </button>
            </div>

            {settings?.insurancePlans && settings.insurancePlans.length > 0 && (
              <div className="pt-12 border-t border-outline-variant/30">
                <p className="text-[10px] uppercase font-bold tracking-[0.2em] text-on-surface-variant/50 mb-6 font-mono">Convênios que aceitamos</p>
                <div className="flex flex-wrap gap-x-12 gap-y-10 items-end transition-all duration-500">
                  {settings.insurancePlans.map(plan => (
                    <div key={plan.id} className="flex flex-col items-center gap-3 group">
                      <img 
                        src={plan.logo} 
                        alt={plan.name} 
                        className="h-10 md:h-14 w-auto object-contain group-hover:scale-110 transition-transform duration-300" 
                        title={plan.name} 
                      />
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant/70 group-hover:text-primary transition-colors text-center max-w-[100px]">
                        {plan.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative"
          >
            <div className="aspect-square rounded-[4rem] overflow-hidden soft-shadow relative z-10 border border-outline-variant/30">
              <img 
                src={settings.heroImageUrl} 
                className="w-full h-full object-cover transition-transform duration-[5s] hover:scale-105"
                alt="Clínica Interior"
              />
            </div>
            <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-secondary-container rounded-full -z-10 opacity-40 blur-3xl"></div>
            <div className="absolute -top-10 -left-10 w-48 h-48 bg-primary-container rounded-full -z-10 opacity-30 blur-2xl"></div>
          </motion.div>
        </div>
      </section>

      {/* Simplified Approaches Section */}
      <section className="section-padding bg-white">
        <div className="max-w-7xl mx-auto space-y-20">
          <div className="flex flex-col md:flex-row justify-between items-end gap-8">
            <div className="space-y-4">
              <h2 className="text-4xl font-bold text-primary tracking-tight">Abordagens</h2>
              <p className="text-on-surface-variant max-w-xl font-medium">Diferentes perspectivas clínicas para atender à sua complexidade individual.</p>
            </div>
            <button 
              onClick={() => onNavigate(Screen.Abordagens, 'push')}
              className="text-primary font-bold flex items-center gap-2 hover:underline transition-all"
            >
              Ver todas fundamentações <ArrowForward size={20} />
            </button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {approaches.slice(0, 4).map((app, idx) => (
              <div 
                key={app.id} 
                className="bg-surface-container p-8 rounded-[2.5rem] group hover:bg-white hover:soft-shadow hover:translate-y-[-8px] transition-all duration-500 border border-transparent hover:border-outline-variant/30"
              >
                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-primary mb-8 group-hover:bg-secondary-container transition-colors">
                  {idx === 0 && <Psychology size={28} />}
                  {idx === 1 && <Group size={28} />}
                  {idx === 2 && <Favorite size={28} />}
                  {idx === 3 && <Spa size={28} />}
                </div>
                <h4 className="text-xl font-bold text-primary mb-4">{app.title}</h4>
                <p className="text-on-surface-variant font-medium text-sm leading-relaxed mb-6 italic opacity-60">
                   {app.desc}
                </p>
                <ArrowForward size={18} className="text-primary opacity-0 group-hover:opacity-100 transition-all" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Compact Equipe Section - Carousel */}
      <section className="section-padding bg-surface-container-low border-y border-outline-variant/30 overflow-hidden">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="text-center">
            <h2 className="text-4xl font-bold text-primary tracking-tight">Especialistas</h2>
          </div>
          
          <div className="relative max-w-md mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={index}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
              >
                {specialists.length > 0 && (
                  <SpecialistCard 
                    spec={specialists[index]} 
                    insurancePlans={settings.insurancePlans || []}
                    isAdminUnlocked={isAdminUnlocked}
                  />
                )}
              </motion.div>
            </AnimatePresence>

            {/* Navigation Dots */}
            <div className="flex justify-center gap-3 mt-10">
              {specialists.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setIndex(i)}
                  className={`h-1.5 rounded-full transition-all duration-500 ${
                    index === i ? 'bg-primary w-8' : 'bg-outline-variant w-2'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>
      
      {/* Testimonials (Google My Business Style) */}
      <section className="section-padding bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center space-y-4">
            <div className="flex justify-center items-center gap-2 mb-4">
              <div className="flex text-[#FBBC05]">
                {[...Array(5)].map((_, i) => <Star key={i} size={20} fill="currentColor" />)}
              </div>
              <span className="font-bold text-on-surface-variant">5.0</span>
            </div>
            <h2 className="text-4xl font-bold text-primary tracking-tight">O que dizem nossos pacientes</h2>
            <p className="text-on-surface-variant/70 font-medium">Avaliações reais compartilhadas no Google</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {DEFAULT_TESTIMONIALS.map(item => (
              <div key={item.id} className="bg-surface-container-low p-8 rounded-[2.5rem] border border-outline-variant/30 flex flex-col justify-between hover:soft-shadow transition-all group">
                <div className="space-y-6">
                  <div className="flex justify-between items-start">
                    <div className="flex gap-1 text-[#FBBC05]">
                      {[...Array(item.rating)].map((_, i) => <Star key={i} size={14} fill="currentColor" />)}
                    </div>
                    <div className="w-5 h-5 opacity-40 group-hover:opacity-100 transition-opacity">
                      <svg viewBox="0 0 24 24" fill="currentColor"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/></svg>
                    </div>
                  </div>
                  <p className="text-on-surface-variant font-medium leading-relaxed italic text-sm">"{item.text}"</p>
                </div>
                <div className="flex items-center gap-4 mt-8 pt-6 border-t border-outline-variant/10">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold text-xs">
                    {item.avatar}
                  </div>
                  <div>
                    <h5 className="text-sm font-bold text-primary">{item.author}</h5>
                    <p className="text-[10px] text-on-surface-variant/60 font-medium uppercase tracking-wider">{item.date}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center pt-8">
            <a 
              href="https://maps.app.goo.gl/qnU86jo4xeY7dz7V8" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 text-sm font-bold text-primary hover:underline group"
            >
              Ver todas as avaliações no Google <ArrowForward size={16} className="group-hover:translate-x-1 transition-transform" />
            </a>
          </div>
        </div>
      </section>

      {/* Material CTA */}
      <section className="section-padding">
        <div className="max-w-5xl mx-auto bg-primary text-white rounded-[3rem] md:rounded-[3.5rem] p-8 sm:p-12 md:p-20 relative overflow-hidden shadow-2xl text-center group">
          <div className="relative z-10 space-y-8">
            <h2 className="text-3xl md:text-6xl font-bold tracking-tight">Pronto para dar o próximo passo?</h2>
            <p className="text-lg md:text-xl text-on-primary-container/80 max-w-2xl mx-auto font-medium">
               A jornada do equilíbrio começa com um acolhimento respeitoso. Agende sua consulta e dê o seu primeiro passo!
            </p>
            <button 
              onClick={() => onNavigate(Screen.CorpoClinico, 'push', true)}
              className="bg-white text-primary px-12 py-6 rounded-2xl font-bold text-lg hover:shadow-2xl transition-all active:scale-95 group-hover:scale-105"
            >
              Agendar agora!
            </button>
          </div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-[80px]"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-secondary-container/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-[60px]"></div>
        </div>
      </section>
    </Layout>
  );
}

function AbordagensScreen({ onNavigate, approaches, settings }: { onNavigate: (screen: Screen, transition?: TransitionType) => void; approaches: Approach[]; settings: HomeSettings }) {
  return (
    <Layout activeScreen={Screen.Abordagens} onNavigate={onNavigate} settings={settings}>
      <header className="section-padding bg-background pt-32">
        <div className="max-w-7xl mx-auto text-center space-y-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <span className="inline-block px-4 py-1.5 rounded-full bg-primary-container text-white text-[10px] font-bold uppercase tracking-widest shadow-sm">
              Tipos de Terapia
            </span>
            <h1 className="text-5xl md:text-7xl font-extrabold text-primary tracking-tight mt-8">Ciência & <span className="text-secondary italic">Acolhimento</span></h1>
            <p className="text-lg md:text-xl text-on-surface-variant font-medium max-w-2xl mx-auto mt-8 leading-relaxed">
              Entenda as principais abordagens da psicologia, como funcionam e para quais situações cada uma pode ser mais indicada.
            </p>
          </motion.div>
        </div>
      </header>

      <section className="section-padding">
        <div className="max-w-7xl mx-auto space-y-32">
          {approaches.map((app, idx) => (
            <motion.div 
              key={app.id} 
              initial={{ opacity: 0, scale: 0.98 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className={`flex flex-col ${idx % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'} gap-16 items-center`}
            >
              <div className="flex-1 space-y-8">
                <div className="space-y-4">
                  <span className="text-xs font-mono font-bold text-secondary uppercase tracking-widest">Abordagem {idx + 1}</span>
                  <h3 className="text-4xl md:text-5xl font-bold text-primary tracking-tight">{app.title}</h3>
                  <p className="text-xl font-medium text-secondary italic leading-relaxed py-4 border-l-4 border-secondary/20 pl-6">
                    {app.desc}
                  </p>
                </div>
                <div className="p-8 bg-surface-container rounded-[2.5rem] border border-outline-variant/30 space-y-6">
                  <p className="text-on-surface-variant font-medium leading-loose">
                    {app.details}
                  </p>
                </div>
              </div>
              
              <div className="flex-1 w-full flex justify-center">
                 <div className="w-full max-w-[500px] aspect-square rounded-[4rem] bg-secondary-container/20 flex items-center justify-center relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5 group-hover:opacity-0 transition-opacity"></div>
                    {idx % 4 === 0 && <Psychology size={180} className="text-primary/10 group-hover:text-primary/20 transition-colors" />}
                    {idx % 4 === 1 && <Group size={180} className="text-primary/10 group-hover:text-primary/20 transition-colors" />}
                    {idx % 4 === 2 && <Favorite size={180} className="text-primary/10 group-hover:text-primary/20 transition-colors" />}
                    {idx % 4 === 3 && <Spa size={180} className="text-primary/10 group-hover:text-primary/20 transition-colors" />}
                    
                    <div className="absolute bottom-10 left-10 right-10 p-6 bg-white/80 backdrop-blur-md rounded-3xl border border-white/50 text-center font-bold text-primary shadow-xl">
                      Prática Baseada em Evidências
                    </div>
                 </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="section-padding bg-primary text-white">
        <div className="max-w-5xl mx-auto text-center space-y-12">
           <h3 className="text-4xl md:text-5xl font-bold tracking-tight italic">"O segredo da mudança é a construção do novo."</h3>
           <div className="w-16 h-1.5 bg-secondary mx-auto rounded-full"></div>
           <button onClick={() => onNavigate(Screen.CorpoClinico, 'push')} className="btn-secondary !bg-white !text-primary transform hover:scale-105">Iniciar Jornada</button>
        </div>
      </section>
    </Layout>
  );
}

function SEOScreen({ onNavigate, settings }: ScreenProps & { settings: HomeSettings }) {
  return (
    <Layout activeScreen={Screen.SEO} onNavigate={onNavigate} settings={settings}>
      <header className="px-6 py-16 md:py-40 bg-surface-container-low overflow-hidden relative">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 lg:gap-20 items-center relative z-10">
          <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} className="space-y-10">
            <span className="inline-block px-4 py-1.5 rounded-full bg-secondary-container text-on-secondary-container text-xs font-bold uppercase tracking-widest">
              Psicologia em Palhoça
            </span>
            <h1 className="text-5xl md:text-8xl font-black text-primary leading-tight tracking-tighter">
              {settings.seoTitle || 'Um ambiente pensado para o cuidado com você'}
            </h1>
            <p className="text-xl text-on-surface-variant font-medium leading-relaxed max-w-xl">
              {settings.seoText || 'Localizada no Pagani, a Clínica Hope oferece um espaço acolhedor, reservado e cuidadosamente preparado para atendimentos psicológicos, proporcionando conforto, privacidade e uma experiência tranquila desde a chegada.'}
            </p>
            <div className="flex flex-wrap gap-4">
               {[
                 { icon: <Wifi size={20} />, label: 'Wi-Fi' },
                 { icon: <ConciergeBell size={20} />, label: 'Recepção' },
                 { icon: <Volume2 size={20} />, label: 'Isolamento Acústico' },
                 { icon: <Snowflake size={20} />, label: 'Ar Condicionado' },
                 { icon: <ParkingCircle size={20} />, label: 'Estacionamento' },
                 { icon: <ShieldCheck size={20} />, label: 'Portaria 24h' }
               ].map((item, index) => (
                 <div key={index} className="group relative">
                   <div className="p-4 bg-white rounded-2xl shadow-sm border border-outline-variant/30 text-primary hover:bg-secondary/10 hover:text-secondary transition-all duration-300">
                     {item.icon}
                   </div>
                   <span className="absolute -top-10 left-1/2 -translate-x-1/2 px-3 py-1 bg-primary text-white text-[10px] font-bold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                     {item.label}
                   </span>
                 </div>
               ))}
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="relative">
             <div className="aspect-[4/5] rounded-[3rem] md:rounded-[4rem] overflow-hidden soft-shadow border-4 border-white">
                <img src={settings.heroImageUrl || "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=2069"} className="w-full h-full object-cover" alt="Clinica Interior" />
             </div>
             <div className="absolute -bottom-6 -right-2 md:-right-6 bg-primary text-white p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] shadow-2xl space-y-2">
                <p className="text-[10px] md:text-xs font-bold uppercase tracking-widest opacity-60">Endereço</p>
                <p className="text-base md:text-lg font-bold">{settings.address || 'Bairro Pagani, Palhoça/SC'}</p>
             </div>
          </motion.div>
        </div>
      </header>

      <section className="section-padding bg-white">
        <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-8">
           {[
             { title: 'Localização Estratégica', desc: 'Situada no Pagani, ponto de fácil acesso para moradores de toda a Grande Florianópolis.', icon: <LocationOn size={32} /> },
             { title: 'Conforto Sensorial', desc: 'Salas projetadas para minimizar estímulos ansiosos e promover a introspecção.', icon: <Spa size={32} /> },
             { title: 'Privacidade Total', desc: 'Fluxo planejado para garantir a máxima discrição em sua chegada e saída.', icon: <VerifiedUser size={32} /> }
           ].map((item, i) => (
             <div key={i} className="p-10 bg-surface-container rounded-[3rem] space-y-6 hover:bg-secondary-container transition-colors group">
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-primary group-hover:scale-110 transition-transform shadow-sm">
                  {item.icon}
                </div>
                <h3 className="text-2xl font-bold text-primary">{item.title}</h3>
                <p className="text-on-surface-variant font-medium leading-relaxed">{item.desc}</p>
             </div>
           ))}
        </div>
      </section>

      <section className="section-padding bg-surface-container-low border-t border-outline-variant/30">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="text-center space-y-4">
            <h2 className="text-4xl font-bold text-primary tracking-tight">O que dizem sobre nós</h2>
            <p className="text-on-surface-variant font-medium">Experiências reais compartilhas no Google</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {DEFAULT_TESTIMONIALS.map(item => (
              <div key={item.id} className="bg-white p-8 rounded-[2.5rem] border border-outline-variant/30 flex flex-col justify-between hover:soft-shadow transition-all group">
                <div className="space-y-6">
                  <div className="flex gap-1 text-secondary">
                    {[...Array(item.rating)].map((_, i) => <Star key={i} size={16} fill="currentColor" />)}
                  </div>
                  <p className="text-on-surface-variant font-medium leading-relaxed italic text-sm">"{item.text}"</p>
                </div>
                <div className="flex items-center gap-4 mt-8 pt-6 border-t border-outline-variant/10">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold text-xs">
                    {item.avatar}
                  </div>
                  <div>
                    <h5 className="text-sm font-bold text-primary">{item.author}</h5>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-center pt-8">
            <a 
              href="https://maps.app.goo.gl/qnU86jo4xeY7dz7V8" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white border border-outline-variant/50 rounded-2xl text-primary font-bold text-sm hover:soft-shadow transition-all group"
            >
              Ver todas as avaliações no Google
              <ArrowForward size={16} className="group-hover:translate-x-1 transition-transform" />
            </a>
          </div>
        </div>
      </section>

    </Layout>
  );
}

interface CorpoClinicoProps extends ScreenProps {
  specialists: Specialist[];
  approaches: Approach[];
  settings: HomeSettings;
  isAdminUnlocked: boolean;
  shouldScrollToList?: boolean;
}

interface SpecialistCardProps {
  spec: Specialist;
  insurancePlans: InsurancePlan[];
  isAdminUnlocked?: boolean;
}

function SpecialistCard({ spec, insurancePlans, isAdminUnlocked }: SpecialistCardProps) {
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [sheetSchedule, setSheetSchedule] = useState<Specialist['schedule'] | null>(null);
  const [isLoadingSheet, setIsLoadingSheet] = useState(false);
  const [sheetError, setSheetError] = useState<string | null>(null);

  useEffect(() => {
    if (spec.googleAppsScriptUrl) {
      const fetchSheetData = async () => {
        setIsLoadingSheet(true);
        setSheetError(null);
        try {
          const baseUrl = (spec.googleAppsScriptUrl || '').trim();
          if (!baseUrl) {
            setIsLoadingSheet(false);
            return;
          }
          
          if (!baseUrl.endsWith('/exec')) {
            throw new Error('A URL não termina em /exec. Verifique se você copiou o link de "App da Web" em vez do link da planilha.');
          }

          const scriptUrl = baseUrl.includes('?') ? `${baseUrl}&mode=agenda` : `${baseUrl}?mode=agenda`;
          const url = `/api/proxy-sheet?url=${encodeURIComponent(scriptUrl)}`;
          
          let appointments: any[] = [];

          try {
            const response = await fetch(url).catch(() => null);
            
            if (response && response.ok) {
              try {
                const result = await response.json();
                appointments = Array.isArray(result) ? result : (result.data || []);
              } catch (e) {
                console.warn("Proxy returned non-JSON, likely Cookie Check page. Switching to JSONP.");
                // Fallback handled below because appointments will be empty
              }
            }
            
            if (appointments.length === 0) {
              // Se o proxy falhar ou retornar HTML, tentamos JSONP direto do navegador
              const jsonpUrl = baseUrl.includes('?') 
                ? `${baseUrl}&action=getDadosDaAgenda` 
                : `${baseUrl}?action=getDadosDaAgenda`;
              
              const jsonpData = await new Promise<any>((resolve) => {
                const callbackName = `bg_cb_${Date.now()}`;
                const script = document.createElement('script');
                script.src = `${jsonpUrl}&callback=${callbackName}`;
                (window as any)[callbackName] = (res: any) => {
                  document.body.removeChild(script);
                  delete (window as any)[callbackName];
                  resolve(res);
                };
                setTimeout(() => {
                  if ((window as any)[callbackName]) {
                    document.body.removeChild(script);
                    delete (window as any)[callbackName];
                    resolve(null);
                  }
                }, 45000);
                document.body.appendChild(script);
              });

              if (jsonpData) {
                appointments = Array.isArray(jsonpData) ? jsonpData : (jsonpData.data || []);
              }
            }
          } catch (e) {
            console.error("Erro na sincronização:", e);
          }

          const newSchedule: NonNullable<Specialist['schedule']> = {};

          if (Array.isArray(appointments) && appointments.length > 0) {
            appointments.forEach((row: any) => {
              if (!row) return;
              
              const dayRaw = row.dia || row["Dia da Semana"] || row.Day;
              let time = row.horario || row["Horário"] || row.Time;
              const status = row.paciente || row["Paciente"] || row.Status;
              
              if (!dayRaw || !time) return;

              // Extract time HH:mm even if it comes with dates like "30/12/1899 18:53"
              const timeStr = time.toString();
              const timeMatch = timeStr.match(/(\d{1,2}:\d{2})/);
              const processedTime = timeMatch ? timeMatch[1] : timeStr;

              const dayMap: {[key: string]: string} = {
                'segunda': 'Segunda', 'segunda-feira': 'Segunda',
                'terça': 'Terça', 'terça-feira': 'Terça',
                'quarta': 'Quarta', 'quarta-feira': 'Quarta',
                'quinta': 'Quinta', 'quinta-feira': 'Quinta',
                'sexta': 'Sexta', 'sexta-feira': 'Sexta',
                'sábado': 'Sábado', 'sabado': 'Sábado'
              };
              const dayKey = dayRaw.toString().toLowerCase().trim();
              const day = dayMap[dayKey] || (dayRaw.charAt(0).toUpperCase() + dayRaw.slice(1).toLowerCase());
              
              // FILTER: Only free slots
              if (status === '💚' || (status && status.toString().includes('💚'))) {
                if (!newSchedule[day]) {
                  newSchedule[day] = { periods: {} };
                }

                const hourMatch = processedTime.match(/(\d{1,2})/);
                if (hourMatch) {
                  const hour = parseInt(hourMatch[1]);
                  let shift: Shift = Shift.Afternoon;
                  
                  if (hour >= 7 && hour < 13) shift = Shift.Morning;
                  else if (hour >= 13 && hour < 18) shift = Shift.Afternoon;
                  else if (hour >= 18 && hour <= 22) shift = Shift.Night;

                  if (!newSchedule[day].periods[shift]) {
                    newSchedule[day].periods[shift] = [];
                  }
                  
                  if (!newSchedule[day].periods[shift]?.includes(processedTime)) {
                    newSchedule[day].periods[shift]?.push(processedTime);
                  }
                }
              }
            });
          }

          // Sort times within periods
          Object.keys(newSchedule).forEach(day => {
            Object.keys(newSchedule[day].periods).forEach(p => {
              const shift = p as Shift;
              newSchedule[day].periods[shift]?.sort();
            });
          });

          if (Object.keys(newSchedule).length > 0) {
            setSheetSchedule(newSchedule);
          } else {
            setSheetSchedule({}); // Sucesso, mas sem horários livres
          }
        } catch (error) {
          console.error('Erro ao buscar dados da planilha:', error);
          let message = 'Erro na integração';
          if (error instanceof TypeError && error.message.includes('fetch')) {
            message = 'Bloqueio de conexão (CORS). Verifique se o Script foi publicado como Web App para "Qualquer pessoa" e se a URL termina em /exec';
          } else {
            message = error instanceof Error ? error.message : 'Erro na integração';
          }
          setSheetError(message);
        } finally {
          setIsLoadingSheet(false);
        }
      };

      fetchSheetData();
      const interval = setInterval(fetchSheetData, 300000);
      return () => clearInterval(interval);
    } else if (spec.googleSheetsId) {
      // Fallback to direct CSV if still present and Apps Script URL is not
      const fetchSheetData = async () => {
        setIsLoadingSheet(true);
        setSheetError(null);
        try {
          let sheetId = spec.googleSheetsId || '';
          if (sheetId.includes('/d/')) {
            const parts = sheetId.split('/d/');
            if (parts.length > 1) sheetId = parts[1].split('/')[0];
          }
          const tabName = spec.googleSheetsTab || 'Agenda';
          const url = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&sheet=${encodeURIComponent(tabName)}`;
          const response = await fetch(url);
          if (!response.ok) throw new Error('Acesso negado à planilha');
          const csvText = await response.text();
          
          const rows = csvText.split(/\r?\n/)
            .map(row => row.split(',').map(cell => cell.replace(/^"|"$/g, '').trim()))
            .filter(row => row.length >= 3 && row[0] !== '');

          const newSchedule: NonNullable<Specialist['schedule']> = {};
          rows.slice(1).forEach(row => {
            const [dayRaw, time, status] = row;
            if (!dayRaw || !time) return;
            const dayMap: {[key: string]: string} = {
              'segunda': 'Segunda', 'segunda-feira': 'Segunda',
              'terça': 'Terça', 'terça-feira': 'Terça',
              'quarta': 'Quarta', 'quarta-feira': 'Quarta',
              'quinta': 'Quinta', 'quinta-feira': 'Quinta',
              'sexta': 'Sexta', 'sexta-feira': 'Sexta',
              'sábado': 'Sábado', 'sabado': 'Sábado'
            };
            const dayKey = dayRaw.toLowerCase().trim();
            const day = dayMap[dayKey] || (dayRaw.charAt(0).toUpperCase() + dayRaw.slice(1).toLowerCase());
            if (status && status.includes('💚')) {
              if (!newSchedule[day]) newSchedule[day] = { periods: {} };
              const hourMatch = time.match(/(\d{1,2})/);
              if (hourMatch) {
                const hour = parseInt(hourMatch[1]);
                let shift: Shift = Shift.Afternoon;
                if (hour >= 7 && hour < 13) shift = Shift.Morning;
                else if (hour >= 13 && hour < 18) shift = Shift.Afternoon;
                else if (hour >= 18 && hour <= 22) shift = Shift.Night;
                if (!newSchedule[day].periods[shift]) newSchedule[day].periods[shift] = [];
                if (!newSchedule[day].periods[shift]?.includes(time)) newSchedule[day].periods[shift]?.push(time);
              }
            }
          });
          Object.keys(newSchedule).forEach(day => {
            Object.keys(newSchedule[day].periods).forEach(p => {
              const shift = p as Shift;
              newSchedule[day].periods[shift]?.sort();
            });
          });
          if (Object.keys(newSchedule).length > 0) {
            setSheetSchedule(newSchedule);
          } else {
            setSheetSchedule({});
          }
        } catch (error) {
          setSheetError(error instanceof Error ? error.message : 'Erro na integração');
        } finally {
          setIsLoadingSheet(false);
        }
      };
      fetchSheetData();
    }
  }, [spec.googleAppsScriptUrl, spec.googleSheetsId, spec.googleSheetsTab]);

  // Só mostra a agenda se houver dados e não houver erro de conexão (ou se for admin querendo ver o erro)
  const hasValidData = sheetSchedule && Object.keys(sheetSchedule).length > 0;
  const hasAnySchedule = hasValidData || (spec.schedule && Object.keys(spec.schedule).length > 0);
  
  // Sincronização concluída (seja com erro, com dados ou vazio)
  const isSyncComplete = !isLoadingSheet && (sheetSchedule !== null || sheetError !== null);
  
  // Agenda está "cheia" quando tentamos buscar e não encontramos nada (e não há agenda manual)
  const isAgendaFull = isSyncComplete && !hasAnySchedule && !sheetError && (spec.googleAppsScriptUrl || spec.googleSheetsId);

  const showAgendaSection = (hasAnySchedule || isAgendaFull) && !sheetError;
  
  // No modo Admin, mostramos a seção mesmo com erro para que o administrador saiba o que corrigir
  const displayAgenda = isAdminUnlocked ? (isSyncComplete || sheetError) : showAgendaSection;

  const canBook = selectedDay && selectedTime && selectedPlan;

  const getSpecialtyIcon = (specialty: string) => {
    const s = specialty.toLowerCase();
    if (s.includes('infant') || s.includes('criança') || s.includes('baby')) return <Baby size={14} />;
    if (s.includes('casal') || s.includes('família') || s.includes('relacionamento')) return <Heart size={14} />;
    if (s.includes('neuro') || s.includes('cognitiva') || s.includes('tcc') || s.includes('psicanálise')) return <Brain size={14} />;
    if (s.includes('organizacional') || s.includes('trabalho') || s.includes('carreira')) return <Briefcase size={14} />;
    if (s.includes('pedagogia') || s.includes('escolar') || s.includes('aprendizagem')) return <GraduationCap size={14} />;
    if (s.includes('clínica') || s.includes('hospitalar') || s.includes('saúde')) return <Stethoscope size={14} />;
    return <User size={14} />;
  };

  const handleWhatsAppClick = () => {
    if (!canBook) return;
    const message = `Olá, estou vindo pelo site. Gostaria de agendar com a ${spec.name} na ${selectedDay} às ${selectedTime} (${selectedPlan}). Por gentileza, quais documentos necessito para finalizar este agendamento?`;
    window.open(`https://wa.me/5548999549041?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <motion.div 
      layout
      className="bg-white rounded-[3rem] overflow-hidden soft-shadow border border-outline-variant/30 flex flex-col group"
    >
      <div className="h-96 relative overflow-hidden grayscale group-hover:grayscale-0 transition-all duration-700">
        <img src={spec.img} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" />
        <div className="absolute top-6 right-6 bg-white/90 backdrop-blur px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest text-primary border border-white">
          CRP {spec.crp}
        </div>
      </div>
      <div className="p-8 space-y-6 flex-grow flex flex-col justify-between">
        <div className="space-y-4">
          <div className="flex justify-between items-start">
            <h4 className="text-2xl font-bold text-primary">{spec.name}</h4>
            <Verified size={20} className="text-secondary" />
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary-container text-white text-[10px] font-bold uppercase tracking-widest rounded-full">
              {getSpecialtyIcon(spec.spec)}
              {spec.spec}
            </span>
          </div>
          <p className="text-on-surface-variant text-sm font-medium leading-relaxed italic line-clamp-3">"{spec.desc}"</p>
        </div>
        
        <div className="space-y-6">
          <div className="flex flex-wrap gap-2">
            {spec.ageGroups.map(g => (
              <span key={g} className="inline-flex items-center gap-1.5 bg-surface-container text-on-surface-variant px-3 py-1 rounded-full text-[10px] font-bold uppercase">
                {g.toLowerCase().includes('criança') && <Baby size={12} />}
                {g.toLowerCase().includes('adolescente') && <Users size={12} />}
                {g.toLowerCase().includes('adulto') && <User size={12} />}
                {g.toLowerCase().includes('idoso') && <Users size={12} />}
                {g}
              </span>
            ))}
          </div>

          {displayAgenda && (
            <div className="pt-6 border-t border-outline-variant/30 space-y-4">
              {spec.attendedAges && spec.attendedAges.length > 0 && (
                <div className="flex items-center gap-3 mb-4 p-3 rounded-2xl bg-white border border-secondary/10 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                  <div className="h-6 w-6 rounded-full bg-secondary flex items-center justify-center shadow-md">
                    <VerifiedUser size={12} className="text-white" />
                  </div>
                  <p className="text-[11px] font-bold text-primary/90">
                    Atendimento especializado a partir de <span className="text-secondary font-black underline underline-offset-4 decoration-secondary/30">{Math.min(...spec.attendedAges)}</span> anos
                  </p>
                </div>
              )}
              {isAdminUnlocked && (spec.googleSheetsId || spec.googleAppsScriptUrl) && (
                <div className="flex items-center gap-2 mb-2 px-2">
                  <div className={`w-1.5 h-1.5 rounded-full ${isLoadingSheet ? 'bg-amber-500 animate-pulse' : (sheetError ? 'bg-red-500' : 'bg-green-500')}`} />
                  <p className={`text-[9px] font-bold uppercase tracking-widest ${sheetError ? 'text-red-500/80' : 'text-on-surface-variant/60'}`}>
                    {isLoadingSheet ? 'Sincronizando Agenda...' : (sheetError ? `Aviso Admin: ${sheetError}` : (spec.googleAppsScriptUrl ? 'Agenda Conectada (Web App)' : 'Planilha Conectada'))}
                  </p>
                </div>
              )}

              {sheetError && isAdminUnlocked ? (
                <div className="p-4 bg-red-50 rounded-2xl border border-red-100 animate-in fade-in duration-500">
                  <p className="text-[10px] text-red-600 font-bold uppercase mb-1">Erro Admin Sincronização:</p>
                  <p className="text-xs text-red-500 leading-tight mb-2">{sheetError}</p>
                  <p className="text-[9px] text-red-400 italic">Este aviso não aparece para o público. O público não vê a agenda se houver erro.</p>
                </div>
              ) : isAgendaFull ? (
                <div className="pt-2 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                  <div className="flex flex-col items-center text-center space-y-4 py-6 px-6 bg-secondary/5 rounded-3xl border border-secondary/10">
                    <div className="w-14 h-14 bg-secondary/10 flex items-center justify-center rounded-full text-secondary">
                        <CalendarMonth size={28} />
                    </div>
                    <div className="space-y-1">
                      <p className="font-black text-secondary text-xs uppercase tracking-widest">Agenda Completa</p>
                      <p className="text-[11px] font-medium text-primary/70 leading-relaxed">No momento, esta especialista não possui horários disponíveis para agendamento imediato.</p>
                    </div>
                    
                    <a 
                      href={`https://wa.me/5548999549041?text=${encodeURIComponent(`Olá estou vindo pelo site e gostaria de ficar na fila de espera com o Psi ${spec.name}`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center justify-center gap-3 bg-[#25D366] text-white py-4 rounded-2xl font-bold text-sm shadow-lg shadow-green-200 hover:scale-[1.02] transition-all hover:shadow-green-300"
                    >
                      <Chat size={20} />
                      Lista de Espera
                    </a>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-secondary">Agendar Horário</p>
                  
                  <div className="space-y-4 pt-4">
                    {/* Day Selection */}
                    <div className="flex flex-wrap gap-2">
                      {Object.keys(sheetSchedule || spec.schedule || {})
                        .sort((a, b) => {
                          const days = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
                          return days.indexOf(a) - days.indexOf(b);
                        })
                        .map(day => (
                          <button
                            key={day}
                            onClick={() => {
                              setSelectedDay(day === selectedDay ? null : day);
                              setSelectedTime(null);
                            }}
                            className={`px-4 py-2.5 rounded-xl text-[10px] font-bold transition-all border ${
                              selectedDay === day 
                              ? 'bg-primary text-white border-primary shadow-md' 
                              : 'bg-surface-container text-primary border-outline-variant/30 hover:border-primary/50'
                            }`}
                          >
                            {day}
                          </button>
                        ))}
                    </div>

                    {/* Time Selection */}
                    {selectedDay && (sheetSchedule || spec.schedule)?.[selectedDay] && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }} 
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 bg-surface-container-lowest rounded-2xl border border-outline-variant/20 space-y-3"
                      >
                        {(Object.entries((sheetSchedule || spec.schedule)![selectedDay].periods) as [Shift, string[]][])
                          .sort(([a], [b]) => {
                            const periods = [Shift.Morning as string, Shift.Afternoon as string, Shift.Night as string];
                            return periods.indexOf(a) - periods.indexOf(b);
                          })
                          .map(([period, times]) => times && times.length > 0 && (
                            <div key={period} className="space-y-1.5">
                              <p className="text-[8px] font-black uppercase text-on-surface-variant/60">{period}</p>
                              <div className="flex flex-wrap gap-2">
                                {times.map(time => (
                                  <button
                                    key={time}
                                    onClick={() => setSelectedTime(time === selectedTime ? null : time)}
                                    className={`px-3 py-2 rounded-lg text-[10px] font-medium transition-all ${
                                      selectedTime === time
                                      ? 'bg-secondary text-white shadow-sm'
                                      : 'bg-white text-primary border border-outline-variant/10 hover:border-secondary/30'
                                    }`}
                                  >
                                    {time}
                                  </button>
                                ))}
                              </div>
                            </div>
                          ))}
                      </motion.div>
                    )}

                {/* Plan Selection */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <p className="text-[9px] font-black uppercase text-on-surface-variant/40">Selecione seu Convênio</p>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setSelectedPlan(selectedPlan === 'Particular' ? null : 'Particular')}
                        className={`p-4 rounded-xl border text-[10px] font-bold transition-all text-center ${
                          selectedPlan === 'Particular'
                          ? 'bg-secondary text-white border-secondary shadow-md'
                          : 'bg-surface-container-low text-primary border-outline-variant/30 hover:border-secondary/20'
                        }`}
                      >
                        Particular
                      </button>
                      {insurancePlans.map(plan => (
                        <button
                          key={plan.id}
                          onClick={() => setSelectedPlan(selectedPlan === plan.name ? null : plan.name)}
                          className={`p-4 rounded-xl border text-[10px] font-bold transition-all flex items-center justify-center gap-2 ${
                            selectedPlan === plan.name
                            ? 'bg-secondary text-white border-secondary shadow-md'
                            : 'bg-surface-container-low text-primary border-outline-variant/30 hover:border-secondary/20'
                          }`}
                        >
                          {plan.logo && (
                            <img 
                              src={plan.logo} 
                              alt={plan.name} 
                              className={`h-5 w-auto object-contain transition-all ${selectedPlan === plan.name ? 'brightness-0 invert' : ''}`} 
                            />
                          )}
                          <span>{plan.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

          {!isAgendaFull && (
            <button 
              disabled={!canBook}
              onClick={handleWhatsAppClick}
              className={`w-full py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 ${
                !canBook 
                ? 'bg-surface-container-highest text-on-surface-variant opacity-50 cursor-not-allowed mt-2' 
                : 'bg-primary text-white hover:shadow-xl hover:-translate-y-0.5 mt-2'
              }`}
            >
              <Chat size={18} />
              {canBook ? 'Agendar via WhatsApp' : 'Selecione dia, hora e plano'}
            </button>
          )}

          {/* Footer Disclaimer */}
          <div className="bg-secondary-container/5 -mx-8 -mb-8 mt-6 p-6 border-t border-secondary/10">
            <div className="space-y-3">
              <p className="text-[11px] font-black uppercase text-secondary tracking-widest flex items-center gap-2">
                 <Info size={14} /> Informação Importante para Planos de Saúde
              </p>
              <p className="text-[10px] text-primary/70 leading-relaxed font-medium">
                Para agendamentos via <span className="font-bold underline text-secondary">plano de saúde</span>, é necessário possuir um encaminhamento médico com <span className="font-bold underline text-secondary">CID</span> indicando o tratamento. Somente com este documento os planos autorizam os atendimentos.
              </p>
              <div className="text-[9px] bg-white/40 p-3 rounded-xl border border-secondary/5 text-primary/60 leading-normal">
                💡 <span className="font-bold">Dica:</span> Se você não tiver o encaminhamento, verifique no aplicativo do seu plano se existe a opção de <span className="font-bold underline">teleatendimento</span>. É um processo rápido que pode auxiliar você neste momento de decisão.
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function CorpoClinicoScreen({ onNavigate, specialists, approaches, settings, isAdminUnlocked, shouldScrollToList }: CorpoClinicoProps) {
  useEffect(() => {
    if (shouldScrollToList) {
      const element = document.getElementById('topo-especialistas');
      if (element) {
        setTimeout(() => {
          const offset = 100;
          const elementPosition = element.getBoundingClientRect().top;
          const offsetPosition = (elementPosition || 0) + window.pageYOffset - offset;
          
          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
          });
        }, 300); // Wait for transition
      }
    } else {
      window.scrollTo(0, 0);
    }
  }, [shouldScrollToList]);

  const [selectedAge, setSelectedAge] = useState<AgeGroup | null>(null);
  const [selectedSpecificAges, setSelectedSpecificAges] = useState<number[]>([]);
  const [selectedShifts, setSelectedShifts] = useState<Shift[]>([]);
  const [step, setStep] = useState<number>(1);

  const { exactMatches, alternativeMatches } = useMemo(() => {
    const perfect = specialists.filter(s => {
      const matchAgeGroup = !selectedAge || s.ageGroups.includes(selectedAge);
      const matchSpecificAge = selectedSpecificAges.length === 0 || 
        (s.attendedAges && selectedSpecificAges.some(age => s.attendedAges?.includes(age)));
      const matchShift = selectedShifts.length === 0 || selectedShifts.some(shift => s.shifts.includes(shift));
      return matchAgeGroup && matchSpecificAge && matchShift;
    });

    const alternatives = perfect.length === 0 ? specialists.filter(s => {
      const matchAgeGroup = !selectedAge || s.ageGroups.includes(selectedAge);
      const matchSpecificAge = selectedSpecificAges.length === 0 || 
        (s.attendedAges && selectedSpecificAges.some(age => s.attendedAges?.includes(age)));
      const hasDifferentShift = selectedShifts.length > 0 && !selectedShifts.some(shift => s.shifts.includes(shift));
      return matchAgeGroup && matchSpecificAge && hasDifferentShift;
    }) : [];

    return { exactMatches: perfect, alternativeMatches: alternatives };
  }, [specialists, selectedAge, selectedSpecificAges, selectedShifts]);

  const hasResults = exactMatches.length > 0;
  const specialistsToShow = hasResults ? exactMatches : alternativeMatches;

  const toggleShift = (shift: Shift) => {
    setSelectedShifts(prev => 
      prev.includes(shift) ? prev.filter(s => s !== shift) : [...prev, shift]
    );
  };

  const toggleSpecificAge = (age: number) => {
    setSelectedSpecificAges(prev => 
      prev.includes(age) ? prev.filter(a => a !== age) : [...prev, age]
    );
  };

  const resetFilters = () => {
    setSelectedAge(null);
    setSelectedSpecificAges([]);
    setSelectedShifts([]);
    setStep(1);
  };

  const handleAgeGroupSelect = (age: AgeGroup) => {
    setSelectedAge(age);
    if (age === AgeGroup.Children || age === AgeGroup.Teens) setStep(1.5);
    else setStep(3);
  };

  return (
    <Layout activeScreen={Screen.CorpoClinico} onNavigate={onNavigate} settings={settings}>
      <header id="topo-especialistas" className="section-padding bg-background pt-32 pb-12">
        <div className="max-w-7xl mx-auto text-center px-6 space-y-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <span className="inline-block px-4 py-1.5 rounded-full bg-secondary-container text-on-secondary-container text-[10px] font-bold uppercase tracking-widest shadow-sm">
              Encontre o especialista certo
            </span>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold text-primary tracking-tight mt-8">Especialistas</h1>
            <p className="text-base md:text-lg text-on-surface-variant font-medium max-w-2xl mx-auto mt-6 leading-relaxed">
              Especialistas dedicados ao acolhimento singular e ético.
            </p>
          </motion.div>
        </div>
      </header>

      {/* Guide Stepper */}
      <section className="px-6 pb-20">
        <div className="max-w-4xl mx-auto bg-white rounded-[3.5rem] shadow-xl border border-outline-variant/30 overflow-hidden">
          <div className="h-2 bg-surface-container">
            <motion.div 
              className="h-full bg-primary"
              animate={{ width: `${(step / 3) * 100}%` }}
            />
          </div>
          
          <div className="p-8 md:p-16 space-y-12">
            <div className="text-center space-y-4">
              <span className="text-xs font-bold text-secondary uppercase tracking-[0.3em]">Passo {Math.floor(step)} de 3</span>
              <h2 className="text-3xl font-bold text-primary">
                {step === 1 && "Quem busca atendimento?"}
                {step === 1.5 && "Qual a idade do paciente?"}
                {step === 3 && "Preferência de horário?"}
              </h2>
            </div>

            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {Object.values(AgeGroup).map(age => (
                    <button 
                      key={age} 
                      onClick={() => handleAgeGroupSelect(age)} 
                      className={`p-8 rounded-[2rem] border-2 flex flex-col items-center gap-4 font-bold text-xl transition-all ${
                        selectedAge === age ? 'bg-primary text-white border-primary shadow-lg scale-105' : 'bg-white border-outline-variant/50 text-primary hover:border-primary'
                      }`}
                    >
                      <div className={`p-4 rounded-2xl ${selectedAge === age ? 'bg-white/20' : 'bg-primary/5'}`}>
                        {age.toLowerCase().includes('criança') && <Baby size={32} />}
                        {age.toLowerCase().includes('adolescente') && <Users size={32} />}
                        {age.toLowerCase().includes('adulto') && <User size={32} />}
                        {age.toLowerCase().includes('idoso') && <Users size={32} />}
                      </div>
                      {age}
                    </button>
                  ))}
                </motion.div>
              )}

              {step === 1.5 && (
                <motion.div key="s15" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                  <div className="flex flex-wrap gap-3 justify-center">
                    {Array.from({ length: 17 }, (_, i) => i + 1).map(age => (
                      <button 
                        key={age} 
                        onClick={() => toggleSpecificAge(age)} 
                        className={`w-12 h-12 rounded-full border-2 font-bold transition-all ${
                          selectedSpecificAges.includes(age) ? 'bg-primary text-white border-primary shadow-md scale-110' : 'bg-white border-outline-variant/50 text-primary'
                        }`}
                      >
                        {age}
                      </button>
                    ))}
                  </div>
                  <div className="flex justify-center">
                    <button onClick={() => setStep(3)} className="btn-primary">Continuar</button>
                  </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div key="s3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-10">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {Object.values(Shift).map(shift => (
                      <button 
                        key={shift} 
                        onClick={() => toggleShift(shift)} 
                        className={`p-8 rounded-[2rem] border-2 flex flex-col items-center gap-4 font-bold transition-all ${
                          selectedShifts.includes(shift) ? 'bg-primary text-white border-primary shadow-lg scale-105' : 'bg-white border-outline-variant/50 text-primary hover:border-primary'
                        }`}
                      >
                        <div className={`p-4 rounded-2xl ${selectedShifts.includes(shift) ? 'bg-white/20' : 'bg-primary/5'}`}>
                          {shift.toLowerCase().includes('manhã') || shift.toLowerCase().includes('matutino') ? <Sun size={32} /> : null}
                          {shift.toLowerCase().includes('tarde') || shift.toLowerCase().includes('vespertino') ? <CloudSun size={32} /> : null}
                          {shift.toLowerCase().includes('noite') || shift.toLowerCase().includes('noturno') ? <Moon size={32} /> : null}
                        </div>
                        {shift}
                      </button>
                    ))}
                  </div>
                  <div className="flex justify-center flex-col sm:flex-row gap-4">
                     <button onClick={resetFilters} className="btn-secondary">Recomeçar</button>
                     <button onClick={() => setStep(4)} className="btn-primary">Ver Resultados</button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Results List */}
        <div id="lista-especialistas" className="max-w-7xl mx-auto mt-32 space-y-20">
          <div className="flex justify-between items-end border-b border-outline-variant/50 pb-8">
            <h2 className="text-4xl font-bold text-primary tracking-tight">Especialistas Recomendados</h2>
            <button onClick={resetFilters} className="text-secondary font-bold text-sm underline">Limpar filtros</button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
             {specialistsToShow.map(spec => (
               <div key={spec.id}>
                 <SpecialistCard 
                   spec={spec} 
                   insurancePlans={settings.insurancePlans || []} 
                   isAdminUnlocked={isAdminUnlocked}
                 />
               </div>
             ))}
          </div>

          {specialistsToShow.length === 0 && (
            <div className="text-center py-20 bg-surface-container-low rounded-[4rem] border-2 border-dashed border-outline-variant/50">
               <SentimentVeryDissatisfied size={64} className="mx-auto text-on-surface-variant/30" />
               <p className="text-xl font-bold text-primary mt-6">Nenhum especialista atende a todos os critérios.</p>
               <button onClick={resetFilters} className="btn-primary mt-8">Tentar outra busca</button>
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
}

function AgendamentoScreen({ onNavigate, settings }: ScreenProps & { settings: HomeSettings }) {
  return (
    <Layout activeScreen={Screen.Agendamento} onNavigate={onNavigate} settings={settings}>
      <header className="section-padding bg-background pt-32">
        <div className="max-w-7xl mx-auto text-center space-y-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <span className="inline-block px-4 py-1.5 rounded-full bg-primary-container text-white text-[10px] font-bold uppercase tracking-widest shadow-sm">
              Inicie sua Jornada
            </span>
            <h1 className="text-5xl md:text-7xl font-extrabold text-primary tracking-tight mt-8">Agende sua <span className="text-secondary italic">Consulta</span></h1>
            <p className="text-lg text-on-surface-variant font-medium max-w-2xl mx-auto mt-8 leading-relaxed">
              O primeiro passo para o equilíbrio emocional começa aqui. Escolha o canal que mais lhe agrada.
            </p>
          </motion.div>
        </div>
      </header>

      <section className="px-6 pb-20">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-8 lg:gap-12 items-start">
          {/* Direct Contact Card */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="bg-primary text-white p-8 sm:p-12 md:p-20 rounded-[3rem] sm:rounded-[4rem] shadow-2xl relative overflow-hidden group">
             <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-[100px] group-hover:scale-110 transition-transform duration-700"></div>
             <div className="relative z-10 space-y-8">
                <h3 className="text-4xl font-bold tracking-tight">Atendimento <br/><span className="text-secondary italic">Via WhatsApp</span></h3>
                <p className="text-lg opacity-80 font-medium leading-relaxed">
                  Para agendamentos rápidos, dúvidas sobre convênios ou horários disponíveis, fale diretamente com nossa recepção.
                </p>
                <div className="pt-4">
                  <a 
                    href="https://wa.me/5548999549041" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-4 bg-white text-primary px-10 py-5 rounded-2xl font-bold text-lg hover:shadow-2xl transition-all active:scale-95"
                  >
                    <Chat size={24} /> Conversar Agora
                  </a>
                </div>
                <div className="pt-8 space-y-4">
                   <div className="flex items-center gap-4 text-sm font-bold opacity-60">
                      <Verified size={20} /> Retorno em até 24h úteis
                   </div>
                   <div className="flex items-center gap-4 text-sm font-bold opacity-60">
                      <CalendarMonth size={20} /> Diversas opções de horários
                   </div>
                </div>
             </div>
          </motion.div>

          {/* Form Card */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="bg-white p-8 sm:p-12 md:p-20 rounded-[3rem] sm:rounded-[4rem] border border-outline-variant/30 soft-shadow">
             <div className="space-y-12">
                <div className="space-y-2">
                   <h3 className="text-3xl font-bold text-primary">Envie uma Mensagem</h3>
                   <p className="text-on-surface-variant font-medium">Nós entraremos em contato com você.</p>
                </div>
                
                <form className="space-y-8" onSubmit={(e) => e.preventDefault()}>
                   <div className="grid md:grid-cols-2 gap-8">
                      <div className="space-y-2">
                         <label className="text-xs font-bold text-secondary uppercase tracking-widest pl-1">Seu Nome</label>
                         <input type="text" className="w-full bg-surface-container-low border-2 border-transparent focus:border-primary focus:bg-white rounded-2xl p-5 outline-none transition-all font-medium text-primary shadow-sm" placeholder="Ex: Maria Silva" />
                      </div>
                      <div className="space-y-2">
                         <label className="text-xs font-bold text-secondary uppercase tracking-widest pl-1">Seu WhatsApp</label>
                         <input type="tel" className="w-full bg-surface-container-low border-2 border-transparent focus:border-primary focus:bg-white rounded-2xl p-5 outline-none transition-all font-medium text-primary shadow-sm" placeholder="Ex: (48) 99999-9999" />
                      </div>
                   </div>
                   <div className="space-y-2">
                      <label className="text-xs font-bold text-secondary uppercase tracking-widest pl-1">Mensagem (Opcional)</label>
                      <textarea rows={4} className="w-full bg-surface-container-low border-2 border-transparent focus:border-primary focus:bg-white rounded-2xl p-5 outline-none transition-all font-medium text-primary shadow-sm resize-none" placeholder="Conte-nos brevemente como podemos ajudar..."></textarea>
                   </div>
                   <button className="w-full py-5 bg-secondary text-on-secondary font-bold text-lg rounded-2xl hover:shadow-xl transition-all active:scale-95">
                      Enviar Solicitação
                   </button>
                </form>
             </div>
          </motion.div>
        </div>
      </section>

      {/* Insurance Requirement Disclaimer */}
      <section className="px-6 pb-20 -mt-10">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-secondary-container/30 border border-secondary/20 p-8 md:p-12 rounded-[3rem] relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 p-12 opacity-10 text-secondary group-hover:scale-110 transition-transform">
              <Info size={120} />
            </div>
            <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
              <div className="bg-white p-4 rounded-2xl shadow-sm text-secondary shrink-0">
                <AssignmentTurnedIn size={32} />
              </div>
              <div className="space-y-4">
                <h4 className="text-xl font-bold text-primary tracking-tight italic">Informação Importante para Planos de Saúde</h4>
                <p className="text-on-surface-variant font-medium leading-relaxed max-w-4xl">
                  Para agendamentos via <span className="text-secondary font-bold">plano de saúde</span>, é necessário possuir um encaminhamento médico com <span className="text-secondary font-bold">CID</span> indicando o tratamento. Somente com este documento os planos autorizam os atendimentos. 
                  <span className="block mt-4 text-sm bg-white/50 p-4 rounded-xl border border-outline-variant/30">
                    💡 <span className="font-bold">Dica:</span> Se você não tiver o encaminhamento, verifique no aplicativo do seu plano se existe a opção de <span className="font-bold underline">teleatendimento</span>. É um processo rápido que pode auxiliar você neste momento de decisão.
                  </span>
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="section-padding bg-surface-container-low">
        <div className="max-w-7xl mx-auto space-y-16">
           <div className="text-center space-y-4">
              <h2 className="text-3xl font-bold text-primary">Compromisso com o Bem-estar</h2>
              <p className="text-on-surface-variant max-w-xl mx-auto font-medium">Na Clínica Hope, cada agendamento é o início de uma relação pautada no respeito e na ética profissional.</p>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                { title: 'Sigilo Absoluto', icon: <VerifiedUser /> },
                { title: 'Profissionais CRP', icon: <Verified /> },
                { title: 'Localização Central', icon: <LocationOn /> },
                { title: 'Preço Justo', icon: <Favorite /> }
              ].map((item, i) => (
                <div key={i} className="bg-white p-8 rounded-[2.5rem] flex flex-col items-center text-center space-y-4 border border-outline-variant/30">
                   <div className="text-secondary">{item.icon}</div>
                   <h4 className="font-bold text-primary tracking-tight">{item.title}</h4>
                </div>
              ))}
           </div>
        </div>
      </section>
    </Layout>
  );
}

function LoginScreen({ onNavigate, onUnlock, settings }: { onNavigate: (screen: Screen, transition?: TransitionType) => void; onUnlock: () => void; settings: HomeSettings }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError('');
    try {
      const user = await loginWithGoogle();
      if (user.email === 'scjorge1908@gmail.com') {
        onUnlock();
        onNavigate(Screen.Admin, 'push');
      } else {
        setError('Acesso negado. Apenas o administrador scjorge1908@gmail.com pode acessar o painel.');
      }
    } catch (err: any) {
      if (err.message?.includes('popup-closed-by-user')) {
        setError('O login foi cancelado.');
      } else {
        setError('Houve um erro ao tentar fazer login com Google.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout activeScreen={Screen.Admin} onNavigate={onNavigate} settings={settings}>
      <div className="min-h-[70vh] flex items-center justify-center px-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-white rounded-[3rem] p-10 md:p-16 soft-shadow border border-outline-variant/30 space-y-10"
        >
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mx-auto mb-6">
              <VerifiedUser size={32} />
            </div>
            <h1 className="text-3xl font-bold text-primary tracking-tight">Área Restrita</h1>
            <p className="text-on-surface-variant font-medium">Acesso exclusivo para administradores da Clínica Hope.</p>
          </div>

          <div className="space-y-6">
            <button 
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full py-5 bg-white border-2 border-outline-variant/30 text-primary rounded-2xl font-bold text-lg hover:bg-surface-container-low transition-all active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50"
            >
              <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="Google" />
              {isLoading ? 'Conectando...' : 'Entrar com Google'}
            </button>

            {error && (
              <p className="text-red-500 text-sm font-bold text-center italic">{error}</p>
            )}
            
            <p className="text-[10px] text-center text-on-surface-variant/40 uppercase font-black tracking-widest">
              Apenas para scjorge1908@gmail.com
            </p>
          </div>

          <button 
            onClick={() => onNavigate(Screen.Home, 'push_back')}
            className="w-full text-center text-sm font-bold text-on-surface-variant/60 hover:text-primary transition-colors underline"
          >
            Voltar para o site
          </button>
        </motion.div>
      </div>
    </Layout>
  );
}

interface AdminScreenProps {
  onNavigate: (screen: Screen, transition?: TransitionType) => void;
  settings: HomeSettings;
  onUpdateSettings: (settings: HomeSettings) => void;
  specialists: Specialist[];
  onUpdateSpecialists: (specialists: Specialist[]) => void;
  approaches: Approach[];
  onUpdateApproaches: (approaches: Approach[]) => void;
  onLogout: () => void;
  insurancePlans: InsurancePlan[];
  onUpdateInsurance: (plans: InsurancePlan[]) => void;
}

function AdminScreen({ 
  onNavigate, 
  settings, 
  onUpdateSettings, 
  specialists, 
  onUpdateSpecialists, 
  approaches, 
  onUpdateApproaches, 
  onLogout,
  insurancePlans,
  onUpdateInsurance
}: AdminScreenProps) {
  const [localSettings, setLocalSettings] = useState<HomeSettings>(settings);
  const [localSpecialists, setLocalSpecialists] = useState<Specialist[]>(specialists);
  const [localApproaches, setLocalApproaches] = useState<Approach[]>(approaches);
  const [localInsurancePlans, setLocalInsurancePlans] = useState<InsurancePlan[]>(insurancePlans);

  const [hasInitialized, setHasInitialized] = useState(false);
  const [activeTab, setActiveTab] = useState<'home' | 'corpo' | 'abordagens'>('home');
  const [saveStatus, setSaveStatus] = useState<{[key: string]: boolean}>({});

  const [croppingType, setCroppingType] = useState<'specialist' | 'logo' | 'insurance' | 'hero' | null>(null);
  const [croppingItemId, setCroppingItemId] = useState<string | null>(null);
  const [cropImage, setCropImage] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  useEffect(() => {
    if (!hasInitialized && specialists.length > 0) {
      setLocalSpecialists(specialists);
      setLocalSettings(settings);
      setLocalApproaches(approaches);
      setLocalInsurancePlans(insurancePlans);
      setHasInitialized(true);
    }
  }, [specialists, settings, approaches, insurancePlans, hasInitialized]);

  const addSpecialist = () => {
    const id = Date.now().toString();
    const newSpec: Specialist = {
      id,
      name: 'Novo Especialista',
      crp: 'CRP --/-----',
      spec: 'Especialidade',
      tags: ['Tag'],
      desc: 'Descrição aqui...',
      img: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=688',
      ageGroups: [AgeGroup.Adults],
      shifts: [Shift.Morning]
    };
    setLocalSpecialists([...localSpecialists, newSpec]);
  };

  const removeSpecialist = async (id: string) => {
    if (confirm("Deseja remover este especialista?")) {
      const updated = localSpecialists.filter(s => s.id !== id);
      setLocalSpecialists(updated);
      await onUpdateSpecialists(updated);
    }
  };

  const updateSpecialist = (id: string, updates: Partial<Specialist>) => {
    setLocalSpecialists(localSpecialists.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, specId: string) => {
    if (e.target.files && e.target.files.length > 0) {
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        setCropImage(reader.result as string);
        setCroppingItemId(specId);
        setCroppingType('specialist');
      });
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const onCropComplete = (croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const applyCrop = async () => {
    if (cropImage && croppedAreaPixels && croppingType) {
      try {
        const croppedImg = await getCroppedImg(cropImage, croppedAreaPixels);
        
        if (croppingType === 'specialist' && croppingItemId) {
          updateSpecialist(croppingItemId, { img: croppedImg });
        } else if (croppingType === 'logo') {
          setLocalSettings({ ...localSettings, logoUrl: croppedImg });
        } else if (croppingType === 'hero') {
          setLocalSettings({ ...localSettings, heroImageUrl: croppedImg });
        } else if (croppingType === 'insurance' && croppingItemId) {
          updateInsurance(croppingItemId, { logo: croppedImg });
        }

        setCroppingItemId(null);
        setCroppingType(null);
        setCropImage(null);
        setZoom(1);
        setCrop({ x: 0, y: 0 });
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleSave = async (id: string) => {
    setSaveStatus({ ...saveStatus, [id]: true });
    await onUpdateSpecialists(localSpecialists);
    setTimeout(() => {
      setSaveStatus(prev => ({ ...prev, [id]: false }));
    }, 2000);
  };

  const addInsurance = () => {
    const id = Date.now().toString();
    const newInsurance = {
      id,
      name: 'Novo Plano',
      logo: 'https://cdn-icons-png.flaticon.com/512/2854/2854580.png'
    };
    setLocalInsurancePlans([...localInsurancePlans, newInsurance]);
  };

  const updateInsurance = (id: string, updates: Partial<InsurancePlan>) => {
    setLocalInsurancePlans(localInsurancePlans.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const removeInsurance = async (id: string) => {
    if (confirm("Deseja remover este convênio?")) {
      const updated = localInsurancePlans.filter(p => p.id !== id);
      setLocalInsurancePlans(updated);
      await onUpdateInsurance(updated);
    }
  };

  const handleInsuranceLogoChange = (e: React.ChangeEvent<HTMLInputElement>, id: string) => {
    if (e.target.files && e.target.files.length > 0) {
      const reader = new FileReader();
      reader.onload = () => {
        setCropImage(reader.result as string);
        setCroppingItemId(id);
        setCroppingType('insurance');
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleSaveSettings = async () => {
    setSaveStatus({ ...saveStatus, settings: true });
    await onUpdateSettings(localSettings);
    setTimeout(() => {
      setSaveStatus(prev => ({ ...prev, settings: false }));
    }, 2000);
  };

  const addApproach = () => {
    const id = Date.now().toString();
    const newApp: Approach = {
      id,
      title: 'Nova Abordagem',
      desc: 'Breve descrição...',
      details: 'Detalhes completos sobre como funciona a terapia nesta abordagem.'
    };
    setLocalApproaches([...localApproaches, newApp]);
  };

  const removeApproach = async (id: string) => {
    if (confirm("Deseja remover esta abordagem?")) {
      const updated = localApproaches.filter(a => a.id !== id);
      setLocalApproaches(updated);
      await onUpdateApproaches(updated);
    }
  };

  const updateApproach = (id: string, updates: Partial<Approach>) => {
    setLocalApproaches(localApproaches.map(a => a.id === id ? { ...a, ...updates } : a));
  };

  const handleSaveApproach = async (id: string) => {
    setSaveStatus({ ...saveStatus, [`approach-${id}`]: true });
    await onUpdateApproaches(localApproaches);
    setTimeout(() => {
      setSaveStatus(prev => ({ ...prev, [`approach-${id}`]: false }));
    }, 2000);
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const reader = new FileReader();
      reader.onload = () => {
        setCropImage(reader.result as string);
        setCroppingType('logo');
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleHeroImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const reader = new FileReader();
      reader.onload = () => {
        setCropImage(reader.result as string);
        setCroppingType('hero');
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  return (
    <div className="min-h-screen bg-surface p-6 md:p-12">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-12">
          <div className="flex items-center gap-4">
            <button onClick={() => onNavigate(Screen.Home, 'push_back')} className="p-3 bg-white border border-outline rounded-full shadow-sm hover:bg-outline transition-colors">
              <ArrowForward className="rotate-180" />
            </button>
            <h1 className="text-4xl font-display font-bold text-primary tracking-tighter">Painel de Administração</h1>
          </div>
          <div className="flex gap-4">
            <div className="flex bg-white rounded-2xl p-1 modern-shadow border border-outline">
              {(['home', 'corpo', 'abordagens'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-6 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-primary text-white' : 'text-on-surface-variant hover:bg-surface'}`}
                >
                  {tab === 'home' ? 'Página Inicial' : tab === 'corpo' ? 'Especialistas' : 'Abordagens'}
                </button>
              ))}
            </div>
            <button 
              onClick={() => {
                const btn = document.getElementById('refresh-btn');
                if (btn) btn.classList.add('animate-spin');
                // Limpa cache e recarrega
                if ('caches' in window) {
                  caches.keys().then((names) => {
                    for (let name of names) caches.delete(name);
                  });
                }
                setTimeout(() => window.location.reload(), 500);
              }}
              id="refresh-btn"
              className="p-3 bg-secondary text-white rounded-2xl shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center gap-2"
              title="Atualizar Site e Dados"
            >
              <RefreshCw size={20} />
              <span className="text-[10px] font-black uppercase tracking-widest">Atualizar Site</span>
            </button>
            <button 
              onClick={onLogout}
              className="p-3 bg-white border border-outline rounded-2xl shadow-sm hover:bg-accent hover:text-white transition-all text-accent flex items-center gap-2"
              title="Sair"
            >
              <LogOut size={20} />
              <span className="text-[10px] font-bold uppercase tracking-widest">Sair</span>
            </button>
          </div>
        </div>

        <div className="bg-white rounded-[2.5rem] modern-shadow border border-outline p-10">
          {activeTab === 'home' && (
            <div className="space-y-8">
               <div className="pb-8 border-b border-outline">
                <h2 className="text-2xl font-display font-black text-primary mb-6">Informações da Clínica</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <label className="text-[10px] uppercase font-bold tracking-widest text-primary">Nome da Clínica</label>
                    <input 
                      className="w-full text-xl font-bold border-b-2 border-outline focus:border-primary outline-none py-2"
                      value={localSettings.clinicName}
                      onChange={(e) => setLocalSettings({ ...localSettings, clinicName: e.target.value })}
                      placeholder="Ex: Clínica Hope"
                    />
                  </div>
                  <div className="space-y-4">
                    <label className="text-[10px] uppercase font-bold tracking-widest text-primary">Endereço</label>
                    <input 
                      className="w-full text-xl font-bold border-b-2 border-outline focus:border-primary outline-none py-2"
                      value={localSettings.address}
                      onChange={(e) => setLocalSettings({ ...localSettings, address: e.target.value })}
                      placeholder="Ex: Bairro Pagani, Palhoça/SC"
                    />
                  </div>
                </div>
                <div className="mt-8 space-y-4">
                  <label className="text-[10px] uppercase font-bold tracking-widest text-primary">Direitos Autorais (Rodapé)</label>
                  <input 
                    className="w-full text-sm font-medium border-b-2 border-outline focus:border-primary outline-none py-2"
                    value={localSettings.footerRights}
                    onChange={(e) => setLocalSettings({ ...localSettings, footerRights: e.target.value })}
                    placeholder="Ex: © 2022 Clínica Hope. Todos os direitos reservados."
                  />
                </div>
              </div>

              <div className="pb-8 border-b border-outline">
                <h2 className="text-2xl font-display font-black text-primary mb-6">Seção "A Clínica"</h2>
                <div className="space-y-6">
                  <div className="space-y-4">
                    <label className="text-[10px] uppercase font-bold tracking-widest text-primary">Título da Seção SEO</label>
                    <input 
                      className="w-full text-xl font-bold border-b-2 border-outline focus:border-primary outline-none py-2"
                      value={localSettings.seoTitle}
                      onChange={(e) => setLocalSettings({ ...localSettings, seoTitle: e.target.value })}
                      placeholder="Ex: Um ambiente pensado para o cuidado com você"
                    />
                  </div>
                  <div className="space-y-4">
                    <label className="text-[10px] uppercase font-bold tracking-widest text-primary">Texto Descritivo SEO</label>
                    <textarea 
                      className="w-full text-sm leading-relaxed border-b-2 border-outline focus:border-primary outline-none py-2 resize-none"
                      rows={4}
                      value={localSettings.seoText}
                      onChange={(e) => setLocalSettings({ ...localSettings, seoText: e.target.value })}
                      placeholder="Descreva a clínica e o ambiente..."
                    />
                  </div>
                </div>
              </div>

              <div className="pb-8 border-b border-outline">
                <h2 className="text-2xl font-display font-black text-primary mb-6">Identidade Visual</h2>
                <div className="flex items-center gap-8">
                  <div className="w-24 h-24 bg-surface border border-outline rounded-[2rem] overflow-hidden flex items-center justify-center text-primary relative group">
                    {localSettings.logoUrl ? (
                      <img src={localSettings.logoUrl} className="w-full h-full object-cover" alt="Logo Preview" />
                    ) : (
                      <Spa size={40} />
                    )}
                    <label className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white cursor-pointer transition-opacity">
                      <PhotoCamera size={24} />
                      <span className="text-[10px] font-bold mt-1 uppercase">Trocar Logo</span>
                      <input type="file" className="hidden" accept="image/*" onChange={handleLogoChange} />
                    </label>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-bold text-primary">Logo da Clínica</p>
                    <p className="text-xs text-on-surface-variant">Recomendado: Imagem quadrada (1:1) com fundo transparente ou sólido.</p>
                    <button className="text-[10px] font-black uppercase text-accent tracking-widest hover:underline" onClick={() => setLocalSettings({ ...localSettings, logoUrl: '' })}>Remover Logo</button>
                  </div>
                </div>
              </div>

              <div className="pb-8 border-b border-outline">
                <h2 className="text-2xl font-display font-black text-primary mb-6">Imagem de Destaque (Hero)</h2>
                <div className="flex items-center gap-8">
                  <div className="w-48 h-48 bg-surface border border-outline rounded-[2.5rem] overflow-hidden flex items-center justify-center text-primary relative group">
                    {localSettings.heroImageUrl ? (
                      <img src={localSettings.heroImageUrl} className="w-full h-full object-cover" alt="Hero Preview" />
                    ) : (
                      <PhotoCamera size={40} />
                    )}
                    <label className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white cursor-pointer transition-opacity">
                      <PhotoCamera size={24} />
                      <span className="text-[10px] font-bold mt-1 uppercase">Trocar Imagem Hero</span>
                      <input type="file" className="hidden" accept="image/*" onChange={handleHeroImageChange} />
                    </label>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-bold text-primary">Imagem Principal</p>
                    <p className="text-xs text-on-surface-variant max-w-sm">Esta imagem aparece na vitrine principal do seu site. Escolha algo que represente a Clínica Hope.</p>
                    <button className="text-[10px] font-black uppercase text-accent tracking-widest hover:underline" onClick={() => setLocalSettings({ ...localSettings, heroImageUrl: '' })}>Remover Imagem</button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <label className="text-[10px] uppercase font-bold tracking-widest text-primary">Título Principal</label>
                  <input 
                    className="w-full text-2xl font-display font-bold border-b-2 border-outline focus:border-primary outline-none py-2"
                    value={localSettings.heroTitle}
                    onChange={(e) => setLocalSettings({ ...localSettings, heroTitle: e.target.value })}
                  />
                </div>
                <div className="space-y-4">
                  <label className="text-[10px] uppercase font-bold tracking-widest text-primary">Subtítulo</label>
                  <input 
                    className="w-full text-2xl font-display font-bold border-b-2 border-outline focus:border-primary outline-none py-2"
                    value={localSettings.heroSubtitle}
                    onChange={(e) => setLocalSettings({ ...localSettings, heroSubtitle: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-4">
                <label className="text-[10px] uppercase font-bold tracking-widest text-primary">Texto Hero</label>
                <textarea 
                  className="w-full text-lg leading-relaxed border-b-2 border-outline focus:border-primary outline-none py-2 resize-none"
                  rows={3}
                  value={localSettings.heroText}
                  onChange={(e) => setLocalSettings({ ...localSettings, heroText: e.target.value })}
                />
              </div>

              <div className="pt-8 border-t border-outline">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-display font-black text-primary">Convênios Atendidos</h2>
                  <button 
                    onClick={addInsurance}
                    className="flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-primary hover:text-white transition-all"
                  >
                    <Add size={14} /> Novo Convênio
                  </button>
                </div>
                <p className="text-on-surface-variant text-sm mb-8">Estes convênios aparecerão para todos os profissionais do corpo clínico.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {(localSettings.insurancePlans || []).map(plan => (
                    <div key={plan.id} className="p-6 border border-outline rounded-3xl bg-surface/30 group relative">
                      <button 
                        onClick={() => removeInsurance(plan.id)}
                        className="absolute -top-2 -right-2 w-8 h-8 bg-white border border-outline rounded-full flex items-center justify-center text-accent opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:bg-accent hover:text-white z-10"
                      >
                        <Delete size={14} />
                      </button>
                      <div className="flex flex-col items-center gap-4">
                        <div className="w-20 h-20 rounded-2xl overflow-hidden bg-white border border-outline relative group/logo">
                          <img src={plan.logo} className="w-full h-full object-contain p-3" />
                          <label className="absolute inset-0 bg-black/40 opacity-0 group-hover/logo:opacity-100 flex flex-col items-center justify-center text-white cursor-pointer transition-opacity">
                            <PhotoCamera size={20} />
                            <span className="text-[8px] font-bold mt-1">Trocar Logo</span>
                            <input type="file" className="hidden" accept="image/*" onChange={(e) => handleInsuranceLogoChange(e, plan.id)} />
                          </label>
                        </div>
                        <input 
                          className="w-full text-center font-bold text-sm bg-transparent border-b border-outline/50 focus:border-primary outline-none pb-1"
                          value={plan.name}
                          onChange={(e) => updateInsurance(plan.id, { name: e.target.value })}
                          placeholder="Nome do Plano"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-12 border-t border-outline flex justify-center">
                <button
                  onClick={handleSaveSettings}
                  className={`flex items-center gap-2 px-12 py-4 rounded-[2rem] text-xs font-black uppercase tracking-[0.3em] transition-all shadow-xl active:scale-95 ${saveStatus['settings'] ? 'bg-green-500 text-white shadow-green-500/20' : 'bg-primary text-white shadow-primary/20 hover:bg-primary-light'}`}
                >
                  {saveStatus['settings'] ? <CheckCircle size={16} /> : <Settings size={16} />}
                  {saveStatus['settings'] ? 'Site Atualizado!' : 'Salvar Alterações do Site'}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'corpo' && (
            <div className="space-y-10">
              <div className="flex justify-between items-center">
                <p className="text-on-surface-variant text-sm">Gerencie os profissionais da clínica.</p>
                <button onClick={addSpecialist} className="flex items-center gap-2 bg-primary/10 text-primary px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-primary hover:text-white transition-all">
                  <Add size={16} /> Especialista
                </button>
              </div>
              <div className="grid grid-cols-1 gap-8">
                {localSpecialists.map((s, idx) => (
                  <div key={s.id} className="p-8 border border-outline rounded-[2rem] flex flex-col md:flex-row gap-8 items-start relative group">
                    <button 
                      onClick={() => removeSpecialist(s.id)}
                      className="absolute top-4 right-4 p-2 text-accent bg-accent/5 hover:bg-accent hover:text-white rounded-full transition-all opacity-0 group-hover:opacity-100 shadow-sm"
                      title="Excluir Especialista"
                    >
                      <Trash2 size={16} />
                    </button>
                    <div className="w-full md:w-32 h-32 rounded-2xl overflow-hidden shrink-0 relative group/photo">
                      <img src={s.img} className="w-full h-full object-cover" />
                      <label className="absolute inset-0 bg-black/40 opacity-0 group-hover/photo:opacity-100 flex flex-col items-center justify-center text-white cursor-pointer transition-opacity">
                        <PhotoCamera size={24} />
                        <span className="text-[10px] font-black uppercase mt-2">Mudar Foto</span>
                        <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, s.id)} />
                      </label>
                    </div>
                    <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                      <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase text-primary/40 ml-1">Nome Completo</label>
                        <input className="w-full font-bold p-2 border-b border-outline focus:border-primary outline-none" value={s.name} onChange={e => updateSpecialist(s.id, { name: e.target.value })} placeholder="Nome" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase text-primary/40 ml-1">Especialidade Principal</label>
                        <input className="w-full p-2 border-b border-outline focus:border-primary outline-none" value={s.spec} onChange={e => updateSpecialist(s.id, { spec: e.target.value })} placeholder="Especialidade" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase text-primary/40 ml-1">Registro (CRP)</label>
                        <input className="w-full p-2 border-b border-outline focus:border-primary outline-none" value={s.crp} onChange={e => updateSpecialist(s.id, { crp: e.target.value })} placeholder="CRP" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase text-primary/40 ml-1">Tags (separadas por vírgula)</label>
                        <input className="w-full p-2 border-b border-outline focus:border-primary outline-none" value={s.tags.join(', ')} onChange={e => updateSpecialist(s.id, { tags: e.target.value.split(',').map(t => t.trim()) })} placeholder="Tags" />
                      </div>
                      <div className="md:col-span-2 space-y-1">
                        <label className="text-[9px] font-black uppercase text-primary/40 ml-1">Minibiografia</label>
                        <textarea className="w-full p-2 border border-outline rounded-xl focus:border-primary outline-none" rows={2} value={s.desc} onChange={e => updateSpecialist(s.id, { desc: e.target.value })} placeholder="Descrição" />
                      </div>
                      
                      <div className="md:col-span-2 space-y-4 pt-4 border-t border-outline">
                         <p className="text-[10px] font-black uppercase text-secondary/60 tracking-widest ml-1">Integração com Agenda Online</p>
                         <div className="flex flex-col sm:flex-row gap-4 items-end">
                            <div className="flex-grow space-y-1">
                              <label className="text-[9px] font-black uppercase text-primary/40 ml-1">URL de Integração</label>
                              <div className="relative group">
                                <input 
                                  id={`url-input-${s.id}`}
                                  className="p-3 pr-24 bg-surface-container-low border border-outline rounded-xl w-full focus:border-primary outline-none font-medium text-xs shadow-sm transition-all" 
                                  value={s.googleAppsScriptUrl || ''} 
                                  onChange={e => updateSpecialist(s.id, { googleAppsScriptUrl: e.target.value })} 
                                  placeholder="https://script.google.com/macros/s/.../exec" 
                                />
                                {s.googleAppsScriptUrl && (
                                  <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5 pointer-events-auto">
                                    <button 
                                      type="button"
                                      title="Limpar URL"
                                      onClick={() => {
                                        if (confirm("Deseja realmente remover o link de integração desta especialista?")) {
                                          updateSpecialist(s.id, { googleAppsScriptUrl: '', schedule: undefined });
                                        }
                                      }}
                                      className="p-2 hover:bg-error/10 text-error/40 hover:text-error rounded-lg transition-colors cursor-pointer"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                            <button 
                              onClick={async () => {
                                if (!s.googleAppsScriptUrl) {
                                  alert('Insira a URL antes de vincular.');
                                  return;
                                }
                                if (!s.googleAppsScriptUrl.trim().endsWith('/exec')) {
                                  alert('❌ ATENÇÃO: Sua URL não termina em /exec. Você provavelmente colou o link do rascunho ou da edição. No Google Scripts, vá em Implantar > Nova Implantação e copie a URL correta.');
                                }
                                try {
                                  const jsonpCallbackName = `google_script_cb_${Date.now()}`;
                                  const scriptUrlJsonp = s.googleAppsScriptUrl.trim().includes('?') 
                                    ? `${s.googleAppsScriptUrl.trim()}&action=getDadosDaAgenda&callback=${jsonpCallbackName}` 
                                    : `${s.googleAppsScriptUrl.trim()}?action=getDadosDaAgenda&callback=${jsonpCallbackName}`;
                                  
                                  const script = document.createElement('script');
                                  script.src = scriptUrlJsonp;
                                  
                                  const timeout = setTimeout(() => {
                                    alert('❌ TIME-OUT: O Google Script demorou mais de 45 segundos para responder.\n\nISSO GERALMENTE ACONTECE POR:\n1. Link errado.\n2. Não foi publicado para "Qualquer pessoa".\n3. Planilha lenta.');
                                    document.body.removeChild(script);
                                    delete (window as any)[jsonpCallbackName];
                                  }, 45000);

                                  (window as any)[jsonpCallbackName] = async (jsonpData: any) => {
                                    clearTimeout(timeout);
                                    document.body.removeChild(script);
                                    delete (window as any)[jsonpCallbackName];
                                    
                                    const appointments = Array.isArray(jsonpData) ? jsonpData : (jsonpData.data || []);
                                    const count = appointments.filter((r: any) => r && r.paciente && r.paciente !== '💚').length;
                                    
                                    alert(`✅ CONECTADO!\nEncontramos ${count} agendamentos.\n\nAgora clique em "Salvar Informações" no final para confirmar.`);
                                    updateSpecialist(s.id, { 
                                      googleAppsScriptUrl: s.googleAppsScriptUrl.trim(),
                                      schedule: {} 
                                    });
                                  };

                                  document.body.appendChild(script);
                                } catch (e) {
                                  alert('❌ ERRO CRÍTICO: Falha na conexão.');
                                }
                              }}
                              className="px-8 bg-secondary text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:shadow-lg transition-all active:scale-95 whitespace-nowrap h-[46px]"
                            >
                              Vincular Agenda
                            </button>
                         </div>

                         <div className="bg-secondary/5 p-5 rounded-2xl space-y-4">
                           <div className="flex items-center gap-2 mb-2">
                              <div className="w-6 h-6 bg-secondary text-white rounded-lg flex items-center justify-center">
                                 <Info size={14} />
                              </div>
                              <p className="text-[10px] font-black uppercase text-secondary tracking-widest">
                                 Instruções Rápidas de Integração
                              </p>
                           </div>
                           
                           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-[11px] text-primary/80">
                             <div className="space-y-2 p-4 bg-white/50 rounded-xl border border-outline/30">
                               <p className="font-bold text-primary flex items-center gap-2">
                                 <span className="w-5 h-5 bg-primary text-white rounded-full flex items-center justify-center text-[8px]">1</span>
                                 No Google Scripts:
                               </p>
                               <p>Salve o código `.gs` e vá em <strong>Implantar &gt; Nova Implantação</strong>.</p>
                             </div>
                             <div className="space-y-2 p-4 bg-white/50 rounded-xl border border-outline/30">
                               <p className="font-bold text-primary flex items-center gap-2">
                                 <span className="w-5 h-5 bg-primary text-white rounded-full flex items-center justify-center text-[8px]">2</span>
                                 Configuração de Acesso:
                               </p>
                               <p>Tipo <strong>"App da Web"</strong> e mudar para <strong>"Qualquer pessoa"</strong>.</p>
                             </div>
                             <div className="sm:col-span-2 p-4 bg-amber-50 rounded-xl border border-amber-100 flex gap-4">
                                <div className="text-amber-600 shrink-0">
                                   <Info size={20} />
                                </div>
                                <div className="space-y-1">
                                   <p className="text-[10px] font-black uppercase tracking-widest text-amber-800">Dica de Ouro</p>
                                   <p className="text-[11px] text-amber-700 leading-relaxed">
                                     O link correto deve terminar em <strong>/exec</strong>.
                                   </p>
                                </div>
                             </div>
                           </div>
                           <div className="p-3 bg-white/50 rounded-xl border border-outline/10 italic text-[10px] text-primary/60">
                             💡 Dica: O sistema buscará automaticamente as linhas que contêm o status "💚" (Livre).
                           </div>
                         </div>

                        <p className="text-[10px] uppercase font-bold tracking-widest text-primary">Faixas Etárias</p>
                        <div className="flex flex-wrap gap-2">
                          {Object.values(AgeGroup).map(age => (
                            <button 
                              key={age}
                              onClick={() => {
                                const current = s.ageGroups || [];
                                updateSpecialist(s.id, { ageGroups: current.includes(age) ? current.filter(a => a !== age) : [...current, age] });
                              }}
                              className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all ${s.ageGroups?.includes(age) ? 'bg-primary text-white border-primary' : 'bg-surface text-on-surface-variant border-outline hover:border-primary/40'}`}
                            >
                              {age}
                            </button>
                          ))}
                        </div>

                        <p className="text-[10px] uppercase font-bold tracking-widest text-primary pt-2">Idades Específicas Atendidas (1-17)</p>
                        <div className="grid grid-cols-6 sm:grid-cols-9 md:grid-cols-12 gap-2">
                          {Array.from({ length: 17 }, (_, i) => i + 1).map(age => (
                            <button 
                              key={age}
                              onClick={() => {
                                const current = s.attendedAges || [];
                                updateSpecialist(s.id, { attendedAges: current.includes(age) ? current.filter(a => a !== age) : [...current, age] });
                              }}
                              className={`p-2 rounded-lg text-[10px] font-bold border transition-all ${s.attendedAges?.includes(age) ? 'bg-primary text-white border-primary' : 'bg-surface text-on-surface-variant border-outline hover:border-primary/40'}`}
                            >
                              {age}
                            </button>
                          ))}
                        </div>
                        
                        {!s.googleAppsScriptUrl && (
                          <>
                            <p className="text-[10px] uppercase font-bold tracking-widest text-primary pt-2">Períodos de Atendimento</p>
                            <div className="flex flex-wrap gap-2">
                              {Object.values(Shift).map(shift => (
                                <button 
                                  key={shift}
                                  onClick={() => {
                                    const current = s.shifts || [];
                                    updateSpecialist(s.id, { shifts: current.includes(shift) ? current.filter(a => a !== shift) : [...current, shift] });
                                  }}
                                  className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all ${s.shifts?.includes(shift) ? 'bg-primary text-white border-primary' : 'bg-surface text-on-surface-variant border-outline hover:border-primary/40'}`}
                                >
                                  {shift}
                                </button>
                              ))}
                            </div>
                          </>
                        )}

                        {s.googleAppsScriptUrl ? (
                           <div className="pt-6 border-t border-outline">
                              <div className="p-8 bg-green-50/50 border border-green-100 rounded-3xl text-center space-y-3">
                                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto shadow-sm">
                                  <VerifiedUser className="text-white" size={24} />
                                </div>
                                <h3 className="text-sm font-black text-green-800 uppercase tracking-widest">Agenda Em Tempo Real Ativa</h3>
                                <p className="text-[11px] text-green-700/80 max-w-xs mx-auto">
                                  Esta agenda está sendo sincronizada com o Google Sheets. Os horários marcados com 💚 são exibidos automaticamente para os pacientes.
                                </p>
                                <button 
                                  onClick={() => updateSpecialist(s.id, { googleAppsScriptUrl: '' })}
                                  className="text-[10px] font-black uppercase text-red-500 hover:underline pt-2"
                                >
                                  Desativar Integração e Usar Manual
                                </button>
                              </div>
                           </div>
                        ) : (
                          <div className="pt-6 border-t border-outline space-y-4">
                            <div className="flex justify-between items-center">
                              <p className="text-[10px] uppercase font-bold tracking-widest text-primary">Agenda Semanal (Card de Horários)</p>
                              {!s.schedule && (
                                <button 
                                  onClick={() => {
                                    const def = DEFAULT_SPECIALISTS.find(ds => ds.id === s.id);
                                    if (def?.schedule) updateSpecialist(s.id, { schedule: def.schedule });
                                    else updateSpecialist(s.id, { schedule: { 'Segunda': { periods: { [Shift.Morning]: ['08:00', '09:00'] } } } });
                                  }}
                                  className="text-[9px] font-black uppercase text-secondary hover:underline"
                                >
                                  Ativar Agenda Visual
                                </button>
                              )}
                            </div>
                            
                            {s.schedule && (
                              <div className="space-y-4">
                                {Object.entries(s.schedule as Record<string, { periods: Record<string, string[]> }>).map(([day, data]) => (
                                  <div key={day} className="p-4 bg-surface rounded-2xl border border-outline space-y-3 relative group/item">
                                    <button 
                                      onClick={() => {
                                        const newSched = { ...s.schedule };
                                        delete newSched[day];
                                        updateSpecialist(s.id, { schedule: newSched });
                                      }}
                                      className="absolute top-2 right-2 text-accent p-1 opacity-0 group-hover/item:opacity-100 hover:bg-accent/10 rounded"
                                    >
                                      <Delete size={14} />
                                    </button>
                                    <p className="text-xs font-bold text-primary">{day}</p>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                      {Object.values(Shift).map(shift => (
                                        <div key={shift} className="space-y-2">
                                          <label className="text-[9px] font-black uppercase text-on-surface-variant/40">{shift}</label>
                                          <input 
                                            className="w-full text-[10px] p-2 border-b border-outline outline-none focus:border-primary"
                                            value={data.periods[shift]?.join(', ') || ''}
                                            placeholder="Ex: 08:00, 09:00"
                                            onChange={(e) => {
                                              const times = e.target.value.split(',').map(t => t.trim()).filter(t => t !== '');
                                              const newSched = JSON.parse(JSON.stringify(s.schedule));
                                              if (!newSched[day]) newSched[day] = { periods: {} };
                                              newSched[day].periods[shift] = times;
                                              updateSpecialist(s.id, { schedule: newSched });
                                            }}
                                          />
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                ))}
                                <div className="flex flex-wrap gap-2">
                                  {['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'].map(day => (
                                    !(s.schedule as any)?.[day] && (
                                      <button 
                                        key={day}
                                        onClick={() => {
                                          const newSched = { ...s.schedule, [day]: { periods: {} } };
                                          updateSpecialist(s.id, { schedule: newSched });
                                        }}
                                        className="text-[9px] font-bold text-primary/60 px-3 py-1.5 bg-surface-container rounded-lg hover:bg-primary/10 transition-colors border border-outline/30"
                                      >
                                        + {day}
                                      </button>
                                    )
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        <div className="pt-6 flex justify-between items-center">
                          <button 
                            onClick={() => handleSave(s.id)}
                            className={`flex items-center gap-2 px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all shadow-lg active:scale-95 ${saveStatus[s.id] ? 'bg-green-500 text-white shadow-green-500/20' : 'bg-primary text-white shadow-primary/20 hover:bg-primary-light'}`}
                          >
                            {saveStatus[s.id] ? <CheckCircle size={14} /> : <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin hidden group-active:block" />}
                            {saveStatus[s.id] ? 'Salvo!' : 'Salvar Informações'}
                          </button>
                          <button onClick={() => removeSpecialist(s.id)} className="p-4 text-accent hover:bg-accent/10 rounded-full transition-colors opacity-0 group-hover:opacity-100">
                            <Delete size={20} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'abordagens' && (
            <div className="space-y-10">
              <div className="flex justify-between items-center">
                <p className="text-on-surface-variant text-sm">Gerencie as abordagens terapêuticas e seus detalhes.</p>
                <button onClick={addApproach} className="flex items-center gap-2 bg-primary/10 text-primary px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-primary hover:text-white transition-all">
                  <Add size={16} /> Abordagem
                </button>
              </div>
              <div className="grid grid-cols-1 gap-8">
                {localApproaches.map(a => (
                  <div key={a.id} className="p-8 border border-outline rounded-[2rem] space-y-6">
                    <div className="space-y-6 flex-grow">
                      <input className="w-full text-xl font-bold p-2 border-b border-outline" value={a.title} onChange={e => updateApproach(a.id, { title: e.target.value })} placeholder="Título" />
                      <input className="w-full p-2 border-b border-outline text-on-surface-variant" value={a.desc} onChange={e => updateApproach(a.id, { desc: e.target.value })} placeholder="Breve descrição" />
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase font-bold tracking-widest text-primary">Detalhes</label>
                        <textarea className="w-full p-4 border border-outline rounded-2xl" rows={4} value={a.details} onChange={e => updateApproach(a.id, { details: e.target.value })} placeholder="Explicação..." />
                      </div>
                      <div className="pt-4 flex justify-between items-center">
                        <button 
                          onClick={() => handleSaveApproach(a.id)}
                          className={`flex items-center gap-2 px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all shadow-lg active:scale-95 ${saveStatus[`approach-${a.id}`] ? 'bg-green-500 text-white shadow-green-500/20' : 'bg-primary text-white shadow-primary/20 hover:bg-primary-light'}`}
                        >
                          {saveStatus[`approach-${a.id}`] ? <CheckCircle size={14} /> : <AssignmentTurnedIn size={14} />}
                          {saveStatus[`approach-${a.id}`] ? 'Salvo!' : 'Salvar Abordagem'}
                        </button>
                        <button onClick={() => removeApproach(a.id)} className="p-4 text-accent hover:bg-accent/10 rounded-full transition-colors opacity-0 group-hover:opacity-100">
                          <Delete size={20} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Global Cropper Modal */}
        <AnimatePresence>
          {cropImage && (
            <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 sm:p-12">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => { setCropImage(null); setCroppingItemId(null); setCroppingType(null); }}
                className="absolute inset-0 bg-on-surface/80 backdrop-blur-md"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 30 }}
                className="relative bg-white w-full max-w-2xl rounded-[3rem] modern-shadow border border-outline overflow-hidden"
              >
                <div className="p-8 border-b border-outline flex justify-between items-center">
                  <h3 className="text-xl font-display font-black text-primary">Ajustar e Cortar Foto</h3>
                  <button onClick={() => { setCropImage(null); setCroppingItemId(null); setCroppingType(null); }} className="w-10 h-10 rounded-full bg-surface hover:bg-outline flex items-center justify-center transition-colors">
                    <Close size={20} />
                  </button>
                </div>
                
                <div className="relative h-[400px] w-full bg-surface">
                  <Cropper
                    image={cropImage}
                    crop={crop}
                    zoom={zoom}
                    aspect={1}
                    onCropChange={setCrop}
                    onCropComplete={onCropComplete}
                    onZoomChange={setZoom}
                  />
                </div>

                <div className="p-8 space-y-6">
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase text-primary/40 tracking-widest block text-center">Zoom</label>
                    <input
                      type="range"
                      value={zoom}
                      min={1}
                      max={3}
                      step={0.1}
                      aria-labelledby="Zoom"
                      onChange={(e) => setZoom(Number(e.target.value))}
                      className="w-full h-1.5 bg-outline rounded-lg appearance-none cursor-pointer accent-primary"
                    />
                  </div>
                  
                  <div className="flex gap-4">
                    <button 
                      onClick={() => { setCropImage(null); setCroppingItemId(null); setCroppingType(null); }}
                      className="flex-1 btn-modern-outline py-4"
                    >
                      Cancelar
                    </button>
                    <button 
                      onClick={applyCrop}
                      className="flex-1 btn-modern-primary py-4"
                    >
                      Aplicar Corte
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

interface AdminScreenProps extends ScreenProps {
  settings: HomeSettings;
  onUpdateSettings: (s: HomeSettings) => void;
  specialists: Specialist[];
  onUpdateSpecialists: (s: Specialist[]) => void;
  approaches: Approach[];
  onUpdateApproaches: (a: Approach[]) => void;
}
