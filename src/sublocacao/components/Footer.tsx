import { Calendar, Globe, Mail } from 'lucide-react';

interface FooterProps {
  setView: (view: string) => void;
}

export default function Footer({ setView }: FooterProps) {
  return (
    <footer className="bg-white border-t border-outline-alt/40 pt-16 pb-8 px-6 mt-auto">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start gap-12">
        <div className="max-w-xs">
          <div className="flex items-center gap-2 mb-4 cursor-pointer" onClick={() => setView('home')}>
            <Calendar className="w-8 h-8 text-primary" />
            <span className="font-sans font-extrabold text-xl tracking-tight text-primary">
              Subloca<span className="text-secondary">Hope</span>
            </span>
          </div>
          <p className="font-sans text-brand-variant text-sm leading-relaxed">
            Soluções inteligentes de espaço e infraestrutura completa para profissionais da saúde em Palhoça, Santa Catarina. Tecnologia de ponta e cuidado humanizado em um só lugar.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-12">
          <div>
            <h4 className="font-sans font-bold text-primary text-sm uppercase tracking-wider mb-4">
              Empresa
            </h4>
            <ul className="space-y-2.5 font-sans text-brand-variant text-sm">
              <li>
                <button onClick={() => setView('home')} className="hover:text-primary transition-colors cursor-pointer text-left">
                  Sobre Nós
                </button>
              </li>
              <li>
                <a href="#vagas" className="hover:text-primary transition-colors">
                  Carreiras
                </a>
              </li>
              <li>
                <a href="#blog" className="hover:text-primary transition-colors">
                  Blog Institucional
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-sans font-bold text-primary text-sm uppercase tracking-wider mb-4">
              Suporte
            </h4>
            <ul className="space-y-2.5 font-sans text-brand-variant text-sm">
              <li>
                <a href="#central-ajuda" className="hover:text-primary transition-colors">
                  Central de Ajuda
                </a>
              </li>
              <li>
                <a href="#faq" className="hover:text-primary transition-colors">
                  Perguntas Frequentes
                </a>
              </li>
              <li>
                <a href="#seguranca" className="hover:text-primary transition-colors">
                  Segurança e SLAs
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-sans font-bold text-primary text-sm uppercase tracking-wider mb-4">
              Legal
            </h4>
            <ul className="space-y-2.5 font-sans text-brand-variant text-sm">
              <li>
                <a href="#termos" className="hover:text-primary transition-colors">
                  Termos de Serviço
                </a>
              </li>
              <li>
                <a href="#privacidade" className="hover:text-primary transition-colors">
                  Políticas de Privacidade
                </a>
              </li>
              <li>
                <a href="#lgpd" className="hover:text-primary transition-colors">
                  Conformidade LGPD
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto mt-12 pt-6 border-t border-outline-alt/30 flex flex-col md:flex-row justify-between items-center gap-4">
        <p className="font-sans text-brand-variant text-xs opacity-80">
          &copy; 2026 SublocaHope. Todos os direitos reservados.
        </p>
        <div className="flex gap-4">
          <a
            href="#suporte-email"
            title="Suporte Técnico"
            className="text-primary hover:text-secondary p-1.5 hover:bg-primary/5 rounded-lg transition-colors"
          >
            <Mail className="w-4.5 h-4.5" />
          </a>
          <a
            href="#idioma"
            title="Selecionar Idioma"
            className="text-primary hover:text-secondary p-1.5 hover:bg-primary/5 rounded-lg transition-colors"
          >
            <Globe className="w-4.5 h-4.5" />
          </a>
        </div>
      </div>
    </footer>
  );
}
