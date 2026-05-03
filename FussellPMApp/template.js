// Universal Template Editor
import firebaseConfig from './firebase-config.js';
import { getTemplate } from './templates-config.js';

if (firebase.apps.length === 0) {
    firebase.initializeApp(firebaseConfig);
}

const db = firebase.firestore();
const auth = firebase.auth();

let currentUser = null;
let currentProject = null;
let projectId = null;
let templateId = null;
let templateDef = null;
let docData = {};         // values keyed by sectionId.fieldId
let unsubscribeDoc = null;

// Helpers
function escapeHtml(s) {
    return String(s == null ? '' : s)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
function fieldKey(sectionId, fieldId) { return `${sectionId}.${fieldId}`; }

function showAlert(message, type = 'info') {
    const c = document.getElementById('alert-container');
    const cls = type === 'error' ? 'alert-error' : type === 'success' ? 'alert-success' : 'alert-info';
    c.innerHTML = `<div class="alert ${cls}">${message}</div>`;
    setTimeout(() => { c.innerHTML = ''; }, 4000);
}

function setStatus(text, kind = '') {
    const el = document.getElementById('save-status');
    el.textContent = text;
    el.className = 'save-status ' + kind;
}

// --- Rendering ---

function renderField(sectionId, field) {
    const key = fieldKey(sectionId, field.id);
    const value = docData[key];
    const elId = `f-${sectionId}-${field.id}`;
    const hint = field.hint ? `<small class="hint">${escapeHtml(field.hint)}</small>` : '';

    if (field.type === 'text') {
        return `<div class="doc-field">
            <label for="${elId}">${escapeHtml(field.label)}</label>
            <input type="text" id="${elId}" data-key="${key}" value="${escapeHtml(value || '')}" placeholder="${escapeHtml(field.placeholder || '')}">
            ${hint}
        </div>`;
    }
    if (field.type === 'textarea') {
        return `<div class="doc-field">
            <label for="${elId}">${escapeHtml(field.label)}</label>
            <textarea id="${elId}" data-key="${key}" rows="${field.rows || 3}" placeholder="${escapeHtml(field.placeholder || '')}">${escapeHtml(value || '')}</textarea>
            ${hint}
        </div>`;
    }
    if (field.type === 'list') {
        const items = Array.isArray(value) ? value : [];
        return `<div class="doc-field">
            <label>${escapeHtml(field.label)}</label>
            <div class="list-items" id="${elId}" data-key="${key}" data-type="list" data-placeholder="${escapeHtml(field.itemPlaceholder || 'Enter item')}">
                ${items.map(item => listRowHtml(item, field.itemPlaceholder)).join('')}
            </div>
            <button type="button" class="add-row-btn" data-target="${elId}" data-action="add-list-item">+ Add Item</button>
            ${hint}
        </div>`;
    }
    if (field.type === 'table') {
        const rows = Array.isArray(value) ? value : [];
        const headers = field.columns.map(c => `<th>${escapeHtml(c.label)}</th>`).join('') + '<th></th>';
        const body = rows.map((row, idx) => tableRowHtml(field.columns, row, idx)).join('');
        return `<div class="doc-field">
            <label>${escapeHtml(field.label)}</label>
            <div class="doc-table-wrap">
                <table class="doc-table" id="${elId}" data-key="${key}" data-type="table">
                    <thead><tr>${headers}</tr></thead>
                    <tbody>${body}</tbody>
                </table>
            </div>
            <button type="button" class="add-row-btn" data-target="${elId}" data-action="add-table-row">+ Add Row</button>
            ${hint}
        </div>`;
    }
    return '';
}

function listRowHtml(value, placeholder) {
    return `<div class="list-row">
        <input type="text" value="${escapeHtml(value || '')}" placeholder="${escapeHtml(placeholder || 'Enter item')}">
        <button type="button" class="remove" data-action="remove-list-item">Remove</button>
    </div>`;
}

function tableRowHtml(columns, row, idx) {
    const cells = columns.map(col => {
        const v = (row && row[col.id]) || '';
        if (col.type === 'select') {
            const opts = (col.options || []).map(o => `<option value="${escapeHtml(o)}" ${o === v ? 'selected' : ''}>${escapeHtml(o)}</option>`).join('');
            return `<td><select data-col="${col.id}"><option value=""></option>${opts}</select></td>`;
        }
        if (col.type === 'textarea') {
            return `<td><textarea data-col="${col.id}">${escapeHtml(v)}</textarea></td>`;
        }
        return `<td><input type="text" data-col="${col.id}" value="${escapeHtml(v)}"></td>`;
    }).join('');
    return `<tr>${cells}<td><button type="button" class="row-remove" data-action="remove-table-row">×</button></td></tr>`;
}

function renderTemplate() {
    document.getElementById('doc-title').textContent = `${templateDef.icon || ''} ${templateDef.name}`;
    document.getElementById('doc-description').textContent = templateDef.description;

    const container = document.getElementById('sections-container');
    container.innerHTML = templateDef.sections.map(section => `
        <div class="doc-section" data-section="${section.id}">
            <h3>${escapeHtml(section.title)}</h3>
            ${section.description ? `<p style="color:#6b7280; font-size:0.9rem;">${escapeHtml(section.description)}</p>` : ''}
            ${section.fields.map(f => renderField(section.id, f)).join('')}
        </div>
    `).join('');

    wireFieldEvents();
}

function wireFieldEvents() {
    const container = document.getElementById('sections-container');

    // Add list item
    container.querySelectorAll('button[data-action="add-list-item"]').forEach(btn => {
        btn.addEventListener('click', () => {
            const target = document.getElementById(btn.getAttribute('data-target'));
            const placeholder = target.getAttribute('data-placeholder') || '';
            const div = document.createElement('div');
            div.innerHTML = listRowHtml('', placeholder);
            const row = div.firstElementChild;
            row.querySelector('button[data-action="remove-list-item"]').addEventListener('click', () => row.remove());
            target.appendChild(row);
            row.querySelector('input').focus();
        });
    });

    // Remove existing list items
    container.querySelectorAll('button[data-action="remove-list-item"]').forEach(btn => {
        btn.addEventListener('click', () => btn.closest('.list-row').remove());
    });

    // Add table row
    container.querySelectorAll('button[data-action="add-table-row"]').forEach(btn => {
        btn.addEventListener('click', () => {
            const tableId = btn.getAttribute('data-target');
            const tableEl = document.getElementById(tableId);
            const key = tableEl.getAttribute('data-key');
            // Find the field def
            const colsForKey = findColumnsForKey(key);
            const tbody = tableEl.querySelector('tbody');
            const tr = document.createElement('tr');
            tr.innerHTML = colsForKey.map(col => {
                if (col.type === 'select') {
                    const opts = (col.options || []).map(o => `<option value="${escapeHtml(o)}">${escapeHtml(o)}</option>`).join('');
                    return `<td><select data-col="${col.id}"><option value=""></option>${opts}</select></td>`;
                }
                if (col.type === 'textarea') return `<td><textarea data-col="${col.id}"></textarea></td>`;
                return `<td><input type="text" data-col="${col.id}"></td>`;
            }).join('') + `<td><button type="button" class="row-remove" data-action="remove-table-row">×</button></td>`;
            tr.querySelector('button[data-action="remove-table-row"]').addEventListener('click', () => tr.remove());
            tbody.appendChild(tr);
        });
    });

    // Remove existing table rows
    container.querySelectorAll('button[data-action="remove-table-row"]').forEach(btn => {
        btn.addEventListener('click', () => btn.closest('tr').remove());
    });
}

function findColumnsForKey(key) {
    const [secId, fieldId] = key.split('.');
    const sec = templateDef.sections.find(s => s.id === secId);
    if (!sec) return [];
    const field = sec.fields.find(f => f.id === fieldId);
    return (field && field.columns) || [];
}

// --- Collect & save ---

function collectFormData() {
    const out = {};
    const container = document.getElementById('sections-container');

    // text + textarea
    container.querySelectorAll('input[data-key], textarea[data-key]').forEach(el => {
        out[el.getAttribute('data-key')] = el.value;
    });

    // lists
    container.querySelectorAll('[data-type="list"]').forEach(listEl => {
        const key = listEl.getAttribute('data-key');
        const items = Array.from(listEl.querySelectorAll('.list-row input'))
            .map(i => i.value.trim())
            .filter(v => v.length > 0);
        out[key] = items;
    });

    // tables
    container.querySelectorAll('[data-type="table"]').forEach(tbl => {
        const key = tbl.getAttribute('data-key');
        const rows = Array.from(tbl.querySelectorAll('tbody tr')).map(tr => {
            const row = {};
            tr.querySelectorAll('[data-col]').forEach(cell => {
                row[cell.getAttribute('data-col')] = cell.value;
            });
            return row;
        }).filter(r => Object.values(r).some(v => v && String(v).trim().length > 0));
        out[key] = rows;
    });

    return out;
}

async function saveDocument() {
    if (!projectId || !templateId || !currentUser) return;
    setStatus('Saving...');
    try {
        const data = collectFormData();
        await db.collection('projects').doc(projectId)
            .collection('templates').doc(templateId)
            .set({
                fields: data,
                lastEditedBy: currentUser.email,
                lastEditedAt: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
        setStatus('Saved', 'saved');
        showAlert('Document saved', 'success');
    } catch (err) {
        console.error('Save error:', err);
        setStatus('Save failed', 'error');
        showAlert('Save failed: ' + err.message, 'error');
    }
}

// --- Load ---

function loadDocumentData() {
    unsubscribeDoc = db.collection('projects').doc(projectId)
        .collection('templates').doc(templateId)
        .onSnapshot((doc) => {
            if (doc.exists) {
                docData = doc.data().fields || {};
                const editor = doc.data().lastEditedBy;
                const at = doc.data().lastEditedAt;
                if (editor && at && at.toDate) {
                    setStatus(`Last edited by ${editor} at ${at.toDate().toLocaleString()}`, 'saved');
                }
            } else {
                docData = {};
            }
            renderTemplate();
            document.getElementById('loading').classList.add('hidden');
            document.getElementById('doc-content').style.display = 'block';
        }, (err) => {
            console.error('Snapshot error:', err);
            showAlert('Error loading document: ' + err.message, 'error');
        });
}

async function loadProject() {
    const projectDoc = await db.collection('projects').doc(projectId).get();
    if (!projectDoc.exists) {
        showAlert('Project not found', 'error');
        return false;
    }
    currentProject = projectDoc.data();
    document.getElementById('project-title-display').textContent = currentProject.title;

    // Verify access (creator or team member)
    const isCreator = currentProject.creatorId === currentUser.uid;
    const isMember = (currentProject.teamMembers || []).includes(currentUser.email);
    if (!isCreator && !isMember) {
        showAlert('You do not have access to this project', 'error');
        return false;
    }
    return true;
}

// --- Init ---

auth.onAuthStateChanged(async (user) => {
    if (!user) {
        window.location.href = 'login.html';
        return;
    }
    currentUser = user;

    const params = new URLSearchParams(window.location.search);
    projectId = params.get('projectId');
    templateId = params.get('templateId');

    if (!projectId || !templateId) {
        showAlert('Missing projectId or templateId in URL', 'error');
        return;
    }

    templateDef = getTemplate(templateId);
    if (!templateDef) {
        showAlert('Unknown template: ' + templateId, 'error');
        return;
    }

    document.getElementById('back-btn').addEventListener('click', () => {
        window.location.href = `dashboard.html?projectId=${projectId}`;
    });
    document.getElementById('logout-btn').addEventListener('click', async () => {
        await auth.signOut();
        window.location.href = 'index.html';
    });
    document.getElementById('save-btn').addEventListener('click', saveDocument);
    document.getElementById('save-btn-bottom').addEventListener('click', saveDocument);

    const ok = await loadProject();
    if (!ok) return;
    loadDocumentData();
});

console.log('template.js loaded');
