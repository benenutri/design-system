/**
 * Estrutura da aplicação — design.md §10.
 *
 * A janela não rola: o contêiner é h-screen overflow-hidden e quem rola é o
 * <main>. Menu lateral recolhível (estado em localStorage), gaveta no mobile,
 * itens filtrados por permissão ANTES de renderizar.
 */
import * as React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { CalendarDays, ChartLine, CircleDollarSign, ClipboardList, LogOut, MapPin, Menu, PanelLeftClose, PanelLeftOpen, Receipt, Tags, UserCog, Users, X } from 'lucide-react';

import { cn } from '@/lib/utils';
import { clearSession } from '@/lib/mitra-auth';
import { SessaoContext } from '@/lib/sessao';
import { BRAND_GREEN, Monogram, Wordmark } from '@/components/Logo';
import { ThemeToggle } from '@/components/ThemeToggle';

// ── Permissão ─────────────────────────────────────────────────────────────

// O mapa perfil → módulos é constante e mora SÓ aqui (D-008 do plan: perfis
// fixos no sistema, sem tela de gestão). `valores` é a spec 002; `etiquetas`,
// a 003 — manter o vocabulário é do gestor, marcar etiqueta é dos três (D-002
// da spec 003), e por isso só o CADASTRO some do menu.
const MODULOS_POR_PERFIL: Record<string, string[]> = {
  gestor: ['crm', 'valores', 'usuarios', 'etiquetas', 'kpis'],
  central: ['crm'],
  ativa: ['crm'],
};

const MENU = [
  {
    grupo: 'Operação',
    itens: [
      { to: '/atendimentos', label: 'Atendimentos', modulo: 'crm', Icone: ClipboardList },
      // Spec 004 §2: a agenda é de todo mundo — a ativa vê só as visitas dela.
      { to: '/agenda', label: 'Agenda', modulo: 'crm', Icone: CalendarDays },
      { to: '/pacientes', label: 'Pacientes', modulo: 'crm', Icone: Users },
      { to: '/municipios', label: 'Municípios', modulo: 'crm', Icone: MapPin },
    ],
  },
  {
    // Módulo `valores` (spec 002): o grupo inteiro some para central e ativa —
    // essa é a metade fraca de RF-010; a forte é a recusa no backend (D-004).
    grupo: 'Gestão',
    itens: [
      { to: '/valores', label: 'Valores', modulo: 'valores', Icone: CircleDollarSign },
      { to: '/pagamentos', label: 'Pagamentos', modulo: 'valores', Icone: Receipt },
      { to: '/etiquetas', label: 'Etiquetas', modulo: 'etiquetas', Icone: Tags },
      // Spec 004 §7: KPIs do atendimento, exclusivos do gestor.
      { to: '/kpis', label: 'KPIs', modulo: 'kpis', Icone: ChartLine },
      { to: '/usuarios', label: 'Usuários', modulo: 'usuarios', Icone: UserCog },
    ],
  },
];

// ── Layout ────────────────────────────────────────────────────────────────

const CHAVE_RECOLHIDO = 'crm-menu-recolhido';

