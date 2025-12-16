// src/lib/supabaseClient.ts

import { createClient } from "@supabase/supabase-js";

// --- Définition et Initialisation de Supabase ---
// Remplacez par vos clés réelles
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

// Exportez l'objet client séparément des composants React
export { supabase };