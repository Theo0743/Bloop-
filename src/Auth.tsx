// AuthPanel.tsx

import { useState } from "react";
import { createClient, type User } from "@supabase/supabase-js";

// ⭐ ATTENTION : Pour le Fast Refresh de Vite, importez supabase d'un fichier séparé
// comme nous l'avons fait précédemment, au lieu de le recréer ici.
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

interface AuthPanelProps {
  onLogin: (user: User) => void;
}

export default function AuthPanel({ onLogin }: AuthPanelProps) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");

  // Connexion
  const handleLogin = async () => {
    setError("");
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) return setError(error.message);
    if (data.user) onLogin(data.user);
  };

  // Inscription
  const handleRegister = async () => {
    setError("");

    if (!username.trim()) return setError("Le pseudo est requis.");

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username },
      },
    });

    if (error) return setError(error.message);
    if (data.user) onLogin(data.user);
  };
  
  // ⭐ NOUVEAU : Fonction unique pour gérer la soumission du formulaire
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault(); // Empêche le rechargement standard de la page
    if (mode === "login") {
      void handleLogin();
    } else {
      void handleRegister();
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-box">
        <h2>{mode === "login" ? "Connexion" : "Inscription"}</h2>

        <div className="auth-tabs">
          <button
            className={mode === "login" ? "active" : ""}
            onClick={() => setMode("login")}
          >
            Connexion
          </button>
          <button
            className={mode === "register" ? "active" : ""}
            onClick={() => setMode("register")}
          >
            Inscription
          </button>
        </div>

        {/* ⭐ CORRECTION : Utilisation de la balise <form> avec onSubmit */}
        <form onSubmit={handleSubmit}>
          {mode === "register" && (
            <div className="auth-input">
              <label>Pseudo</label>
              <input
                type="text"
                placeholder="Ton pseudo"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
          )}

          <div className="auth-input">
            <label>Email</label>
            <input
              type="email"
              placeholder="email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required // Ajout de required pour une meilleure UX
            />
          </div>

          <div className="auth-input">
            <label>Mot de passe</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required // Ajout de required
            />
          </div>

          {error && <p className="auth-error">{error}</p>}

          <button
            className="auth-button"
            type="submit" // ⭐ CRUCIAL : Définit le bouton pour soumettre le formulaire
          >
            {mode === "login" ? "Se connecter" : "Créer un compte"}
          </button>
        </form> 
        {/* ⭐ FIN DE LA BALISE <form> */}
      </div>
    </div>
  );
}