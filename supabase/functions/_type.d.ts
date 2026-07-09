// Ce fichier ne fait rien à l'exécution. Il sert uniquement à déclarer
// l'environnement Deno pour l'IDE quand on ouvre supabase/functions/*.
//
// Le code de l'Edge Function est déployé tel quel sur le runtime Deno de
// Supabase ; il ne passe PAS par tsc ni par Vite.

declare const Deno: {
  env: { get(name: string): string | undefined };
  serve(handler: (req: Request) => Promise<Response> | Response): void;
};
