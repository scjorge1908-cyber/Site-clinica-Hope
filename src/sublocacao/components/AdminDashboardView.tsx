import React, { useState, useRef, FormEvent, useEffect } from 'react';
import { 
  Key, Database, FileEdit, LayoutDashboard, Search, Calendar, CreditCard, 
  Settings, CheckCircle, TrendingUp, Sparkles, Upload, Eye, Trash2, ShieldCheck, RefreshCw,
  Plus, Coffee, Music, Wind, Gamepad, MapPin, Users, Bath, Sofa, Check, X, ShieldAlert, User, Phone, FileText,
  Smartphone, QrCode, Apple, Star, Wifi, Car, VolumeX, Baby, Video, ArrowUpDown, HelpCircle, Maximize,
  SlidersHorizontal, Camera, Image
} from 'lucide-react';
import { Booking, AdminSettings, Room, ProfessionalProfile } from '../types';
import EditorView from './EditorView';
import { getAmenityIcon, cleanAmenityLabel } from './BookingPageView';

export const AMENITIES_LIST = [
  { label: 'Wi-Fi', emoji: '📶' },
  { label: 'Copa', emoji: '☕' },
  { label: 'Estacionamento', emoji: '🚗' },
  { label: 'Banheiro', emoji: '🚻' },
  { label: 'Climatizado', emoji: '❄️' },
  { label: 'Acústico', emoji: '🔇' },
  { label: 'Recepção', emoji: '🛎️' },
  { label: 'Espaço Infantil', emoji: '🧸' },
  { label: 'Videoconferência', emoji: '📹' },
  { label: 'Elevador', emoji: '🛗' }
];

