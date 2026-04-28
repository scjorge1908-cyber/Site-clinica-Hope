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
  Info
} from './components/Icons';
import { Instagram, Facebook, Linkedin as LinkedIn } from 'lucide-react';
import Cropper from 'react-easy-crop';
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, signInWithPopup, GoogleAuthProvider, User, signInWithEmailAndPassword } from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  onSnapshot, 
  updateDoc, 
  deleteDoc,
  query,
  getDocFromServer
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { Screen, TransitionType, Specialist, Approach, HomeSettings, AgeGroup, Shift, InsurancePlan } from './types';
import { DEFAULT_HOME_SETTINGS, DEFAULT_SPECIALISTS, DEFAULT_APPROACHES, CLINICA_LOGO_URL } from './constants';

// Firebase Initialization
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

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

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      if (!blob) return;
      resolve(URL.createObjectURL(blob));
    }, 'image/jpeg');
  });
};

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>(Screen.Home);
  const [direction, setDirection] = useState<number>(0);
  const [user, setUser] = useState<User | null>(null);
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  
  // Data State
  const [homeSettings, setHomeSettings] = useState<HomeSettings>(DEFAULT_HOME_SETTINGS);
  const [specialists, setSpecialists] = useState<Specialist[]>(DEFAULT_SPECIALISTS);
  const [approaches, setApproaches] = useState<Approach[]>(DEFAULT_APPROACHES);

  const [insurancePlans, setInsurancePlans] = useState<InsurancePlan[]>([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  // Verify Firestore connection
  useEffect(() => {
    async function testConnection() {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if(error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration.");
        }
      }
    }
    testConnection();
  }, []);

  // Real-time Fetching
  useEffect(() => {
    const unsubSettings = onSnapshot(doc(db, 'settings', 'site'), (s) => {
      if (s.exists()) {
        const data = s.data() as HomeSettings;
        // Don't overwrite insurancePlans from settings if it's there (for migration safety)
        const { insurancePlans: _, ...rest } = data;
        setHomeSettings(rest as HomeSettings);
      }
    }, (err) => handleFirestoreError(err, OperationType.GET, 'settings/site'));

    const unsubInsurance = onSnapshot(collection(db, 'insurancePlans'), (snap) => {
      const data = snap.docs.map(d => d.data() as InsurancePlan);
      if (data.length > 0) setInsurancePlans(data);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'insurancePlans'));

    const unsubSpecialists = onSnapshot(collection(db, 'specialists'), (snap) => {
      const data = snap.docs.map(d => d.data() as Specialist);
      if (data.length > 0) setSpecialists(data);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'specialists'));

    const unsubApproaches = onSnapshot(collection(db, 'approaches'), (snap) => {
      const data = snap.docs.map(d => d.data() as Approach);
      if (data.length > 0) setApproaches(data);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'approaches'));

    return () => {
      unsubSettings();
      unsubInsurance();
      unsubSpecialists();
      unsubApproaches();
    };
  }, []);

  const updateSettings = async (newSettings: HomeSettings) => {
    // Remove insurancePlans from the settings object before saving to site doc to avoid size limit
    const { insurancePlans: _, ...cleanSettings } = newSettings;
    setHomeSettings(cleanSettings as HomeSettings);
    try {
      await setDoc(doc(db, 'settings', 'site'), cleanSettings);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'settings/site');
    }
  };

  const updateSpecialists = async (newSpecialists: Specialist[]) => {
    setSpecialists(newSpecialists);
    // Note: In real app we update individual docs, but here maintaining state parity
  };

  const updateApproaches = async (newApproaches: Approach[]) => {
    setApproaches(newApproaches);
  };

  const navigateTo = (screen: Screen, transition: TransitionType = 'none') => {
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
              settings={homeSettings} 
              approaches={approaches}
              specialists={specialists}
            />
          )}
          {currentScreen === Screen.SEO && <SEOScreen onNavigate={navigateTo} />}
          {currentScreen === Screen.CorpoClinico && (
            <CorpoClinicoScreen 
              onNavigate={navigateTo} 
              specialists={specialists} 
              approaches={approaches}
              settings={{ ...homeSettings, insurancePlans }}
            />
          )}
          {currentScreen === Screen.Agendamento && <AgendamentoScreen onNavigate={navigateTo} />}
          {currentScreen === Screen.Abordagens && <AbordagensScreen onNavigate={navigateTo} approaches={approaches} />}
          {currentScreen === Screen.Login && (
            <LoginScreen 
              onNavigate={navigateTo} 
              onUnlock={() => setIsAdminUnlocked(true)} 
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
              user={user}
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
}

function Layout({ children, activeScreen, onNavigate }: LayoutProps) {
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
    { id: Screen.CorpoClinico, label: 'Equipe' },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans selection:bg-secondary-container selection:text-on-secondary-container overflow-x-hidden">
      {/* Material 3 TopAppBar */}
      <header className="fixed top-0 w-full z-50 glass-nav">
        <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center transition-all">
          <button 
            onClick={() => onNavigate(Screen.Home, 'push_back')}
            className="flex items-center gap-3 group"
          >
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
              <Spa size={24} />
            </div>
            <span className="text-xl font-bold tracking-tight text-primary">Clínica Hope</span>
          </button>
          
          <nav className="hidden md:flex gap-10 items-center">
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id, activeScreen === Screen.Home ? 'push' : 'none')}
                className={`text-sm font-semibold transition-all hover:text-primary ${
                  activeScreen === item.id 
                    ? 'text-primary border-b-2 border-primary pb-1' 
                    : 'text-on-surface-variant'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          <button 
            onClick={() => onNavigate(Screen.Agendamento, 'push')}
            className="bg-primary text-white text-sm font-bold px-6 py-2.5 rounded-full hover:shadow-lg active:scale-95 transition-all"
          >
            Agendar Consulta
          </button>
        </div>
      </header>

      {/* Mobile Navigation (Bottom Bar Style) */}
      <nav className="md:hidden fixed bottom-0 w-full bg-white/95 backdrop-blur-md border-t border-outline-variant px-6 py-4 flex justify-between items-center z-50">
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`flex flex-col items-center gap-1 transition-all ${
              activeScreen === item.id ? 'text-primary font-bold' : 'text-on-surface-variant'
            }`}
          >
            {item.id === Screen.Home && <HomeIcon size={20} />}
            {item.id === Screen.SEO && <LocationOn size={20} />}
            {item.id === Screen.Abordagens && <Psychology size={20} />}
            {item.id === Screen.CorpoClinico && <Group size={20} />}
            <span className="text-[10px] uppercase font-bold">{item.label}</span>
          </button>
        ))}
      </nav>

      <main className="flex-grow pt-20 pb-20 md:pb-0">{children}</main>

      <footer className="py-20 bg-surface-container-low border-t border-outline-variant/30">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-3">
              <Spa size={24} className="text-primary" />
              <span className="font-bold text-primary text-xl tracking-tight">Clínica Hope</span>
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
          </div>
          <div className="md:text-right space-y-4">
            <p className="text-on-surface-variant text-sm">© 2024 Clínica Hope. Todos os direitos reservados.</p>
            <p className="text-[10px] uppercase tracking-widest text-on-surface-variant/40">Pagani, Palhoça – SC</p>
          </div>
        </div>
      </footer>
    </div>
  );
}


// ---
interface ScreenProps {
  onNavigate: (screen: Screen, transition?: TransitionType) => void;
}

interface HomeProps extends ScreenProps {
  settings: HomeSettings;
  approaches: Approach[];
}

function HomeScreen({ onNavigate, settings, approaches, specialists }: HomeProps & { specialists: Specialist[] }) {
  return (
    <Layout activeScreen={Screen.Home} onNavigate={onNavigate}>
      {/* Modern Hero Section */}
      <section className="relative px-6 py-12 md:py-32 overflow-hidden bg-background">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
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
                onClick={() => onNavigate(Screen.Agendamento, 'push')}
                className="btn-primary shadow-xl"
              >
                Agendar Consulta
              </button>
              <button 
                onClick={() => onNavigate(Screen.Abordagens, 'push')}
                className="btn-secondary"
              >
                Nossas Abordagens
              </button>
            </div>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative"
          >
            <div className="aspect-square rounded-[4rem] overflow-hidden soft-shadow relative z-10 border border-outline-variant/30">
              <img 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBFcpZ0zvgTNyZBiSKYzxT2xDJXnMXz8_r7z7ESPg6e_68_XijjD01XLwMcR4NIA05ClFmB0kT-C0-PwXni2zx1bcmn4bIr-28JWlAPufxkF0aZlQ55B-Tbu-a2VbJ9rLbcWfzA9TsxaJ-1xfJh0YhXidLL6ToBR6EFw-xLNDp8F_kFz01dFqMEBM0bUMhA5fnLjyo_iG1Wn8cDTaHvpUc-kz1Sq-XRqlPEQKHhwbRhIO7g0xEfR21uFWZFDIEBlKz4nV_0dyHATEg" 
                className="w-full h-full object-cover transition-transform duration-[5s] hover:scale-105"
                alt="Clínica Interior"
              />
            </div>
            <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-secondary-container rounded-full -z-10 opacity-40 blur-3xl"></div>
            <div className="absolute -top-10 -left-10 w-48 h-48 bg-primary-container rounded-full -z-10 opacity-30 blur-2xl"></div>
          </motion.div>
        </div>
      </section>

      {/* A Clínica Section (Bento Grid Style) */}
      <section className="section-padding bg-surface-container-low">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="text-center space-y-4">
            <h2 className="text-4xl md:text-5xl font-bold text-primary tracking-tight">Onde o cuidado floresce</h2>
            <p className="text-on-surface-variant max-w-2xl mx-auto font-medium">Ambientes planejados com as melhores práticas de design sensorial para promover calma e foco no que realmente importa.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[300px]">
            <div className="md:col-span-2 bg-white p-10 rounded-[3rem] soft-shadow border border-outline-variant/50 flex flex-col justify-between group overflow-hidden relative">
              <div className="relative z-10">
                <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform">
                  <Verified size={32} />
                </div>
                <h3 className="text-2xl font-bold text-primary mb-4">Acolhimento Humanizado</h3>
                <p className="text-on-surface-variant leading-relaxed max-w-md">Do atendimento na recepção ao consultório, privilegiamos a escuta ativa e o respeito à sua história.</p>
              </div>
              <div className="absolute top-0 right-0 w-1/2 h-full opacity-10 group-hover:opacity-100 transition-opacity">
                 <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuB8_m85XdaEaixcl2b0_WEi58LQoccqoVkXcIn2hbINlWb3cyLEVparNdja4L90EhXAPLCIg7in7qJOFQXvfs9szLpgRqay6pLkMjafkDVtDn_gL8ikSPPxep21FSvnIks0ueW9sIWbCpqLYJfcySLxy_u8upsz8RpgOF4KEpfZeDyEY8aUXSEZOkArD56ujP0q2GFXRTbTLXUo6AMsuu_zf-4N7jCQ0ZhIU4anH2ayRGI2vos0wOrSomOI_GIWSfLkIQTnvhwXu1A" className="w-full h-full object-cover rounded-l-[3rem]" />
              </div>
            </div>
            
            <div className="bg-primary-container p-10 rounded-[3rem] text-on-primary-container flex flex-col justify-center items-center text-center space-y-6">
              <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center">
                <VerifiedUser size={40} className="text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white">Ética & Sigilo</h3>
              <p className="text-sm opacity-80 leading-relaxed font-medium">Compromisso inegociável com a segurança de dados e normas éticas em cada sessão.</p>
            </div>

            <div className="bg-surface-container p-10 rounded-[3rem] flex flex-col justify-between group cursor-pointer hover:bg-secondary-container transition-colors">
              <div className="w-12 h-12 bg-white rounded-[1.5rem] flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                <CalendarMonth size={24} />
              </div>
              <div className="space-y-4">
                <h4 className="text-xl font-bold text-primary">Agendamento Multi-canal</h4>
                <p className="text-xs font-medium text-on-surface-variant leading-relaxed">WhatsApp, Telefone ou Formulário. Escolha como quer iniciar seu cuidado.</p>
              </div>
            </div>

            <div className="md:col-span-2 relative rounded-[3rem] overflow-hidden border border-outline-variant/30">
               <img src="https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=2069" className="w-full h-full object-cover" />
               <div className="absolute inset-0 bg-gradient-to-t from-primary/80 to-transparent flex items-end p-10">
                  <p className="text-white text-lg font-bold">Unidade Pagani, Palhoça</p>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* Simplified Approaches Section */}
      <section className="section-padding bg-white">
        <div className="max-w-7xl mx-auto space-y-20">
          <div className="flex flex-col md:flex-row justify-between items-end gap-8">
            <div className="space-y-4">
              <h2 className="text-4xl font-bold text-primary tracking-tight">Nossas Abordagens</h2>
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

      {/* Compact Equipe Section */}
      <section className="section-padding bg-surface-container-low border-y border-outline-variant/30">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="text-center space-y-4">
            <h2 className="text-4xl font-bold text-primary tracking-tight">Especialistas</h2>
            <p className="text-on-surface-variant max-w-xl mx-auto font-medium">Conheça os profissionais que compõem nosso corpo clínico especializado.</p>
          </div>
          
          <div className="flex gap-8 overflow-x-auto pb-10 hide-scrollbar scroll-smooth snap-x">
            {specialists.map(spec => (
              <div key={spec.id} className="min-w-[320px] bg-white rounded-[3rem] overflow-hidden soft-shadow group snap-center border border-outline-variant/30 flex flex-col">
                <div className="h-80 relative overflow-hidden grayscale group-hover:grayscale-0 transition-all duration-700">
                  <img src={spec.img} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" alt={spec.name} />
                </div>
                <div className="p-8 space-y-6 flex-grow flex flex-col justify-between">
                  <div className="space-y-4">
                    <h4 className="text-xl font-bold text-primary leading-none">{spec.name}</h4>
                    <span className="text-secondary font-bold text-xs uppercase tracking-widest">{spec.spec}</span>
                    <p className="text-xs text-on-surface-variant/60 font-mono tracking-widest uppercase">CRP {spec.crp}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {spec.ageGroups.slice(0, 2).map(g => (
                      <span key={g} className="bg-secondary-container text-on-secondary-container px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">{g}</span>
                    ))}
                  </div>
                  <button 
                    onClick={() => onNavigate(Screen.CorpoClinico, 'push')}
                    className="w-full py-4 text-xs font-black uppercase tracking-[0.2em] text-primary border-t border-outline-variant/30 mt-4 group-hover:text-secondary group-hover:bg-secondary-container/20 transition-all"
                  >
                    Ver Perfil Completo
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          <div className="text-center">
            <button 
              onClick={() => onNavigate(Screen.CorpoClinico, 'push')}
              className="btn-primary !px-12 shadow-primary/20"
            >
              Encontrar meu Especialista <ArrowForward size={18} />
            </button>
          </div>
        </div>
      </section>

      {/* Material CTA */}
      <section className="section-padding">
        <div className="max-w-5xl mx-auto bg-primary text-white rounded-[3.5rem] p-12 md:p-20 relative overflow-hidden shadow-2xl text-center group">
          <div className="relative z-10 space-y-8">
            <h2 className="text-4xl md:text-6xl font-bold tracking-tight">Pronto para dar o próximo passo?</h2>
            <p className="text-lg md:text-xl text-on-primary-container/80 max-w-2xl mx-auto font-medium">
               A jornada do equilíbrio começa com um acolhimento respeitoso. Agende uma conversa inicial e tire todas as suas dúvidas.
            </p>
            <button 
              onClick={() => onNavigate(Screen.Agendamento, 'push')}
              className="bg-white text-primary px-12 py-6 rounded-2xl font-bold text-lg hover:shadow-2xl transition-all active:scale-95 group-hover:scale-105"
            >
              Agendar minha consulta agora
            </button>
          </div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-[80px]"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-secondary-container/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-[60px]"></div>
        </div>
      </section>
    </Layout>
  );
}

function AbordagensScreen({ onNavigate, approaches }: { onNavigate: (screen: Screen, transition?: TransitionType) => void; approaches: Approach[] }) {
  return (
    <Layout activeScreen={Screen.Abordagens} onNavigate={onNavigate}>
      <header className="section-padding bg-background pt-32">
        <div className="max-w-7xl mx-auto text-center space-y-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <span className="inline-block px-4 py-1.5 rounded-full bg-primary-container text-white text-[10px] font-bold uppercase tracking-widest shadow-sm">
              Nossas Fundamentações
            </span>
            <h1 className="text-5xl md:text-7xl font-extrabold text-primary tracking-tight mt-8">Ciência & <span className="text-secondary italic">Acolhimento</span></h1>
            <p className="text-lg md:text-xl text-on-surface-variant font-medium max-w-2xl mx-auto mt-8 leading-relaxed">
              Diferentes perspectivas clínicas para uma compreensão integral da saúde mental.
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
                <button 
                  onClick={() => onNavigate(Screen.Agendamento, 'push')}
                  className="btn-primary"
                >
                  Agendar com esta abordagem
                </button>
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
           <button onClick={() => onNavigate(Screen.Agendamento, 'push')} className="btn-secondary !bg-white !text-primary transform hover:scale-105">Iniciar Jornada</button>
        </div>
      </section>
    </Layout>
  );
}

function SEOScreen({ onNavigate }: ScreenProps) {
  return (
    <Layout activeScreen={Screen.SEO} onNavigate={onNavigate}>
      <header className="px-6 py-20 md:py-40 bg-surface-container-low overflow-hidden relative">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-20 items-center relative z-10">
          <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} className="space-y-10">
            <span className="inline-block px-4 py-1.5 rounded-full bg-secondary-container text-on-secondary-container text-xs font-bold uppercase tracking-widest">
              Psicologia em Palhoça
            </span>
            <h1 className="text-6xl md:text-8xl font-black text-primary leading-tight tracking-tighter">
              Seu Refúgio no <span className="text-secondary">Pagani</span>
            </h1>
            <p className="text-xl text-on-surface-variant font-medium leading-relaxed max-w-xl">
              Localizada no centro comercial de Palhoça, a Clínica Hope oferece discrição, acessibilidade e o máximo conforto para sua jornada terapêutica.
            </p>
            <div className="flex flex-wrap gap-4">
               {['Acessível', 'Climatizado', 'Estacionamento Próprio'].map(tag => (
                 <span key={tag} className="flex items-center gap-2 text-sm font-bold text-primary bg-white px-6 py-3 rounded-2xl shadow-sm border border-outline-variant/30">
                    <Verified size={18} className="text-secondary" /> {tag}
                 </span>
               ))}
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="relative">
             <div className="aspect-[4/5] rounded-[4rem] overflow-hidden soft-shadow border-4 border-white">
                <img src="https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=2069" className="w-full h-full object-cover" alt="Clinica Interior" />
             </div>
             <div className="absolute -bottom-6 -right-6 bg-primary text-white p-8 rounded-[2.5rem] shadow-2xl space-y-2">
                <p className="text-xs font-bold uppercase tracking-widest opacity-60">Endereço</p>
                <p className="text-lg font-bold">Bairro Pagani, Palhoça/SC</p>
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

      <div className="w-full h-[500px] grayscale hover:grayscale-0 transition-all duration-1000">
         <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuAFEuUOZS85uek4ySOsBKwdEtfvjR5sx16STxDw1deoYdbPG7sW7GG_i91spg0hjZ6dXoWoo0A5ExZcBQKHu0sy2NO-_6EQDcrDE0lgBKNL0CJojYEG_tEzHOWNXZR7nrOGnXbN1JNWVhE_BEHSlMli3TFxSxhiLRWFGMJcBRk9BlXyVdAmqpbDJmFgwK9cktVPvqpZWBlZMGYkLcQDeEhZS-fwqUCiC2P55d0zeu7Opuwr4rmMsf26sC5LTSTOKZ25_0r8YqYgenA" className="w-full h-full object-cover" alt="Mapa Localização" />
      </div>
    </Layout>
  );
}

interface CorpoClinicoProps extends ScreenProps {
  specialists: Specialist[];
  approaches: Approach[];
  settings: HomeSettings;
}

function CorpoClinicoScreen({ onNavigate, specialists, approaches, settings }: CorpoClinicoProps) {
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
    <Layout activeScreen={Screen.CorpoClinico} onNavigate={onNavigate}>
      <header className="section-padding bg-background pt-32">
        <div className="max-w-7xl mx-auto text-center space-y-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <span className="inline-block px-4 py-1.5 rounded-full bg-secondary-container text-on-secondary-container text-[10px] font-bold uppercase tracking-widest shadow-sm">
              Encontre o profissional certo
            </span>
            <h1 className="text-5xl md:text-7xl font-extrabold text-primary tracking-tight mt-8">Corpo <span className="text-secondary italic">Clínico</span></h1>
            <p className="text-lg text-on-surface-variant font-medium max-w-2xl mx-auto mt-8 leading-relaxed">
              Curadoria de especialistas dedicados ao acolhimento singular e ético.
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
                      className={`p-8 rounded-[2rem] border-2 text-center font-bold text-xl transition-all ${
                        selectedAge === age ? 'bg-primary text-white border-primary shadow-lg scale-105' : 'bg-white border-outline-variant/50 text-primary hover:border-primary'
                      }`}
                    >
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
                        className={`p-8 rounded-[2rem] border-2 text-center font-bold transition-all ${
                          selectedShifts.includes(shift) ? 'bg-primary text-white border-primary shadow-lg scale-105' : 'bg-white border-outline-variant/50 text-primary hover:border-primary'
                        }`}
                      >
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
        <div className="max-w-7xl mx-auto mt-32 space-y-20">
          <div className="flex justify-between items-end border-b border-outline-variant/50 pb-8">
            <h2 className="text-4xl font-bold text-primary tracking-tight">Profissionais Recomendados</h2>
            <button onClick={resetFilters} className="text-secondary font-bold text-sm underline">Limpar filtros</button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
             {specialistsToShow.map(spec => (
               <motion.div 
                 key={spec.id} 
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
                      <span className="inline-block px-3 py-1 bg-primary-container text-white text-[10px] font-bold uppercase tracking-widest rounded-full">{spec.spec}</span>
                      <p className="text-on-surface-variant text-sm font-medium leading-relaxed italic line-clamp-3">"{spec.desc}"</p>
                    </div>
                    
                    <div className="space-y-6">
                      <div className="flex flex-wrap gap-2">
                        {spec.ageGroups.map(g => (
                          <span key={g} className="bg-surface-container text-on-surface-variant px-3 py-1 rounded-full text-[10px] font-bold uppercase">{g}</span>
                        ))}
                      </div>
                      <button 
                        onClick={() => onNavigate(Screen.Agendamento, 'push')}
                        className="w-full py-4 bg-primary text-white rounded-2xl font-bold hover:shadow-xl transition-all"
                      >
                         Agendar com {spec.name.split(' ')[0]}
                      </button>
                    </div>
                  </div>
               </motion.div>
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

function AgendamentoScreen({ onNavigate }: ScreenProps) {
  return (
    <Layout activeScreen={Screen.Agendamento} onNavigate={onNavigate}>
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
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-start">
          {/* Direct Contact Card */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="bg-primary text-white p-12 md:p-20 rounded-[4rem] shadow-2xl relative overflow-hidden group">
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
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="bg-white p-12 md:p-20 rounded-[4rem] border border-outline-variant/30 soft-shadow">
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

function LoginScreen({ onNavigate, onUnlock }: { onNavigate: (screen: Screen, transition?: TransitionType) => void; onUnlock: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (email === 'scjorge1908@gmail.com' && password === '123456') {
      onUnlock();
      onNavigate(Screen.Admin, 'push');
    } else {
      setError('Credenciais inválidas. Tente novamente.');
    }
  };

  return (
    <Layout activeScreen={Screen.Admin} onNavigate={onNavigate}>
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

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-secondary uppercase tracking-widest pl-1">E-mail</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-surface-container-low border-2 border-transparent focus:border-primary focus:bg-white rounded-2xl p-5 outline-none transition-all font-medium text-primary" 
                placeholder="seu@email.com"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-secondary uppercase tracking-widest pl-1">Senha</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-surface-container-low border-2 border-transparent focus:border-primary focus:bg-white rounded-2xl p-5 outline-none transition-all font-medium text-primary" 
                placeholder="••••••"
                required
              />
            </div>

            {error && (
              <p className="text-red-500 text-sm font-bold text-center italic">{error}</p>
            )}

            <button 
              type="submit"
              className="w-full py-5 bg-primary text-white rounded-2xl font-bold text-lg hover:shadow-xl transition-all active:scale-95"
            >
              Entrar no Painel
            </button>
          </form>

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

function AdminScreen({ onNavigate, settings, onUpdateSettings, specialists, onUpdateSpecialists, approaches, onUpdateApproaches, user }: AdminScreenProps & { user: User | null }) {
  const [activeTab, setActiveTab] = useState<'home' | 'corpo' | 'abordagens'>('home');
  const [saveStatus, setSaveStatus] = useState<{[key: string]: boolean}>({});
  const [croppingSpecId, setCroppingSpecId] = useState<string | null>(null);
  const [cropImage, setCropImage] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  // Login Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      setLoginError('Falha no login. Verifique seu email e senha.');
      console.error(err);
    }
  };

  if (!user) {
    return (
      <Layout activeScreen={Screen.Admin} onNavigate={onNavigate}>
        <div className="max-w-4xl mx-auto pt-48 pb-24 px-6 text-center">
          <div className="bg-white p-12 md:p-16 rounded-[3rem] border border-outline modern-shadow space-y-10">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto text-primary">
              <VerifiedUser size={40} />
            </div>
            <div className="space-y-4">
              <h2 className="text-4xl font-display font-black text-primary tracking-tighter">Acesso Restrito</h2>
              <p className="text-on-surface-variant max-w-sm mx-auto font-medium">Faça o login para gerenciar a clínica.</p>
            </div>
            
            <form onSubmit={handleLogin} className="max-w-sm mx-auto space-y-6">
              <div className="space-y-4 text-left">
                <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest ml-1">E-mail</label>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-surface border border-outline rounded-2xl p-4 outline-none focus:border-primary transition-colors font-medium"
                  placeholder="admin@clinica.com"
                  required
                />
              </div>
              <div className="space-y-4 text-left">
                <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest ml-1">Senha</label>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-surface border border-outline rounded-2xl p-4 outline-none focus:border-primary transition-colors font-medium"
                  placeholder="••••••"
                  required
                />
              </div>
              {loginError && <p className="text-accent text-[10px] font-bold uppercase tracking-widest">{loginError}</p>}
              <button 
                type="submit"
                className="w-full py-5 bg-primary text-white rounded-[2rem] font-black text-sm uppercase tracking-widest hover:bg-primary-light transition-all shadow-xl shadow-primary/10"
              >
                Entrar no Painel
              </button>
            </form>

            <div className="pt-4">
              <p className="text-[10px] font-bold text-on-surface-variant/40 uppercase tracking-widest mb-6">— ou continue com —</p>
              <button 
                onClick={() => signInWithPopup(auth, new GoogleAuthProvider())}
                className="px-8 py-4 bg-white border border-outline text-on-surface-variant rounded-2xl font-bold text-[10px] uppercase tracking-widest hover:bg-surface transition-all flex items-center gap-3 mx-auto"
              >
                Google Account
              </button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // Admin Verification (Redundant with rules but good for UI)
  const isAdmin = user.email === 'scjorge1908@gmail.com';

  if (!isAdmin) {
    return (
      <Layout activeScreen={Screen.Admin} onNavigate={onNavigate}>
        <div className="max-w-4xl mx-auto py-32 px-6 text-center">
          <div className="bg-white p-16 rounded-[3rem] border border-accent/20 modern-shadow space-y-8">
            <div className="w-24 h-24 bg-accent/10 rounded-full flex items-center justify-center mx-auto text-accent">
              <MoodBad size={48} />
            </div>
            <h2 className="text-4xl font-display font-black text-accent tracking-tighter">Acesso Negado</h2>
            <p className="text-on-surface-variant max-w-sm mx-auto font-medium">Você está logado como <strong>{user.email}</strong>, mas não possui permissões de administrador.</p>
            <button onClick={() => auth.signOut()} className="text-xs font-black uppercase text-primary tracking-widest hover:underline">Sair da conta</button>
          </div>
        </div>
      </Layout>
    );
  }

  const addSpecialist = async () => {
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
    try {
      await setDoc(doc(db, 'specialists', id), newSpec);
      onUpdateSpecialists([...specialists, newSpec]);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `specialists/${id}`);
    }
  };

  const removeSpecialist = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'specialists', id));
      onUpdateSpecialists(specialists.filter(s => s.id !== id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `specialists/${id}`);
    }
  };

  const updateSpecialist = (id: string, updates: Partial<Specialist>) => {
    onUpdateSpecialists(specialists.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, specId: string) => {
    if (e.target.files && e.target.files.length > 0) {
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        setCropImage(reader.result as string);
        setCroppingSpecId(specId);
      });
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const onCropComplete = (croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const applyCrop = async () => {
    if (cropImage && croppingSpecId && croppedAreaPixels) {
      try {
        const croppedImg = await getCroppedImg(cropImage, croppedAreaPixels);
        updateSpecialist(croppingSpecId, { img: croppedImg });
        setCroppingSpecId(null);
        setCropImage(null);
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleSave = async (id: string) => {
    const spec = specialists.find(s => s.id === id);
    if (!spec) return;

    setSaveStatus({ ...saveStatus, [id]: true });
    try {
      await setDoc(doc(db, 'specialists', id), spec);
      setTimeout(() => {
        setSaveStatus(prev => ({ ...prev, [id]: false }));
      }, 2000);
    } catch (err) {
      setSaveStatus(prev => ({ ...prev, [id]: false }));
      handleFirestoreError(err, OperationType.UPDATE, `specialists/${id}`);
    }
  };

  const addInsurance = async () => {
    const id = Date.now().toString();
    const newInsurance = {
      id,
      name: 'Novo Plano',
      logo: 'https://cdn-icons-png.flaticon.com/512/2854/2854580.png'
    };
    try {
      await setDoc(doc(db, 'insurancePlans', id), newInsurance);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `insurancePlans/${id}`);
    }
  };

  const updateInsurance = async (id: string, updates: Partial<InsurancePlan>) => {
    const plan = (settings.insurancePlans || []).find(p => p.id === id);
    if (!plan) return;
    try {
      await updateDoc(doc(db, 'insurancePlans', id), updates);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `insurancePlans/${id}`);
    }
  };

  const removeInsurance = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'insurancePlans', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `insurancePlans/${id}`);
    }
  };

  const handleInsuranceLogoChange = (e: React.ChangeEvent<HTMLInputElement>, id: string) => {
    if (e.target.files && e.target.files.length > 0) {
      const reader = new FileReader();
      reader.onload = () => {
        updateInsurance(id, { logo: reader.result as string });
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const addApproach = async () => {
    const id = Date.now().toString();
    const newApp: Approach = {
      id,
      title: 'Nova Abordagem',
      desc: 'Breve descrição...',
      details: 'Detalhes completos sobre como funciona a terapia nesta abordagem.'
    };
    try {
      await setDoc(doc(db, 'approaches', id), newApp);
      onUpdateApproaches([...approaches, newApp]);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `approaches/${id}`);
    }
  };

  const removeApproach = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'approaches', id));
      onUpdateApproaches(approaches.filter(a => a.id !== id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `approaches/${id}`);
    }
  };

  const updateApproach = (id: string, updates: Partial<Approach>) => {
    onUpdateApproaches(approaches.map(a => a.id === id ? { ...a, ...updates } : a));
  };

  const saveApproach = async (id: string) => {
    const approach = approaches.find(a => a.id === id);
    if (!approach) return;
    try {
      await setDoc(doc(db, 'approaches', id), approach);
      alert('Abordagem salva com sucesso!');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `approaches/${id}`);
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
          <div className="flex bg-white rounded-2xl p-1 modern-shadow border border-outline">
            {(['home', 'corpo', 'abordagens'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-primary text-white' : 'text-on-surface-variant hover:bg-surface'}`}
              >
                {tab === 'home' ? 'Página Inicial' : tab === 'corpo' ? 'Corpo Clínico' : 'Abordagens'}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-[2.5rem] modern-shadow border border-outline p-10">
          {activeTab === 'home' && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <label className="text-[10px] uppercase font-bold tracking-widest text-primary">Título Principal</label>
                  <input 
                    className="w-full text-2xl font-display font-bold border-b-2 border-outline focus:border-primary outline-none py-2"
                    value={settings.heroTitle}
                    onChange={(e) => onUpdateSettings({ ...settings, heroTitle: e.target.value })}
                  />
                </div>
                <div className="space-y-4">
                  <label className="text-[10px] uppercase font-bold tracking-widest text-primary">Subtítulo</label>
                  <input 
                    className="w-full text-2xl font-display font-bold border-b-2 border-outline focus:border-primary outline-none py-2"
                    value={settings.heroSubtitle}
                    onChange={(e) => onUpdateSettings({ ...settings, heroSubtitle: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-4">
                <label className="text-[10px] uppercase font-bold tracking-widest text-primary">Texto Hero</label>
                <textarea 
                  className="w-full text-lg leading-relaxed border-b-2 border-outline focus:border-primary outline-none py-2 resize-none"
                  rows={3}
                  value={settings.heroText}
                  onChange={(e) => onUpdateSettings({ ...settings, heroText: e.target.value })}
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
                  {(settings.insurancePlans || []).map(plan => (
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
                {specialists.map(s => (
                  <div key={s.id} className="p-8 border border-outline rounded-[2rem] flex flex-col md:flex-row gap-8 items-start relative group">
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
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <p className="text-[10px] uppercase font-bold tracking-widest text-primary">ID Agenda Planilha</p>
                            <input 
                              className="p-2 border-b border-outline w-full focus:border-primary outline-none" 
                              value={s.agendaId || ''} 
                              onChange={e => updateSpecialist(s.id, { agendaId: e.target.value })} 
                              placeholder="Fica na URL da planilha" 
                            />
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
                {approaches.map(a => (
                  <div key={a.id} className="p-8 border border-outline rounded-[2rem] space-y-6">
                    <div className="space-y-6 flex-grow">
                      <input className="w-full text-xl font-bold p-2 border-b border-outline" value={a.title} onChange={e => updateApproach(a.id, { title: e.target.value })} placeholder="Título" />
                      <input className="w-full p-2 border-b border-outline text-on-surface-variant" value={a.desc} onChange={e => updateApproach(a.id, { desc: e.target.value })} placeholder="Breve descrição" />
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase font-bold tracking-widest text-primary">Detalhes</label>
                        <textarea className="w-full p-4 border border-outline rounded-2xl" rows={4} value={a.details} onChange={e => updateApproach(a.id, { details: e.target.value })} placeholder="Explicação..." />
                      </div>
                      <button 
                        onClick={() => saveApproach(a.id)}
                        className="btn-modern-primary py-3 px-8 text-[10px]"
                      >
                        Salvar Abordagem
                      </button>
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
                onClick={() => { setCropImage(null); setCroppingSpecId(null); }}
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
                  <button onClick={() => { setCropImage(null); setCroppingSpecId(null); }} className="w-10 h-10 rounded-full bg-surface hover:bg-outline flex items-center justify-center transition-colors">
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
                      onClick={() => { setCropImage(null); setCroppingSpecId(null); }}
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
