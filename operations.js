/**
 * js/operations.js
 * Implémentation des opérateurs de l'algèbre relationnelle :
 * σ (sélection), π (projection), ⨝ (jointure), ∪ (union), - (différence), ρ (renommage).
 */

/**
 * Crée une copie profonde d'une relation
 */
function cloneTable(table) {
    return table.map(row => ({ ...row }));
}

/**
 * Opérateur de SÉLECTION (σ)
 * Filtre les tuples d'une relation selon une condition
 */
function select(table, conditionStr) {
    try {
        // Remplace AND/OR par les opérateurs JS correspondants
        const cleanCond = conditionStr.replace(/AND/g, '&&').replace(/OR/g, '||');
        
        // Crée une fonction dynamique pour tester la condition sur chaque tuple
        const tester = new Function('row', `
            with(row) {
                try {
                    return (${cleanCond});
                } catch(e) { return false; }
            }
        `);

        return table.filter(row => {
            return tester(row);
        });
    } catch (e) {
        throw new Error(`Erreur de syntaxe dans la condition : ${conditionStr}`);
    }
}

/**
 * Opérateur de PROJECTION (π)
 * Sélectionne uniquement les colonnes spécifiées et élimine les doublons
 */
function project(table, columnsStr) {
    const cols = columnsStr.split(',').map(c => c.trim());
    if (cols.length === 0) return table;
    
    const seen = new Set();
    const result = [];

    for (const row of table) {
        const newRow = {};
        cols.forEach(col => {
            if (row.hasOwnProperty(col)) newRow[col] = row[col];
        });
        
        // Élimination des doublons
        const key = JSON.stringify(newRow);
        if (!seen.has(key)) {
            seen.add(key);
            result.push(newRow);
        }
    }
    return result;
}

/**
 * Opérateur de JOINTURE NATURELLE (⨝)
 * Combine deux relations sur la base de leurs colonnes communes
 */
function naturalJoin(t1, t2) {
    if (!t1.length || !t2.length) return [];

    const cols1 = Object.keys(t1[0]);
    const cols2 = Object.keys(t2[0]);
    const commonCols = cols1.filter(c => cols2.includes(c));

    const result = [];
    
    for (const r1 of t1) {
        for (const r2 of t2) {
            let match = true;
            // Vérifie l'égalité sur toutes les colonnes communes
            for (const col of commonCols) {
                if (r1[col] !== r2[col]) {
                    match = false;
                    break;
                }
            }

            if (match) {
                const newRow = { ...r1, ...r2 };
                result.push(newRow);
            }
        }
    }
    return result;
}

/**
 * Opérateur d'UNION (∪)
 * Combine les tuples de deux relations compatibles (même schéma) sans doublons
 */
function union(t1, t2) {
    const combined = [...t1, ...t2];
    const unique = new Set();
    const result = [];
    combined.forEach(row => {
        const key = JSON.stringify(row);
        if (!unique.has(key)) {
            unique.add(key);
            result.push(row);
        }
    });
    return result;
}

/**
 * Opérateur de DIFFÉRENCE (-)
 * Retourne les tuples de t1 qui ne sont pas dans t2
 */
function difference(t1, t2) {
    const keys2 = new Set(t2.map(row => JSON.stringify(row)));
    return t1.filter(row => !keys2.has(JSON.stringify(row)));
}

/**
 * Opérateur de RENOMMAGE (ρ)
 * (Note: Dans cette version simplifiée, l'opérateur est principalement symbolique)
 */
function rename(table, newName) {
    return table;
}

/**
 * Valide la compatibilité des schémas pour les opérations binaires
 */
function validateSchemaCompatibility(op, table1, table2 = null) {
    if (!table1 || table1.length === 0) {
        return { valid: false, message: 'La première relation est vide' };
    }
    
    const cols1 = Object.keys(table1[0]);
    
    if (table2) {
        if (table2.length === 0) {
            return { valid: false, message: 'La deuxième relation est vide' };
        }
        const cols2 = Object.keys(table2[0]);
        
        if (op === 'union' || op === 'difference') {
            if (cols1.length !== cols2.length) {
                return { valid: false, message: `Incompatibilité de schéma : ${cols1.length} colonnes vs ${cols2.length}` };
            }
        } else if (op === 'join') {
            const common = cols1.filter(c => cols2.includes(c));
            if (common.length === 0) {
                return { valid: false, message: 'Les relations n\'ont pas de colonnes communes pour la jointure' };
            }
        }
    }
    
    return { valid: true };
}

