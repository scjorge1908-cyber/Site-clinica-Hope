/**
 * Otimização de imagens no navegador (sem servidor).
 *
 * As fotos do site ficam gravadas no Firestore em base64. Fotos grandes deixam o
 * site lento no celular, porque todas são baixadas antes da página aparecer.
 * Estas funções reduzem a imagem para um tamanho adequado à exibição e a
 * convertem para WebP (menor e com transparência), com JPEG como alternativa.
 */

/** Tamanho máximo (maior lado, em pixels) por tipo de imagem. */
export const IMAGE_MAX_SIZE = {
  specialist: 600, // foto 1:1 do card do especialista
  insurance: 360, // logo de convênio 3:1 (exibido com ~48px de altura)
  logo: 320, // logo da clínica
  hero: 1200, // foto principal 16:9
  sublease: 1000, // fotos das salas 4:3
} as const;

export type ImageKind = keyof typeof IMAGE_MAX_SIZE;

const QUALITY = 0.82;

const loadImage = (src: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    if (!src.startsWith('data:')) image.setAttribute('crossOrigin', 'anonymous');
    image.src = src;
  });

/**
 * Desenha a área indicada de uma imagem num canvas já no tamanho final e
 * devolve um data URL WebP (ou JPEG, se o navegador não gerar WebP).
 */
export const renderToDataUrl = (
  image: CanvasImageSource,
  area: { x: number; y: number; width: number; height: number },
  maxSize: number
): string => {
  const scale = Math.min(1, maxSize / Math.max(area.width, area.height));
  const width = Math.max(1, Math.round(area.width * scale));
  const height = Math.max(1, Math.round(area.height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(image, area.x, area.y, area.width, area.height, 0, 0, width, height);

  const webp = canvas.toDataURL('image/webp', QUALITY);
  if (webp.startsWith('data:image/webp')) return webp;

  // Navegador sem WebP (ex.: Safari antigo): JPEG com fundo branco,
  // para logos transparentes não ficarem com fundo preto.
  const jpgCanvas = document.createElement('canvas');
  jpgCanvas.width = width;
  jpgCanvas.height = height;
  const jctx = jpgCanvas.getContext('2d');
  if (!jctx) return '';
  jctx.fillStyle = '#ffffff';
  jctx.fillRect(0, 0, width, height);
  jctx.drawImage(canvas, 0, 0);
  return jpgCanvas.toDataURL('image/jpeg', QUALITY);
};

/** Recorta e reduz (usado no recorte de imagem do painel admin). */
export const cropAndResize = async (
  imageSrc: string,
  pixelCrop: { x: number; y: number; width: number; height: number },
  maxSize: number
): Promise<string> => {
  const image = await loadImage(imageSrc);
  return renderToDataUrl(image, pixelCrop, maxSize);
};

/**
 * Reduz uma imagem já existente (data URL). Devolve null quando não vale a pena
 * trocar: não é base64, falhou ao abrir, ou o resultado não ficou menor.
 */
export const shrinkDataUrl = async (src: string | undefined | null, maxSize: number): Promise<string | null> => {
  if (!src || typeof src !== 'string' || !src.startsWith('data:image')) return null;
  try {
    const image = await loadImage(src);
    const result = renderToDataUrl(image, { x: 0, y: 0, width: image.naturalWidth, height: image.naturalHeight }, maxSize);
    if (!result || result.length >= src.length * 0.9) return null;
    return result;
  } catch (e) {
    console.warn('Não foi possível otimizar uma imagem:', e);
    return null;
  }
};

/** Tamanho aproximado, em KB, de um texto/data URL. */
export const sizeKb = (value: string | undefined | null): number => (value ? Math.round(value.length / 1024) : 0);