export const CLINIC_PRESETS = [
  { name: 'Pediatria / Infantil', url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAoW3_3-lK3ixFkeSUuv13KklvQeADvFsiWG-M2JXqkPo3zc351XK-v-QY5B6WZhMFYcdux00x9OQx8JQ3t81CRSw19hEzWMubmMom5eMM-9Jwz14jeGfJBQe8fV4f5h3ioRQdGt2JHH92cElgmq9VuAOcTw7-9w7x1_cltDMQPUqRRNV5kEMi9GPzjkXYtGddkTSaSfaEtayWZ4p31vYarH7bg2go2QjYVqVzV4JvlyzqGLQH-dZynak73vV5-YBhcm0oWpMxUf0w' },
  { name: 'Psicologia Clássica', url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBEA5kcWz6rbF7fVL_dVyf4kNliZh8hHnoTBjUNP-IqEaUPjRkWwbmMiVLt0-qmPlAPb3WEBZnuKKxtPPdeGGyuE_itqi6_ADsV6lfhB-fI-90aTCt_Kyju8NQXl4klyixYzoi2wZ9JjTPioHfHvMoc5a5FtygotQs05VASNttBMqHVm6ehI5O4Z4R2xHI1I4FcB8tiWzzVTW8agz70qJ57GdPnq75ElzCPEckGi-yYNWCFvqxTKKYq9S-f0Srazuq69vYW1Xa02jA' },
  { name: 'Multidisciplinar Geral', url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBq8jn8GNPvhb_gIC4xr06rraY39VlEUEH-0vSJU6AYujIG9DPkiUF1zqgzTX4ed3d_R2wOdBXRkiOMI1Y9BO9LzgJkVhgoETydsTV8dowqy_Z9JNSoh_SiVLn0ilBjJowhkrFI_0mgfjbkVy-Qq32p4dqZVc0fNwPvvGoy_Z8ShEwGo0oyYQgb5AdRSb09mKV_O1pwN0N-wglRmLTKXEAy6PFRZCkL8A7B8oN3s_OrsOv7CY8nPWXlcPeRWSvDO5P2k_UvMbJ51tU' },
  { name: 'Mesa Reuniões Clinica', url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCpK_ydxVzclnmYMUAi0fsi4DzKI6JXpLmaD9G4jAA8rUDn6AyhwunUa4UddC_1JNYOekP_W2E3pKLnY14-QXm8nN9PhbUkw2T4tMo4n__v_aOuyEIuudaAeqR3IjtbOc3sKmovzJxlZF0_oLpSFqedv8UtqQPeoiR0TfKXgeDNA54dq6ZO_jVXIxUrPJbJnuDZXE8mtKjhRPaiyRxL1eG9phYCM4C3JrjDNRuBP1ov_16x1MXzql6-d_L4wU6RMKkt6WcTJNBkYDQ' },
  { name: 'Consultório Médico Clean', url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCbK8t2MXcuciTeSFdpZrvoudmGLI2aWWKTHsUBGmLIisjwi8bZmKUb4GMCgLy58EDLq-Ic1Xtd457pWxBK-N6dP55R5bb9r2ehTy2t1kX6pEViqQ3Cl0HrAgBRla5fgbbjJ5D-YBfwaYoqJJ950dGz3j_sPgVqq3Lkxnh1GdZoffRJD5wXX9krvDqNQfrEKkFEj3-cVL0WesZKYsNqQGFLClaC2zW6Zvzv3DLN-lJEn3gnN23bJjDO8pwQuFZ20zsAxAIa_CdKqwY' },
  { name: 'Recepção e Detalhes', url: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&q=80&w=1200' }
];

export const parseFormattedPrice = (val: string | number): number => {
  if (typeof val === 'number') return val;
  if (!val) return 0;
  const cleaned = val.replace(',', '.');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
};

interface AdminDashboardProps {
  adminSettings: AdminSettings;
  bookings: Booking[];
  rooms: Room[];
  onUpdateSettings: (settings: AdminSettings) => void;
  onCancelBooking: (bookingId: string) => void;
  onUpdateRooms: (rooms: Room[]) => void;
  registeredUsers: ProfessionalProfile[];
  onUpdateUsers: (users: ProfessionalProfile[]) => void;
  setView: (view: string) => void;
}

export default function AdminDashboardView({
  adminSettings,
  bookings,
  rooms,
  onUpdateSettings,
  onCancelBooking,
  onUpdateRooms,
  registeredUsers,
  onUpdateUsers,
  setView
}: AdminDashboardProps) {
  // Local state for forms
  const [adminTab, setAdminTab] = useState<'dashboard' | 'editor'>('dashboard');
  const [appScriptId, setAppScriptId] = useState(adminSettings?.appScriptId || '');
  const [publicKey, setPublicKey] = useState(adminSettings?.publicKey || '');
  const [webhookSecret, setWebhookSecret] = useState(adminSettings?.webhookSecret || '');
  const [isProductionMode, setIsProductionMode] = useState(adminSettings?.isProductionMode ?? false);
  
  const [standardPrice, setStandardPrice] = useState(adminSettings?.tableOfPrices?.standard ?? 45);
  const [premiumPrice, setPremiumPrice] = useState(adminSettings?.tableOfPrices?.premium ?? 75);
  const [auditoriumPrice, setAuditoriumPrice] = useState(adminSettings?.tableOfPrices?.auditorium ?? 280);
  const [executivoLuxoPrice, setExecutivoLuxoPrice] = useState(adminSettings?.tableOfPrices?.executivo_luxo ?? 120);

  const [heroTitle, setHeroTitle] = useState(adminSettings?.heroTitle || '');
  const [heroDescription, setHeroDescription] = useState(adminSettings?.heroDescription || '');

  // New customizable copy states
  const [heroImage, setHeroImage] = useState(adminSettings?.heroImage || '');
  const [landingRoomsHeading, setLandingRoomsHeading] = useState(adminSettings?.landingRoomsHeading || '');
  const [landingRoomsSub, setLandingRoomsSub] = useState(adminSettings?.landingRoomsSub || '');
  const [bookingRoomsHeading, setBookingRoomsHeading] = useState(adminSettings?.bookingRoomsHeading || '');
  const [trustTitle, setTrustTitle] = useState(adminSettings?.trustTitle || '');
  const [trustDesc, setTrustDesc] = useState(adminSettings?.trustDesc || '');
  const [plan1Title, setPlan1Title] = useState(adminSettings?.plan1Title || '');
  const [plan1Subtitle, setPlan1Subtitle] = useState(adminSettings?.plan1Subtitle || '');
  const [plan1Desc, setPlan1Desc] = useState(adminSettings?.plan1Desc || '');
  const [plan1PriceSuffix, setPlan1PriceSuffix] = useState(adminSettings?.plan1PriceSuffix || '');
  const [plan1Price, setPlan1Price] = useState(adminSettings?.plan1Price || '');
  const [plan2Title, setPlan2Title] = useState(adminSettings?.plan2Title || '');
  const [plan2Subtitle, setPlan2Subtitle] = useState(adminSettings?.plan2Subtitle || '');
  const [plan2Desc, setPlan2Desc] = useState(adminSettings?.plan2Desc || '');
  const [plan2PriceSuffix, setPlan2PriceSuffix] = useState(adminSettings?.plan2PriceSuffix || '');
  const [plan2Price, setPlan2Price] = useState(adminSettings?.plan2Price || '');

  const [gallery, setGallery] = useState<string[]>(adminSettings?.galleryImages || []);
  const [showGallery, setShowGallery] = useState<boolean>(adminSettings?.showGallery !== false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Room edit states
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [editRoomNameOnly, setEditRoomNameOnly] = useState('');
  const [editRoomLocation, setEditRoomLocation] = useState('');
  const [editRoomDescription, setEditRoomDescription] = useState('');
  const [editRoomType, setEditRoomType] = useState<'standard' | 'premium' | 'auditorium' | 'executivo_luxo'>('standard');
  const [editRoomImage0, setEditRoomImage0] = useState('');
  const [editRoomImage1, setEditRoomImage1] = useState('');
  const [editRoomImage2, setEditRoomImage2] = useState('');
  
  const [editRoomFeatures, setEditRoomFeatures] = useState<string[]>([]);
  const [editRoomSize, setEditRoomSize] = useState('');
  const [editRoomCapacity, setEditRoomCapacity] = useState('');
  const [editRoomPrice, setEditRoomPrice] = useState<string | number>('0');
  const [isImageEditorExpanded, setIsImageEditorExpanded] = useState(false);

  // Room creation states
  const [isAddingRoom, setIsAddingRoom] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomType, setNewRoomType] = useState<'standard' | 'premium' | 'auditorium' | 'executivo_luxo'>('standard');
  const [newRoomNumber, setNewRoomNumber] = useState('');
  const [newRoomLocation, setNewRoomLocation] = useState('Av. Barão do Rio Branco, 150 - Centro, Palhoça - SC');
  const [newRoomDescription, setNewRoomDescription] = useState('');
  
  const [newRoomSize, setNewRoomSize] = useState('15m²');
  const [newRoomCapacity, setNewRoomCapacity] = useState('Até 3 pessoas');
  const [newRoomPrice, setNewRoomPrice] = useState<string | number>('30');

  // Default exactly 3 image presets in state
  const [newRoomImage0, setNewRoomImage0] = useState('https://lh3.googleusercontent.com/aida-public/AB6AXuAoW3_3-lK3ixFkeSUuv13KklvQeADvFsiWG-M2JXqkPo3zc351XK-v-QY5B6WZhMFYcdux00x9OQx8JQ3t81CRSw19hEzWMubmMom5eMM-9Jwz14jeGfJBQe8fV4f5h3ioRQdGt2JHH92cElgmq9VuAOcTw7-9w7x1_cltDMQPUqRRNV5kEMi9GPzjkXYtGddkTSaSfaEtayWZ4p31vYarH7bg2go2QjYVqVzV4JvlyzqGLQH-dZynak73vV5-YBhcm0oWpMxUf0w');
  const [newRoomImage1, setNewRoomImage1] = useState('https://lh3.googleusercontent.com/aida-public/AB6AXuBEA5kcWz6rbF7fVL_dVyf4kNliZh8hHnoTBjUNP-IqEaUPjRkWwbmMiVLt0-qmPlAPb3WEBZnuKKxtPPdeGGyuE_itqi6_ADsV6lfhB-fI-90aTCt_Kyju8NQXl4klyixYzoi2wZ9JjTPioHfHvMoc5a5FtygotQs05VASNttBMqHVm6ehI5O4Z4R2xHI1I4FcB8tiWzzVTW8agz70qJ57GdPnq75ElzCPEckGi-yYNWCFvqxTKKYq9S-f0Srazuq69vYW1Xa02jA');
  const [newRoomImage2, setNewRoomImage2] = useState('https://lh3.googleusercontent.com/aida-public/AB6AXuBq8jn8GNPvhb_gIC4xr06rraY39VlEUEH-0vSJU6AYujIG9DPkiUF1zqgzTX4ed3d_R2wOdBXRkiOMI1Y9BO9LzgJkVhgoETydsTV8dowqy_Z9JNSoh_SiVLn0ilBjJowhkrFI_0mgfjbkVy-Qq32p4dqZVc0fNwPvvGoy_Z8ShEwGo0oyYQgb5AdRSb09mKV_O1pwN0N-wglRmLTKXEAy6PFRZCkL8A7B8oN3s_OrsOv7CY8nPWXlcPeRWSvDO5P2k_UvMbJ51tU');

  // Interactive focus variables for real-time panning/zoom of pictures ("mexer e ajustar a foto")
  const [activeNewImageIdx, setActiveNewImageIdx] = useState<number>(0);
  const [activeEditImageIdx, setActiveEditImageIdx] = useState<number>(0);

  const [newImgZooms, setNewImgZooms] = useState<number[]>([100, 100, 100]);
  const [newImgPosXs, setNewImgPosXs] = useState<number[]>([50, 50, 50]);
  const [newImgPosYs, setNewImgPosYs] = useState<number[]>([50, 50, 50]);
  const [newImgRotate, setNewImgRotate] = useState<number>(0);
  const [newImgBrightness, setNewImgBrightness] = useState<number>(100);
  const [newImgContrast, setNewImgContrast] = useState<number>(100);

  const [editImgZooms, setEditImgZooms] = useState<number[]>([100, 100, 100]);
  const [editImgPosXs, setEditImgPosXs] = useState<number[]>([50, 50, 50]);
  const [editImgPosYs, setEditImgPosYs] = useState<number[]>([50, 50, 50]);
  const [editImgRotate, setEditImgRotate] = useState<number>(0);
  const [editImgBrightness, setEditImgBrightness] = useState<number>(100);
  const [editImgContrast, setEditImgContrast] = useState<number>(100);
  
  // Safe state confirmation states (prevents iframe alert/confirm sandbox restrictions)
  const [deletingUserEmail, setDeletingUserEmail] = useState<string | null>(null);
  const [deletingRoomId, setDeletingRoomId] = useState<string | null>(null);
  const [cancellingBookingId, setCancellingBookingId] = useState<string | null>(null);
  
  // Amenities selection list state (newRoom)
  const [newRoomFeatures, setNewRoomFeatures] = useState<string[]>(['📶 Wi-Fi', '☕ Copa', '❄️ Climatizado']);

  useEffect(() => {
    if (adminSettings && adminSettings.tableOfPrices) {
      setNewRoomPrice(adminSettings.tableOfPrices[newRoomType] || 30);
    }
  }, [newRoomType, adminSettings.tableOfPrices]);

  // File upload simulated trigger
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>, isEdit: boolean) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2.5 * 1024 * 1024) {
        alert("Para melhor desempenho no armazenamento local, escolha imagens com menos de 2.5MB.");
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result && typeof event.target.result === 'string') {
          if (isEdit) {
            setEditRoomImage0(event.target.result);
          } else {
            setNewRoomImage0(event.target.result);
          }
          triggerToast("Foto anexada e carregada no editor de imagens com sucesso! 📸");
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleCreateRoom = (e: FormEvent) => {
    e.preventDefault();
    if (!newRoomName.trim()) {
      alert('Por favor, informe o nome do consultório.');
      return;
    }
    if (!newRoomNumber.trim()) {
      alert('Por favor, informe o número do consultório (Ex: Consultório 102).');
      return;
    }
    if (!newRoomLocation.trim()) {
      alert('Por favor, informe o endereço da sala.');
      return;
    }
    if (!newRoomDescription.trim()) {
      alert('Por favor, descreva brevemente a sala.');
      return;
    }

    const price = parseFormattedPrice(newRoomPrice) || 30;
    const features = newRoomFeatures;
 
    const newId = `room-${Date.now()}`;
    const formattedName = `${newRoomName} - ${newRoomNumber}`;
 
    const newRoom: Room = {
      id: newId,
      name: formattedName,
      type: newRoomType,
      pricePerHour: price,
      rating: 5.0,
      size: "",
      capacity: "",
      location: newRoomLocation,
      description: newRoomDescription,
      images: [newRoomImage0].filter(Boolean),
      features,
      imageSettings: {
        zoom: newImgZooms[0] || 100,
        posX: newImgPosXs[0] || 50,
        posY: newImgPosYs[0] || 50,
        rotate: newImgRotate || 0,
        brightness: newImgBrightness || 100,
        contrast: newImgContrast || 100
      }
    };
 
    onUpdateRooms([...rooms, newRoom]);
    triggerToast('Sala cadastrada com sucesso! Disponível para locação agora.');
 
    // Reset fields
    setNewRoomName('');
    setNewRoomNumber('');
    setNewRoomDescription('');
    setNewRoomFeatures(['📶 Wi-Fi', '☕ Copa', '❄️ Climatizado']);
    setNewRoomSize('15m²');
    setNewRoomCapacity('Até 3 pessoas');
    setNewRoomPrice(30);
    setNewImgZooms([100, 100, 100]);
    setNewImgPosXs([50, 50, 50]);
    setNewImgPosYs([50, 50, 50]);
    setNewImgRotate(0);
    setNewImgBrightness(100);
    setNewImgContrast(100);
    setIsAddingRoom(false);
  };

  const handleDeleteRoom = (roomId: string) => {
    if (confirm('Deseja realmente excluir esta sala do catálogo de locações?')) {
      const updatedRooms = rooms.filter(r => r.id !== roomId);
      onUpdateRooms(updatedRooms);
      triggerToast('Sala removida com sucesso de Palhoça.');
    }
  };

  const handleDeleteUser = (email: string) => {
    if (confirm('Deseja realmente excluir permanentemente este cadastro de profissional? Esta ação é irreversível.')) {
      const updated = registeredUsers.filter(u => u.email !== email);
      onUpdateUsers(updated);
      triggerToast('Profissional excluído do sistema com sucesso! 🗑️');
    }
  };

  // 1. Google Appscript save
  const handleSaveAppScript = () => {
    onUpdateSettings({
      ...adminSettings,
      appScriptId
    });
    triggerToast('Configuração de sincronização AppScript salva!');
  };

  // 2. Gateway setup save
  const handleSaveGateway = () => {
    onUpdateSettings({
      ...adminSettings,
      publicKey,
      webhookSecret,
      isProductionMode
    });
    triggerToast('Gateway de pagamento atualizado com sucesso!');
  };

  // Toggle production toggle
  const toggleProdMode = () => {
    setIsProductionMode(!isProductionMode);
  };

  // 3. Save Price settings or Hero texts
  const handlePublishChanges = () => {
    onUpdateSettings({
      ...adminSettings,
      tableOfPrices: {
        standard: standardPrice,
        premium: premiumPrice,
        auditorium: auditoriumPrice,
        executivo_luxo: executivoLuxoPrice
      },
      heroTitle,
      heroDescription,
      galleryImages: gallery,
      showGallery,
      heroImage,
      landingRoomsHeading,
      landingRoomsSub,
      bookingRoomsHeading,
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
    triggerToast('Alterações de texto, preço e imagem publicadas no site com sucesso!');
  };

  const handleSelectRoomForEditing = (room: Room) => {
    setEditingRoom(room);
    setEditRoomNameOnly(room.name);
    setEditRoomLocation(room.location);
    setEditRoomDescription(room.description);
    setEditRoomType(room.type);
    setEditRoomImage0(room.images[0] || '');
    setEditRoomImage1('');
    setEditRoomImage2('');
    setEditRoomSize(room.size || '');
    setEditRoomCapacity('');
    setEditRoomPrice(String(room.pricePerHour || 30).replace('.', ','));
    
    // Load existing image crop/edit settings if present, or set to standard values
    setEditImgZooms([room.imageSettings?.zoom || 100, 100, 100]);
    setEditImgPosXs([room.imageSettings?.posX ?? 50, 50, 50]);
    setEditImgPosYs([room.imageSettings?.posY ?? 50, 50, 50]);
    setEditImgRotate(room.imageSettings?.rotate || 0);
    setEditImgBrightness(room.imageSettings?.brightness ?? 100);
    setEditImgContrast(room.imageSettings?.contrast ?? 100);
    
    // Set amenities
    setEditRoomFeatures(room.features || []);

    setTimeout(() => {
      document.getElementById('edit-room-form-anchor')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  };

  const handleSaveEditedRoom = (e: FormEvent) => {
    e.preventDefault();
    if (!editingRoom) return;

    const features = editRoomFeatures;

    const updatedRooms = rooms.map(r => {
      if (r.id === editingRoom.id) {
        return {
          ...r,
          name: editRoomNameOnly,
          type: editRoomType,
          size: editRoomSize,
          capacity: "",
          pricePerHour: parseFormattedPrice(editRoomPrice) || r.pricePerHour,
          location: editRoomLocation,
          description: editRoomDescription,
          images: [editRoomImage0].filter(Boolean),
          features,
          imageSettings: {
            zoom: editImgZooms[0] || 100,
            posX: editImgPosXs[0] || 50,
            posY: editImgPosYs[0] || 50,
            rotate: editImgRotate || 0,
            brightness: editImgBrightness || 100,
            contrast: editImgContrast || 100
          }
        };
      }
      return r;
    });

    onUpdateRooms(updatedRooms);
    setEditingRoom(null);
    triggerToast('Os dados e fotografias do consultório foram editados com sucesso!');
  };

  // Mock add gallery image
  const handleAddMockImage = () => {
    // Generate a random high resolution medical clean interior image or ask simple URL input
    const newImages = [
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCpK_ydxVzclnmYMUAi0fsi4DzKI6JXpLmaD9G4jAA8rUDn6AyhwunUa4UddC_1JNYOekP_W2E3pKLnY14-QXm8nN9PhbUkw2T4tMo4n__v_aOuyEIuudaAeqR3IjtbOc3sKmovzJxlZF0_oLpSFqedv8UtqQPeoiR0TfKXgeDNA54dq6ZO_jVXIxUrPJbJnuDZXE8mtKjhRPaiyRxL1eG9phYCM4C3JrjDNRuBP1ov_16x1MXzql6-d_L4wU6RMKkt6WcTJNBkYDQ',
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBEA5kcWz6rbF7fVL_dVyf4kNliZh8hHnoTBjUNP-IqEaUPjRkWwbmMiVLt0-qmPlAPb3WEBZnuKKxtPPdeGGyuE_itqi6_ADsV6lfhB-fI-90aTCt_Kyju8NQXl4klyixYzoi2wZ9JjTPioHfHvMoc5a5FtygotQs05VASNttBMqHVm6ehI5O4Z4R2xHI1I4FcB8tiWzzVTW8agz70qJ57GdPnq75ElzCPEckGi-yYNWCFvqxTKKYq9S-f0Srazuq69vYW1Xa02jA',
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAoW3_3-lK3ixFkeSUuv13KklvQeADvFsiWG-M2JXqkPo3zc351XK-v-QY5B6WZhMFYcdux00x9OQx8JQ3t81CRSw19hEzWMubmMom5eMM-9Jwz14jeGfJBQe8fV4f5h3ioRQdGt2JHH92cElgmq9VuAOcTw7-9w7x1_cltDMQPUqRRNV5kEMi9GPzjkXYtGddkTSaSfaEtayWZ4p31vYarH7bg2go2QjYVqVzV4JvlyzqGLQH-dZynak73vV5-YBhcm0oWpMxUf0w'
    ];
    // Prompt to enter any image URL, we can supply a default placeholder nice clinic picture
    const url = prompt('Cole a URL de uma imagem ou clique OK para usar uma imagem padrão de consultório:', newImages[Math.floor(Math.random() * newImages.length)]);
    if (url) {
      setGallery([...gallery, url]);
      triggerToast('Imagem de portfólio adicionada com sucesso!');
    }
  };

  // Compute stats including dynamic items booked
  const activeBookings = bookings.filter(b => b.status === 'Confirmado');
  const sessionSpentSum = activeBookings
    .filter(b => b.id.startsWith('book-')) // Only user added ones
    .reduce((acc, curr) => acc + curr.totalValue, 0);

  const finalRevenue = (adminSettings?.revenueTotalMonth ?? 0) + sessionSpentSum;
  const finalNewBookings = (adminSettings?.newBookingsCount ?? 0) + activeBookings.filter(b => b.id.startsWith('book-')).length;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 pb-12 animate-fade-in relative">
      
      {/* Visual Toast Notification */}
      {showToast && (
        <div className="fixed top-20 right-6 bg-primary text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 z-50 animate-bounce duration-200">
          <ShieldCheck className="w-5 h-5 text-secondary" />
          <span className="font-sans font-semibold text-xs leading-none">{toastMessage}</span>
        </div>
      )}

      {/* Side Navigation Drawer (Left Column in Screen 2) */}
      <aside className="lg:col-span-1 bg-white border border-outline-alt/40 p-6 rounded-3xl space-y-8 flex flex-col justify-between shadow-sm h-fit sticky top-24">
        <div className="space-y-6">
          <div className="flex items-center gap-2.5 pb-4 border-b border-outline-alt/20">
            <Settings className="w-5 h-5 text-primary" />
            <h2 className="font-sans font-black text-primary text-base">Practitioner Portal</h2>
          </div>

          {/* Practitioner Brief info from Screen 2 */}
          <div className="flex items-center gap-3 p-4 bg-surface-container-low rounded-2xl border border-outline-alt/20">
            <div className="w-11 h-11 rounded-full bg-slate-300 overflow-hidden border border-primary/20 flex-shrink-0">
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCbK8t2MXcuciTeSFdpZrvoudmGLI2aWWKTHsUBGmLIisjwi8bZmKUb4GMCgLy58EDLq-Ic1Xtd457pWxBK-N6dP55R5bb9r2ehTy2t1kX6pEViqQ3Cl0HrAgBRla5fgbbjJ5D-YBfwaYoqJJ950dGz3j_sPgVqq3Lkxnh1GdZoffRJD5wXX9krvDqNQfrEKkFEj3-cVL0WesZKYsNqQGFLClaC2zW6Zvzv3DLN-lJEn3gnN23bJjDO8pwQuFZ20zsAxAIa_CdKqwY"
                alt="Admin Global Portrait"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="min-w-0">
              <p className="font-sans font-bold text-primary text-xs truncate">Admin Global</p>
              <p className="text-[10px] uppercase font-bold tracking-wider text-brand-variant">Clínica Hope</p>
            </div>
          </div>

          {/* Navigation Items (Highlights of active panel in Screen 2) */}
          <nav className="flex flex-col gap-1.5 font-sans text-xs">
            <button 
              onClick={() => setAdminTab('dashboard')}
              className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl font-bold text-left transition-all cursor-pointer ${
                adminTab === 'dashboard'
                  ? 'bg-secondary/15 text-secondary'
                  : 'text-primary hover:bg-slate-50'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Painel de Controle</span>
            </button>
            
            <button 
              onClick={() => setAdminTab('editor')}
              className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl font-bold text-left transition-all cursor-pointer ${
                adminTab === 'editor'
                  ? 'bg-secondary/15 text-secondary'
                  : 'text-primary hover:bg-slate-50'
              }`}
            >
              <FileEdit className="w-4 h-4" />
              <span>Editor da Landing Page</span>
            </button>
          </nav>
        </div>

        <div className="text-[9px] font-bold text-brand-variant uppercase tracking-wider text-center border-t border-outline-alt/25 pt-4">
          v1.4.2 · sublocaHope Inc.
        </div>
      </aside>

      {/* Main Content (Right Columns - 3 cols) */}
      <div className="lg:col-span-3 space-y-8">
        {adminTab === 'editor' ? (
          <EditorView
            adminSettings={adminSettings}
            rooms={rooms}
            onUpdateSettings={onUpdateSettings}
            setView={setView}
          />
        ) : (
          <>
            {/* Bento Grid Stats Box (Top items in Screen 2) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-outline-alt/40 shadow-sm flex flex-col justify-between min-h-[140px] relative overflow-hidden bg-gradient-to-r from-white to-brand-bg/10">
            <div>
              <p className="text-brand-variant font-sans font-semibold text-xs uppercase tracking-wider">
                Receita Total (Mês)
              </p>
              <h3 className="font-sans font-black text-3xl text-primary mt-2">
                R$ {(finalRevenue ?? 0).toFixed(2).replace('.', ',')}
              </h3>
            </div>
            <div className="flex items-center gap-1.5 text-secondary text-xs font-bold pt-2 border-t border-outline-alt/10">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>+12% em relação ao mês anterior</span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-outline-alt/40 shadow-sm flex flex-col justify-between min-h-[140px]">
            <div>
              <p className="text-brand-variant font-sans font-semibold text-xs uppercase tracking-wider">
                Novos Agendamentos
              </p>
              <h3 className="font-sans font-black text-3xl text-primary mt-2">
                {finalNewBookings}
              </h3>
            </div>
            <p className="text-[10px] text-brand-variant font-bold uppercase tracking-wider border-t border-outline-alt/10 pt-2">
              8 aguardando aprovação remota
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-outline-alt/40 shadow-sm flex flex-col justify-between min-h-[140px]">
            <div>
              <p className="text-brand-variant font-sans font-semibold text-xs uppercase tracking-wider font-bold">
                Taxa de Ocupação
              </p>
              <h3 className="font-sans font-black text-3xl text-primary mt-2">
                {adminSettings.occupancyRate}%
              </h3>
            </div>
            <div className="w-full bg-outline-alt/30 h-2 rounded-full overflow-hidden mt-1 mt-auto">
              <div 
                className="bg-secondary h-full rounded-full transition-all duration-1000"
                style={{ width: `${adminSettings.occupancyRate}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Core Administrative Forms Grid (Split 2 Columns) */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          
          {/* Card 1: Agenda Integration (AppScript configuration setup in Screen 2) */}
          <div className="bg-white p-8 rounded-3xl border border-outline-alt/40 shadow-sm space-y-6">
            <div className="flex items-center gap-3">
              <div className="bg-secondary/15 text-secondary p-3 rounded-xl">
                <Database className="w-5 h-5 animate-pulse" />
              </div>
              <h4 className="font-sans font-extrabold text-[#111c2c] text-lg leading-tight">
                Integração de Agenda
              </h4>
            </div>
            
            <p className="font-sans text-brand-variant text-xs sm:text-sm leading-relaxed">
              Vincule o ID do seu Google AppScript para sincronizar disponibilidades de consultório em tempo real com o calendário dos profissionais de saúde.
            </p>

            <div className="space-y-2">
              <label htmlFor="app-script-id-field" className="block text-xs uppercase font-extrabold tracking-wider text-brand-variant">
                ID do AppScript Deployment
              </label>
              <input
                id="app-script-id-field"
                type="text"
                value={appScriptId}
                onChange={(e) => setAppScriptId(e.target.value)}
                placeholder="Ex. AKfycbz3W8a2oN3s_OrsOv7..."
                className="w-full px-4 py-3 rounded-xl border border-outline-alt/60 bg-brand-bg font-mono text-xs focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none"
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={handleSaveAppScript}
                className="bg-secondary hover:bg-secondary/95 text-white text-xs font-bold px-5 py-3 rounded-xl shadow-md transition-colors cursor-pointer"
              >
                Salvar Configuração
              </button>
            </div>
          </div>

          {/* Card 2: Payment Gateway configuration setup in Screen 2 */}
          <div className="bg-white p-8 rounded-3xl border border-outline-alt/40 shadow-sm space-y-6">
            <div className="flex items-center gap-3">
              <div className="bg-secondary/15 text-secondary p-3 rounded-xl">
                <CreditCard className="w-5 h-5" />
              </div>
              <h4 className="font-sans font-extrabold text-[#111c2c] text-lg leading-tight">
                Gateway de Pagamento
              </h4>
            </div>

            <p className="font-sans text-brand-variant text-xs sm:text-sm leading-relaxed">
              Configure suas chaves credenciadas Stripe / ASAAS de produção e webhook de recebimento automático para validação de pix de locação.
            </p>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-[10px] uppercase font-bold tracking-wider text-brand-variant">
                  Chave Pública (Live)
                </label>
                <input
                  type="password"
                  value={publicKey}
                  onChange={(e) => setPublicKey(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-outline-alt/60 bg-brand-bg font-sans text-xs focus:ring-2 focus:ring-primary outline-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-[10px] uppercase font-bold tracking-wider text-brand-variant">
                  Webhook Secret
                </label>
                <input
                  type="password"
                  value={webhookSecret}
                  onChange={(e) => setWebhookSecret(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-outline-alt/60 bg-brand-bg font-sans text-xs focus:ring-2 focus:ring-primary outline-none"
                />
              </div>
            </div>

            {/* Toggle bar identical to Screen 2 markup style */}
            <div className="flex justify-between items-center bg-brand-bg p-3.5 rounded-xl border border-outline-alt/20">
              <span className="font-sans text-xs font-semibold text-primary">Modo de Produção Ativo</span>
              <button 
                onClick={toggleProdMode}
                className={`w-12 h-6 rounded-full p-1 transition-all duration-300 focus:outline-none cursor-pointer ${
                  isProductionMode ? 'bg-secondary' : 'bg-[#bfc8c9]'
                }`}
              >
                <div 
                  className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-300 ${
                    isProductionMode ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={handleSaveGateway}
                className="bg-secondary hover:bg-secondary/95 text-white text-xs font-bold px-5 py-3 rounded-xl shadow-md transition-colors cursor-pointer"
              >
                Atualizar Gateway
              </button>
            </div>
          </div>

        </div>



        {/* Panel 3: Gerenciamento de Salas (Room Creation & Catalog Administration) */}
        <div className="bg-white p-8 rounded-3xl border border-outline-alt/40 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center pb-4 border-b border-outline-alt/20 gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-secondary/15 text-secondary p-3 rounded-xl">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-sans font-extrabold text-[#111c2c] text-lg leading-tight">
                  Gerenciamento de Salas & Consultórios
                </h4>
                <p className="text-xs text-brand-variant mt-0.5">
                  Adicione novas salas, defina endereços, comodidades, recursos lúdicos e fotos para o catálogo de locações em Palhoça.
                </p>
              </div>
            </div>
            
            <button
              onClick={() => setIsAddingRoom(!isAddingRoom)}
              className="px-4 py-2.5 bg-secondary text-white rounded-xl font-sans font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm shadow-secondary/10 hover:bg-secondary/95 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{isAddingRoom ? 'Fechar Formulário' : 'Criar Nova Sala'}</span>
            </button>
          </div>

          {/* Form Expansion Block */}
          {isAddingRoom && (
            <form onSubmit={handleCreateRoom} className="p-6 bg-[#ebf3fc]/40 rounded-3xl border-2 border-secondary/20 animate-fade-in mb-6 text-left">
              <div className="flex justify-between items-center pb-2 border-b border-secondary/10 mb-5">
                <span className="font-sans font-black text-secondary text-xs uppercase tracking-wider">
                  Layout Simplificado · Novo Consultório ✨
                </span>
                <button
                  type="button"
                  onClick={() => setIsAddingRoom(false)}
                  className="text-brand-variant hover:text-primary text-xs font-bold cursor-pointer font-sans"
                >
                  Fechar [✕]
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* Inputs Columns */}
                <div className="lg:col-span-7 space-y-6">
                  
                  {/* SEÇÃO 1: Informações Básicas */}
                  <div className="space-y-4">
                    <h5 className="text-[10px] uppercase font-black tracking-wider text-secondary flex items-center gap-1.5 font-sans font-extrabold select-none">
                      <LayoutDashboard className="w-3.5 h-3.5" /> SEÇÃO 1: Informações Básicas
                    </h5>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Nome da Sala */}
                      <div className="space-y-1.5 font-sans text-xs">
                        <label className="text-[10px] uppercase font-extrabold tracking-wider text-brand-variant block">Nome da Sala</label>
                        <input
                          type="text"
                          required
                          value={newRoomName}
                          onChange={(e) => setNewRoomName(e.target.value)}
                          placeholder="Ex: Sala das Palmeiras"
                          className="w-full px-4 py-2.5 rounded-xl border border-outline-alt/60 bg-white text-primary focus:ring-2 focus:ring-primary outline-none font-sans font-bold"
                        />
                      </div>

                      {/* Número da Sala */}
                      <div className="space-y-1.5 font-sans text-xs">
                        <label className="text-[10px] uppercase font-extrabold tracking-wider text-brand-variant block">Número da Sala</label>
                        <input
                          type="text"
                          required
                          value={newRoomNumber}
                          onChange={(e) => setNewRoomNumber(e.target.value)}
                          placeholder="Ex: Consultório 102"
                          className="w-full px-4 py-2.5 rounded-xl border border-outline-alt/60 bg-white text-primary focus:ring-2 focus:ring-primary outline-none font-sans font-bold"
                        />
                      </div>

                      {/* Valor por Hora */}
                      <div className="space-y-1.5 font-sans text-xs">
                        <label id="lbl-create-valor" className="text-[10px] uppercase font-extrabold tracking-wider text-secondary block font-bold">Valor por Hora</label>
                        <div className="relative rounded-xl border border-secondary/40 bg-white focus-within:ring-2 focus-within:ring-secondary flex items-center overflow-hidden">
                          <span className="pl-4 pr-1.5 text-xs font-black text-secondary select-none">R$</span>
                          <input
                            type="text"
                            required
                            value={newRoomPrice}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (/^[0-9.,]*$/.test(val) || val === '') {
                                setNewRoomPrice(val);
                              }
                            }}
                            className="w-full py-2.5 bg-transparent text-primary focus:outline-none font-sans font-black text-xs"
                            placeholder="30,00"
                          />
                          <span className="pr-3 text-[9px] text-brand-variant font-black select-none whitespace-nowrap">/ h</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* SEÇÃO 2: Foto Principal */}
                  <div className="space-y-4 pt-4 border-t border-secondary/10">
                    <h5 className="text-[10px] uppercase font-black tracking-wider text-secondary flex items-center gap-1.5 font-sans font-extrabold select-none">
                      <Camera className="w-3.5 h-3.5" /> SEÇÃO 2: Foto Principal
                    </h5>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {/* Upload box */}
                      <div className="sm:col-span-1 flex flex-col gap-2">
                        <span className="text-[10px] font-bold text-slate-700 uppercase">Input local:</span>
                        <div className="relative aspect-video rounded-xl overflow-hidden border border-secondary/30 bg-slate-100 flex items-center justify-center group shadow-xs">
                          {newRoomImage0 ? (
                            <img
                              src={newRoomImage0}
                              alt="Visualização no Editor"
                              className="w-full h-full object-cover transition-all"
                              style={{
                                transform: `scale(${(newImgZooms[0] || 100) / 100}) rotate(${newImgRotate || 0}deg)`,
                                objectPosition: `${newImgPosXs[0] || 50}% ${newImgPosYs[0] || 50}%`,
                                filter: `brightness(${newImgBrightness || 100}%) contrast(${newImgContrast || 100}%)`
                              }}
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <span className="text-xs text-slate-400 font-bold">Sem Foto</span>
                          )}
                          <div className="absolute inset-0 border-2 border-dashed border-white/40 pointer-events-none rounded-lg m-1" />
                        </div>

                        <div className="mt-1">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handlePhotoUpload(e, false)}
                            className="hidden"
                            id="new-room-photo-file-picker"
                          />
                          <button
                            type="button"
                            onClick={() => document.getElementById('new-room-photo-file-picker')?.click()}
                            className="w-full py-2 bg-secondary text-white font-sans font-black text-xs rounded-xl hover:bg-secondary-dark transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer font-sans"
                          >
                            Anexar Foto 📁
                          </button>
                        </div>
                      </div>

                      {/* Presets */}
                      <div className="sm:col-span-2 bg-white/50 p-4 border border-[#c2c7cf]/45 rounded-xl space-y-2 font-sans">
                        <span className="text-[10px] font-black uppercase tracking-wider text-secondary block">
                          Ou selecione um preset clínico:
                        </span>
                        <div className="grid grid-cols-3 gap-1.5 font-sans">
                          {CLINIC_PRESETS.slice(0, 6).map((preset) => (
                            <button
                              key={preset.name}
                              type="button"
                              onClick={() => {
                                setNewRoomImage0(preset.url);
                                triggerToast(`Preset carregado: ${preset.name}!`);
                              }}
                              className="px-1 py-1 bg-white border border-[#9b9fa6]/35 text-[9px] font-bold text-primary rounded-lg text-center hover:bg-slate-50 cursor-pointer truncate font-sans"
                              title={preset.name}
                            >
                              🏢 {preset.name.split(' ')[0]}
                            </button>
                          ))}
                        </div>
                        <input
                          type="text"
                          value={newRoomImage0}
                          onChange={(e) => setNewRoomImage0(e.target.value)}
                          placeholder="Cole o endereço/link web de outra foto"
                          className="w-full px-3 py-2 text-xs rounded-lg border border-outline-alt/50 bg-white text-primary outline-none focus:ring-1 focus:ring-secondary font-mono mt-1"
                        />
                      </div>
                    </div>
                  </div>

                  {/* SEÇÃO 4: Editar Imagem */}
                  <div className="space-y-4 pt-4 border-t border-secondary/10">
                    <h5 className="text-[10px] uppercase font-black tracking-wider text-secondary flex items-center gap-1.5 font-sans font-extrabold select-none">
                      <SlidersHorizontal className="w-3.5 h-3.5" /> SEÇÃO 4: Editar Imagem
                    </h5>

                    <div className="bg-white/50 p-4 border border-[#c2c7cf]/40 rounded-xl space-y-3 font-sans">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Zoom */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px] font-bold text-slate-700">
                            <span>Zoom</span>
                            <span className="text-secondary">{newImgZooms[0] || 100}%</span>
                          </div>
                          <input
                            type="range"
                            min="100"
                            max="300"
                            step="2"
                            value={newImgZooms[0] || 100}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              setNewImgZooms(prev => [val, prev[1], prev[2]]);
                            }}
                            className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-secondary"
                          />
                        </div>

                        {/* Rotate */}
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-slate-700 block text-left">Rotacionar</span>
                          <div className="flex gap-1.5">
                            {[0, 90, 180, 270].map((deg) => (
                              <button
                                key={deg}
                                type="button"
                                onClick={() => setNewImgRotate(deg)}
                                className={`flex-1 py-0.5 text-[9px] font-bold rounded border cursor-pointer transition-all ${
                                  newImgRotate === deg 
                                    ? 'bg-slate-900 border-black text-white' 
                                    : 'bg-white hover:bg-slate-100 text-slate-700 border-outline-alt/40'
                                }`}
                              >
                                {deg}°
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Brightness */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px] font-bold text-slate-700">
                            <span>Brilho</span>
                            <span className="text-secondary">{newImgBrightness}%</span>
                          </div>
                          <input
                            type="range"
                            min="50"
                            max="150"
                            step="2"
                            value={newImgBrightness}
                            onChange={(e) => setNewImgBrightness(Number(e.target.value))}
                            className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-secondary"
                          />
                        </div>

                        {/* Contrast */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px] font-bold text-slate-700">
                            <span>Contraste</span>
                            <span className="text-secondary">{newImgContrast}%</span>
                          </div>
                          <input
                            type="range"
                            min="50"
                            max="150"
                            step="2"
                            value={newImgContrast}
                            onChange={(e) => setNewImgContrast(Number(e.target.value))}
                            className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-secondary"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end pt-2 border-t border-outline-alt/10">
                        <button
                          type="button"
                          onClick={() => {
                            setNewImgZooms([100, 100, 100]);
                            setNewImgPosXs([50, 50, 50]);
                            setNewImgPosYs([50, 50, 50]);
                            setNewImgRotate(0);
                            setNewImgBrightness(100);
                            setNewImgContrast(100);
                          }}
                          className="px-2.5 py-0.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 font-bold rounded cursor-pointer text-[9px] font-sans"
                        >
                          Redefinir
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* SEÇÃO 5: Comodidades do Novo Consultório */}
                  <div className="space-y-4 pt-4 border-t border-secondary/10">
                    <h5 className="text-[10px] uppercase font-black tracking-wider text-secondary flex items-center gap-1.5 font-sans font-extrabold select-none">
                      <SlidersHorizontal className="w-3.5 h-3.5" /> SEÇÃO 5: Comodidades do Consultório
                    </h5>

                    <div className="space-y-3 font-sans">
                      <div className="flex flex-wrap gap-1.5 font-sans font-sans">
                        {AMENITIES_LIST.map((amenity) => {
                          const valStr = `${amenity.emoji} ${amenity.label}`;
                          const isSelected = newRoomFeatures.includes(valStr);
                          return (
                            <button
                              key={`new-amenity-${amenity.label}`}
                              type="button"
                              onClick={() => {
                                setNewRoomFeatures(prev =>
                                  prev.includes(valStr) ? prev.filter(f => f !== valStr) : [...prev, valStr]
                                );
                              }}
                              className={`px-3 py-1.5 text-[11px] rounded-lg border transition-all cursor-pointer flex items-center gap-1 ${
                                isSelected
                                  ? 'bg-slate-100 border-slate-300 text-slate-900 font-bold'
                                  : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-500 font-semibold'
                              }`}
                            >
                              <span>{amenity.emoji}</span>
                              <span className="text-[10px]">{amenity.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* SEÇÃO 6: Descrição do Novo Consultório */}
                  <div className="space-y-1 font-sans pt-4 border-t border-secondary/10">
                    <div className="flex justify-between items-center">
                      <h5 className="text-[10px] uppercase font-black tracking-wider text-secondary flex items-center gap-1.5 font-sans font-extrabold select-none">
                        <FileText className="w-3.5 h-3.5" /> Descrição do Consultório
                      </h5>
                      <span className="text-[10px] text-brand-variant font-medium">
                        {newRoomDescription.length} / 500 caracteres
                      </span>
                    </div>
                    <textarea
                      rows={3}
                      required
                      maxLength={500}
                      value={newRoomDescription}
                      onChange={(e) => setNewRoomDescription(e.target.value)}
                      placeholder="Descreva de forma acolhedora os recursos do espaço..."
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-secondary/25 bg-white text-slate-800 focus:border-slate-400 focus:outline-none transition-all placeholder:text-slate-400 leading-relaxed font-sans"
                    />
                  </div>

                </div>

                {/* Right Column: SEÇÃO 3: Prévia do Consultório (Live Preview) (occupies lg:col-span-5) */}
                <div className="lg:col-span-5 text-left lg:sticky lg:top-6 space-y-3 font-sans">
                  <h5 className="text-[10px] uppercase font-black tracking-wider text-[#38761d] bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full inline-block select-none">
                    👁️ SEÇÃO 3: Prévia do Consultório
                  </h5>

                  <div className="flex flex-col bg-white border border-outline-alt/25 rounded-3xl overflow-hidden shadow-lg border-secondary ring-2 ring-secondary/20 min-w-[280px] font-sans">
                    <div className="h-60 w-full overflow-hidden relative bg-slate-100">
                      {newRoomImage0 ? (
                        <img
                          src={newRoomImage0}
                          alt={newRoomName || 'Visualização do Consultório'}
                          className="w-full h-full object-cover transition-all"
                          style={{
                            transform: `scale(${(newImgZooms[0] || 100) / 100}) rotate(${newImgRotate || 0}deg)`,
                            objectPosition: `${(newImgPosXs[0] || 50)}% ${(newImgPosYs[0] || 50)}%`,
                            filter: `brightness(${newImgBrightness || 100}%) contrast(${newImgContrast || 100}%)`
                          }}
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs font-sans">Sem Foto</div>
                      )}
                      
                      <div className="absolute top-3 left-3 bg-secondary/90 backdrop-blur-xs text-white text-[9px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-xl">
                        {newRoomNumber ? `Sala ${newRoomNumber}` : 'Nova Sala'}
                      </div>
                      
                      <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-xs text-primary text-xs font-bold px-2 py-1 rounded-xl flex items-center gap-1 shadow select-none flex-nowrap">
                        <Star className="w-3 h-3 fill-secondary text-secondary" />
                        <span>5.0</span>
                      </div>

                      <div className="absolute bottom-3 left-3 bg-black/70 backdrop-blur-xs text-white text-xs font-bold px-3 py-1 rounded-lg">
                        R$ {(parseFormattedPrice(newRoomPrice) ?? 0).toFixed(2).replace('.', ',')} / hora
                      </div>
                    </div>

                    <div className="p-5 flex-grow space-y-3 bg-slate-50/35 border-t border-outline-alt/10">
                      <div className="space-y-1.5 text-left font-sans">
                        <h3 className="font-sans font-extrabold text-sm text-primary leading-snug">
                          {newRoomName || 'Nome do Consultório'}
                        </h3>
                        <div className="flex flex-wrap items-center gap-1 select-none font-sans">
                          {newRoomFeatures.map((feat, i) => (
                            <span key={i} className="flex items-center gap-1 text-[11px] font-bold text-slate-700 bg-slate-100 rounded-lg px-2 py-0.5">
                              {getAmenityIcon(feat, "w-3 h-3 text-slate-500")}
                              <span>{cleanAmenityLabel(feat)}</span>
                            </span>
                          ))}
                        </div>
                      </div>

                      <p className="font-sans text-[10px] text-brand-variant leading-relaxed text-left">
                        {newRoomDescription || 'Descreva de forma acolhedora os recursos do espaço...'}
                      </p>
                    </div>
                  </div>
                </div>

              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-outline-alt/15 mt-5">
                <button
                  type="button"
                  onClick={() => setIsAddingRoom(false)}
                  className="px-5 py-2.5 text-xs text-brand-variant font-bold border border-[#c2c7cf] hover:bg-outline-alt/10 rounded-xl transition-all cursor-pointer font-sans"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-xs text-white font-bold bg-secondary hover:bg-secondary/95 rounded-xl shadow-md cursor-pointer font-sans"
                >
                  Criar Consultório
                </button>
              </div>
            </form>
          )}

          {/* Edit Room Form Expansion Block */}
          {editingRoom && (
            <form onSubmit={handleSaveEditedRoom} id="edit-room-form-anchor" className="p-6 bg-[#ebf3fc]/40 rounded-3xl border-2 border-secondary/20 animate-fade-in mb-6 text-left font-sans">
              <div className="flex justify-between items-center pb-2 border-b border-secondary/10 mb-5 font-sans">
                <span className="font-sans font-black text-secondary text-xs uppercase tracking-wider">
                  Layout Simplificado · Editando Consultório: {editingRoom.name} ✏️
                </span>
                <button
                  type="button"
                  onClick={() => setEditingRoom(null)}
                  className="text-brand-variant hover:text-primary text-xs font-bold cursor-pointer font-sans"
                >
                  Fechar [✕]
                </button>
              </div>

              {/* Grid Layout: Form fields (left) vs High Fidelity Live Preview (right) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* Left Side: Dynamic Forms */}
                <div className="lg:col-span-12 xl:col-span-7 space-y-6">
                  
                  {/* SEÇÃO 1: Informações Básicas */}
                  <div className="space-y-4">
                    <h5 className="text-[10px] uppercase font-black tracking-wider text-secondary flex items-center gap-1.5 font-sans font-extrabold select-none">
                      <LayoutDashboard className="w-3.5 h-3.5" /> SEÇÃO 1: Informações Básicas
                    </h5>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Nome da Sala */}
                      <div className="space-y-1.5 font-sans text-xs font-sans">
                        <label className="text-[10px] uppercase font-extrabold tracking-wider text-brand-variant block">Nome da Sala</label>
                        <input
                          type="text"
                          required
                          value={editRoomNameOnly}
                          onChange={(e) => setEditRoomNameOnly(e.target.value)}
                          placeholder="Ex: Consultório Master"
                          className="w-full px-4 py-2.5 rounded-xl border border-outline-alt/60 bg-white text-primary focus:ring-2 focus:ring-primary outline-none font-sans font-bold"
                        />
                      </div>

                      {/* Número da Sala */}
                      <div className="space-y-1.5 font-sans text-xs">
                        <label className="text-[10px] uppercase font-extrabold tracking-wider text-brand-variant block">Número da Sala</label>
                        <input
                          type="text"
                          required
                          value={editRoomSize}
                          onChange={(e) => setEditRoomSize(e.target.value)}
                          placeholder="Ex: Sala 301"
                          className="w-full px-4 py-2.5 rounded-xl border border-outline-alt/60 bg-white text-primary focus:ring-2 focus:ring-primary outline-none font-sans font-bold"
                        />
                      </div>

                      {/* Valor por Hora */}
                      <div className="space-y-1.5 font-sans text-xs">
                        <label id="lbl-edit-valor" className="text-[10px] uppercase font-extrabold tracking-wider text-secondary block font-bold">Valor por Hora</label>
                        <div className="relative rounded-xl border border-secondary/40 bg-white focus-within:ring-2 focus-within:ring-secondary flex items-center overflow-hidden">
                          <span className="pl-4 pr-1.5 text-xs font-black text-secondary select-none">R$</span>
                          <input
                            type="text"
                            required
                            value={editRoomPrice}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (/^[0-9.,]*$/.test(val) || val === '') {
                                setEditRoomPrice(val);
                              }
                            }}
                            className="w-full py-2.5 bg-transparent text-primary focus:outline-none font-sans font-black text-xs"
                            placeholder="35,00"
                          />
                          <span className="pr-3 text-[9px] text-brand-variant font-black select-none whitespace-nowrap font-sans">/ h</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* SEÇÃO 2: Foto Principal */}
                  <div className="space-y-4 pt-4 border-t border-secondary/10">
                    <h5 className="text-[10px] uppercase font-black tracking-wider text-secondary flex items-center gap-1.5 font-sans font-extrabold select-none">
                      <Camera className="w-3.5 h-3.5" /> SEÇÃO 2: Foto Principal
                    </h5>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-sans">
                      {/* Upload box */}
                      <div className="sm:col-span-1 flex flex-col gap-2">
                        <span className="text-[10px] font-bold text-slate-700 uppercase font-sans">Input local:</span>
                        <div className="relative aspect-video rounded-xl overflow-hidden border border-secondary/30 bg-slate-100 flex items-center justify-center group shadow-xs">
                          {editRoomImage0 ? (
                            <img
                              src={editRoomImage0}
                              alt="Visualização no Editor"
                              className="w-full h-full object-cover transition-all"
                              style={{
                                transform: `scale(${(editImgZooms[0] || 100) / 100}) rotate(${editImgRotate || 0}deg)`,
                                objectPosition: `${editImgPosXs[0] || 50}% ${editImgPosYs[0] || 50}%`,
                                filter: `brightness(${editImgBrightness || 100}%) contrast(${editImgContrast || 100}%)`
                              }}
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <span className="text-xs text-slate-400 font-bold font-sans">Sem Foto</span>
                          )}
                          <div className="absolute inset-0 border-2 border-dashed border-white/40 pointer-events-none rounded-lg m-1" />
                        </div>

                        <div className="mt-1 font-sans font-sans">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handlePhotoUpload(e, true)}
                            className="hidden"
                            id="edit-room-photo-file-picker"
                          />
                          <button
                            type="button"
                            onClick={() => document.getElementById('edit-room-photo-file-picker')?.click()}
                            className="w-full py-2 bg-secondary text-white font-sans font-black text-xs rounded-xl hover:bg-secondary-dark transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer font-sans"
                          >
                            Anexar Foto 📁
                          </button>
                        </div>
                      </div>

                      {/* Presets */}
                      <div className="sm:col-span-2 bg-white/50 p-4 border border-[#c2c7cf]/45 rounded-xl space-y-2 font-sans">
                        <span className="text-[10px] font-black uppercase tracking-wider text-secondary block">
                          Ou selecione um preset clínico:
                        </span>
                        <div className="grid grid-cols-3 gap-1.5 font-sans font-sans">
                          {CLINIC_PRESETS.slice(0, 6).map((preset) => (
                            <button
                              key={preset.name}
                              type="button"
                              onClick={() => {
                                setEditRoomImage0(preset.url);
                                triggerToast(`Preset carregado: ${preset.name}!`);
                              }}
                              className="px-1 py-1 bg-white border border-[#9b9fa6]/35 text-[9px] font-bold text-primary rounded-lg text-center hover:bg-slate-50 cursor-pointer truncate font-sans"
                              title={preset.name}
                            >
                              🏢 {preset.name.split(' ')[0]}
                            </button>
                          ))}
                        </div>
                        <input
                          type="text"
                          value={editRoomImage0}
                          onChange={(e) => setEditRoomImage0(e.target.value)}
                          placeholder="Cole o endereço/link web de outra foto"
                          className="w-full px-3 py-2 text-xs rounded-lg border border-outline-alt/50 bg-white text-primary outline-none focus:ring-1 focus:ring-secondary font-mono mt-1"
                        />
                      </div>
                    </div>
                  </div>

                  {/* SEÇÃO 4: Editar Imagem */}
                  <div className="space-y-4 pt-4 border-t border-secondary/10">
                    <h5 className="text-[10px] uppercase font-black tracking-wider text-secondary flex items-center gap-1.5 font-sans font-extrabold select-none">
                      <SlidersHorizontal className="w-3.5 h-3.5" /> SEÇÃO 4: Editar Imagem
                    </h5>

                    <div className="bg-white/50 p-4 border border-[#c2c7cf]/40 rounded-xl space-y-3 font-sans">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Zoom */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px] font-bold text-slate-700">
                            <span>Zoom</span>
                            <span className="text-secondary">{editImgZooms[0] || 100}%</span>
                          </div>
                          <input
                            type="range"
                            min="100"
                            max="300"
                            step="2"
                            value={editImgZooms[0] || 100}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              setEditImgZooms(prev => [val, prev[1], prev[2]]);
                            }}
                            className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-secondary"
                          />
                        </div>

                        {/* Rotate */}
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-slate-700 block text-left font-sans">Rotacionar</span>
                          <div className="flex gap-1.5 font-sans">
                            {[0, 90, 180, 270].map((deg) => (
                              <button
                                key={deg}
                                type="button"
                                onClick={() => setEditImgRotate(deg)}
                                className={`flex-1 py-0.5 text-[9px] font-bold rounded border cursor-pointer transition-all ${
                                  editImgRotate === deg 
                                    ? 'bg-slate-900 border-black text-white' 
                                    : 'bg-white hover:bg-slate-100 text-slate-700 border-outline-alt/40'
                                }`}
                              >
                                {deg}°
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Brightness */}
                        <div className="space-y-1 font-sans font-sans">
                          <div className="flex justify-between text-[10px] font-bold text-slate-700">
                            <span>Brilho</span>
                            <span className="text-secondary">{editImgBrightness}%</span>
                          </div>
                          <input
                            type="range"
                            min="50"
                            max="150"
                            step="2"
                            value={editImgBrightness}
                            onChange={(e) => setEditImgBrightness(Number(e.target.value))}
                            className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-secondary"
                          />
                        </div>

                        {/* Contrast */}
                        <div className="space-y-1 font-sans">
                          <div className="flex justify-between text-[10px] font-bold text-slate-700">
                            <span>Contraste</span>
                            <span className="text-secondary">{editImgContrast}%</span>
                          </div>
                          <input
                            type="range"
                            min="50"
                            max="150"
                            step="2"
                            value={editImgContrast}
                            onChange={(e) => setEditImgContrast(Number(e.target.value))}
                            className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-secondary"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end pt-2 border-t border-outline-alt/10">
                        <button
                          type="button"
                          onClick={() => {
                            setEditImgZooms([100, 100, 100]);
                            setEditImgPosXs([50, 50, 50]);
                            setEditImgPosYs([50, 50, 50]);
                            setEditImgRotate(0);
                            setEditImgBrightness(100);
                            setEditImgContrast(100);
                          }}
                          className="px-2.5 py-0.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 font-bold rounded cursor-pointer text-[9px] font-sans"
                        >
                          Redefinir
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* SEÇÃO 5: Presets (chips) */}
                  <div className="space-y-3 font-sans">
                    <h5 className="text-[10px] uppercase font-black tracking-wider text-secondary flex items-center gap-1.5 font-sans font-extrabold select-none">
                      <Sparkles className="w-3.5 h-3.5" /> Especialidades / Presets
                    </h5>
                    
                    <div className="flex flex-wrap gap-2">
                      {[
                        { label: 'Psicologia', value: '🧠 Psicologia' },
                        { label: 'Pediatria', value: '🧸 Pediatria' },
                        { label: 'Multidisciplinar', value: '🤝 Multidisciplinar' },
                        { label: 'Neuro', value: 'Neuro' },
                        { label: 'Terapia', value: '🌱 Terapia' }
                      ].map((preset) => {
                        const isSelected = editRoomFeatures.includes(preset.value);
                        return (
                          <button
                            key={preset.label}
                            type="button"
                            onClick={() => {
                              setEditRoomFeatures(prev => 
                                prev.includes(preset.value)
                                  ? prev.filter(f => f !== preset.value)
                                  : [...prev, preset.value]
                              );
                            }}
                            className={`px-4 py-2 text-xs font-bold rounded-full border transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-slate-900 border-slate-900 text-white shadow-2xs'
                                : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                            }`}
                          >
                            {preset.label}
                          </button>
                        );
                      })}
                    </div>

                    {/* Clean list of standard room amenities */}
                    <div className="pt-2 font-sans">
                      <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider mb-2 select-none">Comodidades Básicas</span>
                      <div className="flex flex-wrap gap-1.5 font-sans">
                        {AMENITIES_LIST.map((amenity) => {
                          const valStr = `${amenity.emoji} ${amenity.label}`;
                          const isSelected = editRoomFeatures.includes(valStr);
                          return (
                            <button
                              key={amenity.label}
                              type="button"
                              onClick={() => {
                                setEditRoomFeatures(prev =>
                                  prev.includes(valStr) ? prev.filter(f => f !== valStr) : [...prev, valStr]
                                );
                              }}
                              className={`px-3 py-1.5 text-[11px] rounded-lg border transition-all cursor-pointer flex items-center gap-1 ${
                                isSelected
                                  ? 'bg-slate-100 border-slate-300 text-slate-900 font-bold'
                                  : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-500 font-semibold'
                              }`}
                            >
                              <span>{amenity.emoji}</span>
                              <span className="text-[10px]">{amenity.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* SEÇÃO 6: Descrição */}
                  <div className="space-y-1 font-sans">
                    <div className="flex justify-between items-center">
                      <h5 className="text-[10px] uppercase font-black tracking-wider text-secondary flex items-center gap-1.5 font-sans font-extrabold select-none">
                        <FileText className="w-3.5 h-3.5" /> Descrição do Consultório
                      </h5>
                      <span className="text-[10px] text-brand-variant font-medium">
                        {editRoomDescription.length} / 500 caracteres
                      </span>
                    </div>
                    <textarea
                      rows={3}
                      required
                      maxLength={500}
                      value={editRoomDescription}
                      onChange={(e) => setEditRoomDescription(e.target.value)}
                      placeholder="Descreva de forma acolhedora os recursos do espaço..."
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-secondary/25 bg-white text-slate-800 focus:border-slate-400 focus:outline-none transition-all placeholder:text-slate-400 leading-relaxed font-sans"
                    />
                  </div>

                </div>

                {/* Right Column: SEÇÃO 3: Prévia do Consultório (Live Preview) (occupies lg:col-span-5) */}
                <div className="lg:col-span-5 text-left lg:sticky lg:top-6 space-y-3 font-sans">
                  <h5 className="text-[10px] uppercase font-black tracking-wider text-[#38761d] bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full inline-block select-none">
                    👁️ SEÇÃO 3: Prévia do Consultório
                  </h5>

                  <div className="flex flex-col bg-white border border-outline-alt/25 rounded-3xl overflow-hidden shadow-lg border-secondary ring-2 ring-secondary/20 min-w-[280px] font-sans">
                    <div className="h-60 w-full overflow-hidden relative bg-slate-100">
                      {editRoomImage0 ? (
                        <img
                          src={editRoomImage0}
                          alt={editRoomNameOnly || 'Visualização do Consultório'}
                          className="w-full h-full object-cover transition-all"
                          style={{
                            transform: `scale(${(editImgZooms[0] || 100) / 100}) rotate(${editImgRotate || 0}deg)`,
                            objectPosition: `${(editImgPosXs[0] || 50)}% ${(editImgPosYs[0] || 50)}%`,
                            filter: `brightness(${editImgBrightness || 100}%) contrast(${editImgContrast || 100}%)`
                          }}
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs font-sans font-sans">Sem Foto</div>
                      )}
                      
                      <div className="absolute top-3 left-3 bg-secondary/90 backdrop-blur-xs text-white text-[9px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-xl">
                        {editRoomSize ? `Sala ${editRoomSize}` : 'Consultório'}
                      </div>
                      
                      <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-xs text-primary text-xs font-bold px-2 py-1 rounded-xl flex items-center gap-1 shadow select-none flex-nowrap">
                        <Star className="w-3 h-3 fill-secondary text-secondary" />
                        <span>{(editingRoom?.rating ?? 5.0).toFixed(1)}</span>
                      </div>

                      <div className="absolute bottom-3 left-3 bg-black/70 backdrop-blur-xs text-white text-xs font-bold px-3 py-1 rounded-lg">
                        R$ {(parseFormattedPrice(editRoomPrice) ?? 0).toFixed(2).replace('.', ',')} / hora
                      </div>
                    </div>

                    <div className="p-5 flex-grow space-y-3 bg-slate-50/35 border-t border-outline-alt/10 font-sans">
                      <div className="space-y-1 text-left">
                        <h3 className="font-sans font-extrabold text-sm text-primary leading-snug">
                          {editRoomNameOnly || 'Nome do Consultório'}
                        </h3>
                        <p className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <span className="truncate">{editRoomLocation || 'Endereço da Unidade'}</span>
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-1 select-none font-sans">
                        {editRoomFeatures.map((feat, i) => (
                          <span key={i} className="flex items-center gap-1 text-[11px] font-bold text-slate-700 bg-slate-100 rounded-lg px-2 py-0.5">
                            {getAmenityIcon(feat, "w-3 h-3 text-slate-500")}
                            <span>{cleanAmenityLabel(feat)}</span>
                          </span>
                        ))}
                      </div>

                      <p className="font-sans text-[10px] text-brand-variant leading-relaxed text-left">
                        {editRoomDescription || 'A descrição e as comodidades do consultório clínico serão preservadas ao salvar.'}
                      </p>
                    </div>
                  </div>
                </div>

              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 mt-5 font-sans">
                <button
                  type="button"
                  onClick={() => setEditingRoom(null)}
                  className="px-5 py-2.5 text-xs text-slate-600 font-bold hover:bg-slate-100 rounded-xl transition-all cursor-pointer font-sans"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-xs text-white font-bold bg-secondary hover:bg-secondary/95 rounded-xl shadow-md cursor-pointer font-sans"
                >
                  Confirmar Edição
                </button>
              </div>
            </form>
          )}

          {/* Catalog Review List - Page Editor and Preview */}
          <div className="space-y-6 pt-3 font-sans">
            <div className="bg-slate-50 border border-slate-250/50 p-4 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-left">
              <div className="text-left">
                <span className="text-[10px] uppercase font-black text-secondary bg-secondary/15 px-2.5 py-1 rounded-full block w-fit">
                  Visualização do Catálogo ("Encontrar Salas")
                </span>
                <p className="text-xs text-brand-variant mt-1.5 font-medium">
                  Esta é a visualização idêntica à tela pública de busca de salas. Gerencie dados, comodidades e fotos de cada consultório com cuidado.
                </p>
              </div>
              <span className="text-xs font-bold text-primary bg-white border border-outline-alt/40 px-3 py-1.5 rounded-xl shadow-2xs flex-shrink-0">
                {rooms.length} Salas Cadastradas
              </span>
            </div>

            {/* Mirroring "Encontrar Salas" page visual layout with rich cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {rooms.map((room) => {
                const isStandard = room.type === 'standard';
                const isPremium = room.type === 'premium';
                const isExecutivo = room.type === 'executivo_luxo';

                return (
                  <div
                    key={room.id}
                    className="group bg-white rounded-3xl overflow-hidden border border-outline-alt/45 hover:border-secondary/35 hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
                  >
                    <div>
                      {/* Room Image */}
                      <div className="h-44 overflow-hidden bg-slate-100 relative">
                        <img
                          src={room.images[0]}
                          alt={room.name}
                          className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute top-3.5 right-3.5 bg-white/95 backdrop-blur-md px-2 py-0.5 rounded-full text-[11px] font-bold text-secondary border border-secondary/10 flex items-center gap-1 shadow-xs">
                          <Star className="w-3 h-3 fill-secondary text-secondary" />
                          <span>{(room?.rating ?? 5.0).toFixed(1)}</span>
                        </div>
                      </div>

                      {/* Content details matching finding rooms page exactly */}
                      <div className="p-5 text-left space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-black text-secondary uppercase tracking-wider bg-secondary/10 px-2.5 py-0.5 rounded-md">
                            {isExecutivo ? 'Executivo Luxo' : (isPremium ? 'Premium' : 'Standard')}
                          </span>
                        </div>

                        <h3 className="font-sans font-extrabold text-base text-primary leading-tight">
                          {room.name}
                        </h3>

                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-brand-variant font-medium">
                          {(room.features || []).map((feat, i) => (
                            <span key={i} className="flex items-center gap-1.5 whitespace-nowrap">
                              {getAmenityIcon(feat, "w-3 h-3 text-secondary")}
                              <span>{cleanAmenityLabel(feat)}</span>
                              {i < (room.features || []).length - 1 && <span className="text-black/15 ml-1 select-none">•</span>}
                            </span>
                          ))}
                        </div>

                        <p className="font-sans text-[11px] text-brand-variant leading-relaxed">
                          {room.description}
                        </p>
                      </div>
                    </div>

                    {/* Integrated actions in footer block */}
                    <div className="p-5 pt-0">
                      <div className="pt-3 border-t border-outline-alt/15 flex flex-col gap-3">
                        <div className="flex items-baseline justify-between">
                          <span className="text-[9px] text-brand-variant font-extrabold uppercase tracking-widest block">Locação</span>
                          <p className="font-sans font-black text-lg text-primary">
                            R$ {(room?.pricePerHour ?? 0).toFixed(2).replace('.', ',')} <span className="text-xs font-normal text-brand-variant">/h</span>
                          </p>
                        </div>

                        {/* Direct Scheduling Sync/ID Link copy trigger */}
                        <button
                          type="button"
                          onClick={() => {
                            const url = `${window.location.origin}/?sala=${room.id}`;
                            navigator.clipboard.writeText(url);
                            triggerToast(`📋 Link de agendamento copiado para a sala: ${room.name}!`);
                          }}
                          className="w-full text-center font-black text-[10px] text-white bg-slate-950 hover:bg-slate-800 py-2 rounded-xl transition duration-150 cursor-pointer flex items-center justify-center gap-1.5 font-sans"
                        >
                          <svg className="w-3 h-3 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                          </svg>
                          <span>Copiar Link da Agenda</span>
                        </button>

                        {/* Double button admin editors built meticulously into card bottom */}
                        {deletingRoomId === room.id ? (
                          <div className="bg-red-50/90 border border-red-200 p-2.5 rounded-xl flex items-center justify-between gap-1.5 animate-fade-in">
                            <span className="text-[9px] text-red-700 font-extrabold select-none">Excluir consultório?</span>
                            <div className="flex gap-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  const updatedRooms = rooms.filter(r => r.id !== room.id);
                                  onUpdateRooms(updatedRooms);
                                  triggerToast('Sala removida com sucesso de Palhoça.');
                                  setDeletingRoomId(null);
                                }}
                                className="px-2.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded font-sans font-bold text-[9px] cursor-pointer transition-all shadow-xs"
                              >
                                Sim
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeletingRoomId(null)}
                                className="px-2.5 py-1.5 bg-white text-slate-700 border border-slate-350 hover:bg-slate-50 rounded font-sans font-bold text-[9px] cursor-pointer transition-all"
                              >
                                Não
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => handleSelectRoomForEditing(room)}
                              className="text-center font-bold text-[10px] text-primary border border-[#c2c7cf] hover:bg-slate-50 py-2.5 rounded-xl transition duration-150 cursor-pointer flex items-center justify-center gap-1 font-sans"
                              title="Editar Informações da Sala"
                            >
                              <FileEdit className="w-3.5 h-3.5" />
                              <span>Editar</span>
                            </button>
                            
                            <button
                              type="button"
                              onClick={() => setDeletingRoomId(room.id)}
                              className="text-center font-bold text-[10px] text-red-600 bg-red-50 border border-red-200/40 hover:bg-red-100 py-2.5 rounded-xl transition duration-150 cursor-pointer flex items-center justify-center gap-1 font-sans"
                              title="Excluir Sala com Cuidado"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Excluir</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Healthcare Practitioners / Onboarding Documents Validation Board */}
        <div className="bg-white p-8 rounded-3xl border border-outline-alt/40 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-outline-alt/25 gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="bg-secondary/15 text-secondary p-3 rounded-xl">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-sans font-extrabold text-[#111c2c] text-lg leading-tight animate-pulse">
                  Validação de Documentos de Profissionais
                </h4>
                <p className="text-xs text-brand-variant mt-0.5">
                  Analise as fotos, certidões de conselhos (CRM/CRP/CRN), aceite contratual e dê baixa nos documentos do Dr./Dra. para liberação na portaria do condomínio em Palhoça, SC.
                </p>
              </div>
            </div>
            <span className="px-3 py-1 bg-secondary/10 text-secondary font-sans font-black text-[10px] rounded-full uppercase tracking-wider">
              {registeredUsers.length} Cadastros
            </span>
          </div>

          <div className="space-y-6">
            {registeredUsers.length === 0 ? (
              <p className="text-brand-variant text-center py-6 font-sans text-xs">
                Nenhum profissional cadastrado até o momento.
              </p>
            ) : (
              registeredUsers.map((user, idx) => {
                const status = user.approvalStatus || 'Pendente';
                
                // Toggle / Clearance action helper
                const updateStatus = (newStatus: 'Aprovado' | 'Rejeitado' | 'Pendente') => {
                  const updated = [...registeredUsers];
                  updated[idx] = { ...user, approvalStatus: newStatus };
                  onUpdateUsers(updated);
                  triggerToast(`Status de ${user.name} atualizado para: ${newStatus}!`);
                };

                return (
                  <div
                    key={user.email}
                    className="p-6 rounded-2xl border border-[#bfc8c9] bg-brand-bg flex flex-col lg:flex-row gap-6 transition-all hover:bg-white hover:shadow-md"
                  >
                    {/* Column 1: Profile Photo */}
                    <div className="flex flex-col items-center text-center lg:w-44 flex-shrink-0 space-y-2.5">
                      <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-secondary/20 shadow-inner group bg-slate-100">
                        {user.profilePhoto?.previewUrl ? (
                          <img 
                            src={user.profilePhoto.previewUrl} 
                            alt={user.name} 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform" 
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center font-bold text-slate-400 font-sans text-xs">
                            Sem Foto
                          </div>
                        )}
                        <div className="absolute inset-x-0 bottom-0 bg-secondary/85 py-1 text-center text-[8px] text-white font-black leading-none uppercase">
                          Portaria
                        </div>
                      </div>

                      <div className="w-full">
                        <h5 className="font-bold text-primary text-sm font-sans truncate leading-none">{user.name}</h5>
                        <p className="text-[10px] text-brand-variant font-semibold mt-1 truncate">{user.registerNumber}</p>
                      </div>

                      {/* Acceptance status pill */}
                      {user.acceptedTerms ? (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-50 text-green-700 text-[10px] font-bold rounded-lg border border-green-200" title="Termo Aceito">
                          <Check className="w-3.5 h-3.5" />
                          <span className="leading-none">Termos Aceitos</span>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-yellow-50 text-yellow-700 text-[10px] font-bold rounded-lg border border-yellow-200">
                          <ShieldAlert className="w-3.5 h-3.5 text-yellow-600" />
                          <span className="leading-none">Termo Pendente</span>
                        </div>
                      )}
                    </div>

                    {/* Column 2: Detailed fields info */}
                    <div className="flex-grow min-w-0 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                        <div className="space-y-1">
                          <span className="text-[9px] uppercase font-bold text-brand-variant block">E-mail Profissional</span>
                          <span className="font-bold text-primary font-sans block truncate">{user.email}</span>
                        </div>
                        <div className="space-y-1">
                          <span className="text-[9px] uppercase font-bold text-brand-variant block">Telefone com WhatsApp</span>
                          <span className="font-bold text-primary font-sans block truncate">{user.phone || '(48) ----- ----'}</span>
                        </div>
                        <div className="space-y-1">
                          <span className="text-[9px] uppercase font-bold text-brand-variant block">Data do Aceite Contratual:</span>
                          <span className="font-sans text-[#42474e] text-xs font-semibold block">
                            {user.acceptedTermsDate || 'Não disponível'}
                          </span>
                        </div>
                        <div className="space-y-1">
                          <span className="text-[9px] uppercase font-bold text-brand-variant block">Situação Geral de Cadastro</span>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            {status === 'Aprovado' && (
                              <span className="px-2.5 py-0.5 bg-green-100 text-green-800 text-[10px] font-extrabold uppercase tracking-wide rounded-full border border-green-200 inline-flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-600 block"></span>
                                Aprovado (Acesso Liberado)
                              </span>
                            )}
                            {status === 'Pendente' && (
                              <span className="px-2.5 py-0.5 bg-yellow-100 text-yellow-850 text-[10px] font-extrabold uppercase tracking-wide rounded-full border border-yellow-200 inline-flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-yellow-550 block animate-pulse"></span>
                                Aguardando Liberação / Baixa
                              </span>
                            )}
                            {status === 'Rejeitado' && (
                              <span className="px-2.5 py-0.5 bg-red-100 text-red-800 text-[10px] font-extrabold uppercase tracking-wide rounded-full border border-red-200 inline-flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-600 block"></span>
                                Rejeitado (Necessário Reanexar)
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Documents Attachments Drawer list */}
                      <div className="space-y-2 pt-3 border-t border-outline-alt/10">
                        <span className="text-[10px] uppercase font-extrabold tracking-wider text-brand-variant block">Anexos de Documentos Carregados</span>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 text-[11px]">
                          {/* Item 1: CNH/RG */}
                          <div className="p-2.5 bg-white border border-outline-alt/25 rounded-xl flex items-center justify-between gap-2 shadow-sm">
                            <div className="flex items-center gap-2 min-w-0">
                              <FileText className="w-4 h-4 text-secondary flex-shrink-0" />
                              <div className="min-w-0">
                                <span className="font-extrabold text-primary block leading-none">Documento de ID (RG/CNH)</span>
                                <span className="text-[9px] text-brand-variant truncate block mt-0.5">{user.idDocument?.name || 'rg_cnh_original_sc.pdf'}</span>
                              </div>
                            </div>
                            <button 
                              type="button"
                              onClick={() => alert(`Abrindo visualização do Documento de Identidade de ${user.name}`)}
                              className="text-[10px] font-bold text-secondary hover:underline cursor-pointer flex-shrink-0"
                            >
                              Visualizar
                            </button>
                          </div>

                          {/* Item 2: Class register */}
                          <div className="p-2.5 bg-white border border-outline-alt/25 rounded-xl flex items-center justify-between gap-2 shadow-sm">
                            <div className="flex items-center gap-2 min-w-0">
                              <FileText className="w-4 h-4 text-secondary flex-shrink-0" />
                              <div className="min-w-0">
                                <span className="font-extrabold text-primary block leading-none">Inscrição Profissional</span>
                                <span className="text-[9px] text-brand-variant truncate block mt-0.5">{user.professionalDocument?.name || 'conselho_profissional_sc.pdf'}</span>
                              </div>
                            </div>
                            <button 
                              type="button"
                              onClick={() => alert(`Abrindo visualização do Registro de Classe de ${user.name}`)}
                              className="text-[10px] font-bold text-secondary hover:underline cursor-pointer flex-shrink-0"
                            >
                              Visualizar
                            </button>
                          </div>

                          {/* Item 3: Secondary files */}
                          <div className="p-2.5 bg-white border border-outline-alt/25 rounded-xl flex items-center justify-between gap-2 shadow-sm">
                            <div className="flex items-center gap-2 min-w-0">
                              <FileText className="w-4 h-4 text-brand-variant flex-shrink-0" />
                              <div className="min-w-0">
                                <span className="font-semibold text-primary block leading-none">Outros Diplomas (Extras)</span>
                                <span className="text-[9px] text-brand-variant truncate block mt-0.5">
                                  {user.documents && user.documents[0] ? user.documents[0].name : 'Nenhum comprovante extra'}
                                </span>
                              </div>
                            </div>
                            {user.documents && user.documents[0] ? (
                              <button 
                                onClick={() => alert('Diploma de pós-graduação e residência anexado.')}
                                className="text-[10px] font-bold text-secondary hover:underline cursor-pointer"
                              >
                                Ver
                              </button>
                            ) : (
                              <span className="text-[9px] text-brand-variant italic">Nenhum</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* CLEARANCE / ACTION BUTTONS (Dar baixa nos documentos) */}
                      <div className="bg-[#ebf1fa] p-3.5 rounded-xl flex flex-col sm:flex-row justify-between items-center gap-3 border border-secondary/10">
                        <div className="text-left w-full sm:w-auto">
                          <span className="font-bold text-xs text-[#111c2c] block leading-none">Ações de Regularização de Cadastro</span>
                          <span className="text-[10px] text-brand-variant leading-none block mt-1">Clique para dar baixa nos documentos e ativar/recusar o profissional no condomínio</span>
                        </div>

                        <div className="flex gap-2 w-full sm:w-auto">
                          {status !== 'Aprovado' && (
                            <button
                              type="button"
                              onClick={() => updateStatus('Aprovado')}
                              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-sans font-bold text-xs flex items-center gap-1 cursor-pointer flex-1 sm:flex-initial justify-center shadow-sm"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Dar Baixa (Aprovar)</span>
                            </button>
                          )}
                          {status !== 'Rejeitado' && (
                            <button
                              type="button"
                              onClick={() => updateStatus('Rejeitado')}
                              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-sans font-bold text-xs flex items-center gap-1 cursor-pointer flex-1 sm:flex-initial justify-center shadow-sm"
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>Recusar</span>
                            </button>
                          )}
                          {status !== 'Pendente' && (
                            <button
                              type="button"
                              onClick={() => updateStatus('Pendente')}
                              className="px-4 py-2 bg-white text-[#42474e] border border-[#c2c7cf] hover:bg-slate-100 rounded-lg font-sans font-semibold text-xs flex items-center gap-1 cursor-pointer flex-1 sm:flex-initial justify-center"
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                              <span>Reanalisar</span>
                            </button>
                          )}
                          {deletingUserEmail === user.email ? (
                            <div className="flex items-center gap-1.5 bg-red-100/60 border border-red-200/80 p-1.5 rounded-lg animate-fade-in">
                              <span className="text-[10px] text-red-800 font-bold px-1 select-none">Excluir profissional permanentemente?</span>
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = registeredUsers.filter(u => u.email !== user.email);
                                  onUpdateUsers(updated);
                                  triggerToast('Profissional excluído do sistema com sucesso! 🗑️');
                                  setDeletingUserEmail(null);
                                }}
                                className="px-2.5 py-1.5 bg-red-600 hover:bg-red-700 text-white font-sans font-bold text-[10px] rounded cursor-pointer transition-all shadow-xs"
                              >
                                Sim
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeletingUserEmail(null)}
                                className="px-2.5 py-1.5 bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 font-sans font-bold text-[10px] rounded cursor-pointer transition-all"
                              >
                                Não
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setDeletingUserEmail(user.email)}
                              className="px-4 py-2 bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 rounded-lg font-sans font-bold text-xs flex items-center gap-1 cursor-pointer flex-1 sm:flex-initial justify-center transition-all"
                              title="Excluir profissional permanentemente"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-red-600" />
                              <span>Excluir Cadastro</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Dynamic section: My Bookings Live Monitor Sheet */}
        <div className="bg-white p-8 rounded-3xl border border-outline-alt/40 shadow-sm space-y-6">
          <div className="flex items-center gap-3 justify-between pb-4 border-b border-outline-alt/25">
            <h4 className="font-sans font-extrabold text-[#111c2c] text-base uppercase tracking-wide">
              Controle de Agendamentos ({bookings.length})
            </h4>
            <span className="px-2.5 py-1 bg-primary/10 text-primary font-bold text-[10px] rounded-full uppercase tracking-wider animate-pulse">
              Em Tempo Real
            </span>
          </div>

          <div className="space-y-3 font-sans text-xs">
            {bookings.length === 0 ? (
              <p className="text-brand-variant text-center py-6">
                Nenhum agendamento realizado até o momento.
              </p>
            ) : (
              bookings.map((booking) => {
                const isConfirmed = booking.status === 'Confirmado';
                return (
                  <div
                    key={booking.id}
                    className="p-4 rounded-xl border border-outline-alt/30 bg-brand-bg flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all hover:bg-white"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-primary text-sm truncate">{booking.roomName}</span>
                        <span className="px-2 py-0.5 bg-secondary-container text-secondary text-[9px] font-black uppercase rounded-full tracking-wider">
                          R$ {booking.pricePerHour}/h
                        </span>
                      </div>
                      <p className="text-brand-variant font-semibold">
                        Data: <span className="text-primary font-bold">{booking.date}</span>
                      </p>
                      <p className="text-brand-variant">
                        Horários Reservados: <span className="font-bold text-secondary">{(booking.timeSlots || []).join(', ')}</span>
                      </p>
                      <p className="text-[10px] text-brand-variant uppercase tracking-wider font-semibold">
                        Profissional: <span className="text-primary font-bold">{booking.professionalName}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-4 w-full md:w-auto justify-between border-t border-outline-alt/10 pt-2.5 md:pt-0 md:border-none">
                      <div className="text-left md:text-right">
                        <p className="text-[10px] text-brand-variant uppercase">Total pago</p>
                        <p className="font-bold text-primary text-base">
                          R$ {(booking.totalValue ?? 0).toFixed(2).replace('.', ',')}
                        </p>
                      </div>

                      {isConfirmed ? (
                        cancellingBookingId === booking.id ? (
                          <div className="flex items-center gap-1.5 bg-red-100/60 border border-red-200/80 p-1.5 rounded-lg animate-fade-in shadow-xs">
                            <span className="text-[10px] text-red-800 font-extrabold px-1 select-none whitespace-nowrap">Cancelar?</span>
                            <button
                              type="button"
                              onClick={() => {
                                onCancelBooking(booking.id);
                                triggerToast('Agendamento cancelado com sucesso.');
                                setCancellingBookingId(null);
                              }}
                              className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white font-sans font-bold text-[10px] rounded cursor-pointer transition-all"
                            >
                              Sim
                            </button>
                            <button
                              type="button"
                              onClick={() => setCancellingBookingId(null)}
                              className="px-2.5 py-1 bg-white text-slate-700 border border-slate-305 hover:bg-slate-50 font-sans font-bold text-[10px] rounded cursor-pointer transition-all"
                            >
                              Não
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setCancellingBookingId(booking.id)}
                            className="p-2 border border-red-200 hover:bg-red-50 text-red-600 rounded-lg transition-colors cursor-pointer"
                            title="Cancelar Agendamento"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )
                      ) : (
                        <span className="text-xs font-bold text-red-600 bg-red-100 px-3 py-1 rounded-full border border-red-200">
                          Cancelado
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
          </>
        )}
      </div>
    </div>
  );
}
