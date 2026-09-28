import React, { useState } from 'react';
import { collection, doc, getDocFromServer, getDocsFromServer, updateDoc } from 'firebase/firestore';
import { db, auth, COLLECTIONS, DOCS } from '../lib/firebase';
import { IMAGE_MAX_SIZE, shrinkDataUrl, sizeKb } from '../lib/imageOptimize';

/**
 * Painel "Otimizar fotos" (aba Início do admin).
 *
 * 1. Analisa o tamanho das fotos gravadas no Firebase.
 * 2. Baixa um backup (.json) com TODAS as fotos originais para o computador.
 * 3. Reduz cada foto e grava só o campo da foto (img / logo / heroImageUrl / logoUrl).
 * 4. Pede para recarregar o painel, para não sobrescrever as fotos novas com as antigas.
 */

type Item = {
  label: string;
  ref: { collection: string; id: string };
  field: string; // campo simples, ou 'insurancePlans' (lista dentro de settings/home)
  maxSize: number;
  value: string;
  listIndex?: number;
};

type Phase = 'idle' | 'analyzing' | 'ready' | 'running' | 'done' | 'error';

const OtimizarFotos = () => {
  const [phase, setPhase] = useState<Phase>('idle');
  const [items, setItems] = useState<Item[]>([]);
  const [homeInsurance, setHomeInsurance] = useState<any[] | null>(null);
  const [progress, setProgress] = useState('');
  const [result, setResult] = useState<{ before: number; after: number; changed: number; failed: number } | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [saveError, setSaveError] = useState('');

  const totalKb = items.reduce((s, i) => s + sizeKb(i.value), 0);
  const base64Items = items.filter((i) => i.value.startsWith('data:image'));

  const analyze = async () => {
    setPhase('analyzing');
    setErrorMsg('');
    try {
      const found: Item[] = [];
      const specs = await getDocsFromServer(collection(db, COLLECTIONS.SPECIALISTS));
      specs.forEach((d) => {
        const data: any = d.data();
        if (typeof data.img === 'string' && data.img) {
          found.push({ label: `Especialista: ${data.name || d.id}`, ref: { collection: COLLECTIONS.SPECIALISTS, id: d.id }, field: 'img', maxSize: IMAGE_MAX_SIZE.specialist, value: data.img });
        }
      });
      const plans = await getDocsFromServer(collection(db, COLLECTIONS.INSURANCE));
      plans.forEach((d) => {
        const data: any = d.data();
        if (typeof data.logo === 'string' && data.logo) {
          found.push({ label: `Convênio: ${data.name || d.id}`, ref: { collection: COLLECTIONS.INSURANCE, id: d.id }, field: 'logo', maxSize: IMAGE_MAX_SIZE.insurance, value: data.logo });
        }
      });
      const home = await getDocFromServer(doc(db, COLLECTIONS.SETTINGS, DOCS.HOME_SETTINGS));
      const homeData: any = home.exists() ? home.data() : {};
      if (typeof homeData.heroImageUrl === 'string' && homeData.heroImageUrl) {
        found.push({ label: 'Foto principal (início)', ref: { collection: COLLECTIONS.SETTINGS, id: DOCS.HOME_SETTINGS }, field: 'heroImageUrl', maxSize: IMAGE_MAX_SIZE.hero, value: homeData.heroImageUrl });
      }
      if (typeof homeData.logoUrl === 'string' && homeData.logoUrl) {
        found.push({ label: 'Logo da clínica', ref: { collection: COLLECTIONS.SETTINGS, id: DOCS.HOME_SETTINGS }, field: 'logoUrl', maxSize: IMAGE_MAX_SIZE.logo, value: homeData.logoUrl });
      }
      const list = Array.isArray(homeData.insurancePlans) ? homeData.insurancePlans : null;
      setHomeInsurance(list);
      (list || []).forEach((p: any, idx: number) => {
        if (p && typeof p.logo === 'string' && p.logo) {
          found.push({ label: `Convênio (início): ${p.name || idx + 1}`, ref: { collection: COLLECTIONS.SETTINGS, id: DOCS.HOME_SETTINGS }, field: 'insurancePlans', maxSize: IMAGE_MAX_SIZE.insurance, value: p.logo, listIndex: idx });
        }
      });
      setItems(found);
      setPhase('ready');
    } catch (e: any) {
      setErrorMsg(e?.message || String(e));
      setPhase('error');
    }
  };

  const downloadBackup = () => {
    const backup = {
      criadoEm: new Date().toISOString(),
      observacao: 'Backup das fotos originais do site Clínica Hope antes da otimização.',
      fotos: items.map((i) => ({ label: i.label, colecao: i.ref.collection, documento: i.ref.id, campo: i.field, indiceNaLista: i.listIndex ?? null, valor: i.value })),
    };
    const blob = new Blob([JSON.stringify(backup)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup-fotos-hope-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  };

  const run = async () => {
    if (!window.confirm('Um arquivo de backup com as fotos originais será baixado agora. Depois as fotos serão otimizadas no site. Continuar?')) return;
    downloadBackup();
    setPhase('running');
    let before = 0;
    let after = 0;
    let changed = 0;
    let failed = 0;
    let firstError = '';
    const describe = (e: any) => `${e?.code ? `[${e.code}] ` : ''}${e?.message || String(e)}`;
    const newHomeInsurance = homeInsurance ? homeInsurance.map((p) => ({ ...p })) : null;
    let homeInsuranceChanged = false;

    for (let n = 0; n < items.length; n++) {
      const item = items[n];
      setProgress(`${n + 1} de ${items.length}: ${item.label}`);
      before += sizeKb(item.value);
      const smaller = await shrinkDataUrl(item.value, item.maxSize);
      if (!smaller) {
        after += sizeKb(item.value);
        continue;
      }
      try {
        if (item.field === 'insurancePlans' && newHomeInsurance && item.listIndex !== undefined) {
          newHomeInsurance[item.listIndex] = { ...newHomeInsurance[item.listIndex], logo: smaller };
          homeInsuranceChanged = true;
        } else {
          await updateDoc(doc(db, item.ref.collection, item.ref.id), { [item.field]: smaller });
        }
        after += sizeKb(smaller);
        changed++;
      } catch (e) {
        console.error('Falha ao salvar foto otimizada:', item.label, e);
        if (!firstError) firstError = `${item.label}: ${describe(e)}`;
        after += sizeKb(item.value);
        failed++;
      }
    }

    if (homeInsuranceChanged && newHomeInsurance) {
      try {
        setProgress('Salvando logos de convênios da página inicial…');
        await updateDoc(doc(db, COLLECTIONS.SETTINGS, DOCS.HOME_SETTINGS), { insurancePlans: newHomeInsurance });
      } catch (e) {
        console.error('Falha ao salvar logos da página inicial:', e);
        if (!firstError) firstError = `Logos da página inicial: ${describe(e)}`;
        failed++;
      }
    }

    if (firstError) {
      try {
        const u = auth.currentUser;
        const t = u ? await u.getIdTokenResult() : null;
        firstError += ` | Login: ${u ? u.email : 'NENHUM (não logado no Firebase)'} | token.email: ${t?.claims?.email ?? '—'} | provedor: ${t?.signInProvider ?? '—'} | projeto: ${t?.claims?.aud ?? '—'}`;
      } catch (e: any) {
        firstError += ` | Login: erro ao ler token (${e?.message || e})`;
      }
    }
    setSaveError(firstError);
    setResult({ before, after, changed, failed });
    setPhase('done');
  };

  return (
    <div className="p-6 md:p-8 rounded-[2rem] border border-outline bg-surface-container-low">
      <h2 className="text-xl font-display font-black text-primary mb-2">Otimizar fotos do site</h2>
      <p className="text-sm text-on-surface-variant mb-6 max-w-2xl">
        Reduz o tamanho das fotos (especialistas, convênios, foto principal e logo) para o site abrir mais rápido no celular.
        A aparência continua a mesma. Antes de alterar, um arquivo de backup com as fotos originais é baixado para o seu computador.
      </p>

      {(phase === 'idle' || phase === 'error') && (
        <button onClick={analyze} className="btn-primary !px-5 !py-3 !text-sm">
          Analisar fotos
        </button>
      )}

      {phase === 'analyzing' && <p className="text-sm font-bold text-primary">Analisando fotos…</p>}

      {phase === 'error' && <p className="text-sm text-red-700 mt-4">Não foi possível analisar: {errorMsg}</p>}

      {phase === 'ready' && (
        <div className="space-y-4">
          <p className="text-sm">
            <strong>{items.length}</strong> imagens encontradas, somando <strong>{totalKb.toLocaleString('pt-BR')} KB</strong>
            {' '}({base64Items.length} gravadas dentro do banco de dados).
          </p>
          <button onClick={run} disabled={base64Items.length === 0} className="btn-primary !px-5 !py-3 !text-sm disabled:opacity-50">
            Baixar backup e otimizar
          </button>
        </div>
      )}

      {phase === 'running' && (
        <p className="text-sm font-bold text-primary">Otimizando… {progress}. Não feche esta página.</p>
      )}

      {phase === 'done' && result && (
        <div className="space-y-4">
          <p className="text-sm">
            Pronto: <strong>{result.changed}</strong> imagens otimizadas. Tamanho total de{' '}
            <strong>{result.before.toLocaleString('pt-BR')} KB</strong> para <strong>{result.after.toLocaleString('pt-BR')} KB</strong>.
            {result.failed > 0 && <span className="text-red-700"> {result.failed} não puderam ser salvas.</span>}
          </p>
          {saveError && (
            <p className="text-xs font-mono text-red-700 bg-red-50 border border-red-200 rounded-xl p-3 break-all">
              Motivo: {saveError}
            </p>
          )}
          <p className="text-sm text-on-surface-variant">Recarregue o painel antes de fazer outras alterações, para ele usar as fotos novas.</p>
          <button onClick={() => window.location.reload()} className="btn-primary !px-5 !py-3 !text-sm">
            Recarregar painel
          </button>
        </div>
      )}
    </div>
  );
};

export default OtimizarFotos;
