import { useState, useEffect, useCallback } from "react";
import { supabase } from "../src/lib/supasbaseClient.ts"; 
import { type User } from "@supabase/supabase-js";

import AuthPanel from "./Auth.tsx"; 
import ChatApp from "./ChatApp.tsx"; 
import EditProfile, { avatars } from "../src/components/EditProfile.tsx"; 
import "./App.css";
import "./Auth.css";

// Définition des constantes et types
type CurrentView = 'chat' | 'profile_edit' | 'auth';
type UserStatus = 'online' | 'idle' | 'offline'; // Les statuts possibles
const IDLE_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

// --- Définition du Type de Profil (CORRIGÉ) ---
interface UserProfile {
  id: string;
  pseudo: string; 
  avatar: string | null;
  // ✅ CORRECTION: Ajout du statut à l'interface
  status: UserStatus; 
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null); 
  const [currentView, setCurrentView] = useState<CurrentView>('auth');
  const [isLoading, setIsLoading] = useState(true);
  
  // NOUVEL ÉTAT: Gestion du statut de l'utilisateur (la valeur actuelle)
  const [userStatus, setUserStatus] = useState<UserStatus>('offline');

  // ⭐ FONCTION STABLE: Pour mettre à jour le statut dans la DB
  const updateUserStatus = useCallback(async (status: UserStatus, userId: string) => {
    if (!userId) return;
    
    // IMPORTANT: Cela met à jour le champ 'status' dans la table 'profiles'
    const { error } = await supabase
        .from('profiles')
        .update({ status: status })
        .eq('id', userId);

    if (error) {
        console.error(`Erreur lors de la mise à jour du statut vers ${status}:`, error.message);
    } else {
        // Mise à jour de l'état local APRES succès DB
        setUserStatus(status); 
    }
  }, []);

  // ⭐ FONCTION UTILITAIRE POUR CHARGER LE PROFIL DEPUIS LA BASE DE DONNÉES
  const fetchUserProfile = async (currentUser: User): Promise<UserProfile> => {
    const { data, error } = await supabase
      .from('profiles')
      .select('username, avatar_url, status') 
      .eq('id', currentUser.id)
      .limit(1);

    if (error) { 
        console.error("Erreur critique lors du chargement du profil:", error.message);
        // Fallback en cas d'erreur (DOIT inclure 'status')
        return {
            id: currentUser.id,
            pseudo: currentUser.email?.split('@')[0] || "NouvelUtilisateur",
            avatar: null,
            status: 'offline', 
        };
    }

    const profileData = data?.[0];
    
    // Déterminer le statut initial : on force 'online' si la DB n'a rien ou 'offline'
    const initialStatus: UserStatus = (profileData?.status === 'online' || profileData?.status === 'idle') 
                            ? profileData.status 
                            : 'online';

    return {
        id: currentUser.id,
        pseudo: profileData?.username || currentUser.email?.split('@')[0] || "NouvelUtilisateur",
        avatar: profileData?.avatar_url || null, 
        status: initialStatus, // ✅ Statut initial
    };
  };

  const loadProfileAndSetView = async (currentUser: User) => {
    const profile = await fetchUserProfile(currentUser);
    setUser(currentUser);
    setUserProfile(profile);
    setCurrentView('chat'); 
    setIsLoading(false);
    
    // À la connexion, on force le statut 'online' dans la DB
    updateUserStatus('online', currentUser.id); 
  };
  
  // ✅ Fonction de déconnexion
  const handleLogout = async () => {
    if (user) {
        // Mettre à jour le statut dans la DB vers 'offline' avant de déconnecter
        await updateUserStatus('offline', user.id); 
    }
    
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

  // --------------------------------------------------------------------------------------
  // ⭐ NOUVEL EFFECT: DÉTECTION D'INACTIVITÉ
  // --------------------------------------------------------------------------------------
  useEffect(() => {
    if (!user || currentView !== 'chat') return; 

    let activityTimer: number;

    const setIdle = () => {
        // Si le timer expire et que nous ne sommes pas déjà 'idle' ou 'offline'
        if (userStatus === 'online') {
            updateUserStatus('idle', user.id);
        }
    };

    const handleActivity = () => {
        clearTimeout(activityTimer);
        
        // Si le statut actuel n'est pas 'online' et que nous sommes connectés, le remettre à jour
        if (userStatus !== 'online' && userStatus !== 'offline') { 
            updateUserStatus('online', user.id);
        }

        // Réinitialiser le timer
        activityTimer = setTimeout(setIdle, IDLE_TIMEOUT_MS) as unknown as number;
    };

    const events = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart'];

    events.forEach(event => {
        window.addEventListener(event, handleActivity);
    });
    
    handleActivity(); // Démarrer le timer immédiatement

    // Fonction de nettoyage (cleanup)
    return () => {
        clearTimeout(activityTimer);
        events.forEach(event => {
            window.removeEventListener(event, handleActivity);
        });
    };
  }, [user, userStatus, currentView, updateUserStatus]);
  
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
  }, []); 


  // --------------------------------------------------------------------------------------
  // 🚀 LOGIQUE DE SAUVEGARDE DU PROFIL 
  // --------------------------------------------------------------------------------------
  const handleProfileSave = async (formData: FormData) => {
    if (!user || !userProfile) return;

    const newPseudo = formData.get('pseudo') as string;
    const newAvatarInput = formData.get('avatar'); 
    let newAvatarUrl = userProfile.avatar; 

    setIsLoading(true);

    try {
        // ... (Logique d'upload de fichier/sélection d'avatar par défaut) ...
        if (newAvatarInput instanceof File && newAvatarInput.size > 0) {
            const fileExt = newAvatarInput.name.split('.').pop();
            const fileName = `${user.id}-${Date.now()}.${fileExt}`;
            const filePath = `avatars/${fileName}`; 

            const { error: uploadError } = await supabase.storage
                .from('avatars') 
                .upload(filePath, newAvatarInput, {
                    cacheControl: '3600',
                    upsert: true,
                });

            if (uploadError) throw uploadError;

            const { data: publicUrlData } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);

            newAvatarUrl = publicUrlData.publicUrl;
        
        } else if (typeof newAvatarInput === 'string' && avatars.includes(newAvatarInput)) {
            newAvatarUrl = newAvatarInput;
            
        } else {
            if (typeof newAvatarInput === 'string' && newAvatarInput !== '') {
                newAvatarUrl = newAvatarInput;
            } else {
                newAvatarUrl = userProfile.avatar;
            }
        } 
        
        // --- 2. MISE À JOUR DU PROFIL DANS LA BASE DE DONNÉES (SUPABASE DB) ---
        const { error: updateError } = await supabase
            .from('profiles')
            .upsert({ 
                id: user.id, 
                username: newPseudo,
                avatar_url: newAvatarUrl, 
                status: userStatus, // ⭐ On s'assure de conserver le statut actuel lors de la MAJ du profil
            }, { onConflict: 'id' }); 

        if (updateError) throw updateError;
        
        // --- 3. MISE À JOUR DE L'ÉTAT LOCAL APRÈS SUCCÈS ---
        setUserProfile((prevProfile) => ({
            ...prevProfile!,
            pseudo: newPseudo,
            avatar: newAvatarUrl,
            status: userStatus, // Mise à jour du statut dans l'objet profil local
        }));

        setCurrentView('chat');
        
    } catch (error) {
        console.error("Échec persistant de la sauvegarde.", error);
        alert(`Une erreur est survenue lors de la sauvegarde du profil. Veuillez vérifier la console pour le message d'erreur détaillé.`);
    } finally {
        setIsLoading(false);
    }
  };

  // ----------------------------------------------------
  // ✅ RENDU CONDITIONNEL 
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
      // ⭐ Passage du statut le plus récent (géré par le système d'activité)
      currentUserProfile={{ ...userProfile, status: userStatus }} 
      onEditProfile={() => setCurrentView('profile_edit')}
      onLogout={handleLogout}
    />
  );
}