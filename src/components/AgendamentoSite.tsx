// Agendamento pelo site (prévia APROVADA por Jorge em 03/11/2026).
// A pessoa escolhe dia, hora e convênio no cartão da especialista e clica em "Enviar sua solicitação":
//  1) o sistema da clínica trava o horário por 20 minutos (para quem estiver no site ele aparece "em agendamento");
//  2) aqui mesmo, no site, ela preenche os dados do PACIENTE e anexa os documentos (tudo obrigatório, só o complemento não);
//  3) ao salvar: "Recebemos seus dados" + e-mail com os dados, as regras e os documentos; a equipe valida e confirma pelo WhatsApp.
// Desistiu (fechou) antes de salvar: o horário é liberado na hora. Nada daqui fica guardado no navegador.
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ANEXOS, MAX_ANEXO_BYTES, MAX_TOTAL_BYTES, SEXOS, faltando, mascaraCep, mascaraCpf, mascaraData, mascaraTelefone, nomeCampo, pedeQr,
  type Dados, type TipoAnexo,
} from '../lib/agendamentoRegras';

const SISTEMA = 'https://www.hopecore.com.br';
const VAZIO: Dados = { nome: '', cpf: '', nascimento: '', sexo: '', telefone: '', email: '', cep: '', rua: '', numero: '', complemento: '', bairro: '', cidade: '', uf: '', plano: '', carteirinha: '', crm: '' };

type Reserva = { caminho: string; expira_em: string; psicologa: string; dia: string; horario: string; inicio: string | null; planos: string[] };

const normalizar = (s: string) => (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
/** Convênio escolhido no site → nome do convênio no sistema da clínica (ex.: "Unimed" → "UNIMED GRANDE FLORIANOPOLIS"). */
function planoDoSistema(site: string, planos: string[]): string {
  const n = normalizar(site);
  if (!n) return '';
  return planos.find((p) => normalizar(p) === n) ?? planos.find((p) => normalizar(p).startsWith(n + ' ') || normalizar(p).includes(n)) ?? '';
}
const dataBR = (iso: string | null) => (iso && /^\d{4}-\d{2}-\d{2}/.test(iso) ? `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}` : '');

/** Foto reduzida no aparelho (até 1600 px, JPEG) para o envio caber no limite do servidor. PDF vai como está. */
async function prepararArquivo(f: File): Promise<Blob> {
  if (f.type === 'application/pdf' || !f.type.startsWith('image/')) return f;
  try {
    const img = await createImageBitmap(f);
    const escala = Math.min(1, 1600 / Math.max(img.width, img.height));
    const c = document.createElement('canvas');
    c.width = Math.round(img.width * escala); c.height = Math.round(img.height * escala);
    c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height);
    const b = await new Promise<Blob | null>((ok) => c.toBlob(ok, 'image/jpeg', 0.82));
    return b && b.size < f.size ? b : f;
  } catch { return f; }
}

