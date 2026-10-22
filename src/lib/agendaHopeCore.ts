// Agenda do site lida direto do HopeCore (decisão do Jorge, 21/10/2026).
// O site NÃO lê mais a planilha das psicólogas (link do Apps Script). O HopeCore publica, para cada psicóloga marcada
// com "Agenda no site" no Cadastro profissional, só os horários LIVRES (dia, período e hora — nenhum dado de paciente).
// Agendou, deu alta, reservou ou liberou no HopeCore → o site muda na hora (tempo real).
import { useEffect, useState } from 'react';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Specialist } from '../types';

// Endereço e chave PÚBLICA do HopeCore (chave publicável: só lê o que o banco libera para o público).
export const HOPECORE_URL = 'https://wqktlmcsfytfwquungey.supabase.co';
export const HOPECORE_CHAVE_PUBLICA = 'sb_publishable_UdfP24ZCPtRfXJ57ZJWARQ_rVGhyXkn';

export type Horarios = NonNullable<Specialist['schedule']>;
export type AgendaPublica = { slug: string; nome: string; horarios: Horarios; atualizado_em: string };
export type EstadoAgenda = { carregada: boolean; erro: string | null; porSlug: Record<string, AgendaPublica> };

let cliente: SupabaseClient | null = null;
const supabase = () =>
  (cliente ??= createClient(HOPECORE_URL, HOPECORE_CHAVE_PUBLICA, { auth: { persistSession: false, autoRefreshToken: false } }));

const normalizar = (s: string) =>
  (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

/** Acha a agenda publicada de uma especialista do site: pelo endereço (slug) e, se não houver, pelo nome. */
export function agendaDe(spec: Pick<Specialist, 'slug' | 'name'>, porSlug: Record<string, AgendaPublica>): AgendaPublica | null {
  const slug = (spec.slug || '').trim().toLowerCase();
  if (slug && porSlug[slug]) return porSlug[slug];
  const nome = normalizar(spec.name);
  if (!nome) return null;
  const lista = Object.values(porSlug);
  return lista.find((a) => normalizar(a.nome) === nome)
    ?? lista.find((a) => { const n = normalizar(a.nome); return n.startsWith(nome + ' ') || nome.startsWith(n + ' '); })
    ?? null;
}

/** Especialista com a agenda do HopeCore. Sem "Agenda no site" marcada: sem horários no site. */
export function comAgendaHopeCore(spec: Specialist, estado: EstadoAgenda): Specialist {
  const a = estado.carregada ? agendaDe(spec, estado.porSlug) : null;
  return { ...spec, schedule: a?.horarios ?? {}, lastSync: a?.atualizado_em ?? spec.lastSync, agendaHopeCore: !!a };
}

/** Lê os horários livres do HopeCore e acompanha as mudanças em tempo real. */
export function useAgendaHopeCore(): EstadoAgenda {
  const [estado, setEstado] = useState<EstadoAgenda>({ carregada: false, erro: null, porSlug: {} });

  useEffect(() => {
    let ativo = true;
    const db = supabase();

    const ler = async () => {
      const { data, error } = await db.rpc('site_agenda_ler');
      if (!ativo) return;
      if (error) {
        console.warn('[Agenda HopeCore] não foi possível ler os horários:', error.message);
        setEstado((e) => ({ ...e, carregada: true, erro: error.message }));
        return;
      }
      const porSlug: Record<string, AgendaPublica> = {};
      for (const a of (data ?? []) as AgendaPublica[]) porSlug[a.slug.toLowerCase()] = a;
      setEstado({ carregada: true, erro: null, porSlug });
    };
    void ler();

    const canal = db
      .channel(`site-agenda-publica-${Math.random().toString(36).slice(2)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'site_agenda_publica' }, (msg) => {
        const novo = msg.new as (AgendaPublica & { publicado?: boolean }) | null;
        if (!novo || !novo.slug) return;
        setEstado((e) => {
          const porSlug = { ...e.porSlug };
          if (novo.publicado === false) delete porSlug[novo.slug.toLowerCase()];
          else porSlug[novo.slug.toLowerCase()] = { slug: novo.slug, nome: novo.nome, horarios: novo.horarios ?? {}, atualizado_em: novo.atualizado_em };
          return { ...e, porSlug };
        });
      })
      .subscribe((status) => {
        // Voltou a conexão (celular saiu do modo econômico, troca de rede): relê tudo para não perder mudanças.
        if (status === 'SUBSCRIBED') void ler();
      });

    // Ao voltar para a aba, relê (a leitura também atualiza o que depende da data: reserva que venceu etc.)
    const aoVoltar = () => { if (document.visibilityState === 'visible') void ler(); };
    document.addEventListener('visibilitychange', aoVoltar);

    return () => {
      ativo = false;
      document.removeEventListener('visibilitychange', aoVoltar);
      void db.removeChannel(canal);
    };
  }, []);

  return estado;
}
