// Agendamento pelo site (prévia APROVADA por Jorge em 03/11/2026; cadastro em etapas e opção Particular APROVADOS em 10/11/2026).
// A pessoa escolhe dia, hora e convênio no cartão da especialista e clica em "Enviar sua solicitação":
//  1) o sistema da clínica trava o horário por 30 minutos (Jorge, 03/11/2026) (para quem estiver no site ele aparece "em agendamento");
//  2) aqui mesmo, no site, ela preenche os dados do PACIENTE e anexa os documentos (tudo obrigatório, só o complemento não);
//  3) ao salvar: "Recebemos seus dados" + e-mail com os dados, as regras e os documentos; a equipe valida e confirma pelo WhatsApp.
// Desistiu (fechou) antes de salvar: o horário é liberado na hora. Saiu para buscar um documento e voltou (ou a página recarregou):
// continua a mesma reserva e o que já foi digitado (guardado só nesta aba, até salvar, desistir ou vencer; sem os arquivos).
import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  ANEXOS, MAX_ANEXO_BYTES, MAX_TOTAL_BYTES, SEXOS, ehParticular, faltando, mascaraCep, mascaraCpf, mascaraData, mascaraTelefone, nomeCampo, pedeQr,
  type Dados, type TipoAnexo,
} from '../lib/agendamentoRegras';

const SISTEMA = 'https://www.hopecore.com.br';
const VAZIO: Dados = { nome: '', cpf: '', nascimento: '', sexo: '', telefone: '', email: '', cep: '', rua: '', numero: '', complemento: '', bairro: '', cidade: '', uf: '', plano: '', carteirinha: '', crm: '' };

