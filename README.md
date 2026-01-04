💬 Bloop - Documentation Technique Complète
Bloop est une plateforme de messagerie en temps réel construite avec React 18, TypeScript et Supabase. Elle reproduit les fonctionnalités de base d'une application sociale moderne comme Discord, incluant la gestion de serveurs, de canaux, de messages privés et d'états de présence.

ChatApp.tsx : Le Noyau Social et Temps Réel
Ce fichier est le composant le plus dense, gérant l'interface utilisateur principale et les flux de données interactifs.
Gestion des États de Présence : Utilise un dictionnaire StatusColors pour mapper les états 'online', 'idle', et 'offline' à des couleurs spécifiques (Vert vif, Orange, Gris).
Architecture des Données : Définit des interfaces strictes pour les Friend (amis), Channel (canaux de serveurs) et PrivateConversation (messages privés).

Système de Messagerie :
Filtre les messages dynamiquement en fonction de l'ID du canal ou de la conversation sélectionnée.
Gère le rendu des médias (images, GIFs) et les mentions d'utilisateurs via le symbole @.

Layout Multi-colonnes :
Barre Latérale Gauche : Navigation entre serveurs et accès aux messages privés.
Panneau Central : Flux de discussion défilable avec horodatage localisé.
Panneau Droit : Liste des amis triée, affichant les utilisateurs connectés en priorité avec leurs indicateurs de statut visuels.

App.tsx : Le Cœur Logique et Gestionnaire d'État
Ce fichier orchestre le cycle de vie de l'application et la synchronisation avec le backend.
Routage Interne : Gère trois vues principales (chat, profile_edit, auth) via un état currentView.

Détection d'Inactivité (Idle Logic) :
Utilise un délai d'expiration de 5 minutes (IDLE_TIMEOUT_MS).
Écoute les événements système (mousemove, keydown, scroll) pour réinitialiser le statut de l'utilisateur de idle à online.

Synchronisation Supabase :
La fonction updateUserStatus met à jour directement la table profiles dans PostgreSQL pour refléter l'état de l'utilisateur en temps réel.
handleProfileSave gère la logique complexe d'upload d'avatars vers Supabase Storage et la mise à jour des métadonnées du profil.
Persistance de Session : Un useEffect vérifie la session utilisateur via supabase.auth.getUser() dès le montage du composant.

Auth.tsx : Le Module d'Authentification
Responsable de l'entrée sécurisée des utilisateurs dans l'écosystème Bloop.
Modes d'Accès : Bascule dynamiquement entre les formulaires de "Connexion" et d' "Inscription".
Inscription Enrichie : Lors de la création de compte, le pseudo est stocké dans les métadonnées de l'utilisateur (options: { data: { username } }) pour être récupéré par le profil plus tard.
Interface Immersive : Importe une image de fond (icon.png) et applique un dégradé (linear-gradient) pour assurer une esthétique moderne et une lisibilité optimale des champs de saisie.

main.tsx : L'Ancrage du Projet
Rendu : Utilise createRoot pour monter l'application React dans le DOM HTML.
Qualité du Code : Enveloppe <App /> dans <StrictMode> pour détecter les problèmes de cycle de vie et les effets de bord indésirables pendant le développement.
Styles Globaux : Importe index.css qui contient les définitions CSS globales pour l'ensemble de l'application.

Pourquoi utiliser Supabase ? 
Le Temps Réel Natif (Realtime)
C'est l'atout majeur pour une application comme la vôtre.
Synchronisation instantanée : Dans ChatApp.tsx, Supabase permet de recevoir les messages dès qu'ils sont postés sans avoir à rafraîchir la page.
Gestion de la présence : Votre système de statuts (online, idle, offline) s'appuie sur la capacité de Supabase à suivre l'activité des utilisateurs en direct.

Authentification Simplifiée
Supabase gère toute la complexité de la sécurité.
Gestion des sessions : Dans App.tsx, l'application vérifie automatiquement si l'utilisateur est déjà connecté via supabase.auth.getUser().
Inscription et Métadonnées : Comme vu dans Auth.tsx, vous pouvez lier un pseudo personnalisé directement au compte lors de sa création via les métadonnées de l'utilisateur.

Base de données relationnelle puissante (PostgreSQL)
Contrairement à d'autres solutions, Supabase utilise PostgreSQL, ce qui permet de structurer vos données de manière robuste.
Relations complexes : Vous gérez facilement les liens entre les amis (friendships), les serveurs (group_servers) et les canaux (server_channels).
Mises à jour atomiques : La fonction updateUserStatus dans App.tsx illustre la simplicité avec laquelle on peut modifier une donnée précise en base.

Stockage de fichiers intégré (Storage)
Pour une application de chat, l'échange de médias est essentiel.
Upload d'avatars : Votre code dans App.tsx utilise Supabase Storage pour uploader, stocker et récupérer les photos de profil des utilisateurs de manière sécurisée.
Partage multimédia : ChatApp.tsx peut ainsi afficher des images et des GIFs stockés sur le cloud via des URLs publiques générées par Supabase.

Dossier Avatar : 
Permet, lors de la création du profil, de choisir son Bloopy par les avatars prédéfini 
