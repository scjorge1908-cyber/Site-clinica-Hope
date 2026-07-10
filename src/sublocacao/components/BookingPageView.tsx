import { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, 
  MapPin, 
  ChevronRight, 
  ChevronLeft, 
  Check, 
  X, 
  ShieldCheck, 
  Shield,
  AlertTriangle,
  HelpCircle, 
  LogIn, 
  AlertCircle, 
  Database, 
  RefreshCw, 
  Star, 
  Maximize, 
  Users, 
  Clock, 
  CheckSquare,
  CreditCard,
  Lock,
  Copy,
  Wifi, 
  Coffee, 
  Car, 
  Bath, 
  Wind, 
  VolumeX, 
  Sofa, 
  Gamepad, 
  Video, 
  ArrowUpDown
} from 'lucide-react';
import { Room, Booking, AdminSettings } from '../types';
import { TIME_SLOTS, INITIAL_ROOMS } from '../data';

export function getAmenityIcon(label: string, className = "w-3.5 h-3.5 text-black") {
  const norm = label.toLowerCase();
  if (norm.includes('wi-fi') || norm.includes('wifi')) return <Wifi className={className} />;
  if (norm.includes('copa') || norm.includes('café') || norm.includes('cafe')) return <Coffee className={className} />;
  if (norm.includes('estacionamento')) return <Car className={className} />;
  if (norm.includes('banheiro')) return <Bath className={className} />;
  if (norm.includes('climatizado') || norm.includes('ar-condicionado')) return <Wind className={className} />;
  if (norm.includes('acústico') || norm.includes('isolamento')) return <VolumeX className={className} />;
  if (norm.includes('recepção') || norm.includes('espera')) return <Sofa className={className} />;
  if (norm.includes('infantil') || norm.includes('brinquedo') || norm.includes('lúdicos')) return <Gamepad className={className} />;
  if (norm.includes('videoconferência') || norm.includes('video')) return <Video className={className} />;
  if (norm.includes('elevador')) return <ArrowUpDown className={className} />;
  return <HelpCircle className={className} />;
}

export function cleanAmenityLabel(label: string): string {
  return label
    .replace(/[📶☕🚗🚻❄️🔇🛎️🧸📹🛗]/g, '')
    .replace('Café', 'Copa')
    .replace('cafe', 'copa')
    .trim();
}

// Calendar months
const MONTHS_PT = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const WEEKDAYS_PT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

interface BookingPageViewProps {
  selectedRoom: Room;
  pricePerHour: number;
  onAddBooking: (booking: Booking) => void;
  setView: (view: string) => void;
  professionalName?: string;
  professionalId?: string;
  adminSettings?: AdminSettings;
}