export function AgendamentoSite({ slug, especialista, dia, hora, planoSite, onFechar }: {
  slug: string; especialista: string; dia: string; hora: string; planoSite: string; onFechar: () => void;
}) {
  const [etapa, setEtapa] = useState<'reservando' | 'erro' | 'form' | 'tempo' | 'ok'>('reservando');
  const [erro, setErro] = useState('');
  const [reserva, setReserva] = useState<Reserva | null>(null);
  const [d, setD] = useState<Dados>(VAZIO);
  const [arqs, setArqs] = useState<Partial<Record<TipoAnexo, Blob & { nome?: string }>>>({});
  const [aceite, setAceite] = useState(false);
  const [falta, setFalta] = useState<string[]>([]);
  const [enviando, setEnviando] = useState(false);
  const [buscandoCep, setBuscandoCep] = useState(false);
  const [agora, setAgora] = useState(Date.now());
  const enviado = useRef(false);
  const caminhoRef = useRef<string | null>(null);

  // 1) trava o horário (uma vez)
  useEffect(() => {
    let vivo = true;
    void (async () => {
      try {
        const r = await fetch(`${SISTEMA}/api/site/agendar`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ acao: 'reservar', slug, dia, hora }) });
        const j = await r.json().catch(() => ({})) as Partial<Reserva> & { ok?: boolean; erro?: string };
        if (!vivo) return;
        if (!j.ok || !j.caminho) { setErro(j.erro || 'Não foi possível reservar este horário agora. Tente de novo.'); setEtapa('erro'); return; }
        const res = j as Reserva;
        caminhoRef.current = res.caminho;
        setReserva(res);
        setD((x) => ({ ...x, plano: planoDoSistema(planoSite, res.planos ?? []) }));
        setEtapa('form');
      } catch {
        if (vivo) { setErro('Sem conexão. Confira a internet e tente de novo.'); setEtapa('erro'); }
      }
    })();
    return () => { vivo = false; };
  }, [slug, dia, hora, planoSite]);

  // contagem regressiva dos 20 min
  useEffect(() => {
    if (etapa !== 'form') return;
    const t = setInterval(() => setAgora(Date.now()), 1000);
    return () => clearInterval(t);
  }, [etapa]);
  const restam = reserva ? Math.max(0, Math.floor((new Date(reserva.expira_em).getTime() - agora) / 1000)) : 0;
  useEffect(() => { if (etapa === 'form' && reserva && restam === 0) setEtapa('tempo'); }, [etapa, reserva, restam]);

  // desistiu (fechou a janela ou saiu da página) antes de salvar: libera o horário
  const liberar = () => {
    const c = caminhoRef.current;
    if (!c || enviado.current) return;
    caminhoRef.current = null;
    try { void fetch(`${SISTEMA}/api/site/agendar`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ acao: 'desistir', caminho: c }), keepalive: true }); } catch { /* vence sozinho em 20 min */ }
  };
  useEffect(() => {
    const sair = () => liberar();
    window.addEventListener('pagehide', sair);
    return () => window.removeEventListener('pagehide', sair);
  }, []);
  const fechar = () => { liberar(); onFechar(); };

  const qr = pedeQr(d.plano, d.carteirinha);
  const anexosVisiveis = ANEXOS.filter((a) => a.tipo !== 'qr' || qr);
  const set = (k: keyof Dados, v: string) => { setD((x) => ({ ...x, [k]: v })); setFalta((f) => f.filter((y) => y !== k)); };
  const marca = (k: string) => (falta.includes(k) ? 'ring-2 ring-red-400 border-red-400' : '');

  async function buscarCep(cep: string) {
    const n = cep.replace(/\D/g, '');
    if (n.length !== 8) return;
    setBuscandoCep(true);
    try {
      const r = await fetch(`https://viacep.com.br/ws/${n}/json/`);
      const j = await r.json() as { erro?: boolean; logradouro?: string; bairro?: string; localidade?: string; uf?: string };
      if (!j.erro) {
        setD((x) => ({ ...x, rua: j.logradouro || x.rua, bairro: j.bairro || x.bairro, cidade: j.localidade || x.cidade, uf: j.uf || x.uf }));
        setFalta((f) => f.filter((y) => !(['rua', 'bairro', 'cidade'] as string[]).includes(y) || !({ rua: j.logradouro, bairro: j.bairro, cidade: j.localidade } as Record<string, string | undefined>)[y]));
      }
    } catch { /* sem internet: a pessoa digita */ }
    setBuscandoCep(false);
  }

  async function escolher(tipo: TipoAnexo, f: File | undefined) {
    setErro('');
    if (!f) return;
    if (f.size > MAX_ANEXO_BYTES * 3) { setErro('Arquivo muito grande. Envie uma foto ou um PDF menor.'); return; }
    const b = Object.assign(await prepararArquivo(f), { nome: f.name });
    if (b.size > MAX_ANEXO_BYTES) { setErro('Arquivo acima de 5 MB. Envie uma foto ou um PDF menor.'); return; }
    setArqs((x) => ({ ...x, [tipo]: b }));
    setFalta((x) => x.filter((y) => y !== 'anexo_' + tipo));
  }

  async function salvar() {
    if (!reserva) return;
    setErro('');
    const tipos = (Object.keys(arqs) as TipoAnexo[]).filter((t) => t !== 'qr' || qr);
    const f = faltando(d, tipos, reserva.planos);
    if (!aceite) f.push('aceite');
    setFalta(f);
    if (f.length) { document.getElementById('agsite-topo')?.scrollIntoView({ behavior: 'smooth' }); return; }
    const total = tipos.reduce((t, k) => t + (arqs[k]?.size ?? 0), 0);
    if (total > MAX_TOTAL_BYTES) { setErro('Os documentos juntos passam de 4 MB. Envie fotos (não PDF escaneado pesado) ou arquivos menores.'); return; }
    setEnviando(true);
    try {
      const fd = new FormData();
      fd.append('caminho', reserva.caminho);
      for (const [k, v] of Object.entries(d) as [string, string][]) if (v.trim()) fd.append(k, v.trim());
      for (const t of tipos) fd.append(t, arqs[t]!, arqs[t]!.nome ?? t);
      const r = await fetch(`${SISTEMA}/api/agendamento-link`, { method: 'POST', body: fd });
      const j = await r.json().catch(() => ({})) as { ok?: boolean; erro?: string; campos?: string[] };
      if (j.ok) { enviado.current = true; setEtapa('ok'); }
      else { setErro(j.erro ?? 'Não foi possível enviar. Tente de novo.'); if (j.campos?.length) setFalta(j.campos); }
    } catch { setErro('Sem conexão. Confira a internet e tente de novo.'); }
    setEnviando(false);
  }

  const inicio = useMemo(() => dataBR(reserva?.inicio ?? null), [reserva]);
  const mmss = `${Math.floor(restam / 60)}:${String(restam % 60).padStart(2, '0')}`;
  const campoCls = 'w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0f3d63]';
  const campo = (k: keyof Dados, rotulo: string, extra: { mascara?: (v: string) => string; tipo?: string; ph?: string; largo?: boolean; modo?: 'numeric' | 'email' | 'tel'; opcional?: boolean } = {}) => (
    <label className={`grid gap-1 text-xs font-bold text-gray-600 ${extra.largo ? 'sm:col-span-2' : ''}`}>
      <span>{rotulo}{!extra.opcional && <i className="not-italic text-red-600"> *</i>}</span>
      <input value={d[k]} type={extra.tipo ?? 'text'} inputMode={extra.modo} placeholder={extra.ph} autoComplete="off"
        className={`${campoCls} ${marca(k)}`} onChange={(e) => set(k, extra.mascara ? extra.mascara(e.target.value) : e.target.value)} />
    </label>
  );

  return (
    <div className="fixed inset-0 z-[200] bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4" role="dialog" aria-modal="true" aria-label="Agendamento">
      <div className="bg-white w-full sm:max-w-xl max-h-[100dvh] sm:max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl shadow-2xl">
        <div id="agsite-topo" className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-gray-100 px-5 py-3 flex items-center justify-between gap-3">
          <p className="font-black text-[#0f3d63] text-sm">Agendamento · {especialista}</p>
          <button type="button" onClick={fechar} className="text-gray-500 text-2xl leading-none px-2" aria-label="Fechar">×</button>
        </div>

        <div className="px-5 py-4 grid gap-4">
          {etapa === 'reservando' && <p className="text-sm text-gray-600 py-8 text-center">Reservando o horário para você…</p>}

          {etapa === 'erro' && (
            <div className="grid gap-3 py-6 text-center">
              <p className="text-sm font-bold text-red-700">{erro}</p>
              <button type="button" onClick={onFechar} className="rounded-xl bg-[#0f3d63] text-white font-bold py-3">Escolher outro horário</button>
            </div>
          )}

          {etapa === 'tempo' && (
            <div className="grid gap-3 py-6 text-center">
              <p className="text-sm font-bold text-amber-800">O tempo de 20 minutos acabou e o horário foi liberado.</p>
              <button type="button" onClick={onFechar} className="rounded-xl bg-[#0f3d63] text-white font-bold py-3">Escolher o horário de novo</button>
            </div>
          )}

          {etapa === 'ok' && reserva && (
            <div className="grid gap-3 py-6 text-center justify-items-center">
              <div className="w-14 h-14 rounded-full bg-green-100 text-green-700 grid place-items-center text-3xl font-black">✓</div>
              <h2 className="text-lg font-black text-gray-900">Recebemos seus dados!</h2>
              <p className="text-sm text-gray-600">Nosso time vai validar a autorização junto ao seu plano e entrar em contato pelo <b className="text-green-700">WhatsApp</b> para confirmar o seu agendamento.</p>
              <p className="text-sm text-gray-600">Enviamos um resumo para o seu e-mail, com as orientações e os documentos.</p>
              <p className="text-sm font-bold text-gray-800">{reserva.dia}, {reserva.horario}{inicio ? ` · início ${inicio}` : ''} · {reserva.psicologa}</p>
              <button type="button" onClick={onFechar} className="rounded-xl bg-[#0f3d63] text-white font-bold py-3 px-8 mt-2">Fechar</button>
            </div>
          )}

          {etapa === 'form' && reserva && (
            <form className="grid gap-4" noValidate onSubmit={(e) => { e.preventDefault(); void salvar(); }}>
              <div className="rounded-xl bg-amber-50 text-amber-900 px-3 py-2 text-sm font-bold" role="timer" aria-live="off">
                ⏱ Horário reservado para você por 20 min — {reserva.dia}, {reserva.horario} · {reserva.psicologa} <span className="tabular-nums">(restam {mmss})</span>
              </div>
              {inicio && <p className="text-sm text-gray-700 -mt-2">Início previsto: <b>{inicio}</b> (atendimento semanal, mesmo dia e horário).</p>}

              <fieldset className="grid gap-3">
                <legend className="text-xs font-black uppercase tracking-widest text-gray-500 mb-1">Dados do paciente (quem vai ser atendido)</legend>
                <div className="grid sm:grid-cols-2 gap-3">
                  {campo('nome', 'Nome completo do paciente', { largo: true, ph: 'Nome de quem vai ser atendido' })}
                  {campo('cpf', 'CPF do paciente', { mascara: mascaraCpf, modo: 'numeric', ph: '000.000.000-00' })}
                  {campo('nascimento', 'Data de nascimento do paciente', { mascara: mascaraData, modo: 'numeric', ph: 'dd/mm/aaaa' })}
                  <label className="grid gap-1 text-xs font-bold text-gray-600">
                    <span>Sexo do paciente<i className="not-italic text-red-600"> *</i></span>
                    <select value={d.sexo} onChange={(e) => set('sexo', e.target.value)} className={`${campoCls} ${marca('sexo')}`}>
                      <option value=""></option>
                      {SEXOS.map((x) => <option key={x}>{x}</option>)}
                    </select>
                  </label>
                  {campo('telefone', 'Telefone (WhatsApp)', { mascara: mascaraTelefone, modo: 'tel', ph: '(48) 9 0000-0000' })}
                  {campo('email', 'E-mail', { tipo: 'email', modo: 'email', ph: 'email@exemplo.com', largo: true })}
                </div>
              </fieldset>

              <fieldset className="grid gap-3">
                <legend className="text-xs font-black uppercase tracking-widest text-gray-500 mb-1">Endereço {buscandoCep && <span className="normal-case font-semibold">· buscando…</span>}</legend>
                <div className="grid sm:grid-cols-2 gap-3">
                  <label className="grid gap-1 text-xs font-bold text-gray-600">
                    <span>CEP<i className="not-italic text-red-600"> *</i></span>
                    <input value={d.cep} inputMode="numeric" placeholder="88132-000" autoComplete="off" className={`${campoCls} ${marca('cep')}`}
                      onChange={(e) => { const v = mascaraCep(e.target.value); set('cep', v); if (v.replace(/\D/g, '').length === 8) void buscarCep(v); }} />
                  </label>
                  {campo('rua', 'Rua')}
                  {campo('numero', 'Número', { modo: 'numeric' })}
                  {campo('complemento', 'Complemento', { opcional: true, ph: 'Apto, bloco… (se houver)' })}
                  {campo('bairro', 'Bairro')}
                  {campo('cidade', 'Cidade')}
                </div>
              </fieldset>

              <fieldset className="grid gap-3">
                <legend className="text-xs font-black uppercase tracking-widest text-gray-500 mb-1">Plano de saúde e médico</legend>
                <div className="grid sm:grid-cols-2 gap-3">
                  <label className="grid gap-1 text-xs font-bold text-gray-600 sm:col-span-2">
                    <span>Plano de saúde<i className="not-italic text-red-600"> *</i></span>
                    <select value={d.plano} onChange={(e) => set('plano', e.target.value)} className={`${campoCls} ${marca('plano')}`}>
                      <option value=""></option>
                      {reserva.planos.map((p) => <option key={p}>{p}</option>)}
                    </select>
                  </label>
                  {campo('carteirinha', 'Número da carteirinha do paciente', { largo: true, modo: 'numeric', ph: 'Como está na carteirinha' })}
                  {campo('crm', 'CRM do médico que fez o pedido', { largo: true, modo: 'numeric', ph: 'Ex.: 12345' })}
                </div>
              </fieldset>

              <fieldset className="grid gap-2">
                <legend className="text-xs font-black uppercase tracking-widest text-gray-500 mb-1">Documentos (foto ou PDF) — todos obrigatórios</legend>
                {anexosVisiveis.map((a) => (
                  <label key={a.tipo} className={`flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5 cursor-pointer ${arqs[a.tipo] ? 'border-green-500 bg-green-50' : 'border-dashed border-gray-300'} ${marca('anexo_' + a.tipo)}`}>
                    <span className="grid text-sm text-gray-800"><span>{a.nome}<i className="not-italic text-red-600"> *</i></span><small className="text-xs text-gray-500">{arqs[a.tipo]?.nome ?? a.dica}</small></span>
                    <b className={`text-xs ${arqs[a.tipo] ? 'text-green-700' : 'text-[#0f3d63]'}`}>{arqs[a.tipo] ? '✓ Enviado' : 'Anexar'}</b>
                    <input type="file" accept="image/*,application/pdf" className="sr-only" onChange={(e) => { void escolher(a.tipo, e.target.files?.[0]); e.target.value = ''; }} />
                  </label>
                ))}
                {qr && <p className="text-xs text-gray-600">Carteirinha Unimed que começa com 0025: abra o <b>app da Unimed</b>, vá na carteirinha, tire um <b>print do QR Code</b> e anexe aqui.</p>}
              </fieldset>

              <label className={`flex gap-2 items-start text-sm text-gray-700 rounded-xl p-2 ${marca('aceite')}`}>
                <input type="checkbox" className="mt-1" checked={aceite} onChange={(e) => { setAceite(e.target.checked); setFalta((f) => f.filter((x) => x !== 'aceite')); }} />
                Autorizo a Clínica Hope a usar estes dados só para o atendimento e a autorização junto ao plano (LGPD).
              </label>

              {falta.length > 0 && (
                <p className="text-sm font-bold text-red-700" role="alert">Falta preencher ou anexar: {falta.map((k) => (k === 'aceite' ? 'autorização (LGPD)' : nomeCampo(k))).join(', ')}.</p>
              )}
              {erro && <p className="text-sm font-bold text-red-700" role="alert">{erro}</p>}
              <button type="submit" disabled={enviando} className="rounded-xl bg-[#0f3d63] text-white font-black py-3.5 disabled:opacity-60">{enviando ? 'Enviando…' : 'Salvar'}</button>
              <button type="button" onClick={fechar} className="text-sm font-bold text-gray-500 underline">Desistir e liberar o horário</button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
