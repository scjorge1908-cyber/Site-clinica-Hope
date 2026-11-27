/** Aceita "@usuario", "usuario" ou o link do perfil e devolve só o usuário (sem @). Vazio se não for válido. */
export function instagramUsuario(valor?: string): string {
  let v = String(valor || '').trim();
  const link = v.match(/instagram\.com\/([^/?#\s]+)/i);
  if (link) v = link[1];
  v = v.replace(/^@+/, '').trim();
  return /^[a-z0-9._]{1,30}$/i.test(v) ? v : '';
}

export const instagramLink = (usuario: string) => `https://www.instagram.com/${usuario}/`;