export default function AdminLayout({
  usuario,
}: {
  usuario: { ID: number; NOME: string; EMAIL: string; PERFIL: string };
}) {
  const navigate = useNavigate();
  const [recolhido, setRecolhido] = React.useState(() => {
    try {
      return localStorage.getItem(CHAVE_RECOLHIDO) === '1';
    } catch {
      return false;
    }
  });
  const [gaveta, setGaveta] = React.useState(false);

  React.useEffect(() => {
    try {
      localStorage.setItem(CHAVE_RECOLHIDO, recolhido ? '1' : '0');
    } catch {
      // preferência não crítica
    }
  }, [recolhido]);

  // Gaveta fecha por Escape (design.md §10).
  React.useEffect(() => {
    if (!gaveta) return;
    const fechar = (e: KeyboardEvent) => e.key === 'Escape' && setGaveta(false);
    window.addEventListener('keydown', fechar);
    return () => window.removeEventListener('keydown', fechar);
  }, [gaveta]);

  const modulos = MODULOS_POR_PERFIL[usuario.PERFIL] ?? [];
  const grupos = MENU.map((grupo) => ({
    ...grupo,
    itens: grupo.itens.filter((item) => modulos.includes(item.modulo)),
  })).filter((grupo) => grupo.itens.length > 0);

  const iniciais = usuario.NOME.split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase())
    .join('');

  function sair() {
    clearSession();
    navigate('/login', { replace: true });
    window.location.reload();
  }

  const menu = (fechado: boolean) => (
    <div className="flex h-full flex-col bg-nav">
      <div
        className={cn(
          'flex flex-col items-center justify-center gap-1 px-4 py-4',
          fechado && 'h-14 px-0 py-0'
        )}
      >
        {fechado ? (
          // Verde da MARCA (nao o --primary da interface): recolhido ou aberto,
          // o menu mostra a mesma cor da assinatura completa.
          <span style={{ color: BRAND_GREEN }}>
            <Monogram className="size-7" />
          </span>
        ) : (
          <>
            <Wordmark className="h-6" />
            <p className="text-[11px] font-semibold tracking-[0.08em] text-ink-secondary">CRM Ativa</p>
          </>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-2">
        {grupos.map((grupo) => (
          <div key={grupo.grupo} className="mb-4">
            {fechado ? (
              <div className="mx-auto mb-2 h-px w-6 bg-rule-row" aria-hidden />
            ) : (
              <p className="mb-1 px-2 text-[11px] font-semibold tracking-[0.14em] text-ink-muted uppercase">
                {grupo.grupo}
              </p>
            )}
            {grupo.itens.map(({ to, label, Icone }) => (
              <NavLink
                key={to}
                to={to}
                title={label}
                onClick={() => setGaveta(false)}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-[13px] transition-colors',
                    fechado && 'justify-center px-0',
                    isActive
                      ? 'bg-accent font-semibold text-nav-active'
                      : 'text-nav-text hover:bg-nav-hover hover:text-ink'
                  )
                }
              >
                <Icone className="size-4 shrink-0" aria-hidden />
                {fechado ? null : <span className="truncate">{label}</span>}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <div className="border-t border-rule-row p-2">
        <div className={cn('flex items-center gap-2.5 px-1.5 py-2', fechado && 'flex-col justify-center gap-2 px-0')}>
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-[13px] font-bold text-primary-foreground">
            {iniciais || '?'}
          </span>
          {fechado ? null : (
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-[13px] font-semibold text-ink">{usuario.NOME}</span>
              <span className="truncate text-[12px] text-ink-secondary">{usuario.EMAIL}</span>
            </span>
          )}
          <ThemeToggle />
        </div>
        <button
          type="button"
          onClick={sair}
          aria-label="Sair"
          title="Sair"
          className={cn(
            'flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-[13px] text-nav-text transition-colors',
            'hover:bg-alert-bg hover:text-alert focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:outline-none',
            fechado && 'justify-center px-0'
          )}
        >
          <LogOut className="size-4 shrink-0" aria-hidden />
          {fechado ? null : 'Sair'}
        </button>
        {/* O botão de recolher mora no rodapé: no topo disputava z-index com o
            cabeçalho grudento da tela (§10). Só existe no desktop. */}
        <button
          type="button"
          onClick={() => setRecolhido((v) => !v)}
          aria-label={recolhido ? 'Expandir menu' : 'Recolher menu'}
          title={recolhido ? 'Expandir menu' : 'Recolher menu'}
          className={cn(
            'mt-1 hidden w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-[13px] text-nav-text transition-colors lg:flex',
            'hover:bg-nav-hover hover:text-ink focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:outline-none',
            fechado && 'justify-center px-0'
          )}
        >
          {recolhido ? (
            <PanelLeftOpen className="size-4 shrink-0" aria-hidden />
          ) : (
            <>
              <PanelLeftClose className="size-4 shrink-0" aria-hidden />
              Recolher
            </>
          )}
        </button>
      </div>
    </div>
  );

  return (
    <SessaoContext.Provider value={usuario}>
      <div className="flex h-screen overflow-hidden bg-ground">
        {/* Menu desktop */}
        <aside
          className={cn(
            'hidden shrink-0 border-r border-rule-table transition-[width] lg:block',
            recolhido ? 'lg:w-[4.5rem]' : 'lg:w-60'
          )}
        >
          {menu(recolhido)}
        </aside>

        {/* Gaveta mobile + véu */}
        {gaveta ? (
          <button
            type="button"
            aria-label="Fechar menu"
            onClick={() => setGaveta(false)}
            className="fixed inset-0 z-30 bg-ink/40 lg:hidden"
          />
        ) : null}
        <aside
          className={cn(
            'fixed inset-y-0 left-0 z-40 w-60 border-r border-rule-table transition-transform lg:hidden',
            gaveta ? 'translate-x-0' : '-translate-x-full'
          )}
        >
          <div className="flex h-14 items-center justify-end px-2">
            <button
              type="button"
              aria-label="Fechar menu"
              onClick={() => setGaveta(false)}
              className="absolute top-3 right-2 z-50 rounded-lg p-2 text-ink-secondary hover:bg-nav-hover"
            >
              <X className="size-4" aria-hidden />
            </button>
          </div>
          <div className="-mt-14 h-full">{menu(false)}</div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          {/* Barra mobile de 56px */}
          <header className="flex h-14 shrink-0 items-center gap-3 border-b border-rule-table bg-nav px-3 lg:hidden">
            <button
              type="button"
              aria-label="Abrir menu"
              onClick={() => setGaveta(true)}
              className="rounded-lg p-2 text-ink-secondary hover:bg-nav-hover"
            >
              <Menu className="size-5" aria-hidden />
            </button>
            <Wordmark className="h-5" />
            <span className="ml-auto flex size-8 items-center justify-center rounded-xl bg-primary text-[12px] font-bold text-primary-foreground">
              {iniciais || '?'}
            </span>
          </header>

          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
            <Outlet />
          </main>
        </div>
      </div>
    </SessaoContext.Provider>
  );
}
