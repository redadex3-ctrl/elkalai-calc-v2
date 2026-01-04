/**
 * js/app.js
 * Logique de l'interface utilisateur, gestion des événements,
 * manipulations du DOM et intégration des fonctionnalités.
 */

// --- Éléments du DOM ---
const schemaList = document.getElementById('schema-list');
const queryInput = document.getElementById('query-input');
const resultOutput = document.getElementById('result-output');
const resultCount = document.getElementById('result-count');

// --- Fonctions Utilitaires d'Interface ---

/**
 * Affiche une notification toast
 */
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(100%)';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

/**
 * Ouvre une fenêtre modale
 */
function openModal(modalId) {
    document.getElementById(modalId).classList.add('active');
}

/**
 * Ferme une fenêtre modale
 */
function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

/**
 * Échappe les caractères HTML pour éviter les injections XSS
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// --- Gestion du Schéma (Sidebar) ---

/**
 * Rafraîchit la liste des relations dans le panneau latéral
 */
function refreshSidebar() {
    schemaList.innerHTML = '';
    for (const [tableName, data] of Object.entries(DB)) {
        const li = document.createElement('li');
        li.className = 'schema-item editable';
        const cols = data.length > 0 ? Object.keys(data[0]).join(', ') : 'vide';
        li.innerHTML = `
            <div class="schema-item-text" onclick="queryInput.value='${tableName}'; runQuery();">
                <div class="schema-name">${tableName}</div>
                <div class="schema-cols">${cols}</div>
            </div>
            <div class="schema-item-actions">
                <button class="small-btn" onclick="openAddTupleModal('${tableName}')">+ Tuple</button>
                <button class="small-btn" onclick="deleteTable('${tableName}')" style="background-color:#fee2e2; color:#dc2626;">Suppr</button>
            </div>
        `;
        schemaList.appendChild(li);
    }
    updateBuilderRelations();
}

/**
 * Initialise l'application au chargement
 */
function initSidebar() {
    refreshSidebar();
    updateExportButtons();
}

// --- Gestion des Relations (CRUD) ---

/**
 * Ouvre la modale de création de table
 */
function openAddTableModal() {
    document.getElementById('tableName').value = '';
    document.getElementById('tableColumns').value = '';
    openModal('addTableModal');
}

/**
 * Crée une nouvelle relation dans la base de données
 */
function createTable() {
    const tableName = document.getElementById('tableName').value.trim();
    const columnsStr = document.getElementById('tableColumns').value.trim();

    if (!tableName || !columnsStr) {
        showToast('Nom et colonnes requis', 'error');
        return;
    }

    if (DB[tableName]) {
        showToast(`La relation "${tableName}" existe déjà`, 'error');
        return;
    }

    const columns = columnsStr.split(',').map(c => c.trim());
    const emptyRow = {};
    columns.forEach(col => emptyRow[col] = '');
    
    DB[tableName] = [emptyRow];
    
    closeModal('addTableModal');
    refreshSidebar();
    openAddTupleModal(tableName);
    showToast(`Relation "${tableName}" créée`, 'success');
}

/**
 * Supprime une relation
 */
function deleteTable(tableName) {
    if (confirm(`Supprimer la relation "${tableName}" ?`)) {
        delete DB[tableName];
        refreshSidebar();
        resultOutput.innerHTML = '<div class="empty-state"><p>Relation supprimée</p></div>';
        resultCount.textContent = '';
        showToast(`Relation "${tableName}" supprimée`, 'success');
    }
}

// --- Gestion des Tuples ---

/**
 * Ouvre la modale pour ajouter un tuple
 */
function openAddTupleModal(tableName) {
    editingTableName = tableName;
    editingRowIndex = null;
    document.getElementById('addTupleTableName').textContent = tableName;
    
    const columns = DB[tableName].length > 0 ? Object.keys(DB[tableName][0]) : [];
    
    let formHtml = '';
    columns.forEach(col => {
        formHtml += `
            <div class="form-group">
                <label>${col}:</label>
                <input type="text" id="field_${col}" placeholder="${col}">
            </div>
        `;
    });
    
    document.getElementById('addTupleForm').innerHTML = formHtml;
    openModal('addTupleModal');
}

