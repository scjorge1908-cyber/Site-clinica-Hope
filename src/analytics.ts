declare global {
  interface Window {
    dataLayer: any[];
    fbq: (...args: any[]) => void;
  }
}

const push = (event: object) => {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(event);
};

// ── WhatsApp Click ──────────────────────────────────────
export const trackWhatsAppClick = (source: string = 'floating_button') => {
  push({
    event: 'whatsapp_click',
    event_category: 'contato',
    event_label: source,
  });
  if (typeof window.fbq === 'function') {
    window.fbq('trackCustom', 'WhatsAppClick', { source });
  }
};

// ── Telefone Click ──────────────────────────────────────
export const trackPhoneClick = (source: string = 'page') => {
  push({
    event: 'phone_click',
    event_category: 'contato',
    event_label: source,
  });
  if (typeof window.fbq === 'function') {
    window.fbq('trackCustom', 'PhoneClick', { source });
  }
};

// ── Formulário Enviado ──────────────────────────────────
export const trackFormSubmit = (formName: string = 'agendamento') => {
  push({
    event: 'form_submit',
    event_category: 'conversao',
    event_label: formName,
  });
  if (typeof window.fbq === 'function') {
    window.fbq('track', 'Lead', { content_name: formName });
  }
};

// ── Agendamento iniciado (botão especialista) ───────────
export const trackScheduleClick = (specialistName: string) => {
  push({
    event: 'schedule_click',
    event_category: 'agendamento',
    event_label: specialistName,
  });
  if (typeof window.fbq === 'function') {
    window.fbq('trackCustom', 'ScheduleClick', { specialist: specialistName });
  }
};

// ── Visualização de Perfil de Especialista ─────────────
export const trackSpecialistProfileView = (specialistName: string, slug: string) => {
  push({
    event: 'view_specialist_profile',
    event_category: 'engajamento',
    event_label: specialistName,
    slug: slug
  });
  if (typeof window.fbq === 'function') {
    window.fbq('trackCustom', 'ViewPerfilEspecialista', { 
      content_name: specialistName, 
      content_category: 'Especialista',
      slug: slug 
    });
  }
};


