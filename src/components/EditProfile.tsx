import React, { useState, useEffect } from 'react';

// FIX: La dépendance "../utils" n'étant pas résolue, nous définissons
// le tableau des avatars directement dans ce fichier pour permettre la compilation.
const avatars: string[] = [
 "../Avatar/AvatarBleu.webp",
 "../Avatar/AvatarJaune.webp",
 "../Avatar/AvatarMarron.webp",
 "../Avatar/AvatarNoir.webp",
 "../Avatar/AvatarVert.webp",
 "../Avatar/AvatarRose.webp",
 "../Avatar/AvatarRouge.webp",
 "../Avatar/AvatarViolet.webp"
];

// NOTE: C'est le type UserProfile utilisé dans App.tsx
interface UserProfile {
    id: string;
    pseudo: string; 
    avatar: string | null;
}

// L'interface de props corrigée pour correspondre à l'appel dans App.tsx
interface ProfileEditModalProps {
    currentUser: UserProfile;
    onSave: (formData: FormData) => Promise<void>;
    onBack: () => void;
}

// URL d'avatar par défaut si aucun n'est défini
const DEFAULT_AVATAR_URL = "/avatars/default_placeholder.png"; 

const EditProfile: React.FC<ProfileEditModalProps> = ({
    currentUser,
    onSave,
    onBack,
}) => {
    // Le composant gère maintenant ses états locaux pour l'édition :
    const [newUsername, setNewUsername] = useState(currentUser.pseudo);
    // Initialiser avec l'avatar actuel de l'utilisateur ou une valeur par défaut
    const [newAvatar, setNewAvatar] = useState<string | null>(currentUser.avatar || DEFAULT_AVATAR_URL);
    const [newAvatarFile, setNewAvatarFile] = useState<File | null>(null);
    const [isUpdating, setIsUpdating] = useState(false);

    // Initialise les états lors du montage ou si l'utilisateur change
    useEffect(() => {
        setNewUsername(currentUser.pseudo);
        setNewAvatar(currentUser.avatar || DEFAULT_AVATAR_URL);
        setNewAvatarFile(null);
    }, [currentUser]);

    // Fonction de soumission locale
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isUpdating) return;
        
        setIsUpdating(true);

        try {
            // Création de l'objet FormData pour l'envoi au parent
            const formData = new FormData();
            formData.append('pseudo', newUsername);
            
            // Si un nouveau fichier d'avatar a été sélectionné
            if (newAvatarFile) {
                formData.append('avatar', newAvatarFile);
            } else if (avatars.includes(newAvatar || '')) {
                // Si l'utilisateur a choisi un avatar par défaut
                // On envoie le chemin d'accès de l'avatar par défaut au parent.
                // Le parent (App.tsx) doit gérer le fait que ce n'est pas un upload de fichier.
                formData.append('avatar', newAvatar as string); 
            } else {
                // Si l'avatar est l'ancien avatar Supabase (non changé) ou null, 
                // on envoie une chaîne vide ou l'URL existante si l'API le permet.
                // La logique dans App.tsx est déjà configurée pour conserver l'ancienne URL si 'newAvatar' est null ou vide.
                // On envoie l'URL existante pour indiquer qu'il n'y a pas de changement de fichier uploadé.
                formData.append('avatar', newAvatar || ''); 
            }
            
            await onSave(formData);
        } catch (e) {
            console.error(e);
            // Utilisation d'une boîte de dialogue personnalisée au lieu d'alert()
            // (Note: pour cet exercice, l'alert est conservé selon les instructions précédentes)
            alert("Erreur lors de la soumission du profil. Voir console.");
        } finally {
            setIsUpdating(false);
        }
    };


    return (
        <div 
            className="profile-edit-modal-overlay" 
            style={{
                position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.7)', display: 'flex',
                justifyContent: 'center', alignItems: 'center', zIndex: 100
            }}
        >
          <form 
            onSubmit={handleSubmit} 
            className="profile-edit-modal" 
            style={{
                backgroundColor: '#36393f', padding: '30px',
                borderRadius: '8px', width: '350px',
                boxShadow: '0 5px 15px rgba(0, 0, 0, 0.5)', color: 'white',
                display: 'flex', flexDirection: 'column', gap: '15px'
            }}
          >
            <h3 style={{ marginBottom: '10px', textAlign: 'center' }}>Modifier votre profil</h3>

            {/* BLOC: PRÉVISUALISATION DE L'AVATAR EN COURS */}
            <div style={{ textAlign: 'center', marginBottom: '10px' }}>
                <img 
                    // Utilise l'état newAvatar (URL d'upload ou chemin par défaut)
                    src={newAvatar || DEFAULT_AVATAR_URL} 
                    alt="Aperçu de l'avatar"
                    style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #5865f2' }}
                    // Gérer l'erreur de chargement pour les URL de fichiers temporaires
                    onError={(e) => {
                        e.currentTarget.src = DEFAULT_AVATAR_URL;
                        e.currentTarget.onerror = null; 
                    }}
                />
            </div>
            {/* FIN DU BLOC DE PRÉVISUALISATION */}

            {/* CHAMP NOM D'UTILISATEUR */}
            <div>
                <label style={{ display: 'block', color: '#b9bbbe', marginBottom: '5px', fontSize: '14px' }}>Pseudo :</label>
                <input
                    type="text"
                    placeholder="Nouveau nom d'utilisateur (3+ caractères)"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    required
                    autoComplete="nickname"
                    style={{ width: '100%', padding: '10px', border: 'none', borderRadius: '4px', background: '#202225', color: 'white' }}
                    disabled={isUpdating}
                />
            </div>

            {/* SÉLECTION D'AVATAR PAR DÉFAUT */}
            <div className="avatar-selector" style={{ padding: '15px', borderRadius: '8px', border: '1px solid #202225', backgroundColor: '#2d3136' }}>
                <p style={{ color: '#b9bbbe', marginBottom: '10px', fontSize: '14px', textAlign: 'center' }}>Choisissez un avatar par défaut :</p>
                <div className="avatar-grid" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '8px' }}>
                  {avatars.map((avatarPath: string) => ( 
                    <img
                      key={avatarPath}
                      src={avatarPath}
                      alt="Avatar option"
                      onClick={() => {
                        // Lorsque l'utilisateur clique sur un avatar par défaut
                        setNewAvatar(avatarPath);
                        setNewAvatarFile(null); // Annule tout upload de fichier précédent
                      }}
                      style={{ 
                          width: '48px', height: '48px', borderRadius: '50%', cursor: 'pointer',
                          // Mettre en évidence l'avatar sélectionné
                          border: newAvatar === avatarPath ? '3px solid #5865f2' : '3px solid transparent',
                          transition: 'all 0.2s', objectFit: 'cover'
                      }}
                    />
                  ))}
                </div>
            </div>
            
            {/* CHAMP POUR UPLOAD DE FICHIER (Optionnel) */}
            <div>
                <label style={{ display: 'block', color: '#b9bbbe', marginBottom: '5px', fontSize: '14px' }}>Ou téléchargez une nouvelle image :</label>
                <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        setNewAvatarFile(file);
                        if (file) {
                            // Utiliser l'URL temporaire pour la prévisualisation immédiate
                            setNewAvatar(URL.createObjectURL(file)); 
                        } else {
                             // Si l'utilisateur annule la sélection du fichier, revenir à l'ancien état
                             setNewAvatar(currentUser.avatar || DEFAULT_AVATAR_URL);
                        }
                    }}
                    style={{ width: '100%', padding: '10px', border: 'none', borderRadius: '4px', background: '#202225', color: 'white' }}
                    disabled={isUpdating}
                />
            </div>


            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', marginTop: '15px' }}>
                <button 
                  type="button" 
                  onClick={onBack} 
                  style={{ padding: '10px 20px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', flex: '1', transition: 'background-color 0.3s' }}
                  disabled={isUpdating}
                >
                  Annuler
                </button>
                <button 
                  type="submit" 
                  disabled={isUpdating || newUsername.length < 3}
                  style={{ padding: '10px 20px', background: '#5865f2', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', flex: '1', transition: 'background-color 0.3s' }}
                >
                  {isUpdating ? "Sauvegarde..." : "Sauvegarder"}
                </button>
            </div>
          </form>
        </div>
    );
};

export default EditProfile;