import React from 'react';
import { motion } from 'motion/react';
import { Send } from 'lucide-react';
import { TELEGRAM_URL } from '../contact';

const FloatingTelegram = () => {
  const message = encodeURIComponent('Olá, estou vindo pelo site da Hope clinicahopebrasil.com.br e gostaria de agendar uma consulta');
  const telegramUrl = `${TELEGRAM_URL}`;

  return (
    <motion.a
      href={telegramUrl}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 0.1 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      className="fixed bottom-6 right-24 z-50 hidden sm:flex items-center gap-3 bg-[#0088cc] text-white px-5 py-3 rounded-full shadow-2xl hover:bg-[#0078b4] transition-colors group cursor-pointer border-2 border-white/20"
      id="floating-telegram"
      data-event="contato_telegram"
      title="Contate-nos pelo Telegram"
    >
      <span className="font-bold text-sm tracking-tight whitespace-nowrap">
        Telegram
      </span>
      <Send className="w-6 h-6 fill-white stroke-[#0088cc]" />
    </motion.a>
  );
};

export default FloatingTelegram;