/**
 * MOTEUR D'EXÉCUTION DES REQUÊTES
 * Analyse récursivement l'expression et appelle les fonctions d'opération
 */
function executeRA(expr) {
    expr = expr.trim();
    if (!expr) return null;

    // Si c'est un nom de table directe
    if (DB[expr]) {
        return cloneTable(DB[expr]);
    }
    
    // Recherche de l'opérateur principal (niveau le plus bas dans l'arbre)
    function findMainOp(str, opSymbols) {
        let level = 0;
        for (let i = 0; i < str.length; i++) {
            if (str[i] === '(') level++;
            else if (str[i] === ')') level--;
            else if (level === 0) {
                for (const op of opSymbols) {
                    if (str.substr(i, op.length) === op) {
                        return { op: op, index: i };
                    }
                }
            }
        }
        return null;
    }

    // Traitement des opérations binaires (Union, Différence, Jointure)
    const op1 = findMainOp(expr, [' ∪ ', ' - ', ' ⨝ ']);
    if (op1) {
        const left = executeRA(expr.substring(0, op1.index).trim());
        const right = executeRA(expr.substring(op1.index + op1.op.length).trim());
        
        if (op1.op === ' ∪ ') {
            const validation = validateSchemaCompatibility('union', left, right);
            if (!validation.valid) throw new Error(validation.message);
            return union(left, right);
        }
        if (op1.op === ' - ') {
            const validation = validateSchemaCompatibility('difference', left, right);
            if (!validation.valid) throw new Error(validation.message);
            return difference(left, right);
        }
        if (op1.op === ' ⨝ ') {
            const validation = validateSchemaCompatibility('join', left, right);
            if (!validation.valid) throw new Error(validation.message);
            return naturalJoin(left, right);
        }
    }

    // Traitement des opérations unaires (Sélection, Projection, Renommage)
    const unaryOps = ['π', 'σ', 'ρ', 'Project', 'Select', 'Rename'];
    let matchedOp = null;
    
    for(const op of unaryOps) {
        if (expr.startsWith(op + '[') || expr.startsWith(op + ' ')) {
            matchedOp = op;
            break;
        }
    }

    if (matchedOp) {
        let argsStart = expr.indexOf('[');
        if (argsStart === -1 && expr.length > matchedOp.length && expr[matchedOp.length] === ' ') argsStart = matchedOp.length;
        
        let argsEnd = expr.indexOf(']');
        
        if (argsStart === -1 || argsEnd === -1) {
            throw new Error("Syntaxe invalide pour l'opérateur " + matchedOp + ". Attendu: Op[arg](Relation)");
        }

        const args = expr.substring(argsStart + 1, argsEnd).trim();
        const subExprStart = argsEnd + 1;
        
        if (subExprStart >= expr.length || expr[subExprStart] !== '(') {
            throw new Error("Parenthèse ouvrante manquante après l'opérateur " + matchedOp);
        }
        
        // Extraction de l'expression entre parenthèses
        let level = 0;
        let subExprEnd = -1;
        for(let i = subExprStart; i < expr.length; i++) {
            if(expr[i] === '(') level++;
            if(expr[i] === ')') level--;
            if(level === 0) {
                subExprEnd = i;
                break;
            }
        }
        
        if (subExprEnd === -1) throw new Error("Parenthèse fermante manquante");

        const subExpr = expr.substring(subExprStart + 1, subExprEnd).trim();
        const subTable = executeRA(subExpr);

        if (matchedOp === 'σ' || matchedOp === 'Select') return select(subTable, args);
        if (matchedOp === 'π' || matchedOp === 'Project') {
            // Validation des colonnes pour la projection
            if (subTable.length > 0) {
                const cols = args.split(',').map(c => c.trim());
                const availableCols = Object.keys(subTable[0]);
                const invalidCols = cols.filter(c => !availableCols.includes(c));
                if (invalidCols.length > 0) {
                    throw new Error(`Colonnes invalides : ${invalidCols.join(', ')}. Colonnes disponibles : ${availableCols.join(', ')}`);
                }
            }
            return project(subTable, args);
        }
        if (matchedOp === 'ρ' || matchedOp === 'Rename') return rename(subTable, args);
    }

    // Gestion des parenthèses groupées (E)
    if (expr.startsWith('(') && expr.endsWith(')')) {
        return executeRA(expr.substring(1, expr.length - 1));
    }

    throw new Error("Expression inconnue ou invalide : " + expr);
}
