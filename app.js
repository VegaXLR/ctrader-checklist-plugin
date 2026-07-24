const STORAGE_DATA_KEY = "vegaxlr_ctrader_multi_checklists_data";
const STORAGE_ACTIVE_LIST_KEY = "vegaxlr_ctrader_active_checklist_id";

const checklistCard = document.getElementById("checklistCard");
const progressCounter = document.getElementById("progressCounter");
const readyStatus = document.getElementById("readyStatus");

const checklistSelect = document.getElementById("checklistSelect");
const newChecklistButton = document.getElementById("newChecklistButton");
const renameChecklistButton = document.getElementById("renameChecklistButton");
const duplicateChecklistButton = document.getElementById("duplicateChecklistButton");
const deleteChecklistButton = document.getElementById("deleteChecklistButton");

const checklistItemsElement = document.getElementById("checklistItems");
const addItemButton = document.getElementById("addItemButton");

const tickAllButton = document.getElementById("tickAllButton");
const untickAllButton = document.getElementById("untickAllButton");

const templateButton = document.getElementById("templateButton");
const exportButton = document.getElementById("exportButton");
const importButton = document.getElementById("importButton");
const importFileInput = document.getElementById("importFileInput");

const itemModal = document.getElementById("itemModal");
const modalTitle = document.getElementById("modalTitle");
const itemInput = document.getElementById("itemInput");
const cancelItemModalButton = document.getElementById("cancelItemModalButton");
const saveItemButton = document.getElementById("saveItemButton");

const checklistModal = document.getElementById("checklistModal");
const checklistModalTitle = document.getElementById("checklistModalTitle");
const checklistNameInput = document.getElementById("checklistNameInput");
const cancelChecklistModalButton = document.getElementById("cancelChecklistModalButton");
const saveChecklistButton = document.getElementById("saveChecklistButton");

const templateModal = document.getElementById("templateModal");
const templateSelect = document.getElementById("templateSelect");
const templatePreview = document.getElementById("templatePreview");
const cancelTemplateModalButton = document.getElementById("cancelTemplateModalButton");
const createFromTemplateButton = document.getElementById("createFromTemplateButton");

const TEMPLATES = [
    {
        name: "Scalping Setup",
        items: [
            "Spread is acceptable",
            "Market has enough volatility",
            "Trend direction is clear",
            "Entry level is defined",
            "Stop loss is defined",
            "Risk is within limit",
            "No high-impact news nearby"
        ]
    },
    {
        name: "Breakout Setup",
        items: [
            "Key level is clearly marked",
            "Price is consolidating near the level",
            "Breakout candle closes beyond the level",
            "Volume or momentum confirms the move",
            "Retest plan is defined",
            "Stop loss is defined",
            "Reward-to-risk is acceptable"
        ]
    },
    {
        name: "Pullback Setup",
        items: [
            "Higher timeframe trend is clear",
            "Price pulls back into a valid area",
            "Support or resistance confirms the zone",
            "Rejection candle or signal appears",
            "Entry trigger is defined",
            "Stop loss is protected",
            "Target is realistic"
        ]
    },
    {
        name: "Risk Management",
        items: [
            "Risk per trade is within plan",
            "Position size is calculated",
            "Stop loss is placed before entry",
            "Reward-to-risk is acceptable",
            "Total exposure is acceptable",
            "No revenge trading",
            "Trade matches the trading plan"
        ]
    },
    {
        name: "News Trading Checklist",
        items: [
            "News event time is confirmed",
            "Expected impact is understood",
            "Spread conditions are acceptable",
            "Volatility risk is acceptable",
            "Entry plan is defined",
            "Exit plan is defined",
            "Position size is reduced if needed"
        ]
    },
    {
        name: "Blank Checklist",
        items: []
    }
];

let appData = {
    checklists: []
};

let activeChecklistId = null;
let editingItemId = null;
let checklistModalMode = "create";