/** Cadastro em etapas (Jorge 10/11/2026): mesmos campos de antes, uma parte por vez. `campos` = chaves de `faltando` conferidas na etapa. */
const ETAPAS: { id: string; titulo: string; campos: string[] }[] = [
  { id: 'plano', titulo: 'Atendimento', campos: ['plano'] },
  { id: 'paciente', titulo: 'Paciente', campos: ['nome', 'nascimento', 'sexo', 'cpf'] },
  { id: 'endereco', titulo: 'Endereço', campos: ['cep', 'rua', 'numero', 'bairro', 'cidade'] },
  { id: 'contato', titulo: 'Contato', campos: ['email', 'telefone'] },
  { id: 'pedido', titulo: 'Pedido médico', campos: ['anexo_pedido_medico', 'crm'] },
  { id: 'documentos', titulo: 'Documentos', campos: ['carteirinha', 'anexo_carteirinha', 'anexo_qr', 'anexo_rg'] },
  { id: 'confirmar', titulo: 'Confirmar', campos: ['aceite'] },
];
/** Idade em anos a partir de dd/mm/aaaa (null se a data não estiver completa). */
function idadeDe(nasc: string, hoje = new Date()): number | null {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(nasc.trim());
  if (!m) return null;
  let i = hoje.getFullYear() - Number(m[3]);
  if (hoje.getMonth() + 1 < Number(m[2]) || (hoje.getMonth() + 1 === Number(m[2]) && hoje.getDate() < Number(m[1]))) i--;
  return i >= 0 && i <= 120 ? i : null;
}

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
  const [passo, setPasso] = useState(0);
  // Particular ou plano (Jorge 10/11/2026): Particular pula o pedido médico e a carteirinha (migration 183).
  const [modo, setModo] = useState<'' | 'particular' | 'plano'>('');
  const enviado = useRef(false);
  const caminhoRef = useRef<string | null>(null);

  const chave = `agsite:${slug}|${dia}|${hora}`;
  const ler = (k: string) => { try { return JSON.parse(sessionStorage.getItem(k) || 'null'); } catch { return null; } };
  const gravar = (k: string, v: unknown) => { try { sessionStorage.setItem(k, JSON.stringify(v)); } catch { /* aba privada: segue sem guardar */ } };
  const limpar = () => { try { sessionStorage.removeItem(chave); sessionStorage.removeItem(chave + ':dados'); sessionStorage.removeItem(chave + ':passo'); } catch { /* nada */ } };

  // 1) trava o horário (uma vez) — ou retoma a reserva desta aba, se ainda vale
  useEffect(() => {
    let vivo = true;
    const salva = ler(chave) as Reserva | null;
    if (salva?.caminho && new Date(salva.expira_em).getTime() > Date.now() + 5000) {
      caminhoRef.current = salva.caminho;
      setReserva(salva);
      const rascunho = ler(chave + ':dados') as Dados | null;
      setD(rascunho ? { ...VAZIO, ...rascunho } : { ...VAZIO, plano: planoDoSistema(planoSite, salva.planos ?? []) });
      const p = Number(ler(chave + ':passo'));
      if (Number.isInteger(p) && p > 0 && p < ETAPAS.length) setPasso(p);
      setEtapa('form');
      return () => { vivo = false; };
    }
    void (async () => {
      try {
        const r = await fetch(`${SISTEMA}/api/site/agendar`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ acao: 'reservar', slug, dia, hora }) });
        const j = await r.json().catch(() => ({})) as Partial<Reserva> & { ok?: boolean; erro?: string };
        if (!vivo) return;
        if (!j.ok || !j.caminho) { setErro(j.erro || 'Não foi possível reservar este horário agora. Tente de novo.'); setEtapa('erro'); return; }
        const res = j as Reserva;
        caminhoRef.current = res.caminho;
        gravar(chave, res);
        setReserva(res);
        setD((x) => ({ ...x, plano: planoDoSistema(planoSite, res.planos ?? []) }));
        setEtapa('form');
      } catch {
        if (vivo) { setErro('Sem conexão. Confira a internet e tente de novo.'); setEtapa('erro'); }
      }
    })();
    return () => { vivo = false; };
  }, [slug, dia, hora, planoSite]); // eslint-disable-line react-hooks/exhaustive-deps

  // o que já foi digitado fica guardado nesta aba (sem os arquivos) para não perder ao sair e voltar
  useEffect(() => { if (etapa === 'form') gravar(chave + ':dados', d); }, [d, etapa]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (etapa === 'form') gravar(chave + ':passo', passo); }, [passo, etapa]); // eslint-disable-line react-hooks/exhaustive-deps

  // contagem regressiva dos 30 min
  useEffect(() => {
    if (etapa !== 'form') return;
    const t = setInterval(() => setAgora(Date.now()), 1000);
    return () => clearInterval(t);
  }, [etapa]);
  const restam = reserva ? Math.max(0, Math.floor((new Date(reserva.expira_em).getTime() - agora) / 1000)) : 0;
  useEffect(() => { if (etapa === 'form' && reserva && restam === 0) { limpar(); setEtapa('tempo'); } }, [etapa, reserva, restam]); // eslint-disable-line react-hooks/exhaustive-deps

  // desistiu (botão Desistir ou ×) antes de salvar: libera o horário na hora. Sair da página NÃO libera
  // (a pessoa pode ter ido buscar um documento); se não voltar, a reserva vence sozinha em 30 min.
  const liberar = () => {
    const c = caminhoRef.current;
    limpar();
    if (!c || enviado.current) return;
    caminhoRef.current = null;
    try { void fetch(`${SISTEMA}/api/site/agendar`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ acao: 'desistir', caminho: c }), keepalive: true }); } catch { /* vence sozinho em 30 min */ }
  };
  const fechar = () => { liberar(); onFechar(); };

  const part = ehParticular(d.plano);
  useEffect(() => { if (etapa === 'form' && !modo && d.plano) setModo(ehParticular(d.plano) ? 'particular' : 'plano'); }, [etapa, d.plano]); // eslint-disable-line react-hooks/exhaustive-deps
  const etapas = part ? ETAPAS.filter((e) => e.id !== 'pedido') : ETAPAS;
  const etapaDoCampo = (k: string) => Math.max(0, etapas.findIndex((e) => e.campos.includes(k)));
  const planosConvenio = (reserva?.planos ?? []).filter((p) => !ehParticular(p));
  const particularNome = (reserva?.planos ?? []).find((p) => ehParticular(p)) ?? '';
  const qr = !part && pedeQr(d.plano, d.carteirinha);
  const anexosVisiveis = ANEXOS.filter((a) => (part ? a.tipo === 'rg' : a.tipo !== 'qr' || qr));
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
    const tipos = (Object.keys(arqs) as TipoAnexo[]).filter((t) => (part ? t === 'rg' : t !== 'qr' || qr));
    const f = faltando(d, tipos, reserva.planos);
    if (!aceite) f.push('aceite');
    setFalta(f);
    if (f.length) { setPasso(etapaDoCampo(f[0])); document.getElementById('agsite-topo')?.scrollIntoView({ behavior: 'smooth' }); return; }
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
      if (j.ok) { enviado.current = true; limpar(); setEtapa('ok'); }
      else { setErro(j.erro ?? 'Não foi possível enviar. Tente de novo.'); if (j.campos?.length) { setFalta(j.campos); setPasso(etapaDoCampo(j.campos[0])); } }
    } catch { setErro('Sem conexão. Confira a internet e tente de novo.'); }
    setEnviando(false);
  }

  // Avança só com a etapa completa (mesmas regras do envio); na última, envia.
  async function avancar() {
    setErro('');
    if (!reserva) return;
    if (etapas[passo].id === 'plano' && !modo) { setErro('Escolha Particular ou Plano de saúde.'); return; }
    if (passo === etapas.length - 1) { await salvar(); return; }
    const tipos = (Object.keys(arqs) as TipoAnexo[]).filter((t) => (part ? t === 'rg' : t !== 'qr' || qr));
    const f = faltando(d, tipos, reserva.planos).filter((k) => etapas[passo].campos.includes(k));
    setFalta(f);
    if (f.length) return;
    setPasso(passo + 1);
    document.getElementById('agsite-topo')?.scrollIntoView({ behavior: 'smooth' });
  }
  const voltar = () => { setErro(''); setFalta([]); setPasso((p) => Math.max(0, p - 1)); };
  const idade = idadeDe(d.nascimento);
  const anexo = (tipo: TipoAnexo) => {
    const a = ANEXOS.find((x) => x.tipo === tipo)!;
    return (
      <label className={`flex items-center justify-between gap-3 rounded-xl border px-3 py-3 cursor-pointer ${arqs[tipo] ? 'border-green-500 bg-green-50' : 'border-dashed border-gray-300'} ${marca('anexo_' + tipo)}`}>
        <span className="grid text-sm text-gray-800"><span>{a.nome}<i className="not-italic text-red-600"> *</i></span><small className="text-xs text-gray-500">{arqs[tipo]?.nome ?? `${a.dica} · foto ou PDF`}</small></span>
        <b className={`text-xs ${arqs[tipo] ? 'text-green-700' : 'text-[#0f3d63]'}`}>{arqs[tipo] ? '✓ Anexado' : 'Anexar'}</b>
        <input type="file" accept="image/*,application/pdf" className="sr-only" onChange={(e) => { void escolher(tipo, e.target.files?.[0]); e.target.value = ''; }} />
      </label>
    );
  };

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

  // Abre por cima da página inteira (portal no <body>): dentro do cartão animado/recortado da especialista a janela ficava invisível.
  return createPortal(
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
              <p className="text-sm font-bold text-amber-800">O tempo de 30 minutos para finalizar acabou e o horário foi liberado.</p>
              <button type="button" onClick={onFechar} className="rounded-xl bg-[#0f3d63] text-white font-bold py-3">Escolher o horário de novo</button>
            </div>
          )}

          {etapa === 'ok' && reserva && (
            <div className="grid gap-3 py-6 text-center justify-items-center">
              <div className="w-14 h-14 rounded-full bg-green-100 text-green-700 grid place-items-center text-3xl font-black">✓</div>
              <h2 className="text-lg font-black text-gray-900">Recebemos seus dados!</h2>
              <p className="text-sm text-gray-600">{part ? 'Nosso time vai entrar em contato' : 'Nosso time vai validar a autorização junto ao seu plano e entrar em contato'} pelo <b className="text-green-700">WhatsApp</b> para confirmar o seu agendamento.</p>
              <p className="text-sm text-gray-600">Enviamos um resumo para o seu e-mail, com as orientações e os documentos.</p>
              {!part && <p className="text-sm font-bold text-[#0f3d63]">📍 Lembre-se: pelo plano de saúde o atendimento é somente presencial, na clínica (não há atendimento online).</p>}
              <p className="text-sm font-bold text-gray-800">{reserva.dia}, {reserva.horario}{inicio ? ` · início ${inicio}` : ''} · {reserva.psicologa}</p>
              <button type="button" onClick={onFechar} className="rounded-xl bg-[#0f3d63] text-white font-bold py-3 px-8 mt-2">Fechar</button>
            </div>
          )}

          {etapa === 'form' && reserva && (
            <form className="grid gap-4" noValidate onSubmit={(e) => { e.preventDefault(); void avancar(); }}>
              <div className="rounded-xl bg-amber-50 text-amber-900 px-3 py-2 text-sm grid gap-0.5" role="timer" aria-live="off">
                <b>⏱ Finalize seu agendamento: você tem 30 minutos <span className="tabular-nums">(restam {mmss})</span></b>
                <span>{reserva.dia}, {reserva.horario} · {reserva.psicologa}{inicio ? ` · início ${inicio}` : ''}</span>
              </div>

              {/* Cadastro em etapas (Jorge 10/11/2026): uma parte por vez, sem tirar nenhum dado; só avança com a etapa completa. */}
              <div className="grid gap-1.5">
                <div className="flex justify-between text-xs font-bold text-gray-500"><span>Etapa {passo + 1} de {etapas.length}</span><span>{etapas[passo].titulo}</span></div>
                <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden"><div className="h-full bg-[#0f3d63] transition-all" style={{ width: `${((passo + 1) / etapas.length) * 100}%` }} /></div>
              </div>

              {etapas[passo].id === 'plano' && (
                <div className="grid gap-3">
                  <h3 className="text-base font-black text-gray-900">Como será o atendimento?</h3>
                  {particularNome && (
                    <div className="grid grid-cols-2 gap-2">
                      {([['particular', 'Particular'], ['plano', 'Plano de saúde']] as const).map(([m, rot]) => (
                        <button key={m} type="button" aria-pressed={modo === m}
                          onClick={() => { setErro(''); setModo(m); set('plano', m === 'particular' ? particularNome : (ehParticular(d.plano) ? '' : d.plano)); }}
                          className={`rounded-xl border-2 py-3.5 font-black text-sm ${modo === m ? 'border-[#0f3d63] bg-blue-50 text-[#0f3d63]' : 'border-gray-300 text-gray-700'}`}>{rot}</button>
                      ))}
                    </div>
                  )}
                  {(modo === 'plano' || !particularNome) && (
                    <label className="grid gap-1 text-xs font-bold text-gray-600">
                      <span>Qual plano?<i className="not-italic text-red-600"> *</i></span>
                      <select value={part ? '' : d.plano} onChange={(e) => { setModo('plano'); set('plano', e.target.value); }} className={`${campoCls} ${marca('plano')}`}>
                        <option value="">Escolha o plano</option>
                        {planosConvenio.map((p) => <option key={p}>{p}</option>)}
                      </select>
                    </label>
                  )}
                  {/* Aviso pedido por Jorge em 06/11/2026: pelo plano de saúde a clínica atende só presencialmente (não faz online). */}
                  {modo === 'plano' && <div className="rounded-xl border-2 border-[#0f3d63] bg-blue-50 text-[#0f3d63] px-3 py-2.5 text-sm grid gap-1" role="note">
                    <b>📍 Atendimento pelo plano de saúde é somente PRESENCIAL</b>
                    <span>A Clínica Hope <b>não realiza atendimento online</b> pelo plano de saúde. As sessões acontecem na clínica: City Office Square, R. Najla Carone Guedert, 1080 – Pagani, Palhoça/SC.</span>
                  </div>}
                  {inicio && <p className="text-sm text-gray-700">Início previsto: <b>{inicio}</b> (atendimento semanal, mesmo dia e horário).</p>}
                </div>
              )}

              {etapas[passo].id === 'paciente' && (
                <div className="grid gap-3">
                  <h3 className="text-base font-black text-gray-900">Quem vai ser atendido?</h3>
                  {campo('nome', 'Nome completo do paciente', { ph: 'Nome de quem vai ser atendido' })}
                  <div className="grid grid-cols-2 gap-3">
                    {campo('nascimento', 'Data de nascimento', { mascara: mascaraData, modo: 'numeric', ph: 'dd/mm/aaaa' })}
                    <div className="grid gap-1 text-xs font-bold text-gray-600"><span>Idade</span><span className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-900">{idade !== null ? `${idade} ${idade === 1 ? 'ano' : 'anos'}` : '—'}</span></div>
                  </div>
                  <label className="grid gap-1 text-xs font-bold text-gray-600">
                    <span>Sexo do paciente<i className="not-italic text-red-600"> *</i></span>
                    <select value={d.sexo} onChange={(e) => set('sexo', e.target.value)} className={`${campoCls} ${marca('sexo')}`}>
                      <option value=""></option>
                      {SEXOS.map((x) => <option key={x}>{x}</option>)}
                    </select>
                  </label>
                  {campo('cpf', 'CPF do paciente', { mascara: mascaraCpf, modo: 'numeric', ph: '000.000.000-00' })}
                </div>
              )}

              {etapas[passo].id === 'endereco' && (
                <div className="grid gap-3">
                  <h3 className="text-base font-black text-gray-900">Onde o paciente mora? {buscandoCep && <span className="text-xs font-semibold text-gray-500">· buscando…</span>}</h3>
                  <label className="grid gap-1 text-xs font-bold text-gray-600">
                    <span>CEP<i className="not-italic text-red-600"> *</i></span>
                    <input value={d.cep} inputMode="numeric" placeholder="88132-000" autoComplete="off" className={`${campoCls} ${marca('cep')}`}
                      onChange={(e) => { const v = mascaraCep(e.target.value); set('cep', v); if (v.replace(/\D/g, '').length === 8) void buscarCep(v); }} />
                  </label>
                  {d.cep.replace(/\D/g, '').length === 8 && (
                    <div className="grid grid-cols-2 gap-3">
                      {campo('rua', 'Rua', { largo: true })}
                      {campo('numero', 'Número', { modo: 'numeric' })}
                      {campo('complemento', 'Complemento', { opcional: true, ph: 'Apto, bloco…' })}
                      {campo('bairro', 'Bairro')}
                      {campo('cidade', 'Cidade')}
                    </div>
                  )}
                </div>
              )}

              {etapas[passo].id === 'contato' && (
                <div className="grid gap-3">
                  <h3 className="text-base font-black text-gray-900">Para onde enviamos a confirmação?</h3>
                  {campo('email', 'E-mail', { tipo: 'email', modo: 'email', ph: 'email@exemplo.com' })}
                  {campo('telefone', 'Telefone (WhatsApp)', { mascara: mascaraTelefone, modo: 'tel', ph: '(48) 9 0000-0000' })}
                </div>
              )}

              {etapas[passo].id === 'pedido' && (
                <div className="grid gap-3">
                  <h3 className="text-base font-black text-gray-900">Pedido médico</h3>
                  <div className="rounded-xl bg-amber-50 text-amber-900 px-3 py-2.5 text-sm font-bold" role="note">Sem o pedido médico o plano não autoriza o atendimento. Este anexo é obrigatório.</div>
                  {anexo('pedido_medico')}
                  {campo('crm', 'CRM do médico que fez o pedido', { modo: 'numeric', ph: 'Ex.: 12345' })}
                </div>
              )}

              {etapas[passo].id === 'documentos' && (
                <div className="grid gap-3">
                  <h3 className="text-base font-black text-gray-900">{part ? 'Documento do paciente' : 'Carteirinha e documento do paciente'}</h3>
                  {!part && campo('carteirinha', 'Número da carteirinha do paciente', { modo: 'numeric', ph: 'Como está na carteirinha' })}
                  {!part && anexo('carteirinha')}
                  {qr && anexo('qr')}
                  {qr && <p className="text-xs text-gray-600 -mt-1">Carteirinha Unimed que começa com 0025: abra o <b>app da Unimed</b>, vá na carteirinha, tire um <b>print do QR Code</b> e anexe aqui.</p>}
                  {anexo('rg')}
                </div>
              )}

              {etapas[passo].id === 'confirmar' && (
                <div className="grid gap-3">
                  <h3 className="text-base font-black text-gray-900">Confira e finalize</h3>
                  <dl className="grid text-sm">
                    {([
                      ['Atendimento', part ? 'Particular' : d.plano], ['Paciente', d.nome], ['Nascimento', `${d.nascimento}${idade !== null ? ` (${idade} anos)` : ''}`], ['CPF', d.cpf],
                      ['Endereço', [d.rua, d.numero, d.complemento, d.bairro, d.cidade].filter(Boolean).join(', ')], ['E-mail', d.email], ['WhatsApp', d.telefone],
                      ['Documentos', anexosVisiveis.map((a) => a.nome).join(', ')],
                    ] as [string, string][]).map(([k, v]) => (
                      <div key={k} className="flex justify-between gap-3 border-b border-gray-100 py-1.5"><dt className="text-gray-500">{k}</dt><dd className="text-right text-gray-900 font-semibold">{v}</dd></div>
                    ))}
                  </dl>
                  <label className={`flex gap-2 items-start text-sm text-gray-700 rounded-xl p-2 ${marca('aceite')}`}>
                    <input type="checkbox" className="mt-1" checked={aceite} onChange={(e) => { setAceite(e.target.checked); setFalta((f) => f.filter((x) => x !== 'aceite')); }} />
                    Autorizo a Clínica Hope a usar estes dados só para o atendimento e a autorização junto ao plano (LGPD).
                  </label>
                </div>
              )}

              {falta.length > 0 && (
                <p className="text-sm font-bold text-red-700" role="alert">Falta preencher ou anexar: {falta.map((k) => (k === 'aceite' ? 'autorização (LGPD)' : nomeCampo(k))).join(', ')}.</p>
              )}
              {erro && <p className="text-sm font-bold text-red-700" role="alert">{erro}</p>}
              <div className="flex gap-2">
                {passo > 0 && <button type="button" onClick={voltar} className="flex-1 rounded-xl border border-gray-300 text-gray-700 font-bold py-3.5">Voltar</button>}
                <button type="submit" disabled={enviando} className="flex-[2] rounded-xl bg-[#0f3d63] text-white font-black py-3.5 disabled:opacity-60">
                  {enviando ? 'Enviando…' : passo === etapas.length - 1 ? 'Finalizar agendamento' : 'Continuar'}
                </button>
              </div>
              <button type="button" onClick={fechar} className="text-sm font-bold text-gray-500 underline">Desistir e liberar o horário</button>
            </form>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