/**
 * Enregistre un nouveau tuple
 */
function saveTuple() {
    const tableName = editingTableName;
    const columns = Object.keys(DB[tableName][0] || {});
    const newRow = {};
    
    columns.forEach(col => {
        const value = document.getElementById(`field_${col}`).value;
        newRow[col] = isNaN(value) ? value : (value === '' ? '' : parseFloat(value) || value);
    });
    
    const isFirstTuple = DB[tableName].length === 1 && Object.values(DB[tableName][0]).every(v => v === '');
    
    if (isFirstTuple) DB[tableName][0] = newRow;
    else DB[tableName].push(newRow);
    
    closeModal('addTupleModal');
    refreshSidebar();
    queryInput.value = editingTableName;
    runQuery();
}

/**
 * Ouvre la modale d'édition d'un tuple existant
 */
function openEditTupleModal(tableName, rowIndex) {
    editingTableName = tableName;
    editingRowIndex = rowIndex;
    document.getElementById('editTupleTableName').textContent = tableName;
    
    const row = DB[tableName][rowIndex];
    const columns = Object.keys(row);
    
    let formHtml = '';
    columns.forEach(col => {
        formHtml += `
            <div class="form-group">
                <label>${col}:</label>
                <input type="text" id="field_${col}" value="${String(row[col] || '')}">
            </div>
        `;
    });
    
    document.getElementById('editTupleForm').innerHTML = formHtml;
    openModal('editTupleModal');
}

/**
 * Met à jour un tuple après modification
 */
function updateTuple() {
    const tableName = editingTableName;
    const rowIndex = editingRowIndex;
    const columns = Object.keys(DB[tableName][rowIndex]);
    
    columns.forEach(col => {
        const value = document.getElementById(`field_${col}`).value;
        DB[tableName][rowIndex][col] = isNaN(value) ? value : (value === '' ? '' : parseFloat(value) || value);
    });
    
    closeModal('editTupleModal');
    runQuery();
}

/**
 * Supprime un tuple d'une relation
 */
function deleteTuple(tableName, rowIndex) {
    if (confirm('Supprimer ce tuple ?')) {
        DB[tableName].splice(rowIndex, 1);
        runQuery();
    }
}

// --- Exécution des Requêtes ---

/**
 * Lance l'analyse et l'exécution de la requête saisie
 */
function runQuery() {
    const expr = queryInput.value.trim();
    if (!expr) {
        showToast("Veuillez entrer une requête.", "info");
        return;
    }

    try {
        const startTime = performance.now();
        const result = executeRA(expr);
        const endTime = performance.now();

        const isSimpleTable = DB[expr];
        resultOutput.innerHTML = renderTable(result, isSimpleTable ? expr : null);
        
        const count = result ? result.length : 0;
        resultCount.textContent = `${count} tuple(s) trouvé(s) (${(endTime - startTime).toFixed(2)}ms)`;
        
        addToHistory(expr, count, result);
        updateExportButtons();
        
        resultOutput.style.opacity = '0.5';
        setTimeout(() => resultOutput.style.opacity = '1', 100);

    } catch (err) {
        resultOutput.innerHTML = `
            <div style="padding:1rem; color:var(--error-color); display:flex; flex-direction:column; align-items:center;">
                <strong>Erreur d'exécution</strong>
                <span style="font-size:0.9rem; margin-top:5px;">${err.message}</span>
            </div>
        `;
        resultCount.textContent = "Erreur";
        showToast(err.message, "error");
        updateExportButtons();
    }
}

/**
 * Insère un symbole à la position du curseur dans l'éditeur
 */
function insertSymbol(symbol) {
    const start = queryInput.selectionStart;
    const end = queryInput.selectionEnd;
    const text = queryInput.value;
    queryInput.value = text.substring(0, start) + symbol + text.substring(end);
    queryInput.selectionStart = queryInput.selectionEnd = start + symbol.length;
    queryInput.focus();
}

/**
 * Vide l'éditeur de requête
 */
function clearInput() {
    queryInput.value = '';
    queryInput.focus();
}

// --- Rendu des Résultats ---

/**
 * Génère le code HTML d'un tableau de résultats
 */
