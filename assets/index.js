const { createApp, ref, onMounted, computed } = Vue;

createApp({
  setup() {
    // Keys for Local Storage
    const LS_KEYS = {
      SETTINGS: 'clinica_hope_settings',
      SPECIALISTS: 'clinica_hope_specialists',
      APPROACHES: 'clinica_hope_approaches',
      AUTH: 'clinica_hope_auth'
    };

    // Initial Data
    const defaultSettings = {
      clinicName: 'Clínica Hope',
      heroTitle: 'Clínica de Psicologia em Palhoça',
      heroSubtitle: 'Bem-vindo à Clínica Hope',
      heroText: 'Oferecemos um espaço seguro e acolhedor para o seu desenvolvimento emocional em Palhoça. Um convite ao reencontro com sua essência.',
      logoUrl: 'https://images.unsplash.com/photo-1628157588553-5eeea00af15c?auto=format&fit=crop&q=80&w=300',
      heroImageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBFcpZ0zvgTNyZBiSKYzxT2xDJXnMXz8_r7z7ESPg6e_68_XijjD01XLwMcR4NIA05ClFmB0kT-C0-PwXni2zx1bcmn4bIr-28JWlAPufxkF0aZlQ55B-Tbu-a2VbJ9rLbcWfzA9TsxaJ-1xfJh0YhXidLL6ToBR6EFw-xLNDp8F_kFz01dFqMEBM0bUMhA5fnLjyo_iG1Wn8cDTaHvpUc-kz1Sq-XRqlPEQKHhwbRhIO7g0xEfR21uFWZFDIEBlKz4nV_0dyHATEg',
      seoTitle: 'Um ambiente pensado para o cuidado com você',
      seoText: 'Localizada no Pagani, a Clínica Hope oferece um espaço acolhedor, reservado e cuidadosamente preparado para atendimentos psicológicos, proporcionando conforto, privacidade e uma experiência tranquila desde a chegada.',
      address: 'Bairro Pagani, Palhoça/SC',
      footerRights: '© 2022 Clínica Hope. Todos os direitos reservados.'
    };

    const defaultSpecialists = [
      {
        id: '1',
        name: 'Dra. Mariana Costa',
        crp: 'CRP 12/00000',
        spec: 'Psicologia Clínica',
        tags: ['TCC', 'Ansiedade', 'Adultos'],
        desc: 'Especialista em auxiliar adultos a navegar por momentos de transição e gerenciamento de estresse com empatia e técnica.',
        img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCy4FxItzzF0l_uQVfaJLfAihSf9eC9kjTPe9o6IgdfgO7cJs-CLOUdWkbr75en44KHtvbBJQlGXcZ_Ng8D5bdMh5mWKeshRlJRGCMmR5eKvCLMxo7aL5D3lsIWIqcxDSoOvjLGNFZdEIUNhs9vU-lMIR-JEl9GkFpasyNTL6clrTbw7LhkYyEy466wFLNDAFTMyQpavnLP6C6XYMGwK3mtXS38A_8nMpVeliUsQ0S3H1Ijn5YGETIC9DWJOpNssJ-V0uPQSfeT8_A'
      },
      {
        id: '2',
        name: 'Dr. Ricardo Almeida',
        crp: 'CRP 12/11111',
        spec: 'Infantojuvenil',
        tags: ['Ludoterapia', 'TDAH', 'Adolescentes'],
        desc: 'Trabalho focado no desenvolvimento infantil e suporte a pais, utilizando ferramentas lúdicas para facilitar a expressão emocional.',
        img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCePyTXW1pCC647MZg6MJ0OkRxDztLYFVhqoDRzMLyd1QPTZc5ZhVz_DKDKoV-P7yGwBrziEaCXAeEXP8gtPkM7_CHAjT3nn02jH7I2mbZ-JO6whqfN6_VEaB25uD5Q26nc72TYL-_fOSEdjv5_VFMrlZ9E8fNIE3keDW8G6_bm0gzx-K9qYUmycF76cnSu2hTQ8pO5cWx6J5NQzBs1oYMsErVt1CPaKHWGcme_CYB3nBEa-ygIjB26aKKqoVUHRYdm0kea4tbhagE'
      },
      {
        id: '3',
        name: 'Dra. Beatriz Santos',
        crp: 'CRP 12/22222',
        spec: 'Terapia de Casal',
        tags: ['Sistêmica', 'Conflitos', 'Famílias'],
        desc: 'Focada em restaurar vínculos e melhorar a comunicação entre casais e famílias por meio de uma abordagem sistêmica integrativa.',
        img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBbG654DgYRUm3f3dXrYGskwB6KV8mcBVO2LCotqLxo6Dy9TVdkdjrVxP3Ym4ZArsqgnyJidvLPIfg8-hEUDVFMqD5aaCUgmGYr9t1ldnV5UUVGgAVFnJHHT2sjXKwVu-Q2GtRyLCaIzzgmgcntNobpt-gczLKY53eQ14iSZdLe0VHEO6fVOvRkxXZRGC0onPUzskexCRlZ7DKktmRKz7qj8kDJq2kwWkTv8IAb5e6gowqJlNnwkDt1svX1hBxNN_mkkR_cqrdegSs'
      }
    ];

    // State
    const settings = ref(defaultSettings);
    const specialists = ref(defaultSpecialists);
    const currentScreen = ref('home');
    const loginPassword = ref('');
    const loginError = ref('');
    const isAdmin = ref(false);

    // Load from Local Storage
    onMounted(() => {
      const savedSettings = localStorage.getItem(LS_KEYS.SETTINGS);
      if (savedSettings) settings.value = JSON.parse(savedSettings);

      const savedSpecs = localStorage.getItem(LS_KEYS.SPECIALISTS);
      if (savedSpecs) specialists.value = JSON.parse(savedSpecs);

      const savedAuth = localStorage.getItem(LS_KEYS.AUTH);
      if (savedAuth === 'true') isAdmin.value = true;
      
      // Initialize Lucide Icons
      lucide.createIcons();
    });

    // Methods
    const navigate = (screen) => {
      currentScreen.value = screen;
      window.scrollTo(0, 0);
      setTimeout(() => lucide.createIcons(), 0);
    };

    const handleLogin = () => {
      if (loginPassword.value === '123456') {
        isAdmin.value = true;
        localStorage.setItem(LS_KEYS.AUTH, 'true');
        navigate('admin');
      } else {
        loginError.value = 'Senha incorreta.';
      }
    };

    const logout = () => {
      isAdmin.value = false;
      localStorage.removeItem(LS_KEYS.AUTH);
      navigate('home');
    };

    const saveSettings = () => {
      localStorage.setItem(LS_KEYS.SETTINGS, JSON.stringify(settings.value));
      alert('Configurações salvas com sucesso!');
    };

    return {
      settings,
      specialists,
      currentScreen,
      loginPassword,
      loginError,
      isAdmin,
      navigate,
      handleLogin,
      logout,
      saveSettings
    };
  },
  template: `
    <div class="min-h-screen bg-gray-50 font-sans text-gray-900 border-t-4 border-blue-900">
      <!-- Navigation -->
      <nav class="bg-white shadow-sm sticky top-0 z-50 px-6 py-4 flex justify-between items-center max-width">
        <div class="flex items-center gap-2 cursor-pointer" @click="navigate('home')">
          <div class="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-900">
             <i data-lucide="heart"></i>
          </div>
          <span class="font-bold text-xl text-blue-900">{{ settings.clinicName }}</span>
        </div>
        <div class="hidden md:flex gap-8 font-medium">
          <a href="#" @click.prevent="navigate('home')" class="hover:text-blue-700">Início</a>
          <a href="#especialistas" class="hover:text-blue-700">Especialistas</a>
          <a href="#" @click.prevent="navigate('login')" class="hover:text-blue-700">Admin</a>
        </div>
        <button class="bg-blue-900 text-white px-6 py-2 rounded-full font-bold hover:bg-blue-800 transition-colors">
          Agendar
        </button>
      </nav>

      <!-- Main Content -->
      <main v-if="currentScreen === 'home'" class="max-width">
        <!-- Hero Section -->
        <section class="py-20 flex flex-col md:flex-row items-center gap-12 px-6">
          <div class="flex-1 space-y-8">
            <span class="bg-blue-100 text-blue-800 px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest">
              {{ settings.heroSubtitle }}
            </span>
            <h1 class="text-5xl md:text-6xl font-black text-blue-900 leading-tight">
              {{ settings.heroTitle }}
            </h1>
            <p class="text-lg text-gray-600 leading-relaxed max-w-xl">
              {{ settings.heroText }}
            </p>
            <div class="flex gap-4">
              <button @click="navigate('home')" class="bg-blue-900 text-white px-8 py-4 rounded-xl font-bold shadow-lg hover:bg-blue-800 transition-all">
                Conheça a clínica
              </button>
            </div>
          </div>
          <div class="flex-1 relative">
            <div class="aspect-square rounded-[3rem] overflow-hidden shadow-2xl skew-y-2">
              <img :src="settings.heroImageUrl" class="w-full h-full object-cover" />
            </div>
          </div>
        </section>

        <!-- A Clínica (SEO) Section -->
        <section id="clinica" class="py-24 px-6 bg-gray-50 rounded-[4rem] my-10">
          <div class="max-width grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <div class="space-y-6">
              <h2 class="text-4xl font-black text-blue-900">{{ settings.seoTitle }}</h2>
              <p class="text-gray-600 leading-relaxed text-lg">{{ settings.seoText }}</p>
              <div class="flex items-center gap-4 text-blue-900 font-bold">
                 <i data-lucide="map-pin"></i>
                 <span>{{ settings.address }}</span>
              </div>
            </div>
            <div class="grid grid-cols-2 gap-4">
               <div class="p-6 bg-white rounded-3xl shadow-sm border border-gray-100 text-center space-y-2">
                 <i data-lucide="wifi" class="mx-auto text-blue-900"></i>
                 <p class="font-bold text-sm">Wi-Fi</p>
               </div>
               <div class="p-6 bg-white rounded-3xl shadow-sm border border-gray-100 text-center space-y-2">
                 <i data-lucide="shield-check" class="mx-auto text-blue-900"></i>
                 <p class="font-bold text-sm">Segurança</p>
               </div>
            </div>
          </div>
        </section>

        <!-- Specialists Section -->
        <section id="especialistas" class="py-32 bg-white px-6 rounded-[4rem] my-20 shadow-sm border border-gray-100">
           <div class="text-center mb-20 space-y-4">
             <h2 class="text-4xl font-black text-blue-900">Nossos Especialistas</h2>
             <p class="text-gray-500 max-w-xl mx-auto">Profissionais qualificados para seu atendimento.</p>
           </div>
           <div class="grid grid-cols-1 md:grid-cols-3 gap-12">
             <div v-for="spec in specialists" :key="spec.id" class="bg-gray-50 p-8 rounded-3xl space-y-6 hover:shadow-xl transition-all border border-transparent hover:border-blue-100 group">
                <div class="h-64 rounded-2xl overflow-hidden grayscale group-hover:grayscale-0 transition-all">
                  <img :src="spec.img" class="w-full h-full object-cover" />
                </div>
                <div class="space-y-4 text-center">
                  <h3 class="text-2xl font-bold text-blue-900">{{ spec.name }}</h3>
                  <p class="text-blue-700 font-bold text-sm">{{ spec.spec }}</p>
                  <p class="text-gray-600 italic">"{{ spec.desc }}"</p>
                  <div class="flex flex-wrap gap-2 justify-center pt-4">
                    <span v-for="tag in spec.tags" class="bg-white px-3 py-1 rounded-full text-[10px] font-bold text-gray-400 border border-gray-200">
                      {{ tag }}
                    </span>
                  </div>
                </div>
             </div>
           </div>
        </section>

        <!-- Footer -->
        <footer class="py-20 border-t border-gray-200 mt-20 text-center space-y-6">
          <div class="font-bold text-blue-900 text-xl">{{ settings.clinicName }}</div>
          <div class="text-sm text-gray-400">{{ settings.address }}</div>
          <p class="text-xs text-gray-300 italic">{{ settings.footerRights }}</p>
        </footer>
      </main>

      <!-- Login Screen -->
      <main v-if="currentScreen === 'login'" class="min-h-[80vh] flex items-center justify-center p-6">
        <div class="bg-white max-w-md w-full p-12 rounded-[3rem] shadow-2xl border border-blue-50 space-y-8">
          <div class="text-center">
            <h2 class="text-3xl font-black text-blue-900">Entrar</h2>
            <p class="text-gray-500 mt-2">Área Restrita do Administrador</p>
          </div>
          <div class="space-y-6">
            <div class="space-y-2">
              <label class="text-xs font-bold uppercase tracking-widest text-blue-900 ml-2">Senha</label>
              <input type="password" v-model="loginPassword" class="w-full p-5 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-blue-900 outline-none transition-all" placeholder="••••••" @keyup.enter="handleLogin" />
            </div>
            <p v-if="loginError" class="text-red-500 text-sm font-bold text-center italic">{{ loginError }}</p>
            <button @click="handleLogin" class="w-full bg-blue-900 text-white py-5 rounded-2xl font-bold shadow-xl hover:bg-blue-800 active:scale-95 transition-all">
              Acessar Painel
            </button>
          </div>
          <button @click="navigate('home')" class="w-full text-center text-xs text-gray-400 font-bold hover:text-blue-900 transition-colors uppercase tracking-widest underline">
            Voltar ao site
          </button>
        </div>
      </main>

      <!-- Admin Screen -->
      <main v-if="currentScreen === 'admin'" class="p-12 max-width">
        <div class="flex justify-between items-center mb-12">
          <h2 class="text-4xl font-black text-blue-900">Painel Admin</h2>
          <button @click="logout" class="bg-red-50 text-red-600 px-6 py-2 rounded-full font-bold text-sm tracking-widest uppercase border border-red-100 hover:bg-red-600 hover:text-white transition-all">
            Sair
          </button>
        </div>
        
        <div class="bg-white p-12 rounded-[3rem] shadow-xl border border-gray-100 space-y-12">
          <div class="space-y-8">
            <h3 class="text-2xl font-bold text-blue-900 border-b pb-4">Configurações Gerais</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div class="space-y-2">
                 <label class="text-xs font-bold uppercase tracking-widest text-gray-400">Nome da Clínica</label>
                 <input v-model="settings.clinicName" class="w-full border-b-2 p-2 outline-none focus:border-blue-900 font-bold text-lg" />
               </div>
               <div class="space-y-2">
                 <label class="text-xs font-bold uppercase tracking-widest text-gray-400">Endereço</label>
                 <input v-model="settings.address" class="w-full border-b-2 p-2 outline-none focus:border-blue-900 font-bold text-lg" />
               </div>
            </div>
            <div class="space-y-2">
              <label class="text-xs font-bold uppercase tracking-widest text-gray-400">Título Hero</label>
              <input v-model="settings.heroTitle" class="w-full border-b-2 p-2 outline-none focus:border-blue-900 font-bold text-lg" />
            </div>
            <div class="space-y-2">
              <label class="text-xs font-bold uppercase tracking-widest text-gray-400">Texto Descritivo</label>
              <textarea v-model="settings.heroText" rows="4" class="w-full border p-4 rounded-2xl outline-none focus:border-blue-900"></textarea>
            </div>
            <div class="flex justify-center pt-8">
               <button @click="saveSettings" class="bg-blue-900 text-white px-12 py-4 rounded-2xl font-bold shadow-2xl hover:scale-105 transition-all">
                  Salvar Alterações
               </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  `
}).mount('#app');
