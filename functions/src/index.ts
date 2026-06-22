import * as admin from 'firebase-admin';
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';

// Inicializa o admin com credenciais do ambiente (GOOGLE_APPLICATION_CREDENTIALS)
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();
const app = express();
app.use(cors({ origin: true }));
app.use(bodyParser.json({ limit: '10mb' }));

// GET /agenda/:specialistId  -> retorna doc agenda/{specialistId}
app.get('/agenda/:specialistId', async (req, res) => {
  try {
    const id = req.params.specialistId;
    const docRef = db.collection('agenda').doc(id);
    const docSnap = await docRef.get();
    if (!docSnap.exists) return res.status(404).json({ error: 'Agenda not found' });
    return res.json(docSnap.data());
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: String(e) });
  }
});

// POST /agenda/:specialistId  -> body { slots: [...] }
app.post('/agenda/:specialistId', async (req, res) => {
  try {
    const id = req.params.specialistId;
    const payload = req.body || {};
    await db.collection('agenda').doc(id).set({
      slots: payload.slots || [],
      lastSync: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    return res.json({ success: true });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: String(e) });
  }
});

// POST /salvarCadastroCompleto -> body: form with idPlanilha, linha, fields...
app.post('/salvarCadastroCompleto', async (req, res) => {
  try {
    const form = req.body || {};
    const idPlanilha = String(form.idPlanilha || '');
    const linhaNum = parseInt(form.linha, 10);
    if (!idPlanilha || !linhaNum) return res.status(400).json({ success: false, msg: 'Invalid idPlanilha or linha' });

    const docRef = db.collection('agenda').doc(idPlanilha);
    const docSnap = await docRef.get();
    const data = docSnap.exists ? docSnap.data() || {} : {};
    const slots = Array.isArray(data.slots) ? data.slots : [];

    const idx = slots.findIndex(s => Number(s.linha) === linhaNum);
    if (idx === -1) {
      return res.status(404).json({ success: false, msg: 'Slot not found' });
    }

    const slot = slots[idx];
    // Atualiza campos conforme Apps Script map
    const updates: any = {};
    updates.paciente = form.paciente ? String(form.paciente).toUpperCase() : '';
    updates.telefone = form.telefone || '';
    updates.plano = form.plano || '';
    updates.carterinha = form.carterinha || '';
    updates.valor = form.valor || '';
    updates.email = form.email || '';
    if (form.cpf) updates.cpf = form.cpf;
    if (form.dtNasc) updates.dtNasc = form.dtNasc;
    if (form.sexo) updates.sexo = form.sexo;
    if (form.cidade) updates.cidade = form.cidade;
    if (form.bairro) updates.bairro = form.bairro;
    updates.medico = form.medico || '';
    updates.crm = form.crm || '';
    updates.cid = form.cid || '';
    updates.telefoneEmergencia = form.telefoneEmergencia || '';
    updates.observacoes = form.obs || '';
    updates.dtInicio = form.dtInicio || '';
    updates.bloqueioAdm = form.isReserva ? 'TRUE' : 'FALSE';
    updates.bloqueioAdmAte = form.isReserva ? (form.reservaAte || '') : '';

    // Anexos: se vierem em base64/object, faça upload para Firebase Storage e gere URL assinada
    const bucket = admin.storage().bucket();

    async function uploadAttachment(field: any, destPrefix: string) {
      if (!field) return null;
      // Se já for URL, mantém
      if (typeof field === 'string' && field.startsWith('http')) return field;

      // Suporta objeto { data: base64, mime, nome } ou data URL string
      let base64str = null;
      let mime = 'application/octet-stream';
      let filename = (field && field.nome) ? field.nome : `file_${Date.now()}`;

      if (typeof field === 'object' && field.data) {
        base64str = String(field.data);
        mime = field.mime || mime;
      } else if (typeof field === 'string' && field.indexOf('base64,') !== -1) {
        // data:[mime];base64,AAAA..
        const parts = field.split('base64,');
        const meta = parts[0] || '';
        base64str = parts[1] || '';
        const m = meta.match(/data:([^;]+);/);
        if (m) mime = m[1];
      } else {
        return null;
      }

      if (!base64str) return null;

      const buffer = Buffer.from(base64str, 'base64');
      const destPath = `${destPrefix}/${Date.now()}_${filename}`.replace(/\s+/g, '_');
      const file = bucket.file(destPath);
      await file.save(buffer, { metadata: { contentType: mime } });

      // Gera URL assinada longa (10 anos)
      const expires = new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000);
      const [url] = await file.getSignedUrl({ action: 'read', expires });
      return url;
    }

    if (form.anexoCart) updates.anexoCart = await uploadAttachment(form.anexoCart, `anexos/${idPlanilha}/cart`);
    if (form.anexoGuia) updates.anexoGuia = await uploadAttachment(form.anexoGuia, `anexos/${idPlanilha}/guia`);
    if (form.anexoRg) updates.anexoRg = await uploadAttachment(form.anexoRg, `anexos/${idPlanilha}/rg`);

    slots[idx] = { ...slot, ...updates };

    await docRef.set({ slots, lastSync: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
    return res.json({ success: true });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ success: false, msg: String(e) });
  }
});

