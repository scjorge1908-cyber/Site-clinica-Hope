// Página pública de VALIDAÇÃO das declarações da Clínica Hope (Jorge, 03/11/2026): clinicahopebrasil.com.br/validar
// Quem recebe a declaração (escola, empresa) digita o código impresso no PDF e confere se ela foi emitida pela clínica.
// Consulta o HopeCore pela função pública declaracao_verificar (migration 155): sem login, devolve só o necessário
// para conferir o papel — datas, horário, profissional e o nome do paciente ABREVIADO (LGPD). Nada é gravado.
import { useEffect, useState, type FormEvent } from 'react';
import { createClient } from '@supabase/supabase-js';
import { CheckCircle2, Search, XCircle } from 'lucide-react';
import { HOPECORE_CHAVE_PUBLICA, HOPECORE_URL } from './lib/agendaHopeCore';

type Resultado =
  | { valida: false }
  | {
      valida: true;
      tipo: 'attendance' | 'companion';
      paciente: string | null;
      acompanhante: string | null;
      profissional: string | null;
      crp: string | null;
      clinica: string | null;
      data: string | null;
      hora_inicio: string | null;
      hora_fim: string | null;
      emitida_em: string;
    };

const FORMATO_CODIGO = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

const dataExtenso = (iso: string | null) => {
  if (!iso) return '—';
  const [a, m, d] = iso.slice(0, 10).split('-');
  return `${d} de ${MESES[Number(m) - 1]} de ${a}`;
};
const emitidaBR = (iso: string) =>
  new Date(iso).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).replace(',', ' às');

async function verificar(codigo: string): Promise<Resultado> {
  const sb = createClient(HOPECORE_URL, HOPECORE_CHAVE_PUBLICA, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await sb.rpc('declaracao_verificar', { p_codigo: codigo });
  if (error) throw new Error('Não foi possível consultar agora. Tente novamente em alguns minutos.');
  return data as Resultado;
}

export default function ValidarDeclaracao() {
  const inicial = new URLSearchParams(window.location.search).get('codigo')?.trim() ?? '';
  const [codigo, setCodigo] = useState(inicial);
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [consultando, setConsultando] = useState(false);

  const consultar = async (c: string) => {
    const limpo = c.trim().toLowerCase();
    setResultado(null);
    setErro(null);
    if (!FORMATO_CODIGO.test(limpo)) {
      setErro('Digite o código completo, como está na declaração (ex.: 7e96cca8-8747-4b16-9084-d7794d18a9b2).');
      return;
    }
    setConsultando(true);
    try {
      setResultado(await verificar(limpo));
      window.history.replaceState(null, '', `/validar?codigo=${limpo}`);
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível consultar agora.');
    } finally {
      setConsultando(false);
    }
  };

  useEffect(() => {
    document.title = 'Validar declaração | Clínica Hope';
    if (inicial) void consultar(inicial);
  }, []);

  const enviar = (e: FormEvent) => {
    e.preventDefault();
    void consultar(codigo);
  };

  return (
    <main className="min-h-screen bg-background text-on-background font-sans">
      <header className="bg-white border-b border-outline-alt">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <a href="/" className="flex items-center gap-3">
            <img src="/logo-hope.png" alt="" className="h-10 w-10 object-contain" />
            <span className="text-lg font-bold text-primary">Clínica Hope</span>
          </a>
        </div>
      </header>

      <section className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-primary">Validar declaração</h1>
        <p className="mt-2 text-on-surface-variant">
          Confira se uma declaração de comparecimento foi emitida pela Clínica Hope. Digite o código de verificação
          impresso na caixa cinza da declaração.
        </p>

        <form onSubmit={enviar} className="mt-6 flex flex-col sm:flex-row gap-3">
          <label className="sr-only" htmlFor="codigo">Código de verificação</label>
          <input
            id="codigo"
            value={codigo}
            onChange={(e) => setCodigo(e.target.value)}
            placeholder="Código de verificação"
            autoComplete="off"
            spellCheck={false}
            className="flex-1 rounded-xl border border-outline-alt bg-white px-4 py-3 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button
            type="submit"
            disabled={consultando}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 font-semibold text-on-primary disabled:opacity-60"
          >
            <Search size={18} aria-hidden />
            {consultando ? 'Consultando…' : 'Validar'}
          </button>
        </form>

        {erro && <p role="alert" className="mt-4 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-amber-900">{erro}</p>}

        {resultado && !resultado.valida && (
          <div role="status" className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5">
            <p className="flex items-center gap-2 text-lg font-bold text-red-800"><XCircle aria-hidden /> Código não encontrado</p>
            <p className="mt-2 text-red-900">
              Não há declaração da Clínica Hope com este código. Confira se foi digitado exatamente como está no documento.
              Se continuar sem encontrar, a declaração não deve ser aceita — fale com a clínica para confirmar.
            </p>
          </div>
        )}

        {resultado && resultado.valida && (
          <div role="status" className="mt-6 rounded-2xl border border-green-200 bg-green-50 p-5">
            <p className="flex items-center gap-2 text-lg font-bold text-green-800"><CheckCircle2 aria-hidden /> Declaração válida</p>
            <p className="mt-1 text-green-900">Emitida pela {resultado.clinica ?? 'Clínica Hope'} em {emitidaBR(resultado.emitida_em)}.</p>
            <dl className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
              {resultado.tipo === 'companion' && (
                <div><dt className="text-on-surface-variant">Acompanhante</dt><dd className="font-semibold">{resultado.acompanhante ?? '—'}</dd></div>
              )}
              <div><dt className="text-on-surface-variant">Paciente</dt><dd className="font-semibold">{resultado.paciente ?? '—'}</dd></div>
              <div><dt className="text-on-surface-variant">Data do atendimento</dt><dd className="font-semibold">{dataExtenso(resultado.data)}</dd></div>
              <div><dt className="text-on-surface-variant">Horário</dt><dd className="font-semibold">{resultado.hora_inicio ?? '—'}{resultado.hora_fim ? ` às ${resultado.hora_fim}` : ''}</dd></div>
              <div className="sm:col-span-2"><dt className="text-on-surface-variant">Profissional</dt><dd className="font-semibold">{resultado.profissional ?? '—'}{resultado.crp ? ` · CRP ${resultado.crp}` : ''}</dd></div>
            </dl>
            <p className="mt-4 text-xs text-on-surface-variant">
              Por privacidade, o nome aparece abreviado. Confira se os dados batem com os da declaração apresentada.
            </p>
          </div>
        )}

        <p className="mt-10 text-sm text-on-surface-variant">
          Dúvidas: <a className="text-primary underline" href="/">clinicahopebrasil.com.br</a>
        </p>
      </section>
    </main>
  );
}
