import { Specialist, Approach, HomeSettings, AgeGroup, Shift } from './types';

export const CLINICA_LOGO_URL = 'https://images.unsplash.com/photo-1628157588553-5eeea00af15c?auto=format&fit=crop&q=80&w=300';

export const DEFAULT_HOME_SETTINGS: HomeSettings = {
  heroTitle: 'Onde o cuidado encontra a esperança.',
  heroSubtitle: 'Bem-vindo à Clínica Hope',
  heroText: 'Oferecemos um espaço seguro e acolhedor para o seu desenvolvimento emocional em Palhoça. Um convite ao reencontro com sua essência.',
  insurancePlans: [
    { id: '1', name: 'Particular', logo: 'https://cdn-icons-png.flaticon.com/512/2854/2854580.png' },
    { id: '2', name: 'Unimed', logo: 'https://vagasprofissoes.com.br/wp-content/uploads/2019/12/Logo-Unimed.png' },
    { id: '3', name: 'Bradesco', logo: 'https://vagasprofissoes.com.br/wp-content/uploads/2020/01/logo-bradesco-saude.png' },
    { id: '4', name: 'Select', logo: 'https://www.saudebradesco.com.br/wp-content/uploads/2021/04/bradesco-saude-select.png' },
    { id: '5', name: 'Geap', logo: 'https://www.geap.com.br/wp-content/uploads/2018/11/GEAP-Logomarca-Site-Colorida-2x.png' },
    { id: '6', name: 'Celos', logo: 'https://www.celos.com.br/wp-content/uploads/2018/05/celos_logo_site.png' }
  ]
};

export const DEFAULT_SPECIALISTS: Specialist[] = [
  {
    id: '1',
    name: 'Dra. Mariana Costa',
    crp: 'CRP 12/00000',
    spec: 'Psicologia Clínica',
    tags: ['TCC', 'Ansiedade', 'Adultos'],
    desc: 'Especialista em auxiliar adultos a navegar por momentos de transição e gerenciamento de estresse com empatia e técnica.',
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCy4FxItzzF0l_uQVfaJLfAihSf9eC9kjTPe9o6IgdfgO7cJs-CLOUdWkbr75en44KHtvbBJQlGXcZ_Ng8D5bdMh5mWKeshRlJRGCMmR5eKvCLMxo7aL5D3lsIWIqcxDSoOvjLGNFZdEIUNhs9vU-lMIR-JEl9GkFpasyNTL6clrTbw7LhkYyEy466wFLNDAFTMyQpavnLP6C6XYMGwK3mtXS38A_8nMpVeliUsQ0S3H1Ijn5YGETIC9DWJOpNssJ-V0uPQSfeT8_A',
    color: 'bg-[#D1D9D5]',
    ageGroups: [AgeGroup.Adults, AgeGroup.Seniors],
    shifts: [Shift.Morning, Shift.Afternoon],
    attendedAges: Array.from({ length: 43 }, (_, i) => i + 18), // 18-60
    agendaId: 'SPREADSHEET_ID_1',
    availableTimes: {
      'Segunda': ['08:00', '09:00', '10:00', '11:00'],
      'Quarta': ['14:00', '15:00', '16:00'],
      'Sexta': ['09:00', '10:30', '11:30']
    }
  },
  {
    id: '2',
    name: 'Dr. Ricardo Almeida',
    crp: 'CRP 12/11111',
    spec: 'Infantojuvenil',
    tags: ['Ludoterapia', 'TDAH', 'Adolescentes'],
    desc: 'Trabalho focado no desenvolvimento infantil e suporte a pais, utilizando ferramentas lúdicas para facilitar a expressão emocional.',
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCePyTXW1pCC647MZg6MJ0OkRxDztLYFVhqoDRzMLyd1QPTZc5ZhVz_DKDKoV-P7yGwBrziEaCXAeEXP8gtPkM7_CHAjT3nn02jH7I2mbZ-JO6whqfN6_VEaB25uD5Q26nc72TYL-_fOSEdjv5_VFMrlZ9E8fNIE3keDW8G6_bm0gzx-K9qYUmycF76cnSu2hTQ8pO5cWx6J5NQzBs1oYMsErVt1CPaKHWGcme_CYB3nBEa-ygIjB26aKKqoVUHRYdm0kea4tbhagE',
    color: 'bg-[#E2D6CC]',
    ageGroups: [AgeGroup.Children, AgeGroup.Teens],
    shifts: [Shift.Afternoon, Shift.Night],
    attendedAges: Array.from({ length: 17 }, (_, i) => i + 1), // 1-17
    agendaId: 'SPREADSHEET_ID_2',
    availableTimes: {
      'Terça': ['14:00', '15:00', '18:00', '19:00'],
      'Quinta': ['13:00', '14:30', '17:00', '20:00']
    }
  },
  {
    id: '3',
    name: 'Dra. Beatriz Santos',
    crp: 'CRP 12/22222',
    spec: 'Terapia de Casal',
    tags: ['Sistêmica', 'Conflitos', 'Famílias'],
    desc: 'Focada em restaurar vínculos e melhorar a comunicação entre casais e famílias por meio de uma abordagem sistêmica integrativa.',
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBbG654DgYRUm3f3dXrYGskwB6KV8mcBVO2LCotqLxo6Dy9TVdkdjrVxP3Ym4ZArsqgnyJidvLPIfg8-hEUDVFMqD5aaCUgmGYr9t1ldnV5UUVGgAVFnJHHT2sjXKwVu-Q2GtRyLCaIzzgmgcntNobpt-gczLKY53eQ14iSZdLe0VHEO6fVOvRkxXZRGC0onPUzskexCRlZ7DKktmRKz7qj8kDJq2kwWkTv8IAb5e6gowqJlNnwkDt1svX1hBxNN_mkkR_cqrdegSs',
    color: 'bg-[#EAE4DF]',
    ageGroups: [AgeGroup.Adults],
    shifts: [Shift.Morning, Shift.Afternoon, Shift.Night],
    availableTimes: {
      'Segunda': ['19:00', '20:00'],
      'Quarta': ['08:00', '09:00', '10:00'],
      'Sábado': ['08:00', '09:00', '10:00', '11:00']
    }
  }
];

