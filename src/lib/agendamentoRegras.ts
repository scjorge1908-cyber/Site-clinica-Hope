// Cópia das regras do formulário de agendamento do sistema da clínica (hope-core: apps/web/lib/agendamento-link/regras.ts).
// Só para avisar cedo na tela: o servidor da clínica confere tudo de novo antes de gravar. Mantenha igual à original.

export type TipoAnexo = 'carteirinha' | 'pedido_medico' | 'rg' | 'qr'
export const ANEXOS: { tipo: TipoAnexo; nome: string; dica: string }[] = [
  { tipo: 'carteirinha', nome: 'Carteirinha do plano', dica: 'frente' },
  { tipo: 'pedido_medico', nome: 'Pedido médico', dica: 'encaminhamento do médico' },
  { tipo: 'rg', nome: 'RG ou CNH do paciente', dica: 'do paciente (não do responsável)' },
  { tipo: 'qr', nome: 'QR Code da carteirinha Unimed', dica: 'print do app' },
]
export const SEXOS = ['Feminino', 'Masculino', 'Outro', 'Prefiro não informar'] as const
export const PRAZOS: { minutos: 30 | 180 | 360; nome: string }[] = [
  { minutos: 30, nome: '30 minutos' }, { minutos: 180, nome: '3 horas' }, { minutos: 360, nome: '6 horas' },
]
export const MAX_ANEXO_BYTES = 5 * 1024 * 1024
/** O servidor (Vercel) aceita até ~4,5 MB por envio: a página reduz as fotos antes de enviar e confere o total. */
export const MAX_TOTAL_BYTES = 4_300_000
export const MIMES: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'application/pdf': 'pdf' }

export type Dados = {
  nome: string; cpf: string; nascimento: string; sexo: string; telefone: string; email: string
  cep: string; rua: string; numero: string; complemento: string; bairro: string; cidade: string; uf: string
  plano: string; carteirinha: string; crm: string
}
export const CAMPOS: (keyof Dados)[] = ['nome', 'cpf', 'nascimento', 'sexo', 'telefone', 'email', 'cep', 'rua', 'numero', 'complemento', 'bairro', 'cidade', 'uf', 'plano', 'carteirinha', 'crm']
const NOMES: Record<string, string> = {
  nome: 'Nome completo do paciente', cpf: 'CPF', nascimento: 'Data de nascimento', sexo: 'Sexo', telefone: 'Telefone principal', email: 'E-mail',
  cep: 'CEP', rua: 'Rua', bairro: 'Bairro', cidade: 'Cidade', numero: 'Número do endereço', plano: 'Plano de saúde', carteirinha: 'Número da carteirinha', crm: 'CRM do médico',
  anexo_carteirinha: 'Carteirinha do plano', anexo_pedido_medico: 'Pedido médico', anexo_rg: 'RG ou CNH do paciente', anexo_qr: 'QR Code da carteirinha Unimed',
}
export const nomeCampo = (k: string) => NOMES[k] ?? k

const so = (v: string | undefined) => String(v ?? '').replace(/\D/g, '')

/** Mesma regra da Agenda (ehUnimed0025): carteirinha Unimed que começa com 0025 (ou 25) pede o QR Code. */
export function pedeQr(plano: string, carteirinha: string) {
  if (!String(plano ?? '').toUpperCase().includes('UNIMED')) return false
  const d = so(carteirinha)
  return d.startsWith('0025') || d.startsWith('25')
}

export function cpfValido(v: string) {
  const d = so(v)
  if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false
  const dig = (n: number) => {
    let s = 0
    for (let i = 0; i < n; i++) s += Number(d[i]) * (n + 1 - i)
    const r = (s * 10) % 11
    return r === 10 ? 0 : r
  }
  return dig(9) === Number(d[9]) && dig(10) === Number(d[10])
}

/** dd/mm/aaaa válida e no passado (até 120 anos). */
export function nascimentoValido(v: string, hoje = new Date()) {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(String(v ?? '').trim())
  if (!m) return false
  const d = new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]))
  if (d.getDate() !== Number(m[1]) || d.getMonth() !== Number(m[2]) - 1) return false
  return d <= hoje && hoje.getFullYear() - d.getFullYear() <= 120
}

/** O que falta (chaves) para enviar. `anexos` = tipos já escolhidos. */
export function faltando(d: Partial<Dados>, anexos: TipoAnexo[], planos: string[]): string[] {
  const f: string[] = []
  const vazio = (k: keyof Dados) => !String(d[k] ?? '').trim()
  // Jorge 03/11/2026: todos os dados obrigatórios (só o complemento fica opcional)
  for (const k of ['nome', 'cpf', 'nascimento', 'sexo', 'telefone', 'email', 'cep', 'rua', 'numero', 'bairro', 'cidade', 'plano', 'carteirinha', 'crm'] as (keyof Dados)[]) if (vazio(k)) f.push(k)
  if (!vazio('nome') && String(d.nome).trim().split(/\s+/).length < 2) f.push('nome')
  if (!vazio('cpf') && !cpfValido(String(d.cpf))) f.push('cpf')
  if (!vazio('nascimento') && !nascimentoValido(String(d.nascimento))) f.push('nascimento')
  if (!vazio('sexo') && !(SEXOS as readonly string[]).includes(String(d.sexo))) f.push('sexo')
  if (!vazio('telefone') && so(d.telefone).length < 10) f.push('telefone')
  if (!vazio('email') && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(d.email).trim())) f.push('email')
  if (!vazio('cep') && so(d.cep).length !== 8) f.push('cep')
  if (!vazio('plano') && !planos.includes(String(d.plano))) f.push('plano')
  if (!vazio('crm') && !/^\d{1,8}$/.test(so(d.crm)) ) f.push('crm')
  const precisa: TipoAnexo[] = ['carteirinha', 'pedido_medico', 'rg', ...(pedeQr(String(d.plano ?? ''), String(d.carteirinha ?? '')) ? ['qr' as const] : [])]
  for (const t of precisa) if (!anexos.includes(t)) f.push('anexo_' + t)
  return [...new Set(f)]
}

/** Formato pelo conteúdo do arquivo (não confia no nome nem no tipo informado). */
export function mimeDoConteudo(b: Uint8Array): string | null {
  if (b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'image/jpeg'
  if (b.length > 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return 'image/png'
  if (b.length > 12 && String.fromCharCode(...b.slice(0, 4)) === 'RIFF' && String.fromCharCode(...b.slice(8, 12)) === 'WEBP') return 'image/webp'
  if (b.length > 4 && String.fromCharCode(...b.slice(0, 5)) === '%PDF-') return 'application/pdf'
  return null
}

/** Caminho do endereço: só letras, números e "-" (o código vem no fim). */
export const caminhoValido = (c: string) => /^[a-z0-9-]{1,80}-[A-Za-z0-9]{16,40}$/.test(String(c ?? ''))

export const mascaraCep = (v: string) => { const d = so(v).slice(0, 8); return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d }
export function mascaraCpf(v: string) {
  const d = so(v).slice(0, 11)
  return d.replace(/^(\d{3})(\d)/, '$1.$2').replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3').replace(/\.(\d{3})(\d)/, '.$1-$2')
}
export function mascaraTelefone(v: string) {
  const d = so(v).slice(0, 11)
  if (d.length <= 2) return d
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
}
export function mascaraData(v: string) {
  const d = so(v).slice(0, 8)
  return d.length > 4 ? `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}` : d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d
}

