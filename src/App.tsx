import { useState, useEffect } from "react";
import { supabase } from "../src/lib/supasbaseClient.ts"; 
import { type User } from "@supabase/supabase-js";

import AuthPanel from "./Auth.tsx"; 
import ChatApp from "./ChatApp.tsx"; 
import EditProfile from "../src/components/EditProfile.tsx"; 
import "./App.css";
import "./Auth.css";

// Définition des états de vue possibles
type CurrentView = 'chat' | 'profile_edit' | 'auth';

// --- Définition du Type de Profil ---
interface UserProfile {
  id: string;
  // NOTE: On utilise 'pseudo' dans l'état local pour le composant EditProfile
  pseudo: string; 
  avatar: string | null;
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null); 
  const [currentView, setCurrentView] = useState<CurrentView>('auth');
  const [isLoading, setIsLoading] = useState(true);

  // ⭐ FONCTION UTILITAIRE POUR CHARGER LE PROFIL DEPUIS LA BASE DE DONNÉES
  const fetchUserProfile = async (currentUser: User): Promise<UserProfile> => {
    // 1. Récupérer le profil depuis la table 'profiles'
    // ✅ AMÉLIORATION: Utilise .limit(1) au lieu de .single() pour une meilleure gestion des cas où le profil n'existe pas ou en cas d'erreur 406.
    const { data, error } = await supabase
      .from('profiles')
      .select('username, avatar_url') 
      .eq('id', currentUser.id)
      .limit(1);

    // Vérification de l'erreur RLS ou de colonne
    if (error) { 
        console.error("Erreur critique lors du chargement du profil (vérifiez RLS ou colonnes):", error.message);
        // Fallback en cas d'échec de la récupération
        return {
            id: currentUser.id,
            pseudo: currentUser.email?.split('@')[0] || "NouvelUtilisateur",
            avatar: null,
        };
    }

    // Le profil existe (data est un tableau)
    const profileData = data?.[0];

    return {
        id: currentUser.id,
        // ✅ Utilise profileData.username pour hydrater l'état 'pseudo'
        pseudo: profileData?.username || currentUser.email?.split('@')[0] || "NouvelUtilisateur",
        // ✅ Utilise profileData.avatar_url
        avatar: profileData?.avatar_url || null, 
    };
  };

  const loadProfileAndSetView = async (currentUser: User) => {
    const profile = await fetchUserProfile(currentUser);
    setUser(currentUser);
    setUserProfile(profile);
    setCurrentView('chat'); 
    setIsLoading(false);
  };
  
  // ✅ Nouvelle fonction de déconnexion (Inchangé)
  const handleLogout = async () => {
    setIsLoading(true);
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Erreur lors de la déconnexion:", error.message);
      setIsLoading(false);
      return;
    }
    setUser(null);
    setUserProfile(null);
    setCurrentView('auth');
    setIsLoading(false);
  };

  // ✅ useEffect pour vérifier la session au montage
  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getUser(); 
      if (data?.user) {
        await loadProfileAndSetView(data.user);
      } else {
        setIsLoading(false);
      }
    };
    checkSession();
  }, []); // Dépendance vide


  // --------------------------------------------------------------------------------------
  // 🚀 LOGIQUE DE SAUVEGARDE DU PROFIL (CORRIGÉE ET COMPLÉTÉE)
  // --------------------------------------------------------------------------------------
  const handleProfileSave = async (formData: FormData) => {
    if (!user || !userProfile) return;

    const newPseudo = formData.get('pseudo') as string;
    // Récupérer la valeur, qui peut être un File, une string (chemin), ou null
    const newAvatarInput = formData.get('avatar'); 
    let newAvatarUrl = userProfile.avatar; // Conserver l'ancienne URL par défaut

    setIsLoading(true); // Afficher un indicateur de chargement

    try {
        // --- 1. GESTION DE L'AVATAR ---
        // Cas 1: L'utilisateur a uploadé un NOUVEAU fichier
        if (newAvatarInput instanceof File && newAvatarInput.size > 0) {
            console.log("Cas 1: Traitement de l'upload de fichier.");
            const fileExt = newAvatarInput.name.split('.').pop();
            const fileName = `${user.id}-${Date.now()}.${fileExt}`;
            const filePath = `avatars/${fileName}`; // Dossier 'avatars'

            // Upload vers Supabase Storage
            const { error: uploadError } = await supabase.storage
                .from('avatars') 
                .upload(filePath, newAvatarInput, {
                    cacheControl: '3600',
                    upsert: true,
                });

            if (uploadError) {
                console.error("Erreur d'upload Supabase:", uploadError);
                throw uploadError;
            }

            // Récupérer l'URL publique
            const { data: publicUrlData } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);

            console.log("URL Publique Récupérée:", publicUrlData.publicUrl); // LOG
            newAvatarUrl = publicUrlData.publicUrl;
        
        // Cas 2: L'utilisateur a sélectionné un avatar PAR DÉFAUT (chemin string)
        } else if (typeof newAvatarInput === 'string' && newAvatarInput.startsWith('/avatars')) {
            console.log("Cas 2: Avatar par défaut sélectionné:", newAvatarInput); // LOG
            // Le chemin de l'avatar par défaut est directement l'URL finale à enregistrer
            newAvatarUrl = newAvatarInput;
            
        // Cas 3: Ni fichier ni changement d'avatar par défaut (laisse newAvatarUrl inchangé)
        } else {
            console.log("Cas 3: Avatar non modifié. URL conservée:", newAvatarUrl); // LOG
        } 

        // Log avant la mise à jour de la DB pour vérifier la valeur finale
        console.log("Valeur finale d'avatar_url envoyée à la DB:", newAvatarUrl); // LOG
        
        // --- 2. MISE À JOUR DU PROFIL DANS LA BASE DE DONNÉES (SUPABASE DB) ---
        // Utilisation de upsert pour créer ou mettre à jour la ligne
        const { error: updateError } = await supabase
            .from('profiles')
            .upsert({ 
                id: user.id, // Requis pour l'upsert
                username: newPseudo,
                avatar_url: newAvatarUrl, // <-- La nouvelle URL/chemin (ou l'ancienne)
            }, { onConflict: 'id' }); 

        if (updateError) {
            console.error("Erreur de mise à jour de la table 'profiles':", updateError); // LOG
            throw updateError;
        }
        
        console.log("Mise à jour de la DB réussie."); // LOG

        // --- 3. MISE À JOUR DE L'ÉTAT LOCAL APRÈS SUCCÈS ---
        setUserProfile((prevProfile) => ({
            ...prevProfile!,
            pseudo: newPseudo,
            avatar: newAvatarUrl,
        }));

        // 4. Retour à la vue de chat
        setCurrentView('chat');
        
    } catch (error) {
        console.error("Échec persistant de la sauvegarde, voir les logs ci-dessus.", error);
        // Utilisation de JSON.stringify pour afficher les erreurs d'objets Supabase
        alert(`Une erreur est survenue lors de la sauvegarde du profil. Veuillez vérifier la console pour le message d'erreur détaillé.`);
    } finally {
        setIsLoading(false);
    }
  };

  // ----------------------------------------------------
  // ✅ RENDU CONDITIONNEL MIS À JOUR
  // ----------------------------------------------------
  if (isLoading) {
    return <div className="loading-container">Chargement...</div>;
  }
  
  if (!user || !userProfile) {
    return (
      <AuthPanel 
        onLogin={loadProfileAndSetView} 
      />
    );
  }
  
  if (currentView === 'profile_edit') {
    return (
      <EditProfile 
        currentUser={userProfile} 
        onSave={handleProfileSave} 
        onBack={() => setCurrentView('chat')} 
      />
    );
  }
  
  // Vue par défaut : ChatApp
  return (
    <ChatApp 
      user={user} 
      currentUserProfile={userProfile} // ⭐ AJOUT DE LA PROP MANQUANTE
      onEditProfile={() => setCurrentView('profile_edit')}
      onLogout={handleLogout}
    />
  );
}