function generateId() {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

function createDefaultData() {
    const defaultChecklistId = generateId();

    return {
        version: 2,
        checklists: [
            {
                id: defaultChecklistId,
                name: "Main Checklist",
                items: []
            }
        ]
    };
}

function normalizeImportedData(data) {
    if (!data || !Array.isArray(data.checklists)) {
        return null;
    }

    const cleanChecklists = data.checklists
        .filter((list) => list && typeof list.name === "string")
        .map((list) => ({
            id: list.id || generateId(),
            name: list.name.trim() || "Imported Checklist",
            items: Array.isArray(list.items)
                ? list.items
                    .filter((item) => item && typeof item.text === "string")
                    .map((item) => ({
                        id: item.id || generateId(),
                        text: item.text.trim(),
                        completed: Boolean(item.completed)
                    }))
                    .filter((item) => item.text.length > 0)
                : []
        }));

    if (cleanChecklists.length === 0) {
        return null;
    }

    return {
        version: 2,
        checklists: cleanChecklists
    };
}

function loadData() {
    try {
        const storedData = localStorage.getItem(STORAGE_DATA_KEY);

        if (storedData) {
            const parsedData = JSON.parse(storedData);
            appData = normalizeImportedData(parsedData) || createDefaultData();
        } else {
            appData = createDefaultData();
        }
    } catch {
        appData = createDefaultData();
    }

    const storedActiveId = localStorage.getItem(STORAGE_ACTIVE_LIST_KEY);
    const activeExists = appData.checklists.some((list) => list.id === storedActiveId);

    activeChecklistId = activeExists ? storedActiveId : appData.checklists[0].id;

    saveData();
    saveActiveChecklist();
}

function saveData() {
    localStorage.setItem(STORAGE_DATA_KEY, JSON.stringify(appData));
}

function saveActiveChecklist() {
    localStorage.setItem(STORAGE_ACTIVE_LIST_KEY, activeChecklistId);
}

function getActiveChecklist() {
    return appData.checklists.find((list) => list.id === activeChecklistId) || appData.checklists[0];
}

function escapeHtml(value) {
    return value
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function getChecklistProgress(checklist) {
    if (!checklist || !Array.isArray(checklist.items)) {
        return {
            total: 0,
            completed: 0,
            isReady: false
        };
    }

    const total = checklist.items.length;
    const completed = checklist.items.filter((item) => item.completed).length;

    return {
        total,
        completed,
        isReady: total > 0 && completed === total
    };
}

function updateProgressState() {
    const activeChecklist = getActiveChecklist();
    const progress = getChecklistProgress(activeChecklist);

    progressCounter.textContent = `${progress.completed}/${progress.total}`;

    if (progress.isReady) {
        checklistCard.classList.add("ready");
        readyStatus.classList.add("visible");
    } else {
        checklistCard.classList.remove("ready");
        readyStatus.classList.remove("visible");
    }
}

function renderChecklistSelect() {
    checklistSelect.innerHTML = "";

    appData.checklists.forEach((list) => {
        const option = document.createElement("option");
        option.value = list.id;
        option.textContent = list.name;

        if (list.id === activeChecklistId) {
            option.selected = true;
        }

        checklistSelect.appendChild(option);
    });

    deleteChecklistButton.disabled = appData.checklists.length <= 1;
    deleteChecklistButton.title =
        appData.checklists.length <= 1
            ? "You must keep at least one checklist"
            : "Delete selected checklist";
}

function renderItems() {
    checklistItemsElement.innerHTML = "";

    const activeChecklist = getActiveChecklist();

    updateProgressState();

    if (!activeChecklist || activeChecklist.items.length === 0) {
        tickAllButton.disabled = true;
        untickAllButton.disabled = true;

        const emptyState = document.createElement("div");
        emptyState.className = "empty-state";
        emptyState.textContent =
            "This checklist is empty. Click + Add new item, import a backup, or create a checklist from a template.";

        checklistItemsElement.appendChild(emptyState);
        return;
    }

    tickAllButton.disabled = activeChecklist.items.every((item) => item.completed);
    untickAllButton.disabled = activeChecklist.items.every((item) => !item.completed);

    activeChecklist.items.forEach((item) => {
        const row = document.createElement("div");
        row.className = item.completed ? "checklist-row done" : "checklist-row";

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = item.completed;

        checkbox.addEventListener("change", () => {
            item.completed = checkbox.checked;
            saveData();
            renderItems();
        });

        const label = document.createElement("div");
        label.className = "item-label";
        label.innerHTML = escapeHtml(item.text);

        const editButton = document.createElement("button");
        editButton.className = "symbol-button edit-button";
        editButton.type = "button";
        editButton.title = "Edit";
        editButton.textContent = "✎";

        editButton.addEventListener("click", () => {
            openItemModal(item.id);
        });

        const deleteButton = document.createElement("button");
        deleteButton.className = "symbol-button delete-button";
        deleteButton.type = "button";
        deleteButton.title = "Delete";
        deleteButton.textContent = "×";

        deleteButton.addEventListener("click", () => {
            deleteItem(item.id);
        });

        row.appendChild(checkbox);
        row.appendChild(label);
        row.appendChild(editButton);
        row.appendChild(deleteButton);

        checklistItemsElement.appendChild(row);
    });
}

function renderAll() {
    renderChecklistSelect();
    renderItems();
}

function openItemModal(itemId = null) {
    editingItemId = itemId;

    const activeChecklist = getActiveChecklist();

    if (editingItemId) {
        const item = activeChecklist.items.find((entry) => entry.id === editingItemId);

        modalTitle.textContent = "Edit checklist item";
        itemInput.value = item ? item.text : "";
    } else {
        modalTitle.textContent = "Add checklist item";
        itemInput.value = "";
    }

    itemModal.classList.add("visible");
    itemModal.setAttribute("aria-hidden", "false");

    setTimeout(() => {
        itemInput.focus();
        itemInput.select();
    }, 50);
}

function closeItemModal() {
    editingItemId = null;
    itemInput.value = "";

    itemModal.classList.remove("visible");
    itemModal.setAttribute("aria-hidden", "true");
}

function saveItemFromModal() {
    const value = itemInput.value.trim();

    if (!value) {
        itemInput.focus();
        return;
    }

    const activeChecklist = getActiveChecklist();

    if (editingItemId) {
        const item = activeChecklist.items.find((entry) => entry.id === editingItemId);

        if (item) {
            item.text = value;
        }
    } else {
        activeChecklist.items.push({
            id: generateId(),
            text: value,
            completed: false
        });
    }

    saveData();
    renderItems();
    closeItemModal();
}

function deleteItem(itemId) {
    const activeChecklist = getActiveChecklist();

    activeChecklist.items = activeChecklist.items.filter((item) => item.id !== itemId);

    saveData();
    renderItems();
}

function tickAllItemsInActiveChecklist() {
    const activeChecklist = getActiveChecklist();

    if (!activeChecklist || activeChecklist.items.length === 0) {
        return;
    }

    activeChecklist.items.forEach((item) => {
        item.completed = true;
    });

    saveData();
    renderItems();
}

function untickAllItemsInActiveChecklist() {
    const activeChecklist = getActiveChecklist();

    if (!activeChecklist || activeChecklist.items.length === 0) {
        return;
    }

    activeChecklist.items.forEach((item) => {
        item.completed = false;
    });

    saveData();
    renderItems();
}

function openCreateChecklistModal() {
    checklistModalMode = "create";
    checklistModalTitle.textContent = "Create new checklist";
    saveChecklistButton.textContent = "Create";
    checklistNameInput.value = "";

    openChecklistModalBase();
}

function openRenameChecklistModal() {
    const activeChecklist = getActiveChecklist();

    checklistModalMode = "rename";
    checklistModalTitle.textContent = "Rename checklist";
    saveChecklistButton.textContent = "Rename";
    checklistNameInput.value = activeChecklist ? activeChecklist.name : "";

    openChecklistModalBase();
}

function openChecklistModalBase() {
    checklistModal.classList.add("visible");
    checklistModal.setAttribute("aria-hidden", "false");

    setTimeout(() => {
        checklistNameInput.focus();
        checklistNameInput.select();
    }, 50);
}

function closeChecklistModal() {
    checklistNameInput.value = "";

    checklistModal.classList.remove("visible");
    checklistModal.setAttribute("aria-hidden", "true");
}

function saveChecklistModal() {
    const name = checklistNameInput.value.trim();

    if (!name) {
        checklistNameInput.focus();
        return;
    }

    if (checklistModalMode === "rename") {
        const activeChecklist = getActiveChecklist();

        if (activeChecklist) {
            activeChecklist.name = name;
        }
    } else {
        const newChecklist = {
            id: generateId(),
            name,
            items: []
        };

        appData.checklists.push(newChecklist);
        activeChecklistId = newChecklist.id;
    }

    saveData();
    saveActiveChecklist();
    renderAll();
    closeChecklistModal();
}

function duplicateActiveChecklist() {
    const activeChecklist = getActiveChecklist();

    if (!activeChecklist) {
        return;
    }

    const duplicatedChecklist = {
        id: generateId(),
        name: `${activeChecklist.name} Copy`,
        items: activeChecklist.items.map((item) => ({
            id: generateId(),
            text: item.text,
            completed: item.completed
        }))
    };

    appData.checklists.push(duplicatedChecklist);
    activeChecklistId = duplicatedChecklist.id;

    saveData();
    saveActiveChecklist();
    renderAll();
}

function deleteActiveChecklist() {
    if (appData.checklists.length <= 1) {
        return;
    }

    const activeChecklist = getActiveChecklist();

    const confirmed = window.confirm(
        `Delete checklist "${activeChecklist.name}"? This cannot be undone.`
    );

    if (!confirmed) {
        return;
    }

    appData.checklists = appData.checklists.filter((list) => list.id !== activeChecklistId);

    activeChecklistId = appData.checklists[0].id;

    saveData();
    saveActiveChecklist();
    renderAll();
}

function renderTemplateOptions() {
    templateSelect.innerHTML = "";

    TEMPLATES.forEach((template, index) => {
        const option = document.createElement("option");
        option.value = String(index);
        option.textContent = template.name;

        templateSelect.appendChild(option);
    });

    renderTemplatePreview();
}

function renderTemplatePreview() {
    const template = TEMPLATES[Number(templateSelect.value)] || TEMPLATES[0];

    if (!template.items.length) {
        templatePreview.innerHTML = "Creates an empty checklist.";
        return;
    }

    const itemsHtml = template.items
        .map((item) => `<li>${escapeHtml(item)}</li>`)
        .join("");

    templatePreview.innerHTML = `<ul>${itemsHtml}</ul>`;
}

function openTemplateModal() {
    renderTemplateOptions();

    templateModal.classList.add("visible");
    templateModal.setAttribute("aria-hidden", "false");
}

function closeTemplateModal() {
    templateModal.classList.remove("visible");
    templateModal.setAttribute("aria-hidden", "true");
}

function createChecklistFromTemplate() {
    const template = TEMPLATES[Number(templateSelect.value)] || TEMPLATES[0];

    const newChecklist = {
        id: generateId(),
        name: template.name,
        items: template.items.map((itemText) => ({
            id: generateId(),
            text: itemText,
            completed: false
        }))
    };

    appData.checklists.push(newChecklist);
    activeChecklistId = newChecklist.id;

    saveData();
    saveActiveChecklist();
    renderAll();
    closeTemplateModal();
}

function exportChecklists() {
    const exportData = {
        version: 2,
        exportedAt: new Date().toISOString(),
        source: "VegaXLR cTrader Checklist",
        checklists: appData.checklists
    };

    const json = JSON.stringify(exportData, null, 2);
    const blob = new Blob([json], {
        type: "application/json"
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    const date = new Date().toISOString().slice(0, 10);

    link.href = url;
    link.download = `vegaxlr-ctrader-checklists-${date}.json`;
    link.click();

    URL.revokeObjectURL(url);
}

function importChecklistsFromFile(file) {
    const reader = new FileReader();

    reader.onload = () => {
        try {
            const parsedData = JSON.parse(reader.result);
            const normalizedData = normalizeImportedData(parsedData);

            if (!normalizedData) {
                window.alert("Invalid checklist backup file.");
                return;
            }

            const confirmed = window.confirm(
                "Importing this file will replace your current checklists. Continue?"
            );

            if (!confirmed) {
                return;
            }

            appData = normalizedData;
            activeChecklistId = appData.checklists[0].id;

            saveData();
            saveActiveChecklist();
            renderAll();

            window.alert("Checklists imported successfully.");
        } catch {
            window.alert("Could not read this file. Please select a valid JSON backup.");
        } finally {
            importFileInput.value = "";
        }
    };

    reader.readAsText(file);
}

checklistSelect.addEventListener("change", () => {
    activeChecklistId = checklistSelect.value;

    saveActiveChecklist();
    renderItems();
});

newChecklistButton.addEventListener("click", openCreateChecklistModal);

renameChecklistButton.addEventListener("click", openRenameChecklistModal);

duplicateChecklistButton.addEventListener("click", duplicateActiveChecklist);

deleteChecklistButton.addEventListener("click", deleteActiveChecklist);

tickAllButton.addEventListener("click", tickAllItemsInActiveChecklist);

untickAllButton.addEventListener("click", untickAllItemsInActiveChecklist);

templateButton.addEventListener("click", openTemplateModal);

exportButton.addEventListener("click", exportChecklists);

importButton.addEventListener("click", () => {
    importFileInput.click();
});

importFileInput.addEventListener("change", () => {
    const file = importFileInput.files[0];

    if (file) {
        importChecklistsFromFile(file);
    }
});

addItemButton.addEventListener("click", () => {
    openItemModal();
});

cancelItemModalButton.addEventListener("click", closeItemModal);

saveItemButton.addEventListener("click", saveItemFromModal);

itemInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        saveItemFromModal();
    }

    if (event.key === "Escape") {
        closeItemModal();
    }
});

itemModal.addEventListener("click", (event) => {
    if (event.target === itemModal) {
        closeItemModal();
    }
});

cancelChecklistModalButton.addEventListener("click", closeChecklistModal);

saveChecklistButton.addEventListener("click", saveChecklistModal);

checklistNameInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        saveChecklistModal();
    }

    if (event.key === "Escape") {
        closeChecklistModal();
    }
});

checklistModal.addEventListener("click", (event) => {
    if (event.target === checklistModal) {
        closeChecklistModal();
    }
});

templateSelect.addEventListener("change", renderTemplatePreview);

cancelTemplateModalButton.addEventListener("click", closeTemplateModal);

createFromTemplateButton.addEventListener("click", createChecklistFromTemplate);

templateModal.addEventListener("click", (event) => {
    if (event.target === templateModal) {
        closeTemplateModal();
    }
});

loadData();
renderAll();