export default function BookingPageView({
  selectedRoom: initialSelectedRoom,
  pricePerHour: initialPricePerHour,
  onAddBooking,
  setView,
  professionalName,
  professionalId,
  adminSettings
}: BookingPageViewProps) {
  // Use today's or June 2026 as starting reference since current metadata is June 2026
  const [currentYear, setCurrentYear] = useState<number>(2026);
  const [currentMonth, setCurrentMonth] = useState<number>(5); // 5 is June (0-indexed)
  
  // Support choosing MULTIPLE dates on the calendar
  const [selectedDates, setSelectedDates] = useState<string[]>([]); 

  // Support selecting slots separately inside each room & day combination! Flat key is `{roomId}#{dateStr}`
  const [selectedSlotsByRoomAndDay, setSelectedSlotsByRoomAndDay] = useState<{ [roomIdAndDateCombined: string]: string[] }>({});
  
  // Real-time synchronization state for each room & day combination
  const [roomsAndDaysSlots, setRoomsAndDaysSlots] = useState<{ [roomAndDayKey: string]: typeof TIME_SLOTS }>({});
  const [syncStatus, setSyncStatus] = useState<'idle' | 'loading' | 'success'>('idle');

  // Refund insurance toggle: cost R$ 9,90 fixed
  const [reimbursementInsurance, setReimbursementInsurance] = useState<boolean>(true);
  const [protectedSlots, setProtectedSlots] = useState<{ [slotKey: string]: boolean }>({});
  const [showProtectionDialog, setShowProtectionDialog] = useState<boolean>(false);
  const [hasModifiedProtection, setHasModifiedProtection] = useState<boolean>(false);
  const [protectionModalScenario, setProtectionModalScenario] = useState<'cenario1' | 'cenario2' | 'cenario3' | null>(null);
  
  // Clean date tabs per room card state to prevent vertical card bloat/clutter
  const [selectedRoomDate, setSelectedRoomDate] = useState<Record<string, string>>({});

  // Helper to retrieve detailed objects for all currently selected room-day-time slots
  const getSelectedSlotDetails = () => {
    const list: Array<{
      key: string;       // `${roomId}#${dateStr}#${time}`
      roomId: string;
      roomName: string;
      dateStr: string;
      dateFormatted: string;
      time: string;
      price: number;
    }> = [];
    allRooms.forEach((room) => {
      selectedDates.forEach((dStr) => {
        const key = `${room.id}#${dStr}`;
        const slots = selectedSlotsByRoomAndDay[key] || [];
        slots.forEach((time) => {
          list.push({
            key: `${room.id}#${dStr}#${time}`,
            roomId: room.id,
            roomName: room.name,
            dateStr: dStr,
            dateFormatted: getFormattedPortugueseDate(dStr),
            time: time,
            price: room.pricePerHour,
          });
        });
      });
    });
    return list;
  };

  // Keep protectedSlots synchronized when selected slots or dates change
  useEffect(() => {
    const details = getSelectedSlotDetails();
    setProtectedSlots((prev) => {
      const next = { ...prev };
      let changed = false;
      
      // Remove keys that are no longer selected
      const detailKeys = new Set(details.map(d => d.key));
      Object.keys(next).forEach((k) => {
        if (!detailKeys.has(k)) {
          delete next[k];
          changed = true;
        }
      });

      // Add default true for newly selected keys if insurance template is selected
      details.forEach((d) => {
        if (next[d.key] === undefined) {
          next[d.key] = true; // Pre-checked by default as recommended
          changed = true;
        }
      });

      return changed ? next : prev;
    });
  }, [selectedSlotsByRoomAndDay, selectedDates]);

  const handleToggleSlotProtection = (slotKey: string, checked: boolean) => {
    setHasModifiedProtection(true);
    setProtectedSlots((prev) => {
      const next = { ...prev, [slotKey]: checked };
      // Check if there are any active checked selections
      const activeDetails = getSelectedSlotDetails();
      const hasAnyChecked = activeDetails.some(d => next[d.key]);
      setReimbursementInsurance(hasAnyChecked);
      return next;
    });
  };

  const handleToggleMasterProtection = (checked: boolean) => {
    setHasModifiedProtection(true);
    setReimbursementInsurance(checked);
    setProtectedSlots((prev) => {
      const next = { ...prev };
      getSelectedSlotDetails().forEach((slot) => {
        next[slot.key] = checked;
      });
      return next;
    });
  };

  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [showRefundSuggestionModal, setShowRefundSuggestionModal] = useState(false);
  const [showPolicyModal, setShowPolicyModal] = useState(false);
  const [recentBookings, setRecentBookings] = useState<Booking[]>([]);
  const [showAuthRequiredModal, setShowAuthRequiredModal] = useState(false);

  // Checkout and payment integration states
  const [isPaymentStep, setIsPaymentStep] = useState(true);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'pix' | 'card'>('pix');
  const [isPaid, setIsPaid] = useState(false);
  const [pixCopied, setPixCopied] = useState(false);
  const [cardHolder, setCardHolder] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [paymentLoading, setPaymentLoading] = useState(false);

  // Real full-stack Mercado Pago integration states
  const [mpPreferenceId, setMpPreferenceId] = useState<string>('');
  const [mpInitPoint, setMpInitPoint] = useState<string>('');
  const [mpLoading, setMpLoading] = useState<boolean>(false);
  const [mpError, setMpError] = useState<string>('');

  useEffect(() => {
    if (isSuccessModalOpen && recentBookings.length > 0) {
      setMpLoading(true);
      setMpError('');
      
      let emailAddress = 'scjorge1908@gmail.com';
      try {
        const savedProfile = localStorage.getItem('sublocahope_profile');
        if (savedProfile) {
          const parsed = JSON.parse(savedProfile);
          if (parsed.email) {
            emailAddress = parsed.email;
          }
        }
      } catch (e) {
        // Fallback
      }

      const compileBookingsPayload = recentBookings.map(b => {
        const hasInsurance = reimbursementInsurance && activeProtectedSlotsCount > 0;
        return {
          id: b.id,
          roomName: b.roomName,
          date: b.date,
          dateKey: b.dateKey,
          timeSlots: b.timeSlots,
          pricePerHour: b.pricePerHour,
          hasInsurance: hasInsurance
        };
      });

      fetch('/api/mercadopago/create-preference', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          bookings: compileBookingsPayload,
          professionalEmail: emailAddress,
          professionalName: professionalName || 'Dr(a). Visitante'
        })
      })
      .then(res => {
        if (!res.ok) throw new Error('Falha ao gerar preferência de pagamento.');
        return res.json();
      })
      .then(data => {
        setMpPreferenceId(data.preferenceId || '');
        setMpInitPoint(data.init_point || '');
      })
      .catch(err => {
        console.error(err);
        setMpError('Erro ao conectar com API de pagamento: ' + err.message);
      })
      .finally(() => {
        setMpLoading(false);
      });
    }
  }, [isSuccessModalOpen, recentBookings, professionalName]);

  // Load all 6 rooms available in the clinic
  const allRooms = INITIAL_ROOMS;

  // Check if a specific slot date and hour is less than 25 hours away from current time
  const isSlotDisabledBy25hRule = (dateStr: string, timeStr: string): boolean => {
    try {
      const [year, month, day] = dateStr.split('-').map(Number);
      const [hours, minutes] = timeStr.split(':').map(Number);
      const slotDate = new Date(year, month - 1, day, hours, minutes);
      const now = new Date();
      const diffMs = slotDate.getTime() - now.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);
      return diffHours < 25;
    } catch {
      return false;
    }
  };

  // Check if an entire calendar day is blocked (i.e. past, today, or has no slots at least 25 hours in the future)
  const isCalendarDayDisabled = (dateStr: string): boolean => {
    try {
      const [year, month, day] = dateStr.split('-').map(Number);
      const now = new Date();
      
      const todayDateOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const targetDateOnly = new Date(year, month - 1, day);
      if (targetDateOnly <= todayDateOnly) {
        return true;
      }

      // Latest possible slot starts at 18:00
      const latestTimeStr = '18:00';
      const [lh, lm] = latestTimeStr.split(':').map(Number);
      const latestSlotDate = new Date(year, month - 1, day, lh, lm);
      const diffMs = latestSlotDate.getTime() - now.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);
      return diffHours < 25;
    } catch {
      return false;
    }
  };

  // Helper to get formatted date string in Portuguese
  const getFormattedPortugueseDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-').map(Number);
    const dateObj = new Date(year, month - 1, day);
    const weekday = dateObj.toLocaleDateString('pt-BR', { weekday: 'long' });
    const monthName = MONTHS_PT[month - 1];
    return `${weekday.charAt(0).toUpperCase() + weekday.slice(1)}, ${day} de ${monthName} de ${year}`;
  };

  // Generate days for monthly grid
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();

  // Navigation handlers for Calendar Months
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  };

  // Handle toggling selected date (multi-selection)
  const handleToggleDateStr = (dateString: string) => {
    setSelectedDates((prev) => {
      if (prev.includes(dateString)) {
        if (prev.length === 1) return prev; // Always keep at least 1 date
        return prev.filter(d => d !== dateString);
      } else {
        return [...prev, dateString].sort();
      }
    });
  };

  // Synchronize slots from Google spreadsheet based on selected dates and rooms
  useEffect(() => {
    if (selectedDates.length === 0) {
      setRoomsAndDaysSlots({});
      setSyncStatus('idle');
      return;
    }

    setSyncStatus('loading');
    
    // Clear slots belonging to any stale deselected dates
    setSelectedSlotsByRoomAndDay((prev) => {
      const next = { ...prev };
      let updated = false;
      Object.keys(next).forEach((key) => {
        const [_, dateStr] = key.split('#');
        if (!selectedDates.includes(dateStr)) {
          delete next[key];
          updated = true;
        }
      });
      return updated ? next : prev;
    });

    const scriptId = adminSettings?.appScriptId && adminSettings.appScriptId !== 'AKfycbzyX2H8fVL_dVyf4kNliZh8hHnoTBjUN'
      ? adminSettings.appScriptId
      : 'AKfycbzAFVrhN1e0TLdtptqYi573psMPe8jDz82d5DrwtvTN7Fl6Dh2FMdtBuer5vMqxvKs8';
    
    const SCRIPT_URL = `https://script.google.com/macros/s/${scriptId}/exec`;

    const mapResponseToSlots = (data: any): typeof TIME_SLOTS => {
      if (Array.isArray(data) && data.length > 0 && typeof data[0] === 'object' && 'time' in data[0]) {
        return data as typeof TIME_SLOTS;
      }
      
      if (data && (Array.isArray(data.availableSlots) || Array.isArray(data.reservedSlots) || Array.isArray(data.allSlots))) {
        const slotsToMap = Array.isArray(data.allSlots) && data.allSlots.length > 0
          ? data.allSlots
          : ['07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'];
          
        return slotsToMap.map((t: string) => {
          let isReserved = false;
          if (Array.isArray(data.reservedSlots)) {
            isReserved = data.reservedSlots.includes(t);
          } else if (Array.isArray(data.availableSlots)) {
            isReserved = !data.availableSlots.includes(t);
          }
          return { time: t, reserved: isReserved };
        });
      }
      
      if (Array.isArray(data)) {
        return data as typeof TIME_SLOTS;
      }
      
      return [];
    };

    // Fetch or generate schedule slots for ALL combinations of selected dates & all 6 rooms
    const queryPromises = [];
    for (const room of allRooms) {
      for (const dStr of selectedDates) {
        
        const promise = (async () => {
          // 1. Try Direct POST request first (CORS is configured on Google Apps Script)
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3500);
            
            const response = await fetch(SCRIPT_URL, {
              method: 'POST',
              mode: 'cors',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                action: 'getSlots',
                room: room.id,
                date: dStr
              }),
              signal: controller.signal
            });
            clearTimeout(timeoutId);
            
            if (response.ok) {
              const data = await response.json();
              const mapped = mapResponseToSlots(data);
              if (mapped && mapped.length > 0) {
                return { key: `${room.id}#${dStr}`, slots: mapped };
              }
            }
          } catch (e: any) {
            console.warn(`[Direct POST slot fetch failed for ${room.id} on ${dStr}]`, e.message);
          }

          // 2. Fallback to API proxy (CORS Bypass proxy)
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3500);
            const proxyUrl = `/api/slots?room=${encodeURIComponent(room.id)}&date=${encodeURIComponent(dStr)}`;
            
            const response = await fetch(proxyUrl, { signal: controller.signal });
            clearTimeout(timeoutId);
            
            if (response.ok) {
              const data = await response.json();
              const mapped = mapResponseToSlots(data);
              if (mapped && mapped.length > 0) {
                return { key: `${room.id}#${dStr}`, slots: mapped };
              }
            }
          } catch (e: any) {
            console.warn(`[Proxy slot fetch failed for ${room.id} on ${dStr}]`, e.message);
          }

          // 3. Fallback: simular horários offline determinísticos
          const dateSeed = dStr.split('-').reduce((sum, val) => sum + Number(val), 0);
          const roomSeed = room.id.charCodeAt(room.id.length - 1);
          
          const seededSlots = TIME_SLOTS.map((s, index) => {
            const isReserved = (dateSeed + roomSeed + index * 17) % 3 === 0;
            return {
              ...s,
              reserved: isReserved
            };
          });
          return { key: `${room.id}#${dStr}`, slots: seededSlots };
        })();

        queryPromises.push(promise);
      }
    }

    Promise.all(queryPromises).then((results) => {
      const newState: { [roomAndDayKey: string]: typeof TIME_SLOTS } = {};
      results.forEach((r) => {
        newState[r.key] = r.slots;
      });
      setRoomsAndDaysSlots(newState);
      setSyncStatus('success');
    });

  }, [selectedDates, adminSettings?.appScriptId]);

  // Handle slot toggle choice inside a specific combination
  const handleToggleRoomSlot = (roomId: string, dateStr: string, time: string, reserved: boolean) => {
    if (reserved) return;

    if (!professionalName || !professionalId) {
      setShowAuthRequiredModal(true);
      return;
    }

    setSelectedSlotsByRoomAndDay((prev) => {
      const key = `${roomId}#${dateStr}`;
      const currentSlots = prev[key] || [];
      const updatedSlots = currentSlots.includes(time)
        ? currentSlots.filter((t) => t !== time)
        : [...currentSlots, time].sort();

      return {
        ...prev,
        [key]: updatedSlots
      };
    });
  };

  // Total items reserved
  const totalReservedSlotsCount: number = Object.values(selectedSlotsByRoomAndDay).reduce(
    (sum: number, arr: any) => sum + (arr || []).length, 0
  ) as number;

  // Count of active protected slots
  const activeProtectedSlotsCount = reimbursementInsurance
    ? getSelectedSlotDetails().filter((s) => protectedSlots[s.key]).length
    : 0;

  // Compute calculated cumulative total value
  const calculateTotalValue = () => {
    let sum = 0;
    allRooms.forEach((room) => {
      selectedDates.forEach((dStr) => {
        const key = `${room.id}#${dStr}`;
        const selectedCount = (selectedSlotsByRoomAndDay[key] || []).length;
        sum += selectedCount * (room.pricePerHour ?? 45);
      });
    });
    // Add reimbursement fee of 9.90 per individual protected slot
    sum += (activeProtectedSlotsCount * 9.90);
    return sum;
  };

  const handleClearAllSelections = () => {
    setSelectedSlotsByRoomAndDay({});
    setReimbursementInsurance(false);
    setProtectedSlots({});
  };

  // Submit and confirm reservations with the protection confirmation question dialog checking
  const handleConfirmReservation = () => {
    if (!professionalName || !professionalId) {
      setShowAuthRequiredModal(true);
      return;
    }
    if (totalReservedSlotsCount === 0) return;

    // Check if ALL slots are already protected
    if (activeProtectedSlotsCount === totalReservedSlotsCount) {
      // 100% protected, go directly to payment step without showing any modal
      proceedWithBookingSubmit(true);
      return;
    }

    // Decide which scenario to open automatically
    if (!hasModifiedProtection) {
      // Scenario 3: User has not taken an explicit decision yet
      setProtectionModalScenario('cenario3');
    } else if (activeProtectedSlotsCount > 0) {
      // Scenario 1: User has already chosen to protect some slots
      setProtectionModalScenario('cenario1');
    } else {
      // Scenario 2: User explicitly opted-out or has 0 protected slots
      setProtectionModalScenario('cenario2');
    }

    setShowProtectionDialog(true);
  };

  const handleConfirmWithProtection = () => {
    // Force enable master insurance toggle and mark all checked
    setReimbursementInsurance(true);
    const details = getSelectedSlotDetails();
    const updated: { [key: string]: boolean } = {};
    details.forEach((d) => {
      updated[d.key] = true;
    });
    setProtectedSlots(updated);
    
    // Proceed with booking using active protection
    setTimeout(() => {
      const newBookingsCreated: Booking[] = [];
      allRooms.forEach((room) => {
        selectedDates.forEach((dStr) => {
          const key = `${room.id}#${dStr}`;
          const slots = selectedSlotsByRoomAndDay[key] || [];
          if (slots.length > 0) {
            const protectedSlotsInThisBookingCount = slots.length; // all protected
            const baseCost = slots.length * (room.pricePerHour ?? 45);
            const insuranceCost = protectedSlotsInThisBookingCount * 9.90;

            const newBooking: Booking = {
              id: `book-${room.id}-${dStr}-${Date.now()}`,
              roomName: room.name,
              roomType: room.type,
              pricePerHour: room.pricePerHour ?? 45,
              date: getFormattedPortugueseDate(dStr),
              dateKey: dStr,
              timeSlots: slots,
              totalValue: baseCost + insuranceCost,
              status: 'Confirmado',
              createdAt: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
              professionalName: professionalName || 'Dr(a). Visitante',
              professionalId: professionalId || 'guest'
            };
            
            newBookingsCreated.push(newBooking);
          }
        });
      });

      setRecentBookings(newBookingsCreated);
      setIsSuccessModalOpen(true);
      setIsPaymentStep(true);
      setIsPaid(false);
      setSelectedPaymentMethod('pix');
      setPixCopied(false);
      setCardHolder('');
      setCardNumber('');
      setCardExpiry('');
      setCardCvv('');
      setPaymentLoading(false);
    }, 50);
  };

  const handleConfirmWithoutProtectionCheck = () => {
    proceedWithBookingSubmit(false);
  };

  const proceedWithBookingSubmit = (hasProtection: boolean) => {
    const newBookingsCreated: Booking[] = [];
    
    // Create an individual booking object for each room/day that has selected slots
    allRooms.forEach((room) => {
      selectedDates.forEach((dStr) => {
        const key = `${room.id}#${dStr}`;
        const slots = selectedSlotsByRoomAndDay[key] || [];
        if (slots.length > 0) {
          // Find how many slots in this booking have protection active
          const protectedSlotsInThisBookingCount = slots.filter((time) => {
            const slotKey = `${room.id}#${dStr}#${time}`;
            return hasProtection && reimbursementInsurance && protectedSlots[slotKey];
          }).length;

          const baseCost = slots.length * (room.pricePerHour ?? 45);
          const insuranceCost = protectedSlotsInThisBookingCount * 9.90;

          const newBooking: Booking = {
            id: `book-${room.id}-${dStr}-${Date.now()}`,
            roomName: room.name,
            roomType: room.type,
            pricePerHour: room.pricePerHour ?? 45,
            date: getFormattedPortugueseDate(dStr),
            dateKey: dStr,
            timeSlots: slots,
            totalValue: baseCost + insuranceCost,
            status: 'Confirmado',
            createdAt: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
            professionalName: professionalName || 'Dr(a). Visitante',
            professionalId: professionalId || 'guest'
          };
          
          newBookingsCreated.push(newBooking);
        }
      });
    });

    setRecentBookings(newBookingsCreated);
    setIsSuccessModalOpen(true);
    setIsPaymentStep(true);
    setIsPaid(false);
    setSelectedPaymentMethod('pix');
    setPixCopied(false);
    setCardHolder('');
    setCardNumber('');
    setCardExpiry('');
    setCardCvv('');
    setPaymentLoading(false);
  };

  const handleCompletePayment = (bookings: Booking[]) => {
    bookings.forEach((b) => {
      onAddBooking(b);
    });

    // Notify payment via HTML Form to Google Apps Script bypassing CORS
    try {
      const totalValue = bookings.reduce((sum, b) => sum + b.totalValue, 0);
      const hasTaxaFlex = reimbursementInsurance && activeProtectedSlotsCount > 0;
      const itemsList: Array<{ data: string; hora: string; valor: string }> = [];
      
      bookings.forEach((b) => {
        const parts = b.dateKey.split('-');
        const formattedDate = parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : b.dateKey;
        
        b.timeSlots.forEach((slot) => {
          itemsList.push({
            data: formattedDate,
            hora: slot,
            valor: (b.pricePerHour ?? 0).toFixed(2).replace('.', ',')
          });
        });
      });

      const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzAFVrhN1e0TLdtptqYi573psMPe8jDz82d5DrwtvTN7Fl6Dh2FMdtBuer5vMqxvKs8/exec";
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = SCRIPT_URL;
      form.target = 'hiddenFrame';
      form.style.display = 'none';
      
      const input = document.createElement('input');
      input.name = 'postData';
      
      const payload = {
        tipo: 'pagamento',
        profissionalNome: professionalName || bookings[0]?.professionalName || 'Profissional',
        valorTotal: (totalValue ?? 0).toFixed(2).replace('.', ','),
        formaPagamento: selectedPaymentMethod === 'pix' ? 'pix' : 'cartao',
        taxaFlexivel: hasTaxaFlex ? 'Sim' : 'Não',
        valorTaxa: ((activeProtectedSlotsCount || 0) * 9.90).toFixed(2).replace('.', ','),
        sala: bookings[0]?.roomName || 'Geral',
        itens: itemsList
      };

      input.value = JSON.stringify(payload);
      form.appendChild(input);
      document.body.appendChild(form);
      form.submit();
      document.body.removeChild(form);
      console.log("Notificação de pagamento enviada com sucesso ao Google Apps Script via Form target.");
    } catch (e) {
      console.error("Erro ao notificar pagamento pelo Apps Script:", e);
    }

    setIsPaid(true);
  };

  const handleCloseModal = () => {
    setIsSuccessModalOpen(false);
    setSelectedSlotsByRoomAndDay({});
    setReimbursementInsurance(false);
    setView(professionalName ? 'professional-dashboard' : 'register');
  };

  return (
    <div className="relative animate-fade-in pb-12">
      {/* Visual Breadcrumb Path */}
      <nav className="flex items-center gap-1 text-brand-variant font-sans font-semibold text-xs tracking-wider uppercase mb-4">
        <span className="cursor-pointer hover:text-primary" onClick={() => setView('home')}>Salas</span>
        <ChevronRight className="w-3.5 h-3.5 text-outline-alt" />
        <span className="cursor-pointer hover:text-primary">Clínica Palhoça</span>
        <ChevronRight className="w-3.5 h-3.5 text-outline-alt" />
        <span className="text-primary font-bold">Painel Multicomparativo</span>
      </nav>

      {/* 2. PREMIUM SAAS CONVERSION HERO (3-STEP DYNAMIC VALUE ROADMAP) */}
      <section className="bg-gradient-to-br from-[#0c1a30] via-[#112443] to-[#162f56] text-white rounded-[2rem] p-6 sm:p-10 mb-8 border border-slate-800 shadow-xl overflow-hidden relative" id="saas-hero-booking-panel">
        {/* Background decorative glowing orbs */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-secondary/10 rounded-full translate-x-1/4 -translate-y-1/4 blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-60 h-60 bg-teal-500/5 rounded-full -translate-x-1/4 translate-y-1/4 blur-2xl pointer-events-none"></div>

        <div className="grid lg:grid-cols-12 gap-8 items-center relative z-10 font-sans">
          {/* Main Left Copywriting block */}
          <div className="lg:col-span-12 space-y-5 text-left w-full">
            <span className="inline-flex items-center gap-1.5 bg-secondary/20 border border-secondary/30 text-secondary-hover font-sans font-black text-[10px] sm:text-xs rounded-full uppercase tracking-widest px-3 py-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Alugue seu Consultório sob Demanda
            </span>
            
            <h1 className="font-sans font-extrabold text-3xl sm:text-4xl text-white leading-tight tracking-tight">
              Sua Sala Pronta em Menos de 1 Minuto.
            </h1>
            
            <p className="font-sans text-[#cbd5e1] text-xs sm:text-sm leading-relaxed max-w-3xl">
              Esqueça despesas com aluguel fixo e condomínio. Subloque um espaço acolhedor e de alta qualidade, com fácil acesso para você e seus pacientes, portaria 24h e um ambiente totalmente pronto para o seu atendimento.
            </p>

            {/* Simplicity Proof timeline (Passo-a-Passo de 4 Segundos) */}
            <div className="pt-4 border-t border-slate-700/50 space-y-3">
              <span className="text-[10px] uppercase font-black text-[#94a3b8] tracking-widest block">Como funciona em 3 passos simples</span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-white/5 hover:bg-white/10 transition-colors border border-white/5 p-3 rounded-xl flex gap-2.5 items-center">
                  <div className="w-8 h-8 rounded-lg bg-secondary/20 text-secondary-hover flex items-center justify-center font-black font-sans text-xs shrink-0">1</div>
                  <div>
                    <h4 className="font-sans font-bold text-xs text-white leading-none">Escolha a Data</h4>
                    <span className="text-[9px] text-slate-400 block mt-0.5">Selecione no calendário</span>
                  </div>
                </div>
                <div className="bg-white/5 hover:bg-white/10 transition-colors border border-white/5 p-3 rounded-xl flex gap-2.5 items-center">
                  <div className="w-8 h-8 rounded-lg bg-secondary/20 text-secondary-hover flex items-center justify-center font-black font-sans text-xs shrink-0">2</div>
                  <div>
                    <h4 className="font-sans font-bold text-xs text-white leading-none">Marque a hora</h4>
                    <span className="text-[9px] text-slate-400 block mt-0.5">Selecione nas salas</span>
                  </div>
                </div>
                <div className="bg-white/5 hover:bg-white/10 transition-colors border border-white/5 p-3 rounded-xl flex gap-2.5 items-center">
                  <div className="w-8 h-8 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center font-black font-sans text-xs shrink-0">✓</div>
                  <div>
                    <h4 className="font-sans font-bold text-xs text-white leading-none">E finalize o agendamento</h4>
                    <span className="text-[9px] text-slate-400 block mt-0.5">Rápido e simples</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Grid: Left column (Monthly Calendar) | Right column (Dynamic stats or help info) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-10">
        
        {/* INTERACTIVE MONTHLY CALENDAR CONTAINER WITH TARGETED CSS SELECTOR 2 STYLING IN CLASS */}
        <div className="lg:col-span-8 bg-white border border-outline-alt/15 rounded-3xl p-6 sm:p-8 shadow-lg shadow-slate-100/40 hover:shadow-xl hover:border-secondary/20 transition-all duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold tracking-widest text-brand-variant flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-secondary animate-ping"></span>
                Seleção Múltipla de Datas
              </span>
              <h2 className="font-sans font-extrabold text-2xl text-primary">
                {MONTHS_PT[currentMonth]} {currentYear}
              </h2>
            </div>
            
            {/* Previous/Next Month Controls */}
            <div className="flex items-center gap-3">
              <button
                onClick={handlePrevMonth}
                className="p-2.5 rounded-xl border border-outline-alt/40 hover:bg-slate-50 transition-colors cursor-pointer"
                title="Mês Anterior"
              >
                <ChevronLeft className="w-5 h-5 text-primary" />
              </button>
              <button
                onClick={() => {
                  const now = new Date();
                  // Find the first valid day starting from today or tomorrow
                  let shift = 0;
                  let targetStr = '';
                  while (shift < 10) {
                    const candidate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + shift);
                    const y = candidate.getFullYear();
                    const m = String(candidate.getMonth() + 1).padStart(2, '0');
                    const d = String(candidate.getDate()).padStart(2, '0');
                    const candStr = `${y}-${m}-${d}`;
                    if (!isCalendarDayDisabled(candStr)) {
                      targetStr = candStr;
                      break;
                    }
                    shift++;
                  }
                  if (targetStr) {
                    const [ty, tm, td] = targetStr.split('-').map(Number);
                    setCurrentMonth(tm - 1);
                    setCurrentYear(ty);
                    setSelectedDates([targetStr]);
                  }
                }}
                className="px-3 py-1.5 text-xs font-bold text-secondary bg-secondary/10 hover:bg-secondary/15 rounded-lg transition-colors cursor-pointer"
              >
                Primeira Data Livre
              </button>
              <button
                onClick={handleNextMonth}
                className="p-2.5 rounded-xl border border-outline-alt/40 hover:bg-slate-50 transition-colors cursor-pointer"
                title="Próximo Mês"
              >
                <ChevronRight className="w-5 h-5 text-primary" />
              </button>
            </div>
          </div>

          {/* Weekdays indicator bar */}
          <div className="grid grid-cols-7 gap-1.5 text-center text-xs font-bold font-sans text-brand-variant mb-3">
            {WEEKDAYS_PT.map((day, idx) => (
              <div 
                key={day} 
                className={`py-2 border-b border-outline-alt/10 ${idx === 0 || idx === 6 ? 'text-[#e05638]' : ''}`}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Day Grid */}
          <div className="grid grid-cols-7 gap-2">
            {/* Padding empty boxes for previous month spillover */}
            {Array.from({ length: firstDayIndex }).map((_, idx) => (
              <div key={`empty-${idx}`} className="aspect-square bg-slate-50/50 rounded-xl" />
            ))}

            {/* Render actual days of current month */}
            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const dayNum = idx + 1;
              const dateString = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
              const isSelected = selectedDates.includes(dateString);
              const dateObj = new Date(currentYear, currentMonth, dayNum);
              const dayOfWeek = dateObj.getDay();
              const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
              const isBlocked = isCalendarDayDisabled(dateString);

              return (
                <button
                  key={`day-${dayNum}`}
                  onClick={() => {
                    if (isBlocked) return;
                    if (!professionalId || !professionalName) {
                      setShowAuthRequiredModal(true);
                      return;
                    }
                    handleToggleDateStr(dateString);
                  }}
                  disabled={isBlocked}
                  className={`aspect-square flex flex-col items-center justify-between p-2 rounded-xl border transition-all relative ${
                    isBlocked
                      ? 'bg-slate-100/60 border-slate-200/40 text-slate-400 cursor-not-allowed opacity-40'
                      : isSelected
                        ? 'bg-secondary border-secondary text-white font-extrabold scale-102 shadow-md shadow-secondary/20'
                        : 'bg-white hover:bg-brand-bg border-outline-alt/15 text-primary'
                  }`}
                  title={isBlocked ? "Indisponível (Agendamento exige pelo menos 25h de antecedência)" : "Disponível para seleção"}
                >
                  <span className={`text-sm font-sans mx-auto mt-1 font-bold ${isBlocked ? 'line-through text-slate-400/80' : ''}`}>
                    {dayNum}
                  </span>
                  
                  {/* Miniature decorative bullet indicating weekends */}
                  {isWeekend && !isSelected && !isBlocked && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#f87171] absolute bottom-1.5" />
                  )}

                  {/* Dot/Ping indicator if user has chosen slots on this day */}
                  {Object.keys(selectedSlotsByRoomAndDay).some(key => {
                    const [_, dStr] = key.split('#');
                    return dStr === dateString && (selectedSlotsByRoomAndDay[key] || []).length > 0;
                  }) && !isBlocked && (
                    <span className={`w-2 h-2 rounded-full absolute bottom-1 ${isSelected ? 'bg-white animate-pulse' : 'bg-secondary'}`} />
                  )}
                </button>
              );
            })}
          </div>
          
          <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-end text-xs text-brand-variant font-medium pt-3 border-t border-slate-150 gap-2">
            <span className="text-secondary font-bold font-mono">Dias Selecionados: {selectedDates.length}</span>
          </div>
        </div>

        {/* INFORMATIVE LEGEND PANEL */}
        <div className="lg:col-span-4 bg-brand-bg rounded-3xl p-6 sm:p-8 border border-outline-alt/15 flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="font-sans font-extrabold text-lg text-primary">
              Informações de Agendamento
            </h3>
            
            <div className="p-4 bg-white rounded-2xl border border-outline-alt/10 space-y-3">
              <span className="block text-[10px] uppercase font-bold tracking-widest text-[#64748b]">
                Datas Ativas ({selectedDates.length})
              </span>
              <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1 divide-y divide-outline-alt/10" id="selected-dates-list">
                {selectedDates.length === 0 ? (
                  <p className="text-xs text-slate-400 italic text-center py-2">
                    Nenhum dia selecionado. Clique em uma data no calendário ao lado 📅
                  </p>
                ) : (
                  selectedDates.map((dStr, idx) => (
                    <div key={dStr} className={`flex items-center justify-between pt-1.5 ${idx === 0 ? 'pt-0 border-t-0' : ''}`}>
                      <span className="font-sans font-extrabold text-xs text-primary truncate">
                        📅 {getFormattedPortugueseDate(dStr).split(',')[1]}
                      </span>
                      {selectedDates.length > 1 && (
                        <button 
                          onClick={() => handleToggleDateStr(dStr)}
                          className="text-red-500 hover:text-red-700 text-xs font-bold leading-none p-1 shrink-0 ml-2"
                          title="Remover data"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center gap-2.5 text-brand-variant">
                <span className="w-3.5 h-3.5 rounded bg-white border border-outline-alt/20 flex items-center justify-center text-[10px] font-bold text-secondary">
                  ✓
                </span>
                <span>Selecione horários à vontade em qualquer uma das salas.</span>
              </div>
              <div className="flex items-center gap-2.5 text-brand-variant">
                <Clock className="w-4 h-4 text-[#bfdbfe]" />
                <span>Múltiplos horários acumulam o valor proporcional correspondente.</span>
              </div>
            </div>

            <div className="pt-4 border-t border-outline-alt/10 mt-2 space-y-3 font-sans">
              <h4 className="font-extrabold text-[11px] text-primary flex items-center gap-1.5 uppercase tracking-wider text-slate-700">
                🛡️ Política de Cancelamento
              </h4>
              <div className="space-y-2 text-brand-variant text-[11px] leading-relaxed">
                <p>
                  As reservas podem ser canceladas sem custos com até <strong className="text-primary font-bold">24 horas de antecedência</strong>.
                </p>
                <p>
                  Após esse prazo, o cancelamento somente será permitido para reservas com a opção <strong className="text-secondary font-bold">Reserva Flexibilizada</strong>.
                </p>
                <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-250/30 text-amber-900 space-y-1">
                  <span className="font-extrabold block text-amber-950 text-[11px]">Reserva Flexibilizada – R$ 9,90 por hora</span>
                  <p className="text-[10px] leading-relaxed text-amber-800 font-medium">
                    Permite cancelar sua reserva com até <strong className="text-amber-950 font-bold">3 horas de antecedência</strong>, oferecendo mais segurança e flexibilidade para lidar com remarcações e cancelamentos de última hora dos pacientes.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>


      </div>

      {selectedDates.length === 0 ? (
        <div className="bg-slate-50 border border-dashed border-slate-300 rounded-[2rem] p-12 text-center my-10 space-y-4 shadow-xs">
          <div className="w-16 h-16 rounded-full bg-[#ebf5ff] text-secondary flex items-center justify-center mx-auto text-2xl">
            📅
          </div>
          <div className="space-y-1.5 max-w-md mx-auto">
            <h3 className="font-sans font-extrabold text-xl text-primary">
              Selecione uma data para ver a disponibilidade
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Por favor, clique em um ou mais dias disponíveis no calendário acima para visualizar os consultórios e seus respectivos horários vagos.
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* HEADER: CLINIC ROOMS SECTION */}
          <div className="mb-6 border-b border-outline-alt/25 pb-3">
            <h2 className="font-sans font-extrabold text-2xl text-primary flex items-center gap-2">
              {adminSettings?.bookingRoomsHeading || "Disponibilidade de horário."}
            </h2>
          </div>

          {/* 6 ROOM CARDS BENTO GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-10">
            {allRooms.map((room) => {
              // Check if there's any active slot choice in this room for any of the selectedDates
              const hasChoicesInRoom = selectedDates.some(d => (selectedSlotsByRoomAndDay[`${room.id}#${d}`] || []).length > 0);

              return (
                <div
                  key={room.id}
                  className={`flex flex-col bg-white border rounded-3xl overflow-hidden transition-all duration-300 shadow-sm hover:shadow-md ${
                    hasChoicesInRoom
                      ? 'border-secondary ring-2 ring-secondary/20 scale-[1.01]'
                      : 'border-outline-alt/25'
                  }`}
                >
                  {/* Room Card Image Header */}
                  <div className="h-48 w-full overflow-hidden relative group">
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
                    
                    {/* Visual badge overlays */}
                    <div className="absolute top-3 left-3 bg-primary/90 backdrop-blur-xs text-white text-[10px] uppercase font-bold tracking-wider px-3 py-1 rounded-xl">
                      {room.type === 'executivo_luxo' ? 'Executiva Luxo' : room.type === 'premium' ? 'Premium' : 'Standard'}
                    </div>
                    
                    <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-xs text-primary text-xs font-bold px-2 py-1 rounded-xl flex items-center gap-1 shadow">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span>{(room.rating ?? 5.0).toFixed(1)}</span>
                    </div>

                    <div className="absolute bottom-3 left-3 bg-black/70 backdrop-blur-xs text-white text-xs font-bold px-3 py-1 rounded-lg">
                      R$ {(room.pricePerHour ?? 45).toFixed(2).replace('.', ',')} / hora
                    </div>
                  </div>

                  {/* Room Info Content Body (TARGETED CSS SELECTOR 3 STYLING IN CLASS) */}
                  <div className="p-5 flex-grow space-y-3 bg-slate-50/30 border-t border-outline-alt/10 rounded-b-3xl transition-colors text-left">
                    <div className="space-y-1.5">
                      <h3 className="font-sans font-extrabold text-lg text-primary leading-snug">
                        {room.name}
                      </h3>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-brand-variant font-medium">
                        {(room.features || []).map((feat, i) => (
                          <span key={i} className="flex items-center gap-1.5 whitespace-nowrap">
                            {getAmenityIcon(feat, "w-3.5 h-3.5 text-secondary")}
                            <span>{cleanAmenityLabel(feat)}</span>
                            {i < (room.features || []).length - 1 && <span className="text-black/15 ml-1 select-none">•</span>}
                          </span>
                        ))}
                      </div>
                    </div>

                    <p className="text-xs text-brand-variant leading-relaxed">
                      {room.description}
                    </p>

                    {/* COMPACT STACKED HOURS PER DATE CARD */}
                    <div className="pt-3 border-t border-outline-alt/10 space-y-4 max-h-[350px] overflow-y-auto pr-1">
                      {selectedDates.length > 0 ? (
                        selectedDates.map((dateStr) => {
                          const dateKey = `${room.id}#${dateStr}`;
                          const slotsForRoomAndDay = roomsAndDaysSlots[dateKey] || TIME_SLOTS;
                          const roomSelectedSlots = selectedSlotsByRoomAndDay[dateKey] || [];
                          const dateParts = dateStr.split('-');
                          const dayNum = dateParts[2];
                          const monthNum = dateParts[1];
                          const weekdayLabel = getFormattedPortugueseDate(dateStr).split(',')[0];

                          return (
                            <div 
                              key={dateStr} 
                              className="bg-slate-50 border border-outline-alt/15 p-3 rounded-2xl space-y-2 text-left transition-all hover:border-secondary/30 hover:bg-slate-50/80"
                            >
                              <div className="flex justify-between items-center px-0.5">
                                <span className="text-[10px] font-extrabold text-primary flex items-center gap-1 uppercase tracking-wider">
                                  📅 {weekdayLabel}, {dayNum}/{monthNum}
                                </span>
                                {roomSelectedSlots.length > 0 && (
                                  <span className="text-[9px] bg-secondary text-white font-black px-2 py-0.5 rounded-md leading-none shadow-sm animate-pulse">
                                    {roomSelectedSlots.length} {roomSelectedSlots.length === 1 ? 'hora' : 'horas'}
                                  </span>
                                )}
                              </div>

                              <div className="grid grid-cols-4 gap-1">
                                {slotsForRoomAndDay.map((slot) => {
                                  const isRule25hDisabled = isSlotDisabledBy25hRule(dateStr, slot.time);
                                  const isReserved = slot.reserved || isRule25hDisabled;
                                  const isChecked = roomSelectedSlots.includes(slot.time);

                                  if (isReserved) {
                                    return (
                                      <div
                                        key={slot.time}
                                        className="text-center py-1 bg-slate-100 border border-slate-200/50 rounded text-slate-400 text-[10px] font-extrabold cursor-not-allowed opacity-50 select-none"
                                        title={isRule25hDisabled ? "Indisponível (Antecedência mínima de 25 horas)" : "Indisponível na planilha"}
                                      >
                                        {slot.time}
                                      </div>
                                    );
                                  }

                                  return (
                                    <button
                                      key={slot.time}
                                      type="button"
                                      onClick={() => handleToggleRoomSlot(room.id, dateStr, slot.time, isReserved)}
                                      className={`text-center py-1 text-[10px] font-extrabold rounded border transition-all cursor-pointer ${
                                        isChecked
                                          ? 'bg-secondary border-secondary text-white shadow-xs'
                                          : 'bg-white hover:bg-slate-50 border-outline-alt/30 text-primary hover:border-secondary'
                                      }`}
                                    >
                                      {slot.time}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="text-center text-[10px] text-slate-450 py-4 font-bold border border-slate-150 border-dashed rounded-xl bg-slate-50/50">
                          Nenhuma data selecionada no calendário 📅
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* BOTTOM BOOKING SUMMARY CARD */}
          <div 
            id="booking-sticky-summary" 
            className="bg-white border border-outline-alt/30 rounded-3xl p-6 sm:p-8 shadow-lg shadow-primary/5 transition-all duration-300 space-y-4 mb-8"
          >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-2">
              <div className="flex flex-col sm:flex-row sm:items-center gap-6 flex-grow">
                <div>
                  <span className="block text-[10px] uppercase font-bold tracking-widest text-[#64748b]">
                    Resumo da Seleção Clínica
                  </span>
                  <span className="font-sans font-extrabold text-lg text-primary">
                    {totalReservedSlotsCount}{' '}
                    {totalReservedSlotsCount === 1 ? 'horário selecionado' : 'horários selecionados'}
                  </span>
                  
                  {totalReservedSlotsCount === 0 && (
                    <span className="block text-xs font-medium text-brand-variant mt-1 animate-pulse text-[#e05638]">
                      Selecione horários nos cartões de consultório acima.
                    </span>
                  )}
                </div>

                <div className="hidden sm:block h-12 w-[1px] bg-outline-alt/20"></div>

                <div>
                  <span className="block text-[10px] uppercase font-bold tracking-widest text-[#64748b]">
                    Valor Total Acumulado
                  </span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-sans font-black text-2xl text-primary">
                      R$ {(calculateTotalValue() ?? 0).toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 justify-end items-center shrink-0 self-stretch sm:self-auto flex-wrap animate-fade-in">
                <button
                  onClick={handleClearAllSelections}
                  disabled={totalReservedSlotsCount === 0}
                  className="px-6 py-3.5 rounded-xl border border-[#a2a6ab] text-[#1c1d1f] font-sans font-bold text-sm tracking-wide hover:bg-brand-bg transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Limpar Tudo
                </button>
                
                <button
                  onClick={handleConfirmReservation}
                  disabled={totalReservedSlotsCount === 0}
                  id="confirm-button-sticky"
                  className="px-8 py-3.5 rounded-xl bg-secondary hover:bg-secondary/95 text-white font-sans font-bold text-sm tracking-wide shadow-md shadow-secondary/15 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                >
                  Confirmar Escolhas ({totalReservedSlotsCount})
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* COMPREHENSIVE REIMBURSEMENT FEE SELECTOR BLOCK AT FOOTER */}
      {totalReservedSlotsCount > 0 && (
        <div id="reserva-flexivel-container" className="w-full border border-slate-200 rounded-2xl p-7 bg-white shadow-xs transition-all duration-300 space-y-6">
          
          {/* SaaS Upgrade Header Information */}
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
            <div className="space-y-2.5 max-w-2xl">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-sans font-extrabold text-base text-slate-900 tracking-tight">
                  Reserva Flexível
                </h4>
                <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200/40 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full">
                  Recomendado
                </span>
              </div>
              
              {/* Primary high-impact benefit statement */}
              <p className="font-sans font-semibold text-slate-800 text-sm leading-relaxed">
                Receba reembolso integral mesmo cancelando com até 3 horas de antecedência.
              </p>
              
              {/* Secondary clarifying text */}
              <p className="font-sans text-[13px] text-slate-550 leading-relaxed font-normal">
                Cancele gratuitamente até 24h antes da reserva. Com a Reserva Flexível, você pode cancelar com até 3 horas de antecedência e receber 100% do valor da sublocação de volta.
              </p>
              
              {/* Standard policy info label requested */}
              <p className="font-sans text-xs text-slate-400 font-medium pt-1">
                Cancelamento padrão com estorno disponível até 24h antes da reserva.
              </p>
            </div>

            {/* Micro-upgrade Switch Block */}
            <div className="shrink-0 bg-slate-50/70 border border-slate-100 rounded-xl p-5 md:w-80 flex flex-col justify-between gap-4">
              <div 
                className="flex items-start gap-3.5 cursor-pointer group select-none"
                onClick={() => handleToggleMasterProtection(!reimbursementInsurance)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    handleToggleMasterProtection(!reimbursementInsurance);
                  }
                }}
              >
                {/* Premium Switch Component */}
                <div className="pt-0.5">
                  <div className={`w-11 h-6 rounded-full p-0.5 transition-all duration-300 ease-in-out cursor-pointer relative ${
                    reimbursementInsurance ? 'bg-emerald-500' : 'bg-slate-300'
                  }`}>
                    <div className={`bg-white w-5 h-5 rounded-full shadow-sm transition-all duration-300 ease-in-out transform ${
                      reimbursementInsurance ? 'translate-x-5' : 'translate-x-0'
                    }`} />
                  </div>
                </div>
                
                <div className="space-y-1">
                  <span className="font-sans font-bold text-sm text-slate-700 group-hover:text-slate-900 transition-colors block">
                    Adicionar proteção para esta reserva
                  </span>
                  <div className="flex items-baseline gap-1.5 pt-0.5">
                    <span className="font-mono text-xs font-black text-emerald-700">
                      + R$ 9,90
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      / hora por sala
                    </span>
                  </div>
                </div>
              </div>
              
              {reimbursementInsurance && (
                <div className="text-[11px] font-sans font-medium text-emerald-700 bg-emerald-50/50 border border-emerald-200/30 px-3 py-2 rounded-lg flex items-center gap-1.5 animate-fade-in">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Proteção ativa para os seus horários</span>
                </div>
              )}
            </div>
          </div>

          {/* Individual Slot Tuning Control (Optional sub-management) */}
          {reimbursementInsurance && (
            <div className="pt-4 border-t border-slate-100 space-y-2.5 animate-fade-in">
              <div className="flex items-center justify-between">
                <span className="font-sans font-bold text-xs text-slate-500">
                  Ajustar horários protegidos individualmente (opcional):
                </span>
                <span className="font-sans text-[11px] text-slate-400">
                  {activeProtectedSlotsCount} de {totalReservedSlotsCount} ativos
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-36 overflow-y-auto pr-1">
                {getSelectedSlotDetails().map((slot) => {
                  const isSlotProtected = !!protectedSlots[slot.key] && reimbursementInsurance;
                  return (
                    <label
                      key={slot.key}
                      id={`protected-slot-checkbox-${slot.key}`}
                      className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer select-none text-xs ${
                        isSlotProtected
                          ? 'bg-emerald-50/20 border-emerald-200/55 text-emerald-950 font-medium shadow-xs'
                          : 'bg-slate-50/50 border-slate-150 text-slate-500'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <input
                          type="checkbox"
                          checked={isSlotProtected}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            handleToggleSlotProtection(slot.key, checked);
                          }}
                          className="w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500 cursor-pointer shrink-0"
                        />
                        <div className="truncate pr-1">
                          <span className="font-bold block truncate leading-tight">
                            {slot.roomName}
                          </span>
                          <span className="text-[10px] text-slate-400 block mt-0.5">
                            {slot.dateStr.split('-')[2]}/{slot.dateStr.split('-')[1]} • {slot.time}
                          </span>
                        </div>
                      </div>
                      <span className={`text-[10px] font-mono font-bold shrink-0 ${isSlotProtected ? 'text-emerald-700' : 'text-slate-400'}`}>
                        {isSlotProtected ? '+R$ 9,90' : 'Sem taxa'}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* Core Pricing & Checkout Total Summary Line */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-500">
            <div className="flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${activeProtectedSlotsCount > 0 ? 'bg-emerald-500' : 'bg-slate-300'}`} />
              <span>
                {activeProtectedSlotsCount} {activeProtectedSlotsCount === 1 ? 'horário protegido' : 'horários protegidos'}
              </span>
            </div>
            <div className="text-right">
              <span>Taxa flex total: </span>
              <span className={`font-mono text-sm font-black ${activeProtectedSlotsCount > 0 ? 'text-emerald-700' : 'text-slate-550'}`}>
                R$ {((activeProtectedSlotsCount || 0) * 9.90).toFixed(2).replace('.', ',')}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* REFUND PROTECTION PROMPT QUESTION MODAL */}
      {showProtectionDialog && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-slate-200 shadow-xl relative space-y-4 animate-scale-up">
            <button 
              onClick={() => setShowProtectionDialog(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-all cursor-pointer p-1 rounded-full hover:bg-slate-100"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Cenário 1 – Usuário já possui horários protegidos */}
            {protectionModalScenario === 'cenario1' && (
              <div className="space-y-5">
                <div className="text-center space-y-1">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 mb-1 animate-pulse">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-black text-slate-900 tracking-tight">
                    Proteção Flex Selecionada
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Você protegeu {activeProtectedSlotsCount} {activeProtectedSlotsCount === 1 ? 'horário' : 'horários'}.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-100 text-xs text-slate-600 space-y-2">
                  <div className="flex items-start gap-2 text-left">
                    <span className="text-emerald-600 font-bold">✓</span>
                    <span>Cancelamento ou reagendamento até <strong>3 horas antes</strong>.</span>
                  </div>
                  <div className="flex items-start gap-2 text-left">
                    <span className="text-emerald-600 font-bold">✓</span>
                    <span>Reembolso integral dos horários protegidos.</span>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-600">
                  <span className="font-bold">Valor adicional:</span>
                  <span className="font-mono font-black text-sm text-emerald-700">
                    R$ {((activeProtectedSlotsCount || 0) * 9.90).toFixed(2).replace('.', ',')}
                  </span>
                </div>

                <div className="flex flex-col gap-2 pt-1 font-sans">
                  <button
                    onClick={() => {
                      setShowProtectionDialog(false);
                      proceedWithBookingSubmit(true);
                    }}
                    className="w-full bg-emerald-650 hover:bg-emerald-700 text-white py-3 rounded-xl font-extrabold text-xs cursor-pointer shadow-md transition-all outline-none"
                  >
                    Continuar para Pagamento
                  </button>

                  <button
                    onClick={() => {
                      // Let them adjust it on the main page
                      setHasModifiedProtection(true);
                      setShowProtectionDialog(false);
                    }}
                    className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 rounded-xl font-bold text-xs cursor-pointer transition-colors"
                  >
                    Alterar Proteção
                  </button>
                </div>
              </div>
            )}

            {/* Cenário 2 – Usuário optou por não contratar proteção */}
            {protectionModalScenario === 'cenario2' && (
              <div className="space-y-5">
                <div className="text-center space-y-1">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-amber-50 text-amber-600 mb-1">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-black text-slate-900 tracking-tight font-sans">
                    Continuar sem Proteção?
                  </h3>
                </div>

                <div className="p-4 rounded-xl bg-amber-50/40 border border-amber-150 text-xs text-slate-600 space-y-2.5 leading-relaxed text-left font-sans">
                  <p className="font-bold text-slate-800">
                    Você pode cancelar sua reserva sem custo até 24 horas antes do horário agendado.
                  </p>
                  <p>
                    Cancelamentos realizados com menos de 24 horas de antecedência não dão direito a reembolso do valor da sublocação, mesmo em casos de imprevistos ou ausência do paciente.
                  </p>
                </div>

                <div className="flex flex-col gap-2 pt-1 font-sans">
                  <button
                    onClick={() => {
                      setReimbursementInsurance(false);
                      setProtectedSlots({});
                      setShowProtectionDialog(false);
                      proceedWithBookingSubmit(false);
                    }}
                    className="w-full bg-slate-900 hover:bg-slate-950 text-white py-3 rounded-xl font-extrabold text-xs cursor-pointer shadow-md transition-all outline-none"
                  >
                    Continuar sem Proteção
                  </button>

                  <button
                    onClick={() => {
                      if (!hasModifiedProtection) {
                        setProtectionModalScenario('cenario3');
                      } else {
                        setShowProtectionDialog(false);
                      }
                    }}
                    className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 rounded-xl font-bold text-xs cursor-pointer transition-colors"
                  >
                    Voltar
                  </button>
                </div>
              </div>
            )}

            {/* Cenário 3 – Usuário ainda não tomou decisão */}
            {protectionModalScenario === 'cenario3' && (
              <div className="space-y-5">
                <div className="text-center space-y-1">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-secondary/5 text-secondary mb-1">
                    <Shield className="w-6 h-6 text-secondary" />
                  </div>
                  <h3 className="text-lg font-black text-slate-900 tracking-tight font-sans">
                    Deseja adicionar Proteção Flex?
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Tenha flexibilidade máxima para cancelamentos ou reagendamentos.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-emerald-50/40 border border-emerald-100 text-xs text-slate-600 space-y-2 text-left">
                  <div className="flex items-start gap-2">
                    <span className="text-emerald-600 font-bold">✓</span>
                    <span>Cancelamento ou reagendamento até <strong>3 horas antes</strong>.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-emerald-600 font-bold">✓</span>
                    <span>Reembolso integral da reserva protegida.</span>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-600">
                  <span className="font-bold">Valor:</span>
                  <span className="font-bold text-slate-900">
                    R$ 9,90 por horário
                  </span>
                </div>

                <div className="flex flex-col gap-2 pt-1 font-sans">
                  <button
                    onClick={() => {
                      setReimbursementInsurance(true);
                      const details = getSelectedSlotDetails();
                      const updated: { [key: string]: boolean } = {};
                      details.forEach((d) => {
                        updated[d.key] = true;
                      });
                      setProtectedSlots(updated);
                      setHasModifiedProtection(true);
                      setShowProtectionDialog(false);
                      setTimeout(() => {
                        proceedWithBookingSubmit(true);
                      }, 50);
                    }}
                    className="w-full bg-emerald-600 hover:bg-emerald-650 text-white py-3 rounded-xl font-extrabold text-xs cursor-pointer shadow-md transition-all outline-none"
                  >
                    Adicionar Proteção
                  </button>

                  <button
                    onClick={() => {
                      setReimbursementInsurance(false);
                      setProtectedSlots({});
                      setProtectionModalScenario('cenario2');
                    }}
                    className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 rounded-xl font-bold text-xs cursor-pointer transition-colors"
                  >
                    Continuar sem Proteção
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* POLICY INFORMATIONAL MODAL */}
      {showPolicyModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-slate-200 shadow-xl relative space-y-4 animate-scale-up">
            <button 
              onClick={() => setShowPolicyModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-650 transition-all cursor-pointer p-1 rounded-full hover:bg-slate-100"
            >
              <X className="w-4 h-4" />
            </button>

            <span className="text-lg font-black text-slate-900 block flex items-center gap-2">
              🛡️ Regras da Proteção Flex
            </span>

            <div className="space-y-4 text-xs text-slate-600 leading-relaxed font-sans">
              <p>
                A <strong>Proteção Flex</strong> foi criada para dar total flexibilidade ao profissional de saúde diante de imprevistos ou remarcações de pacientes.
              </p>

              <div className="p-3 border rounded-xl bg-amber-50/50 border-amber-250 text-slate-700">
                <span className="font-bold text-[#b45309] block mb-1">⚠️ Sem Proteção Ativa</span>
                <p>
                  Cancelamentos grátis com reembolso integral se dão apenas com <strong>mais de 24 horas de antecedência</strong> do agendamento. Se precisar cancelar dentro do prazo crítico de 24 horas da consulta, o valor do aluguel da sala não será retornado.
                </p>
              </div>

              <div className="p-3 border rounded-xl bg-emerald-50/35 border-emerald-250 text-slate-700">
                <span className="font-bold text-[#047857] block mb-1">🛡️ Com Proteção Ativa (+R$ 9,90)</span>
                <p>
                  Ao adquirir o seguro opcional por horário, você tem a flexibilidade máxima de cancelar ou reagendar com reembolso integral até <strong>3 horas de antecedência</strong> da reserva!
                </p>
              </div>

              <p className="text-[10px] text-slate-400">
                * A taxa de proteção individual não é reembolsável após o pagamento.
              </p>
            </div>

            <button
              onClick={() => setShowPolicyModal(false)}
              className="w-full py-2.5 rounded-xl bg-secondary hover:bg-secondary/95 text-white font-bold text-xs cursor-pointer transition-all"
            >
              Entendi, voltar
            </button>
          </div>
        </div>
      )}

      {/* Success / Payment Modal Dialogue */}
      {isSuccessModalOpen && recentBookings.length > 0 && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 border border-outline-alt/40 shadow-2xl relative space-y-6 animate-scale-up my-8 max-h-[90vh] overflow-y-auto">
            
            {/* Close button inside modal header */}
            <button 
              onClick={() => setIsSuccessModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-150 transition-all border border-slate-200"
            >
              <X className="w-4 h-4" />
            </button>

            {!isPaid ? (
              // Step 1: Payment Checkout Page ("Finalizar sua Reserva")
              <div className="space-y-4">
                <div className="flex flex-col items-center text-center space-y-3">
                  <div className="w-14 h-14 rounded-full bg-amber-50 border border-amber-200 text-amber-500 flex items-center justify-center">
                    <CreditCard className="w-7 h-7" />
                  </div>
                  <h2 className="font-sans font-black text-2xl text-primary tracking-tight">
                    Finalizar sua Reserva
                  </h2>
                  <p className="font-sans text-brand-variant text-xs max-w-sm leading-relaxed">
                    Sua reserva temporária foi gerada com sucesso. Conclua o seu pagamento para garantir e ativar seus horários na clínica.
                  </p>
                </div>

                {/* Subtitle list of reserved spaces */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-150 space-y-2.5">
                  <span className="text-[10px] uppercase tracking-wider font-extrabold text-[#64748b] block">Resumo das Salas</span>
                  <div className="max-h-24 overflow-y-auto space-y-2 pr-1 text-xs">
                    {recentBookings.map((b, idx) => (
                      <div key={idx} className="flex justify-between items-start text-xs border-b border-dashed border-slate-200 pb-1.5 last:border-0 last:pb-0">
                        <div>
                          <span className="font-extrabold text-slate-800 block leading-tight">{b.roomName}</span>
                          <span className="text-[10px] text-slate-500">{b.date} • {(b.timeSlots || []).length}h ({(b.timeSlots || []).join(', ')})</span>
                        </div>
                        <span className="font-bold text-slate-900 shrink-0">R$ {(b.totalValue ?? 0).toFixed(2).replace('.', ',')}</span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 border-t border-slate-200 space-y-1">
                    {recentBookings.reduce((sum, b) => sum + ((b.totalValue ?? 0) - (b.timeSlots || []).length * (b.pricePerHour ?? 0)), 0) > 0 ? (
                      <div className="flex justify-between text-[11px] text-emerald-700 font-bold">
                        <span>🛡️ Taxa de Reembolso Flex (Inclusa)</span>
                        <span>R$ {recentBookings.reduce((sum, b) => sum + ((b.totalValue ?? 0) - (b.timeSlots || []).length * (b.pricePerHour ?? 0)), 0).toFixed(2).replace('.', ',')}</span>
                      </div>
                    ) : (
                      <div className="flex justify-between text-[11px] text-[#b45309] font-bold">
                        <span>⚠️ Sem Cobertura de Reembolso</span>
                        <span>R$ 0,00</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center pt-1.5">
                      <span className="font-extrabold text-[11px] text-primary">VALOR TOTAL DO PEDIDO:</span>
                      <span className="text-xl font-mono font-black text-secondary">
                        R$ {recentBookings.reduce((sum, b) => sum + (b.totalValue ?? 0), 0).toFixed(2).replace('.', ',')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Secure / Lock indicator */}
                <div className="flex items-center justify-center gap-1.5 text-[#64748b] text-[10px] uppercase font-bold tracking-wider">
                  <Lock className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Ambiente de pagamento 100% seguro</span>
                </div>

                {/* Mercado Pago API Integration Status Block */}
                <div className="bg-slate-50 border border-slate-200/60 p-4 rounded-3xl space-y-3.5 text-xs font-sans">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-[#111827] flex items-center gap-1.5 uppercase text-[10px] tracking-wider">
                      INTEGRAÇÃO OFICIAL MERCADO PAGO API
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-amber-100 text-amber-800 animate-pulse">
                      MODO TESTE / SANDBOX
                    </span>
                  </div>

                  <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200/40 text-amber-900 text-[11px] leading-relaxed">
                    <span className="font-bold block text-amber-950 mb-0.5">💡 Ambiente de Homologação Ativo</span>
                    Todos os pagamentos, assinaturas recorrentes e estornos parciais rodam sob regras de <strong>modo de teste</strong>. Nenhuma cobrança real será efetuada no seu cartão ou Pix real. Use os botões abaixo e dados sugestivos de teste com total segurança.
                  </div>
                  
                  {mpLoading ? (
                    <div className="flex items-center justify-center gap-2 text-slate-550 py-3.5 bg-white rounded-2xl border border-dashed border-slate-200">
                      <RefreshCw className="w-4 h-4 animate-spin text-secondary" />
                      <span className="font-bold">Gerando Preferência no Mercado Pago...</span>
                    </div>
                  ) : mpError ? (
                    <div className="text-red-500 font-bold py-2 px-3 bg-red-50 rounded-xl border border-red-200/45 text-center">
                      {mpError}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="space-y-1.5 text-xs p-3 bg-white rounded-2xl border border-slate-150">
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="text-[#64748b] font-medium">ID da Preferência:</span>
                          <span className="font-mono text-slate-800 font-black truncate max-w-[200px] bg-slate-100 px-1.5 py-0.5 rounded">
                            {mpPreferenceId || 'Simulação de Sandbox'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="text-[#64748b] font-medium">Método Disponibilizado:</span>
                          <span className="font-bold text-slate-800">Pix & Cartão (Estorno Ativo)</span>
                        </div>
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="text-[#64748b] font-medium">Fluxo Integrado:</span>
                          <span className="text-emerald-700 font-extrabold uppercase text-[10px]">Página Segura (Sandbox)</span>
                        </div>
                      </div>
                      
                      {mpInitPoint && (
                        <div className="space-y-1.5">
                          <a 
                            href={mpInitPoint} 
                            target="_blank" 
                            rel="noreferrer"
                            className="bg-sky-500 hover:bg-sky-600 text-white font-extrabold text-center block py-4 px-4 rounded-2xl transition duration-150 shadow-lg shadow-sky-150/40 flex items-center justify-center gap-2.5 cursor-pointer text-xs uppercase tracking-wider"
                          >
                            <span>🛒</span> Abrir Checkout de Teste (Mercado Pago)
                          </a>
                          <span className="text-[10px] leading-relaxed font-semibold text-[#64748b] block text-center">
                            Clique acima para conferir o comportamento do Gateway da API em homologação.
                          </span>
                        </div>
                      )}

                      {/* Expandable JSON payload block */}
                      <details className="bg-white border border-slate-200 rounded-2xl p-2.5 transition">
                        <summary className="cursor-pointer font-bold select-none text-slate-650 py-0.5 px-1 hover:text-slate-900 text-[11px] list-none flex items-center justify-between">
                          <span>📦 Ver JSON da Preferência do Mercado Pago</span>
                          <span className="text-[10px] text-slate-400">Expandir +</span>
                        </summary>
                        <pre className="p-3 bg-slate-900 text-[10px] text-emerald-400 rounded-xl overflow-x-auto mt-2 max-h-44 text-left font-mono">
{JSON.stringify({
  preference_id: mpPreferenceId,
  init_point: mpInitPoint,
  status: "sandbox_test_mode",
  payer: {
    email: 'scjorge1908@gmail.com',
    name: professionalName || 'Dr(a). Visitante'
  },
  items: recentBookings.map(b => ({
    title: `Sublocação: ${b.roomName}`,
    unit_price: b.totalValue,
    quantity: 1
  }))
}, null, 2)}
                        </pre>
                      </details>
                    </div>
                  )}
                </div>

                {/* Interactive Method Tabs */}
                <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setSelectedPaymentMethod('pix')}
                    className={`py-2 rounded-lg text-xs font-black font-sans transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      selectedPaymentMethod === 'pix' 
                        ? 'bg-primary text-white shadow-sm' 
                        : 'bg-transparent text-slate-600 hover:text-slate-800'
                    }`}
                  >
                    <span>🎯</span> Pagar com PIX
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedPaymentMethod('card')}
                    className={`py-2 rounded-lg text-xs font-black font-sans transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      selectedPaymentMethod === 'card' 
                        ? 'bg-primary text-white shadow-sm' 
                        : 'bg-transparent text-slate-600 hover:text-slate-800'
                    }`}
                  >
                    <span>💳</span> Cartão de Crédito
                  </button>
                </div>

                {/* Render Payment Method Form */}
                {selectedPaymentMethod === 'pix' ? (
                  // PIX interface
                  <div className="space-y-4 animate-fade-in">
                    <div className="flex flex-col items-center bg-[#ebfbf3] p-4 rounded-2xl border border-emerald-100 space-y-3.5">
                      {/* Generates a nice Simulated Pix QR Code design */}
                      <div className="relative p-2 bg-white rounded-xl border border-slate-200 shadow-xs">
                        <div className="w-32 h-32 bg-slate-55 flex items-center justify-center rounded-lg border-2 border-dashed border-slate-300 relative overflow-hidden">
                          {/* Inner simulated QR details */}
                          <div className="absolute inset-2 grid grid-cols-4 gap-1 opacity-60">
                            {Array.from({ length: 16 }).map((_, i) => (
                              <div key={i} className={`rounded-xs ${i % 3 === 0 || i % 5 === 0 ? 'bg-slate-800' : 'bg-transparent'}`} />
                            ))}
                          </div>
                          <div className="absolute w-8 h-8 bg-white border border-slate-350 rounded-lg flex items-center justify-center text-[10px] font-black text-secondary shadow-xs">
                            PIX
                          </div>
                        </div>
                      </div>

                      <div className="text-center space-y-1 p-1 w-full">
                        <span className="text-[10px] text-slate-500 uppercase tracking-widest font-extrabold block">Chave Copia e Cola</span>
                        <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 max-w-sm mx-auto">
                          <input 
                            type="text" 
                            readOnly 
                            value="00020126360014br.gov.bcb.pix01140493667977aistudio2026"
                            className="bg-transparent font-mono text-[9px] text-slate-600 py-1 px-2 select-all focus:outline-none flex-1 truncate"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText("00020126360014br.gov.bcb.pix01140493667977aistudio2026");
                              setPixCopied(true);
                              setTimeout(() => setPixCopied(false), 2000);
                            }}
                            className="bg-slate-100 hover:bg-slate-250 p-2 rounded-lg text-slate-600 hover:text-slate-900 transition-all border shrink-0"
                          >
                            {pixCopied ? <span className="text-[10px] font-bold text-emerald-600 px-1">Copiado!</span> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>

                      <span className="block text-center text-slate-500 text-[10px] font-semibold leading-relaxed px-2">
                        💡 Abra o aplicativo do seu banco, acesse a opção Pix Copia e Cola e conclua seu pagamento.
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setPaymentLoading(true);
                        setTimeout(() => {
                          setPaymentLoading(false);
                          handleCompletePayment(recentBookings);
                        }, 1300);
                      }}
                      disabled={paymentLoading}
                      className="w-full bg-[#059669] hover:bg-[#059669]/95 text-white py-4 rounded-xl font-sans font-bold text-sm tracking-wide shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {paymentLoading ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Verificando seu Pix...</span>
                        </>
                      ) : (
                        <span>✓ Já fiz o pagamento Pix!</span>
                      )}
                    </button>
                  </div>
                ) : (
                  // Credit Card Interface
                  <div className="space-y-3 animate-fade-in text-left">
                    <div className="space-y-1">
                      <label className="block text-[10px] font-black text-[#64748b] uppercase tracking-wider">Nome no Cartão</label>
                      <input 
                        type="text" 
                        value={cardHolder}
                        onChange={(e) => setCardHolder(e.target.value)}
                        placeholder="Dr(a). Nome do Titular" 
                        className="w-full text-xs font-sans p-2.5 rounded-xl border border-slate-250 focus:border-primary focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[10px] font-black text-[#64748b] uppercase tracking-wider">Número do Cartão</label>
                      <input 
                        type="text" 
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        placeholder="0000 0000 0000 0000" 
                        className="w-full text-xs font-sans p-2.5 rounded-xl border border-slate-250 focus:border-primary focus:outline-none"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="block text-[10px] font-black text-[#64748b] uppercase tracking-wider">Validade</label>
                        <input 
                          type="text" 
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(e.target.value)}
                          placeholder="MM/AA" 
                          className="w-full text-xs font-sans p-2.5 rounded-xl border border-slate-250 focus:border-primary focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-[10px] font-black text-[#64748b] uppercase tracking-wider">CVV</label>
                        <input 
                          type="text" 
                          value={cardCvv}
                          onChange={(e) => setCardCvv(e.target.value)}
                          placeholder="123" 
                          className="w-full text-xs font-sans p-2.5 rounded-xl border border-slate-250 focus:border-primary focus:outline-none"
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setPaymentLoading(true);
                        setTimeout(() => {
                          setPaymentLoading(false);
                          handleCompletePayment(recentBookings);
                        }, 1300);
                      }}
                      disabled={paymentLoading || !cardHolder || !cardNumber}
                      className="w-full bg-primary hover:bg-primary/95 text-white py-4 rounded-xl font-sans font-bold text-sm tracking-wide shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {paymentLoading ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Processando Cartão Seguro...</span>
                        </>
                      ) : (
                        <span>Pagar R$ {recentBookings.reduce((sum, b) => sum + (b.totalValue ?? 0), 0).toFixed(2).replace('.', ',')}</span>
                      )}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              // Step 2: Payment Confirmed Success Screen ("PAGAMENTO CONFIRMADO")
              <div className="space-y-5 flex flex-col items-center text-center py-4">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center animate-bounce">
                  <Check className="w-10 h-10" />
                </div>
                
                <div className="space-y-2">
                  <span className="bg-emerald-100 border border-emerald-350 text-emerald-800 font-extrabold px-3 py-1 rounded-full text-[10px] tracking-wider uppercase animate-pulse">
                    PAGAMENTO CONFIRMADO 🎉
                  </span>
                  <h2 className="font-sans font-extrabold text-2xl text-slate-900 tracking-tight">
                    Reserva Concluída com Sucesso!
                  </h2>
                  <p className="font-sans text-brand-variant text-sm max-w-sm leading-relaxed">
                    Excelente doutor(a)! Seu pagamento foi detectado com sucesso e os bloqueios de hora na clínica de Palhoça já estão ativos no seu Painel.
                  </p>
                </div>

                <div className="border border-slate-150 p-4 bg-slate-50 rounded-2xl w-full text-xs divide-y divide-slate-200 space-y-2">
                  <div className="pb-1.5 flex justify-between">
                    <span className="text-[#64748b] font-bold">Comprovante de Operação:</span>
                    <span className="font-mono text-slate-800 font-black">#REC-{Date.now().toString().slice(-6)}</span>
                  </div>
                  <div className="py-1.5 flex justify-between">
                    <span className="text-[#64748b] font-bold">Salas Sublocadas:</span>
                    <span className="text-slate-850 font-bold">{recentBookings.length} consultório(s) ao todo</span>
                  </div>
                  <div className="pt-2 flex justify-between items-center text-sm font-extrabold">
                    <span className="text-slate-900">Total Pago:</span>
                    <span className="font-mono text-[#059669] font-black text-base">
                      R$ {recentBookings.reduce((sum, b) => sum + (b.totalValue ?? 0), 0).toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                </div>

                <div className="w-full pt-3">
                  {/* Ir para o Painel Profissional button available as requested once checkout is finalized */}
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="w-full bg-primary hover:bg-primary/95 text-white py-4 rounded-xl font-sans font-bold text-sm tracking-wide shadow-md transition-all cursor-pointer hover:shadow-lg"
                  >
                    Ir para o Painel Profissional
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* PERSUASIVE REFUND FEE ADVISORY MODAL (HIGHLY COMMERCIAL INFO CARD) */}
      {showRefundSuggestionModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-xl w-full p-8 border-2 border-amber-400 shadow-2xl relative space-y-6 animate-scale-up overflow-hidden">
            {/* Visual Accent Badge */}
            <div className="absolute top-0 right-0 bg-amber-400 text-slate-950 text-[10px] font-black uppercase tracking-wider px-5 py-2 rounded-bl-2xl">
              ALERTA DE DESISTÊNCIA
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-500 shrink-0">
                  <AlertCircle className="w-7 h-7" />
                </div>
                <div>
                  <span className="block text-[10px] uppercase font-bold tracking-widest text-amber-800 font-mono">Dica Comercial de Sublocação</span>
                  <h3 className="font-sans font-black text-2xl text-slate-900 leading-tight">
                    Sua reserva está sem nenhuma proteção de Reembolso!
                  </h3>
                </div>
              </div>

              <p className="text-sm text-slate-700 leading-relaxed font-sans">
                Você sabia que <strong className="text-amber-900 font-extrabold bg-amber-50/70 px-1 py-0.5 rounded">mais de 60% dos pacientes cancelam ou desistem</strong> nas primeiras sessões de tratamento? Entenda como funciona a regra de reembolsos:
              </p>

              {/* Loss vs Save Demonstration Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                {/* Without protections */}
                <div className="p-4 rounded-2xl border border-red-150 bg-red-50/40 space-y-2">
                  <span className="block font-sans font-extrabold text-xs text-red-700">
                    ❌ SEM TAXA DE REEMBOLSO
                  </span>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Se você precisar cancelar <strong className="text-red-700">dentro de 24 horas</strong> da sua consulta, <span className="font-bold underline text-red-700">o valor de sublocação não é retornado</span>. Sem a taxa, o cancelamento gratuito só é válido se feito antes de 24 horas do atendimento.
                  </p>
                  <div className="pt-2 border-t border-red-100/65">
                    <span className="block text-[9px] uppercase font-bold text-slate-400">Risco no prazo crítico:</span>
                    <span className="font-black text-sm text-red-600 font-mono">
                      Perda de R$ {(calculateTotalValue() ?? 0).toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                </div>

                {/* With protections */}
                <div className="p-4 rounded-2xl border border-emerald-250 bg-emerald-50/70 space-y-2 relative ring-4 ring-emerald-100/60">
                  <span className="block font-sans font-extrabold text-xs text-emerald-800">
                    🛡️ COM TAXA DE REEMBOLSO
                  </span>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Teve imprevistos de última hora? Com a taxa flex ativa, você pode cancelar com até <strong className="text-[#059669]">3 horas de antecedência</strong> da consulta e receber 100% de reembolso de volta!
                  </p>
                  <div className="pt-2 border-t border-emerald-200">
                    <span className="block text-[9px] uppercase font-bold text-slate-400">Custo Total da Proteção:</span>
                    <span className="font-extrabold text-sm text-emerald-700 font-mono">
                      R$ {((activeProtectedSlotsCount > 0 ? activeProtectedSlotsCount : (totalReservedSlotsCount || 0)) * 9.90).toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Informative commercial point */}
              <div className="bg-[#fcf8e3] border border-[#fbeed5] p-4 rounded-2xl text-xs space-y-1">
                <span className="font-extrabold text-amber-900 block">💡 Regra Prática de Cancelamento:</span>
                <p className="text-amber-850 leading-relaxed">
                  Sem proteção, cancele apenas com <strong className="text-slate-900">mais de 24h</strong> de antecedência para reaver o dinheiro. Com proteção ativa, você tem a flexibilidade máxima para cancelar até <strong className="text-slate-900">3h antes</strong> do horário agendado!
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 pt-2">
              <button
                onClick={() => {
                  setReimbursementInsurance(true);
                  setShowRefundSuggestionModal(false);
                  setTimeout(() => {
                    handleConfirmWithProtection();
                  }, 50);
                }}
                className="w-full bg-emerald-600 hover:bg-emerald-600/95 text-white py-4 px-6 rounded-2xl font-sans font-black text-sm tracking-wide shadow-lg shadow-emerald-700/10 flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-101"
              >
                <span>🛡️ Ativar Taxa de Reembolso (+R$ {((totalReservedSlotsCount || 0) * 9.90).toFixed(2).replace('.', ',')} - Recomendado)</span>
              </button>
              
              <button
                onClick={() => {
                  setShowRefundSuggestionModal(false);
                  handleConfirmWithoutProtectionCheck();
                }}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 py-3 rounded-xl font-sans font-bold text-xs cursor-pointer transition-colors"
              >
                Não, prefiro correr o risco e continuar sem proteção
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Guest Block Login Modal */}
      {showAuthRequiredModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-8 border border-outline-alt/40 shadow-2xl text-center space-y-6 animate-scale-up">
            <div className="w-16 h-16 bg-secondary/15 text-secondary flex items-center justify-center mx-auto rounded-full">
              <LogIn className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h3 className="font-sans font-extrabold text-2xl text-primary tracking-tight">Acesso Registrado</h3>
              <p className="font-sans text-brand-variant text-xs leading-relaxed">
                Para reservar os horários das salas, você precisa fazer login com seu registro profissional. Com sua conta ativa, todos os agendamentos são sincronizados e gerenciados facilmente.
              </p>
            </div>
            <div className="flex flex-col gap-2.5 pt-2">
              <button
                onClick={() => {
                  setShowAuthRequiredModal(false);
                  setView('register-login'); 
                }}
                className="w-full bg-secondary hover:bg-secondary/95 text-white py-3 rounded-xl font-sans font-bold text-xs transition-all cursor-pointer"
              >
                Acessar Minha Conta (Fazer Login)
              </button>
              <button
                onClick={() => {
                  setShowAuthRequiredModal(false);
                  setView('register-signup');
                }}
                className="w-full bg-slate-100 text-primary hover:bg-slate-200 py-3 rounded-xl font-sans font-bold text-xs transition-all cursor-pointer"
              >
                Criar Nova Conta de Profissional
              </button>
              <button
                onClick={() => setShowAuthRequiredModal(false)}
                className="text-xs font-semibold text-brand-variant hover:underline cursor-pointer block pt-1"
              >
                Voltar à consulta de horários
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
