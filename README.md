# Calculateur d'Algèbre Relationnelle

Un outil web interactif pour apprendre et tester les opérations de l'algèbre relationnelle sur des ensembles de données personnalisables.

## 🚀 Fonctionnalités

- **Opérateurs Supportés** : Sélection (σ), Projection (π), Jointure Naturelle (⨝), Union (∪), Différence (-), Renommage (ρ).
- **Éditeur de Requêtes** : Interface conviviale avec insertion rapide de symboles.
- **Constructeur Visuel** : Interface de glisser-déposer (Drag & Drop) pour construire des requêtes complexes graphiquement.
- **Gestion de Données** : Création de relations, ajout/édition de tuples directement dans l'interface.
- **Validation de Schéma** : Vérification de la compatibilité des schémas avant l'exécution (ex: même nombre de colonnes pour l'union).
- **Exportation** : Téléchargement des résultats au format CSV ou JSON.
- **Historique** : Suivi des dernières requêtes exécutées pour une consultation rapide.



## 🛠️ Installation

Aucune installation complexe n'est requise. Le projet est construit avec des technologies web standards (HTML5, CSS3, JavaScript ES6+).

1. Clonez ou téléchargez le dossier du projet.
2. Ouvrez le fichier `index.html` dans n'importe quel navigateur moderne (Chrome, Firefox, Edge, Safari).

## 📖 Utilisation

1. **Charger des données** : Utilisez le bouton "📋 Exemples" pour charger des tables prédéfinies (Étudiants, Cours) ou créez les vôtres avec "+ Ajouter".
2. **Écrire une requête** : Tapez votre expression dans l'éditeur. Exemples :
   - `σ[Age > 21](ETUDIANT)`
   - `π[Nom, Ville](ETUDIANT)`
   - `ETUDIANT ⨝ COURS`
3. **Exécuter** : Appuyez sur "Exécuter" ou sur la touche "Entrée".
4. **Export** : Si un résultat s'affiche, les boutons CSV et JSON deviennent actifs pour l'exportation.

---
Développé pour l'apprentissage des bases de données relationnelles.
