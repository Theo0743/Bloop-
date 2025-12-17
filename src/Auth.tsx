import { useState } from "react";
import { createClient, type User } from "@supabase/supabase-js";

// 1. IMPORTATION DE TON IMAGE
// Remplace './ton-image.jpg' par le nom exact de ton fichier (ex: './background.png') Test
import MonImageDeFond from "../public/icon.png"; 

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

  const handleLogin = async () => {
    setError("");
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) return setError(error.message);
    if (data.user) onLogin(data.user);
  };

  const handleRegister = async () => {
    setError("");
    if (!username.trim()) return setError("Le pseudo est requis.");
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username } },
    });
    if (error) return setError(error.message);
    if (data.user) onLogin(data.user);
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "login") {
      void handleLogin();
    } else {
      void handleRegister();
    }
  };

  return (
    <div 
      className="auth-wrapper"
      style={{
        // 2. UTILISATION DE L'IMAGE IMPORTÉE
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url(${MonImageDeFond})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
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
              required
            />
          </div>

          <div className="auth-input">
            <label>Mot de passe</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && <p className="auth-error">{error}</p>}

          <button className="auth-button" type="submit">
            {mode === "login" ? "Se connecter" : "Créer un compte"}
          </button>
        </form> 
      </div>
    </div>
  );
}