function renderTable(data, tableName = null) {
    if (!data || data.length === 0) {
        return '<p style="padding:1rem; text-align:center; color:#64748b;">Relation vide (0 tuples)</p>';
    }

    const headers = Object.keys(data[0]);
    let html = '<table><thead><tr>';
    headers.forEach(h => html += `<th>${h}</th>`);
    if (tableName && DB[tableName]) html += '<th style="width:120px;">Actions</th>';
    html += '</tr></thead><tbody>';

    data.forEach((row, idx) => {
        html += '<tr>';
        headers.forEach(h => html += `<td>${row[h] !== undefined ? row[h] : ''}</td>`);
        if (tableName && DB[tableName]) {
            html += `<td>
                <button class="small-btn" onclick="openEditTupleModal('${tableName}', ${idx})">Éditer</button>
                <button class="delete-btn" onclick="deleteTuple('${tableName}', ${idx})">Suppr</button>
            </td>`;
        }
        html += '</tr>';
    });
    html += '</tbody></table>';
    return html;
}

// --- Exportation de Données ---

/**
 * Récupère les données du dernier résultat affiché
 */
function getLastResult() {
    const table = resultOutput.querySelector('table');
    if (!table) return null;
    
    const headers = [];
    table.querySelectorAll('thead th').forEach(th => {
        const text = th.textContent.trim();
        if (text !== 'Actions') headers.push(text);
    });
    
    const data = [];
    table.querySelectorAll('tbody tr').forEach(tr => {
        const row = {};
        const cells = tr.querySelectorAll('td');
        headers.forEach((header, idx) => {
            row[header] = cells[idx] ? cells[idx].textContent.trim() : '';
        });
        data.push(row);
    });
    
    return { headers, data };
}

/**
 * Active/Désactive les boutons d'export selon la présence de résultats
 */
function updateExportButtons() {
    const hasResult = resultOutput.querySelector('table') !== null;
    ['exportCSV', 'exportJSON'].forEach(id => {
        const btn = document.getElementById(id);
        btn.style.opacity = hasResult ? '1' : '0.5';
        btn.style.pointerEvents = hasResult ? 'auto' : 'none';
    });
}

/**
 * Export au format CSV
 */
function exportToCSV() {
    const result = getLastResult();
    if (!result) return;
    
    let csv = result.headers.join(',') + '\n';
    result.data.forEach(row => {
        csv += result.headers.map(h => `"${row[h] || ''}"`).join(',') + '\n';
    });
    
    downloadFile(csv, 'resultat.csv', 'text/csv');
}

/**
 * Export au format JSON
 */
function exportToJSON() {
    const result = getLastResult();
    if (!result) return;
    downloadFile(JSON.stringify(result.data, null, 2), 'resultat.json', 'application/json');
}

function downloadFile(content, filename, type) {
    const blob = new Blob([content], { type });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
}

// --- Historique ---

function addToHistory(query, resultCount, resultData) {
    const timestamp = new Date().toLocaleTimeString('fr-FR');
    queryHistory.unshift({ query, resultCount, timestamp, resultData: resultData || [] });
    if (queryHistory.length > 50) queryHistory.pop();
    updateHistoryDisplay();
}

