import React from 'react';
import { motion } from 'motion/react';
import { MessageCircle } from 'lucide-react';
import { trackWhatsAppClick } from '../analytics';

const FloatingWhatsApp = () => {
  const whatsappNumber = '5548999549041'; // Clínica Hope number
  const message = encodeURIComponent('Olá, estou vindo pelo site da Hope e gostaria de agendar uma consulta');
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${message}`;

  return (
    <motion.a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => trackWhatsAppClick('floating_button')}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-[#25D366] text-white px-5 py-3 rounded-full shadow-2xl hover:bg-[#20ba5a] transition-colors group cursor-pointer border-2 border-white/20"
      id="floating-whatsapp"
    >
      <span className="font-bold text-sm tracking-tight whitespace-nowrap">
        Agende pelo WhatsApp
      </span>
      <MessageCircle className="w-6 h-6 fill-white stroke-[#25D366]" />
    </motion.a>
  );
};

export default FloatingWhatsApp;

