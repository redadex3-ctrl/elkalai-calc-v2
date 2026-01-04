/**
 * js/data.js
 * Ce fichier contient les structures de données initiales,
 * les exemples de relations et la base de données simulée (DB).
 */

// Base de données simulée en mémoire
const DB = {};

/**
 * Relations d'exemple basées sur le cours
 * Utilisées pour remplir la base de données via l'interface
 */
const EXAMPLES = {
    // Relation Étudiant
    ETUDIANT: {
        columns: ['NumEtudiant', 'Nom', 'Prenom', 'Age', 'Ville'],
        data: [
            { NumEtudiant: 'E001', Nom: 'Alami', Prenom: 'Fatima', Age: 22, Ville: 'Fès' },
            { NumEtudiant: 'E002', Nom: 'Benna', Prenom: 'Mohammed', Age: 21, Ville: 'Casablanca' },
            { NumEtudiant: 'E003', Nom: 'Chakir', Prenom: 'Sara', Age: 23, Ville: 'Fès' },
            { NumEtudiant: 'E004', Nom: 'Darif', Prenom: 'Ahmed', Age: 20, Ville: 'Rabat' }
        ]
    },
    // Relation Cours
    COURS: {
        columns: ['CodeCours', 'Intitule', 'NbHeures', 'NumEtudiant'],
        data: [
            { CodeCours: 'C101', Intitule: 'Bases de données', NbHeures: 40, NumEtudiant: 'E001' },
            { CodeCours: 'C102', Intitule: 'Algorithmes', NbHeures: 35, NumEtudiant: 'E001' },
            { CodeCours: 'C103', Intitule: 'Réseaux', NbHeures: 30, NumEtudiant: 'E002' },
            { CodeCours: 'C104', Intitule: 'Web', NbHeures: 25, NumEtudiant: 'E003' }
        ]
    }
};

// Variables globales pour le suivi de l'état de l'application
let editingTableName = null;
let editingRowIndex = null;
let queryHistory = [];
let builderData = [];
