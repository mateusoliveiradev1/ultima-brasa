// Configuração do backend (Supabase). A chave "anon" é pública por desenho (a segurança está no RLS/RPCs do schema.sql).
// Enquanto url/key estiverem vazios, todos os recursos online ficam ocultos e o jogo funciona 100% offline.
export const CFG = { url: '', key: '' };
