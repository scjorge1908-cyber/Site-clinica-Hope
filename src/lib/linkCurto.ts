// Link curto de cada profissional: primeiro nome + último sobrenome (ex.: /brenna-vasconcelo).
// A mesma regra está em scripts/prerender.mjs (linkCurto) — mude as duas juntas.
const TITULOS = new Set(['psi', 'psic', 'psicologa', 'psicologo', 'dr', 'dra']);
const PARTICULAS = new Set(['da', 'de', 'do', 'das', 'dos', 'e']);

export function linkCurtoDoNome(nome?: string): string {
  const palavras = String(nome || '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean);
  while (palavras.length && TITULOS.has(palavras[0])) palavras.shift();
  const uteis = palavras.filter((p) => !PARTICULAS.has(p));
  if (!uteis.length) return '';
  return uteis.length === 1 ? uteis[0] : `${uteis[0]}-${uteis[uteis.length - 1]}`;
}

/** Mapa link-curto → id do profissional. Links repetidos ou iguais ao endereço de outra pessoa ficam de fora. */
export function mapaLinksCurtos(lista: { id: string; name: string; slug?: string }[], reservados: (s: string) => boolean): Map<string, string> {
  const contagem = new Map<string, number>();
  const porId = new Map<string, string>();
  for (const s of lista) {
    const c = linkCurtoDoNome(s.name);
    if (!c) continue;
    porId.set(s.id, c);
    contagem.set(c, (contagem.get(c) || 0) + 1);
  }
  const slugs = new Map(lista.filter((s) => s.slug).map((s) => [String(s.slug).toLowerCase(), s.id]));
  const mapa = new Map<string, string>();
  for (const [id, c] of porId) {
    if (contagem.get(c)! > 1 || reservados(c)) continue;
    const dono = slugs.get(c);
    if (dono && dono !== id) continue;
    mapa.set(c, id);
  }
  return mapa;
}
