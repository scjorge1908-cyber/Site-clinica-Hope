import React from 'react';
import { motion } from 'motion/react';
import { MessageCircle } from 'lucide-react';
import { trackWhatsAppClick } from '../analytics';
import { WHATSAPP_URL } from '../contact';

const FloatingWhatsApp = () => {
  const message = 'Olá, estou vindo pelo site da Hope clinicahopebrasil.com.br e gostaria de agendar uma consulta';
  const encodedMessage = encodeURIComponent(message);
  const whatsappUrl = `${WHATSAPP_URL}?text=${encodedMessage}`;

  return (
    <div className="fixed bottom-6 right-6 z-50 hidden sm:flex items-center gap-3">
      <motion.a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => trackWhatsAppClick('floating_button')}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        className="flex items-center gap-3 bg-[#15803d] text-white px-5 py-3 rounded-full shadow-2xl hover:bg-[#166534] transition-colors cursor-pointer border-2 border-white/20"
        id="floating-whatsapp"
        data-event="contato_whatsapp"
        title="Agende pelo WhatsApp"
      >
        <span className="font-bold text-sm tracking-tight whitespace-nowrap">
          Agende pelo WhatsApp
        </span>
        <MessageCircle className="w-6 h-6 fill-white stroke-[#15803d]" />
      </motion.a>
    </div>
  );
};

export default FloatingWhatsApp;
