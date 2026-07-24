const STORAGE_DATA_KEY = "vegaxlr_ctrader_multi_checklists_data";
const STORAGE_ACTIVE_LIST_KEY = "vegaxlr_ctrader_active_checklist_id";

const checklistSelect = document.getElementById("checklistSelect");
const newChecklistButton = document.getElementById("newChecklistButton");
const deleteChecklistButton = document.getElementById("deleteChecklistButton");

const checklistItemsElement = document.getElementById("checklistItems");
const addItemButton = document.getElementById("addItemButton");

const tickAllButton = document.getElementById("tickAllButton");
const untickAllButton = document.getElementById("untickAllButton");

const itemModal = document.getElementById("itemModal");
const modalTitle = document.getElementById("modalTitle");
const itemInput = document.getElementById("itemInput");
const cancelItemModalButton = document.getElementById("cancelItemModalButton");
const saveItemButton = document.getElementById("saveItemButton");

const checklistModal = document.getElementById("checklistModal");
const checklistNameInput = document.getElementById("checklistNameInput");
const cancelChecklistModalButton = document.getElementById("cancelChecklistModalButton");
const saveChecklistButton = document.getElementById("saveChecklistButton");

let appData = {
    checklists: []
};

let activeChecklistId = null;
let editingItemId = null;

function generateId() {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

function createDefaultData() {
    const defaultChecklistId = generateId();

    return {
        checklists: [
            {
                id: defaultChecklistId,
                name: "Main Checklist",
                items: []
            }
        ]
    };
}

function loadData() {
    try {
        const storedData = localStorage.getItem(STORAGE_DATA_KEY);

        if (storedData) {
            appData = JSON.parse(storedData);
        } else {
            appData = createDefaultData();
        }

        if (!appData.checklists || appData.checklists.length === 0) {
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

    if (!activeChecklist || activeChecklist.items.length === 0) {
        tickAllButton.disabled = true;
        untickAllButton.disabled = true;

        const emptyState = document.createElement("div");
        emptyState.className = "empty-state";
        emptyState.textContent =
            "This checklist is empty. Click + Add new item to create your first trading reminder.";

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

function openChecklistModal() {
    checklistNameInput.value = "";

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

function createChecklistFromModal() {
    const name = checklistNameInput.value.trim();

    if (!name) {
        checklistNameInput.focus();
        return;
    }

    const newChecklist = {
        id: generateId(),
        name,
        items: []
    };

    appData.checklists.push(newChecklist);
    activeChecklistId = newChecklist.id;

    saveData();
    saveActiveChecklist();
    renderAll();
    closeChecklistModal();
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

checklistSelect.addEventListener("change", () => {
    activeChecklistId = checklistSelect.value;

    saveActiveChecklist();
    renderItems();
});

newChecklistButton.addEventListener("click", openChecklistModal);

deleteChecklistButton.addEventListener("click", deleteActiveChecklist);

tickAllButton.addEventListener("click", tickAllItemsInActiveChecklist);

untickAllButton.addEventListener("click", untickAllItemsInActiveChecklist);

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

saveChecklistButton.addEventListener("click", createChecklistFromModal);

checklistNameInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        createChecklistFromModal();
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

loadData();
renderAll();
