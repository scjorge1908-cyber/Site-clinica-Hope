// Campo do rodapé para validar declaração (Jorge, 03/11/2026): leva à página /validar com o código digitado.
import { useState, type FormEvent } from 'react';
import { ShieldCheck } from 'lucide-react';

export function ValidarRodape() {
  const [codigo, setCodigo] = useState('');
  const enviar = (e: FormEvent) => {
    e.preventDefault();
    const c = codigo.trim();
    window.location.href = c ? `/validar?codigo=${encodeURIComponent(c)}` : '/validar';
  };
  return (
    <form onSubmit={enviar} className="bg-[#fdfdff] p-5 rounded-3xl border border-outline-alt/20 shadow-sm text-left md:ml-auto md:max-w-sm">
      <p className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.2em] text-primary/40 mb-3">
        <ShieldCheck size={14} aria-hidden /> Validar declaração
      </p>
      <label htmlFor="rodape-codigo" className="sr-only">Código de verificação da declaração</label>
      <div className="flex gap-2">
        <input
          id="rodape-codigo"
          value={codigo}
          onChange={(e) => setCodigo(e.target.value)}
          placeholder="Código de verificação"
          autoComplete="off"
          spellCheck={false}
          className="min-w-0 flex-1 rounded-xl border border-outline-alt bg-white px-3 py-2 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <button type="submit" className="shrink-0 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-on-primary">Validar</button>
      </div>
      <p className="mt-2 text-[11px] text-on-surface-variant/70">Confira se uma declaração foi emitida pela Clínica Hope.</p>
    </form>
  );
}
