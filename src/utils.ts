// src/utils.ts

/**
 * @description Une liste de chemins d'accès (URLs ou chemins locaux) pour les avatars.
 * Il est important de bien typer ce tableau comme string[] (tableau de chaînes de caractères)
 * pour éviter l'erreur TypeScript 7006.
 */
export const avatars: string[] = [
    // ASSUREZ-VOUS QUE CES CHEMINS SONT VALIDES
    // Ils doivent pointer vers les images que votre application peut charger.
    
    // Exemple de chemins si les avatars sont dans le dossier public/avatars
 "../Avatar/AvatarBleu.webp",
 "../Avatar/AvatarJaune.webp",
 "../Avatar/AvatarMarron.webp",
 "../Avatar/AvatarNoir.webp",
 "../Avatar/AvatarVert.webp",
 "../Avatar/AvatarRose.webp",
 "../Avatar/AvatarRouge.webp",
 "../Avatar/AvatarViolet.webp"
];

// Vous pouvez ajouter d'autres fonctions utilitaires ici si nécessaire.