function updateHistoryDisplay() {
    const list = document.getElementById('history-list');
    list.innerHTML = '';
    queryHistory.forEach((item, idx) => {
        const li = document.createElement('li');
        li.className = 'history-item';
        li.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <div><strong>${item.timestamp}</strong> - <code>${escapeHtml(item.query)}</code></div>
                <button class="small-btn" onclick="loadHistoryResult(${idx})">Voir</button>
            </div>
        `;
        li.onclick = () => loadHistoryResult(idx);
        list.appendChild(li);
    });
}

function loadHistoryResult(idx) {
    const item = queryHistory[idx];
    queryInput.value = item.query;
    resultOutput.innerHTML = renderTable(item.resultData);
    resultCount.textContent = `${item.resultData.length} tuple(s) trouvé(s)`;
}

// --- Constructeur Visuel (Drag-and-Drop) ---

function toggleBuilder() {
    const panel = document.getElementById('builderPanel');
    panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
    if (panel.style.display === 'block') updateBuilderRelations();
}

function updateBuilderRelations() {
    const container = document.getElementById('builderRelations');
    container.innerHTML = '';
    Object.keys(DB).forEach(name => {
        const div = document.createElement('div');
        div.className = 'relation-item';
        div.draggable = true;
        div.textContent = name;
        div.ondragstart = (e) => e.dataTransfer.setData('text/plain', JSON.stringify({ type: 'relation', name }));
        container.appendChild(div);
    });
}

function dragOperator(e) {
    const op = e.target.dataset.op;
    e.dataTransfer.setData('text/plain', JSON.stringify({ type: 'operator', op }));
}

function allowDrop(e) { e.preventDefault(); }

function dropInWorkspace(e) {
    e.preventDefault();
    const data = JSON.parse(e.dataTransfer.getData('text/plain'));
    if (data.type === 'relation') builderData = [data];
    else builderData.push(data);
    renderBuilderWorkspace();
}

function renderBuilderWorkspace() {
    const workspace = document.getElementById('builderWorkspace');
    if (builderData.length === 0) {
        workspace.innerHTML = '<div style="color:#94a3b8;">Glissez une relation ici</div>';
        return;
    }
    workspace.innerHTML = builderData.map((item, idx) => `
        <span class="${item.type === 'relation' ? 'builder-item' : 'builder-operator'}">
            ${item.name || item.op}
            ${item.type === 'relation' ? `<button class="close-btn" onclick="removeBuilderItem(${idx})">✕</button>` : ''}
        </span>
    `).join(' ');
}

function removeBuilderItem(idx) {
    builderData.splice(idx, 1);
    renderBuilderWorkspace();
}

function buildQueryFromBuilder() {
    if (builderData.length === 0) return;
    let query = '';
    builderData.forEach(item => {
        if (item.type === 'relation') query += item.name;
        else {
            const arg = prompt(`Argument pour ${item.op} (ex: condition ou colonnes):`);
            if (arg) {
                if (['σ', 'π', 'ρ'].includes(item.op)) query = `${item.op}[${arg}](${query})`;
                else query = `${query} ${item.op} ${arg}`;
            }
        }
    });
    queryInput.value = query;
    runQuery();
    toggleBuilder();
}

function clearBuilder() {
    builderData = [];
    renderBuilderWorkspace();
}

// --- Gestion des Exemples ---

function openExamplesModal() {
    let html = '<div style="display: grid; gap: 1rem;">';
    
    for (const [name, example] of Object.entries(EXAMPLES)) {
        html += `
            <div style="border: 1px solid var(--border-color); border-radius: 6px; padding: 1rem;">
                <h3 style="color: var(--primary-color); margin-bottom: 0.5rem;">${name}</h3>
                <p style="font-size: 0.85rem; color: #64748b; margin-bottom: 0.75rem;">
                    Colonnes: <code>${example.columns.join(', ')}</code>
                </p>
                <div style="max-height: 150px; overflow-y: auto; margin-bottom: 0.75rem; background-color: #f8fafc; border-radius: 4px; padding: 0.5rem;">
                    <table style="width: 100%; font-size: 0.8rem;">
                        <thead>
                            <tr>
                                ${example.columns.map(col => `<th style="text-align: left; padding: 0.5rem; border-bottom: 1px solid var(--border-color);">${col}</th>`).join('')}
                            </tr>
                        </thead>
                        <tbody>
                            ${example.data.map(row => `
                                <tr>
                                    ${example.columns.map(col => `<td style="text-align: left; padding: 0.5rem; border-bottom: 1px solid var(--border-color);">${row[col]}</td>`).join('')}
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
                <button class="btn primary" style="width: 100%;" onclick="loadExample('${name}')">Charger cet exemple</button>
            </div>
        `;
    }
    
    html += '</div>';
    document.getElementById('examplesContent').innerHTML = html;
    openModal('examplesModal');
}

function loadExample(name) {
    if (DB[name]) return showToast('Déjà chargé', 'error');
    DB[name] = [...EXAMPLES[name].data];
    refreshSidebar();
    closeModal('examplesModal');
    showToast(`Exemple ${name} chargé`, 'success');
}

// Écouteurs d'événements
queryInput.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        runQuery();
    }
});

// Initialisation
initSidebar();
