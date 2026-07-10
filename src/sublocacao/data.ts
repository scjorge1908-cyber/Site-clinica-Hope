import { Room, AdminSettings } from './types';

export const INITIAL_ROOMS: Room[] = [
  {
    id: 'room-a04',
    name: 'Consultório A04 - Terapia',
    type: 'premium',
    pricePerHour: 30,
    rating: 4.9,
    size: '15m²',
    capacity: 'Até 3 pessoas',
    location: 'Av. Barão do Rio Branco, 150 - Centro, Palhoça - SC',
    description: 'Um espaço de atendimento psicoterapêutico acolhedor, mobiliado com poltronas confortáveis, iluminação suave, plantas tranquilizadoras e isolamento acústico de alto padrão.',
    images: [
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBEA5kcWz6rbF7fVL_dVyf4kNliZh8hHnoTBjUNP-IqEaUPjRkWwbmMiVLt0-qmPlAPb3WEBZnuKKxtPPdeGGyuE_itqi6_ADsV6lfhB-fI-90aTCt_Kyju8NQXl4klyixYzoi2wZ9JjTPioHfHvMoc5a5FtygotQs05VASNttBMqHVm6ehI5O4Z4R2xHI1I4FcB8tiWzzVTW8agz70qJ57GdPnq75ElzCPEckGi-yYNWCFvqxTKKYq9S-f0Srazuq69vYW1Xa02jA',
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAoW3_3-lK3ixFkeSUuv13KklvQeADvFsiWG-M2JXqkPo3zc351XK-v-QY5B6WZhMFYcdux00x9OQx8JQ3t81CRSw19hEzWMubmMom5eMM-9Jwz14jeGfJBQe8fV4f5h3ioRQdGt2JHH92cElgmq9VuAOcTw7-9w7x1_cltDMQPUqRRNV5kEMi9GPzjkXYtGddkTSaSfaEtayWZ4p31vYarH7bg2go2QjYVqVzV4JvlyzqGLQH-dZynak73vV5-YBhcm0oWpMxUf0w',
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCdpXHREN-QWcd67D_wGIJbs3ugwHlEy92X1GdvLbhbJMPteWIosVN4tyn0mJAujV_MLqr4wf5hr1_xLhKQ0gMkx42oheij2O3qt1iuVl5zYdks49Fe2Inscf1_J6MizfqEFmFSAbKUgRNJ3tSOdD9R0SsTXsP6PSHjz7Bu0Ma0EHo1CdP1ETtTVyVNOgh-bPgDOaWP4htLDgTeMQj4kfJyBz_rf8jR1zGNgKxKYL4ApQJXmNusdgGEysPn3ayKu7g8hZzJq9-quj8'
    ],
    features: ['📶 Wi-Fi', '☕ Copa', '❄️ Climatizado', '🔇 Acústico', '🛎️ Recepção']
  },
  {
    id: 'room-01',
    name: 'Sala Multidisciplinar Premium',
    type: 'standard',
    pricePerHour: 30,
    rating: 4.8,
    size: '15m²',
    capacity: 'Até 3 pessoas',
    location: 'R. José Maria da Luz, 2800 - Centro, Palhoça - SC',
    description: 'Equipada com poltrona confortável para psicólogos, maca higienizável para nutricionistas e balança. Ampla luminosidade natural e decoração biofílica tranquila.',
    images: [
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBq8jn8GNPvhb_gIC4xr06rraY39VlEUEH-0vSJU6AYujIG9DPkiUF1zqgzTX4ed3d_R2wOdBXRkiOMI1Y9BO9LzgJkVhgoETydsTV8dowqy_Z9JNSoh_SiVLn0ilBjJowhkrFI_0mgfjbkVy-Qq32p4dqZVc0fNwPvvGoy_Z8ShEwGo0oyYQgb5AdRSb09mKV_O1pwN0N-wglRmLTKXEAy6PFRZCkL8A7B8oN3s_OrsOv7CY8nPWXlcPeRWSvDO5P2k_UvMbJ51tU',
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAoW3_3-lK3ixFkeSUuv13KklvQeADvFsiWG-M2JXqkPo3zc351XK-v-QY5B6WZhMFYcdux00x9OQx8JQ3t81CRSw19hEzWMubmMom5eMM-9Jwz14jeGfJBQe8fV4f5h3ioRQdGt2JHH92cElgmq9VuAOcTw7-9w7x1_cltDMQPUqRRNV5kEMi9GPzjkXYtGddkTSaSfaEtayWZ4p31vYarH7bg2go2QjYVqVzV4JvlyzqGLQH-dZynak73vV5-YBhcm0oWpMxUf0w',
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCdpXHREN-QWcd67D_wGIJbs3ugwHlEy92X1GdvLbhbJMPteWIosVN4tyn0mJAujV_MLqr4wf5hr1_xLhKQ0gMkx42oheij2O3qt1iuVl5zYdks49Fe2Inscf1_J6MizfqEFmFSAbKUgRNJ3tSOdD9R0SsTXsP6PSHjz7Bu0Ma0EHo1CdP1ETtTVyVNOgh-bPgDOaWP4htLDgTeMQj4kfJyBz_rf8jR1zGNgKxKYL4ApQJXmNusdgGEysPn3ayKu7g8hZzJq9-quj8'
    ],
    features: ['📶 Wi-Fi', '☕ Copa', '❄️ Climatizado', '🔇 Acústico', '🛎️ Recepção', '🚻 Banheiro']
  },
  {
    id: 'room-02',
    name: 'Consultório Executivo Luxo',
    type: 'executivo_luxo',
    pricePerHour: 45,
    rating: 5.0,
    size: '20m²',
    capacity: 'Até 4 pessoas',
    location: 'Av. Atílio Pedro Pagani, 850 - Pagani, Palhoça - SC',
    description: 'Espaço requintado para consultas médicas, psiquiatria de alto padrão ou mediação. Acabamento em madeira nobre, ar-condicionado central de máxima pureza.',
    images: [
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCo2z5GMq-0g_g1vxt7HMApV-_U44FOK5fZ0kXm4d5GERjOTe_lfQWCLFA5a3YuzZBH4jHg-sg-GSSTMaelqe0U0LVIeTcvhxCj_FELp3rCzOkmmI1Of3wyl3RDw3J33HkKYuNvOzGmBvVblVOtmnbOPH146W63Lx5H-G-e4gF0CM1806R0EKsbjv2P8N9EhqEpA-VDzhw8IXCA4LCsXHbkYcAfyWH7wp23lT6UJfNMsMWDoYzISLuCerVPDh5kf7RhI1Tt6oygaBE',
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDSOAn5HZyu7WEqYVFBOzzoPHvuwBHFTTZcZBnx8uYIZq5kAX0ZG_p-ofJYSTLaYK0HwreNWa0vC7sU2l8zb358cOaeRVzLhrKbOBdCv1xmK62nHSqlA9tb8w1CXAb8thw1nQPTxqbGYXH0ZKS8k7ATUygNSCzXtfRK4YBcEerJbZY7Nz50qdqln5LigsKVBa8OM0QFPWLcw8GDa9y3jIrpi4f7YX-St_j4NDZyT8vSFM5-g0JnR0TT9eEyep-7RiZCOzuyBXOK0Mk',
      'https://lh3.googleusercontent.com/aida-public/AB6AXuA7objypSuPMQ70F_1fIq62_q7V8FxXQFkKSaGr7KwG-ABO72DUUIljciACxJ1W2hWwtyBmavSsx8EVgcnsrDFl7SRAYsmwE6KkGhhx71uLb8-4TMvSTdQ_ur4-IC4fz2PN5PwrzhRC-S-UblbNSK4u1PTAO8-j1j-cV3mStLIG-mdcQX2W-mHD2LtlzY3rORgcnKLmLT2sPA9caTIvZe61IkYHvyv9-oDlUjAvCfwSa5FAa4pYRpark3fc-kH8l6BroblVKTjApRQ'
    ],
    features: ['📶 Wi-Fi', '☕ Copa', '🚗 Estacionamento', '❄️ Climatizado', '🔇 Acústico', '🛎️ Recepção', '🛗 Elevador']
  },
  {
    id: 'room-03',
    name: 'Consultório B05 - Psicopedagogia',
    type: 'standard',
    pricePerHour: 32,
    rating: 4.8,
    size: '14m²',
    capacity: 'Até 3 pessoas',
    location: 'R. José Maria da Luz, 2800 - Centro, Palhoça - SC',
    description: 'Ambiente aconchegante focado no atendimento infantil e juvenil. Mobiliado com mesa de atividades, brinquedos lúdicos de estimulação pedagógica e tatame emborrachado opcional.',
    images: [
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCpK_ydxVzclnmYMUAi0fsi4DzKI6JXpLmaD9G4jAA8rUDn6AyhwunUa4UddC_1JNYOekP_W2E3pKLnY14-QXm8nN9PhbUkw2T4tMo4n__v_aOuyEIuudaAeqR3IjtbOc3sKmovzJxlZF0_oLpSFqedv8UtqQPeoiR0TfKXgeDNA54dq6ZO_jVXIxUrPJbJnuDZXE8mtKjhRPaiyRxL1eG9phYCM4C3JrjDNRuBP1ov_16x1MXzql6-d_L4wU6RMKkt6WcTJNBkYDQ',
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAoW3_3-lK3ixFkeSUuv13KklvQeADvFsiWG-M2JXqkPo3zc351XK-v-QY5B6WZhMFYcdux00x9OQx8JQ3t81CRSw19hEzWMubmMom5eMM-9Jwz14jeGfJBQe8fV4f5h3ioRQdGt2JHH92cElgmq9VuAOcTw7-9w7x1_cltDMQPUqRRNV5kEMi9GPzjkXYtGddkTSaSfaEtayWZ4p31vYarH7bg2go2QjYVqVzV4JvlyzqGLQH-dZynak73vV5-YBhcm0oWpMxUf0w',
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCdpXHREN-QWcd67D_wGIJbs3ugwHlEy92X1GdvLbhbJMPteWIosVN4tyn0mJAujV_MLqr4wf5hr1_xLhKQ0gMkx42oheij2O3qt1iuVl5zYdks49Fe2Inscf1_J6MizfqEFmFSAbKUgRNJ3tSOdD9R0SsTXsP6PSHjz7Bu0Ma0EHo1CdP1ETtTVyVNOgh-bPgDOaWP4htLDgTeMQj4kfJyBz_rf8jR1zGNgKxKYL4ApQJXmNusdgGEysPn3ayKu7g8hZzJq9-quj8'
    ],
    features: ['📶 Wi-Fi', '🧸 Espaço Infantil', '❄️ Climatizado', '🔇 Acústico', '🚻 Banheiro']
  },
  {
    id: 'room-04',
    name: 'Sala C02 - Nutrição & Fisiologia',
    type: 'premium',
    pricePerHour: 35,
    rating: 4.9,
    size: '16m²',
    capacity: 'Até 2 pessoas',
    location: 'Av. Atílio Pedro Pagani, 850 - Pagani, Palhoça - SC',
    description: 'Espaço focado em bem-estar físico e nutrição de precisão. Equipado com balança de bioimpedância de última geração, mesa de anamnese ampla e decoração minimalista.',
    images: [
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBYpkVQC9cbGbgrCwOC07691oydQzzkmrg5ycT5gVm8MJJwp6i1lDXuxOinHgGQYQdnMmSNexaULk18N0QLAqmdvzGmSD5gACGOMZjNgw6iicIkm8TNkx3EcyjRbp3wF60dzA4EMcXAnFAIqtOQ8W8p0ejTMhvDHsxM-SgBV1Pd3b37F4FO3xZRepqvsT62L1LlYORn8BSeiwbHkwHfVhm90JhYCVw-Zwv4wyNIEEopQaQZH4cVK6aSoNWQoNCftsaV8zAjhO4vAzb',
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAoW3_3-lK3ixFkeSUuv13KklvQeADvFsiWG-M2JXqkPo3zc351XK-v-QY5B6WZhMFYcdux00x9OQx8JQ3t81CRSw19hEzWMubmMom5eMM-9Jwz14jeGfJBQe8fV4f5h3ioRQdGt2JHH92cElgmq9VuAOcTw7-9w7x1_cltDMQPUqRRNV5kEMi9GPzjkXYtGddkTSaSfaEtayWZ4p31vYarH7bg2go2QjYVqVzV4JvlyzqGLQH-dZynak73vV5-YBhcm0oWpMxUf0w',
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCdpXHREN-QWcd67D_wGIJbs3ugwHlEy92X1GdvLbhbJMPteWIosVN4tyn0mJAujV_MLqr4wf5hr1_xLhKQ0gMkx42oheij2O3qt1iuVl5zYdks49Fe2Inscf1_J6MizfqEFmFSAbKUgRNJ3tSOdD9R0SsTXsP6PSHjz7Bu0Ma0EHo1CdP1ETtTVyVNOgh-bPgDOaWP4htLDgTeMQj4kfJyBz_rf8jR1zGNgKxKYL4ApQJXmNusdgGEysPn3ayKu7g8hZzJq9-quj8'
    ],
    features: ['📶 Wi-Fi', '☕ Copa', '❄️ Climatizado', '🔇 Acústico', '📹 Videoconferência']
  },
  {
    id: 'room-05',
    name: 'Consultório Clínico Essencial E01',
    type: 'standard',
    pricePerHour: 28,
    rating: 4.7,
    size: '13m²',
    capacity: 'Até 2 pessoas',
    location: 'Av. Barão do Rio Branco, 150 - Centro, Palhoça - SC',
    description: 'Ideal para profissionais que necessitam de praticidade máxima e ótimo custo-benefício. Perfeito para psiquiatras e terapeutas com foco em conversação e anamnese.',
    images: [
      'https://lh3.googleusercontent.com/aida-public/AB6AXuC8xbfc0NAOHli8Bo-UPhayVSalcMdm3gsiNyDJWDfukJC1pa3EvIp0rq5LcyG8B098J8CjE2PvON36hkHBBWGLLGD-qeYrBGOtbSNo_ckJcfsaJtMHkhF3PWmevxUdvtD-NpFC741KculCj8aycAvABWcYGfLSefqnIRw7UwGxZAG3lxqLPvVmD0IwPvQ1fbd9emT_1dW3n-86619GkuP62zjRvGDjk2VHz4jHUAFiaWVOpoCvBV-X5m_PPp0GSaPRkzH1J3_ypFc',
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAoW3_3-lK3ixFkeSUuv13KklvQeADvFsiWG-M2JXqkPo3zc351XK-v-QY5B6WZhMFYcdux00x9OQx8JQ3t81CRSw19hEzWMubmMom5eMM-9Jwz14jeGfJBQe8fV4f5h3ioRQdGt2JHH92cElgmq9VuAOcTw7-9w7x1_cltDMQPUqRRNV5kEMi9GPzjkXYtGddkTSaSfaEtayWZ4p31vYarH7bg2go2QjYVqVzV4JvlyzqGLQH-dZynak73vV5-YBhcm0oWpMxUf0w',
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCdpXHREN-QWcd67D_wGIJbs3ugwHlEy92X1GdvLbhbJMPteWIosVN4tyn0mJAujV_MLqr4wf5hr1_xLhKQ0gMkx42oheij2O3qt1iuVl5zYdks49Fe2Inscf1_J6MizfqEFmFSAbKUgRNJ3tSOdD9R0SsTXsP6PSHjz7Bu0Ma0EHo1CdP1ETtTVyVNOgh-bPgDOaWP4htLDgTeMQj4kfJyBz_rf8jR1zGNgKxKYL4ApQJXmNusdgGEysPn3ayKu7g8hZzJq9-quj8'
    ],
    features: ['📶 Wi-Fi', '☕ Copa', '❄️ Climatizado', '🚻 Banheiro']
  }
];

