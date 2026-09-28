import React from 'react';
import { motion } from 'motion/react';
import { MessageCircle, Send } from 'lucide-react';
import { trackWhatsAppClick, trackTelegramClick } from '../analytics';
import { TELEGRAM_PHONE, TELEGRAM_URL, WHATSAPP_URL } from '../contact';

const FloatingWhatsApp = () => {
  const message = 'Olá, estou vindo pelo site da Hope clinicahopebrasil.com.br e gostaria de agendar uma consulta';
  const encodedMessage = encodeURIComponent(message);
  const whatsappUrl = `${WHATSAPP_URL}?text=${encodedMessage}`;
  // Link do Telegram pelo telefone (t.me/+NUMERO). O Telegram não aceita mensagem pré-preenchida neste formato.
  const telegramUrl = TELEGRAM_URL || `https://t.me/+${TELEGRAM_PHONE}`;

  return (
    <div className="fixed bottom-6 right-6 z-50 hidden sm:flex items-center gap-3">
      <motion.a
        href={telegramUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => trackTelegramClick('floating_button')}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1 }}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        className="flex items-center gap-3 bg-[#0088cc] text-white px-5 py-3 rounded-full shadow-2xl hover:bg-[#0078b4] transition-colors cursor-pointer border-2 border-white/20"
        id="floating-telegram"
        data-event="contato_telegram"
        title="Agende pelo Telegram"
      >
        <span className="font-bold text-sm tracking-tight whitespace-nowrap">
          Agende pelo Telegram
        </span>
        <Send className="w-6 h-6 fill-white" />
      </motion.a>

      <motion.a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => trackWhatsAppClick('floating_button')}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        className="flex items-center gap-3 bg-[#25D366] text-white px-5 py-3 rounded-full shadow-2xl hover:bg-[#20ba5a] transition-colors cursor-pointer border-2 border-white/20"
        id="floating-whatsapp"
        data-event="contato_whatsapp"
        title="Agende pelo WhatsApp"
      >
        <span className="font-bold text-sm tracking-tight whitespace-nowrap">
          Agende pelo WhatsApp
        </span>
        <MessageCircle className="w-6 h-6 fill-white stroke-[#25D366]" />
      </motion.a>
    </div>
  );
};

export default FloatingWhatsApp;
