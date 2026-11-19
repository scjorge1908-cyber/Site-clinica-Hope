#!/usr/bin/env node
/**
 * Backup diário do conteúdo do site (Firebase/Firestore) — Jorge, 19/11/2026.
 *
 * Copia, sem alterar nada no Firebase, todas as coleções que o site mostra:
 *   specialists (psicólogas, com fotos), approaches, insurance_plans,
 *   settings e psicoeducacao_articles.
 * Grava em backup/firestore-AAAA-MM-DD.json no formato original do Firestore
 * (campos com tipo), para dar para restaurar exatamente como estava.
 *
 * Roda no GitHub Actions (deploy.yml) todo dia e no deploy; o arquivo vira um
 * "artefato" guardado por 90 dias na aba Actions do repositório.
 *
 * As coleções da Sublocação (sublease_*) só o admin lê; ficam de fora porque o
 * robô não tem login de admin (e o SublocaHope está fora do ar).
 *
 * Uso local: node scripts/backup-firestore.mjs
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'backup');
const SITE = 'https://clinicahopebrasil.com.br';
const COLECOES = ['specialists', 'approaches', 'insurance_plans', 'settings', 'psicoeducacao_articles'];

async function main() {
  const cfg = JSON.parse(await fs.readFile(path.join(ROOT, 'firebase-applet-config.json'), 'utf8'));
  const base = `https://firestore.googleapis.com/v1/projects/${cfg.projectId}/databases/${cfg.firestoreDatabaseId}/documents`;

  async function lerColecao(collection) {
    const res = await fetch(`${base}:runQuery?key=${cfg.apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json', Referer: `${SITE}/` },
      body: JSON.stringify({ structuredQuery: { from: [{ collectionId: collection }], limit: 1000 } }),
    });
    if (!res.ok) {
      let detail = '';
      try { detail = (await res.text()).replace(/\s+/g, ' ').slice(0, 300); } catch (_) {}
      throw new Error(`${res.status} ${res.statusText} em ${collection} ${detail}`);
    }
    const rows = await res.json();
    return (Array.isArray(rows) ? rows : [])
      .filter((r) => r && r.document)
      .map((r) => ({
        id: r.document.name.split('/').pop(),
        name: r.document.name,
        createTime: r.document.createTime,
        updateTime: r.document.updateTime,
        fields: r.document.fields || {},
      }));
  }

  const agora = new Date();
  const backup = {
    origem: SITE,
    projeto: cfg.projectId,
    banco: cfg.firestoreDatabaseId,
    gerado_em: agora.toISOString(),
    formato: 'Firestore REST (campos com tipo) — restaurável documento a documento',
    colecoes: {},
  };

  const falhas = [];
  for (const c of COLECOES) {
    try {
      backup.colecoes[c] = await lerColecao(c);
      console.log(`[backup] ${c}: ${backup.colecoes[c].length} documentos`);
    } catch (e) {
      falhas.push(`${c}: ${e.message}`);
      console.warn(`[backup] Falha em ${c}: ${e.message}`);
    }
  }

  // Sem nenhuma psicóloga lida, não grava (um backup vazio não pode substituir o bom).
  if (!backup.colecoes.specialists || backup.colecoes.specialists.length === 0) {
    console.error('[backup] Nenhuma psicóloga lida — backup NÃO gravado.');
    if (process.env.GITHUB_ACTIONS) console.log('::error title=Backup Firestore::Nenhuma psicóloga lida; backup não gravado.');
    process.exitCode = 1;
    return;
  }

  await fs.mkdir(OUT_DIR, { recursive: true });
  const arquivo = path.join(OUT_DIR, `firestore-${agora.toISOString().slice(0, 10)}.json`);
  await fs.writeFile(arquivo, JSON.stringify(backup), 'utf8');
  const tamanho = (await fs.stat(arquivo)).size;
  const total = Object.values(backup.colecoes).reduce((n, l) => n + l.length, 0);
  console.log(`[backup] OK: ${total} documentos em ${path.relative(ROOT, arquivo)} (${(tamanho / 1024).toFixed(0)} KB).`);
  if (falhas.length && process.env.GITHUB_ACTIONS) console.log(`::warning title=Backup Firestore::${falhas.join(' | ')}`);
}

main().catch((e) => {
  console.error('[backup] Erro:', e);
  process.exitCode = 1;
});