export const DEFAULT_APPROACHES: Approach[] = [
  {
    id: '1',
    title: 'Terapia Cognitivo-Comportamental (TCC)',
    desc: 'Focada em padrões de pensamento.',
    details: 'A TCC ajuda a identificar pensamentos negativos e modificar comportamentos que causam sofrimento. É uma das terapias mais indicadas para ansiedade e depressão.'
  },
  {
    id: '2',
    title: 'Psicanálise',
    desc: 'Exploração do inconsciente.',
    details: 'Trabalha emoções profundas e o inconsciente, ajudando a entender padrões da vida e experiências passadas.'
  },
  {
    id: '3',
    title: 'Terapia de Casal',
    desc: 'Apoio e diálogo no relacionamento.',
    details: 'Ajuda casais a melhorar a comunicação, resolver conflitos e fortalecer o relacionamento.'
  },
  {
    id: '4',
    title: 'Terapia Familiar',
    desc: 'Fortalecimento de vínculos.',
    details: 'Foca nos relacionamentos familiares e na melhoria da convivência entre os membros da família.'
  },
  {
    id: '5',
    title: 'ABA (Terapia para Autismo)',
    desc: 'Análise do Comportamento Aplicada.',
    details: 'Método baseado na análise do comportamento, muito utilizado no desenvolvimento de crianças com autismo.'
  },
  {
    id: '6',
    title: 'Neuropsicologia',
    desc: 'Avaliação das funções cognitivas.',
    details: 'Avalia memória, atenção e outras funções cognitivas, auxiliando em diagnósticos como TDAH.'
  },
  {
    id: '7',
    title: 'Psicopedagogia',
    desc: 'Dificuldades de aprendizagem.',
    details: 'Ajuda crianças e adolescentes com dificuldades de aprendizagem escolar.'
  },
  {
    id: '8',
    title: 'Gestalt-terapia',
    desc: 'Foco no presente e consciência.',
    details: 'Foca no presente e na consciência emocional, ajudando a pessoa a entender seus sentimentos.'
  },
  {
    id: '9',
    title: 'Psicoterapia Breve',
    desc: 'Foco em problemas específicos.',
    details: 'Atendimento focado em resolver problemas específicos de forma mais objetiva.'
  },
  {
    id: '10',
    title: 'Psicologia Organizacional',
    desc: 'Saúde mental no trabalho.',
    details: 'Atua na saúde mental no trabalho, estresse e desenvolvimento profissional.'
  }
];
