# Backend online da Última Brasa (Supabase)

Opcional: sem configuração, o jogo roda 100% offline e os botões **Entrar** e **Ranking** nem aparecem.

## O que existe
- **Conta** (Google ou link por e-mail) e **apelido** público.
- **Save na nuvem**: sobe sozinho (a cada ~30 s após mudanças e ao fim de cada run); se a nuvem for mais nova ao entrar, o jogador escolhe qual usar.
- **Ranking**: geral, semanal, desafio do dia e progresso. Pontuação = `(abates + nível×25 + segundos×3 + 3000 se venceu) × multiplicador da dificuldade`.
- **Desafio do dia**: mapa e dificuldade fixos por data (UTC), iguais para todos.
- Segurança: as tabelas ficam fechadas; tudo passa por funções (`security definer`) que validam login, apelido, limites plausíveis e intervalo mínimo entre envios.

> Limite honesto: o jogo roda no navegador, então os números de cada run são informados pelo cliente. As validações barram valores impossíveis e spam, mas não impedem um trapaceiro determinado. Para ranking competitivo de verdade seria preciso reexecutar a run no servidor.

## Configurar (uma vez)
1. Em supabase.com, crie um projeto (ou use um existente).
2. **SQL Editor** → cole `backend/schema.sql` inteiro → Run.
3. **Authentication → Providers**: mantenha *Email* ligado; para Google, ative *Google* com as credenciais do Google Cloud.
4. **Authentication → URL Configuration**: em *Site URL* e *Redirect URLs* coloque `https://ultima-brasa.vercel.app` (e o endereço local de testes, se usar).
5. **Project Settings → API**: copie *Project URL* e a chave *anon public* para `src/game/online.config.js` e rode `node build.mjs`.
   A chave `anon` é pública por desenho. **Nunca** coloque a `service_role` no código.