export const INITIAL_ADMIN_SETTINGS: AdminSettings = {
  appScriptId: 'AKfycbzyX2H8fVL_dVyf4kNliZh8hHnoTBjUN',
  publicKey: 'pk_live_51MszB4FS3G67R8F7fVL9dwZybV89RB',
  webhookSecret: 'whsec_7gN8P_Ji4V2pu7G13CZ-IswxIg',
  isProductionMode: true,
  tableOfPrices: {
    standard: 45,
    premium: 75,
    auditorium: 280,
    executivo_luxo: 120
  },
  heroTitle: 'O ambiente ideal para seus atendimentos.',
  heroDescription: 'Ambientes multidisciplinares preparados para o seu atendimento. Reduza custos fixos e foque no que realmente importa: seus pacientes.',
  galleryImages: [
    'https://lh3.googleusercontent.com/aida-public/AB6AXuC8xbfc0NAOHli8Bo-UPhayVSalcMdm3gsiNyDJWDfukJC1pa3EvIp0rq5LcyG8B098J8CjE2PvON36hkHBBWGLLGD-qeYrBGOtbSNo_ckJcfsaJtMHkhF3PWmevxUdvtD-NpFC741KculCj8aycAvABWcYGfLSefqnIRw7UwGxZAG3lxqLPvVmD0IwPvQ1fbd9emT_1dW3n-86619GkuP62zjRvGDjk2VHz4jHUAFiaWVOpoCvBV-X5m_PPp0GSaPRkzH1J3_ypFc',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuBYpkVQC9cbGbgrCwOC07691oydQzzkmrg5ycT5gVm8MJJwp6i1lDXuxOinHgGQYQdnMmSNexaULk18N0QLAqmdvzGmSD5gACGOMZjNgw6iicIkm8TNkx3EcyjRbp3wF60dzA4EMcXAnFAIqtOQ8W8p0ejTMhvDHsxM-SgBV1Pd3b37F4FO3xZRepqvsT62L1LlYORn8BSeiwbHkwHfVhm90JhYCVw-Zwv4wyNIEEopQaQZH4cVK6aSoNWQoNCftsaV8zAjhO4vAz8'
  ],
  showGallery: true,
  revenueTotalMonth: 14250,
  newBookingsCount: 48,
  occupancyRate: 76,
  heroImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCpK_ydxVzclnmYMUAi0fsi4DzKI6JXpLmaD9G4jAA8rUDn6AyhwunUa4UddC_1JNYOekP_W2E3pKLnY14-QXm8nN9PhbUkw2T4tMo4n__v_aOuyEIuudaAeqR3IjtbOc3sKmovzJxlZF0_oLpSFqedv8UtqQPeoiR0TfKXgeDNA54dq6ZO_jVXIxUrPJbJnuDZXE8mtKjhRPaiyRxL1eG9phYCM4C3JrjDNRuBP1ov_16x1MXzql6-d_L4wU6RMKkt6WcTJNBkYDQ',
  landingRoomsHeading: 'Locação flexível com alto padrão',
  landingRoomsSub: 'Encontre salas equipadas que transmitem credibilidade e acolhimento para o seu paciente.',
  bookingRoomsHeading: 'Disponibilidade de horário.',
  trustTitle: '97 Profissionais Credenciados',
  trustDesc: 'Confiam na sublocaHope diariamente para sua rotina de atendimentos.',
  plan1Title: 'Reserva Avulsa',
  plan1Subtitle: 'Uso Esporádico',
  plan1Desc: 'Para quem atende sob demanda programada ou eventuais retornos.',
  plan1PriceSuffix: 'A partir de',
  plan1Price: '35',
  plan2Title: '16 Horas Mensais',
  plan2Subtitle: 'Pacote Profissional',
  plan2Desc: 'Ideal para profissionais com clientes recorrentes fixos no mês.',
  plan2PriceSuffix: 'Valor fixo mensal',
  plan2Price: '480'
};