// POST /moverReservaParaLixeira -> body { idPlanilha, linha }
app.post('/moverReservaParaLixeira', async (req, res) => {
  try {
    const { idPlanilha, linha } = req.body || {};
    const id = String(idPlanilha || '');
    const linhaNum = parseInt(linha, 10);
    if (!id || !linhaNum) return res.status(400).json({ success: false, msg: 'Invalid params' });

    const docRef = db.collection('agenda').doc(id);
    const docSnap = await docRef.get();
    const data = docSnap.exists ? docSnap.data() || {} : {};
    const slots = Array.isArray(data.slots) ? data.slots : [];

    const idx = slots.findIndex(s => Number(s.linha) === linhaNum);
    if (idx === -1) return res.status(404).json({ success: false, msg: 'Slot not found' });

    const slot = slots[idx];
    // Adiciona ao cancelados (collection 'cancelados')
    await db.collection('cancelados').add({
      specialistId: id,
      originalSlot: slot,
      movedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Limpa o horário
    slots[idx] = { ...slot, paciente: '💚', telefone: '', plano: '', carterinha: '', valor: '', email: '', cpf: '', dtNasc: '', observacoes: '', anexoCart: '', anexoGuia: '', anexoRg: '' };
    await docRef.set({ slots, lastSync: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });

    return res.json({ success: true });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ success: false, msg: String(e) });
  }
});

// POST /agenda/:specialistId/slot/:linha/desborde -> body { desborde: boolean, motivo?: string }
app.post('/agenda/:specialistId/slot/:linha/desborde', async (req, res) => {
  try {
    const specialistId = String(req.params.specialistId || '');
    const linha = parseInt(req.params.linha, 10);
    if (!specialistId || isNaN(linha)) return res.status(400).json({ success: false, msg: 'Invalid params' });

    const { desborde, motivo } = req.body || {};
    if (typeof desborde !== 'boolean') return res.status(400).json({ success: false, msg: 'desborde must be boolean' });

    const docRef = db.collection('agenda').doc(specialistId);
    const docSnap = await docRef.get();
    const data = docSnap.exists ? docSnap.data() || {} : {};
    const slots = Array.isArray(data.slots) ? data.slots : [];

    const idx = slots.findIndex(s => Number(s.linha) === linha);
    if (idx === -1) return res.status(404).json({ success: false, msg: 'Slot not found' });

    // Update slot with desborde flag
    const slot = slots[idx];
    slots[idx] = { ...slot, desborde };

    await docRef.set({ slots, lastSync: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });

    // Log change for audit
    await db.collection('desbordos').add({
      specialistId,
      linha,
      desborde,
      motivo: motivo || null,
      changedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return res.json({ success: true });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ success: false, msg: String(e) });
  }
});

// Fila de espera endpoints
app.get('/fila', async (req, res) => {
  try {
    const snap = await db.collection('fila').orderBy('dataEntrada', 'desc').limit(500).get();
    const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    return res.json(list);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: String(e) });
  }
});

app.post('/fila', async (req, res) => {
  try {
    const form = req.body || {};
    const now = new Date().toLocaleString('pt-BR');
    const docRef = await db.collection('fila').add({
      ...form,
      dataEntrada: now
    });
    return res.json({ success: true, id: docRef.id });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ success: false, msg: String(e) });
  }
});

app.delete('/fila/:id', async (req, res) => {
  try {
    const id = req.params.id;
    await db.collection('fila').doc(id).delete();
    return res.json({ success: true });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ success: false, msg: String(e) });
  }
});

// Health
app.get('/health', (req, res) => res.json({ ok: true }));

// Export Express app for Cloud Functions or run locally
export default app;

if (require.main === module) {
  const port = process.env.PORT || 3000;
  app.listen(port, () => console.log(`Server listening on ${port}`));
}