export interface DayTab {
  dayName: string;
  dayNum: string;
  fullDate: string;
  disabled?: boolean;
}

export const DAYS_LIST: DayTab[] = [
  { dayName: 'SEG', dayNum: '13', fullDate: 'Segunda-feira, 13 de Junho' },
  { dayName: 'TER', dayNum: '14', fullDate: 'Terça-feira, 14 de Junho' },
  { dayName: 'QUA', dayNum: '15', fullDate: 'Quarta-feira, 15 de Junho' },
  { dayName: 'QUI', dayNum: '16', fullDate: 'Quinta-feira, 16 de Junho' },
  { dayName: 'SEX', dayNum: '17', fullDate: 'Sexta-feira, 17 de Junho' },
  { dayName: 'SAB', dayNum: '18', fullDate: 'Sábado, 18 de Junho', disabled: true },
  { dayName: 'DOM', dayNum: '19', fullDate: 'Domingo, 19 de Junho', disabled: true }
];

export const TIME_SLOTS = [
  { time: '07:00', reserved: false },
  { time: '08:00', reserved: true },
  { time: '09:00', reserved: false },
  { time: '10:00', reserved: false },
  { time: '11:00', reserved: true },
  { time: '12:00', reserved: false },
  { time: '13:00', reserved: false },
  { time: '14:00', reserved: false },
  { time: '15:00', reserved: false },
  { time: '16:00', reserved: true },
  { time: '17:00', reserved: false },
  { time: '18:00', reserved: false }
];
