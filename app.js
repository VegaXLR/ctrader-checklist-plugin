const STORAGE_DATA_KEY = "vegaxlr_ctrader_multi_checklists_data";
const STORAGE_ACTIVE_LIST_KEY = "vegaxlr_ctrader_active_checklist_id";
const STORAGE_NOTES_OPEN_KEY = "vegaxlr_ctrader_notes_open";
const STORAGE_THEME_MODE_KEY = "vegaxlr_ctrader_theme_mode";


/**
 * Reads a persisted value from localStorage.
 *
 * @param {string} key Storage key.
 * @returns {string|null} Persisted value, or null when not found.
 */
function readStorageValue(key) {
    try {
        return localStorage.getItem(key);
    } catch {
        return null;
    }
}

/**
 * Persists a value to localStorage.
 *
 * @param {string} key Storage key.
 * @param {string} value Value to persist.
 */
function writeStorageValue(key, value) {
    try {
        localStorage.setItem(key, value);
    } catch {
        // Ignore localStorage write failures (e.g. storage disabled or full).
    }
}

const checklistCard = document.getElementById("checklistCard");
const pluginTitle = document.getElementById("pluginTitle");
const progressCounter = document.getElementById("progressCounter");
const readyStatus = document.getElementById("readyStatus");
const panelNotice = document.getElementById("panelNotice");

const confirmModal = document.getElementById("confirmModal");
const confirmTitle = document.getElementById("confirmTitle");
const confirmMessage = document.getElementById("confirmMessage");
const cancelConfirmButton = document.getElementById("cancelConfirmButton");
const confirmActionButton = document.getElementById("confirmActionButton");

const checklistDropdown = document.getElementById("checklistDropdown");
const checklistDropdownButton = document.getElementById("checklistDropdownButton");
const checklistDropdownLabel = document.getElementById("checklistDropdownLabel");
const checklistDropdownMenu = document.getElementById("checklistDropdownMenu");

const newChecklistButton = document.getElementById("newChecklistButton");
const renameChecklistButton = document.getElementById("renameChecklistButton");
const duplicateChecklistButton = document.getElementById("duplicateChecklistButton");
const themeToggleButton = document.getElementById("themeToggleButton");
const deleteChecklistButton = document.getElementById("deleteChecklistButton");

const checklistItemsElement = document.getElementById("checklistItems");

const tickAllButton = document.getElementById("tickAllButton");
const untickAllButton = document.getElementById("untickAllButton");

const notesSection = document.getElementById("notesSection");
const notesToggleButton = document.getElementById("notesToggleButton");
const notesTextarea = document.getElementById("notesTextarea");

const itemModal = document.getElementById("itemModal");
const modalTitle = document.getElementById("modalTitle");
const itemInput = document.getElementById("itemInput");
const optionalItemInput = document.getElementById("optionalItemInput");
const cancelItemModalButton = document.getElementById("cancelItemModalButton");
const saveItemButton = document.getElementById("saveItemButton");

const checklistModal = document.getElementById("checklistModal");
const checklistNameInput = document.getElementById("checklistNameInput");
const cancelChecklistModalButton = document.getElementById("cancelChecklistModalButton");
const saveChecklistButton = document.getElementById("saveChecklistButton");

const templateModal = document.getElementById("templateModal");

const templateDropdown = document.getElementById("templateDropdown");
const templateDropdownButton = document.getElementById("templateDropdownButton");
const templateDropdownLabel = document.getElementById("templateDropdownLabel");
const templateDropdownMenu = document.getElementById("templateDropdownMenu");

const templateNameInput = document.getElementById("templateNameInput");
const templatePreview = document.getElementById("templatePreview");

const cancelTemplateModalButton = document.getElementById("cancelTemplateModalButton");
const createFromTemplateButton = document.getElementById("createFromTemplateButton");

const TEMPLATES = [
    {
        name: "Blank Checklist",
        items: []
    },
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
            "Momentum confirms the move",
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
        name: "Post-Trade Review",
        items: [
            "Screenshot saved",
            "Entry reason documented",
            "Exit reason documented",
            "Mistakes noted",
            "Emotional state reviewed",
            "Journal updated"
        ]
    }
];

let appData = {
    checklists: []
};

let activeChecklistId = null;
let editingItemId = null;
let draggedItemId = null;

let notesOpen = false;
let notesSaveTimeoutId = null;
let themeMode = "dark";

let pendingConfirmAction = null;
let noticeTimeoutId = null;
let selectedTemplateIndex = 0;

let isReorderingItems = false;

function generateId() {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

function createDefaultData() {
    const defaultChecklistId = generateId();

    return {
        version: 3,
        checklists: [
            {
                id: defaultChecklistId,
                name: "Main Checklist",
                notes: "",
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
            notes: typeof list.notes === "string" ? list.notes : "",
            items: Array.isArray(list.items)
                ? list.items
                    .filter((item) => item && typeof item.text === "string")
                    .map((item) => ({
                        id: item.id || generateId(),
                        text: item.text.trim(),
                        completed: Boolean(item.completed),
                        optional: Boolean(item.optional)
                    }))
                    .filter((item) => item.text.length > 0)
                : []
        }));

    if (cleanChecklists.length === 0) {
        return null;
    }

    return {
        version: 3,
        checklists: cleanChecklists
    };
}

function loadData() {
    try {
        const storedData = readStorageValue(STORAGE_DATA_KEY);

        if (storedData) {
            const parsedData = JSON.parse(storedData);
            appData = normalizeImportedData(parsedData) || createDefaultData();
        } else {
            appData = createDefaultData();
        }
    } catch {
        appData = createDefaultData();
    }

    const storedActiveId = readStorageValue(STORAGE_ACTIVE_LIST_KEY);
    const activeExists = appData.checklists.some((list) => list.id === storedActiveId);

    activeChecklistId = activeExists ? storedActiveId : appData.checklists[0].id;

    notesOpen = readStorageValue(STORAGE_NOTES_OPEN_KEY) === "true";

    loadThemeMode();

    saveData();
    saveActiveChecklist();
}

function saveData() {
    writeStorageValue(STORAGE_DATA_KEY, JSON.stringify(appData));
}

function saveActiveChecklist() {
    writeStorageValue(STORAGE_ACTIVE_LIST_KEY, activeChecklistId);
}

/**
 * Applies the selected theme mode. Only "dark" and "light" are supported;
 * "dark" is the default.
 *
 * @param {string} mode Theme mode. Supported values: "light", "dark".
 */
function applyThemeMode(mode) {
    themeMode = mode === "light" ? "light" : "dark";

    document.documentElement.setAttribute("data-theme", themeMode);

    if (!themeToggleButton) {
        return;
    }

    if (themeMode === "light") {
        themeToggleButton.classList.remove("is-dark");
        themeToggleButton.title = "Theme: Light";
    } else {
        themeToggleButton.classList.add("is-dark");
        themeToggleButton.title = "Theme: Dark";
    }
}

/**
 * Loads and applies the persisted theme mode (defaults to dark).
 */
function loadThemeMode() {
    applyThemeMode(readStorageValue(STORAGE_THEME_MODE_KEY) || "dark");
}

/**
 * Toggles between light and dark theme modes.
 */
function cycleThemeMode() {
    applyThemeMode(themeMode === "dark" ? "light" : "dark");
    writeStorageValue(STORAGE_THEME_MODE_KEY, themeMode);
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
            requiredTotal: 0,
            requiredCompleted: 0,
            isFullyComplete: false,
            isRequiredComplete: false
        };
    }

    const total = checklist.items.length;
    const completed = checklist.items.filter((item) => item.completed).length;

    const requiredItems = checklist.items.filter((item) => !item.optional);
    const requiredTotal = requiredItems.length;
    const requiredCompleted = requiredItems.filter((item) => item.completed).length;

    return {
        total,
        completed,
        requiredTotal,
        requiredCompleted,
        isFullyComplete: total > 0 && completed === total,
        isRequiredComplete: total > 0 && requiredTotal > 0 && requiredCompleted === requiredTotal
    };
}

function updateProgressState() {
    const activeChecklist = getActiveChecklist();
    const progress = getChecklistProgress(activeChecklist);

    progressCounter.textContent = `${progress.completed}/${progress.total}`;

    checklistCard.classList.remove("ready", "required-ready");
    readyStatus.classList.remove("visible", "complete", "required");
    pluginTitle.classList.remove("hidden");

    if (progress.isFullyComplete) {
        checklistCard.classList.add("ready");
        pluginTitle.classList.add("hidden");
        readyStatus.classList.add("visible", "complete");
        readyStatus.textContent = "✓ Checklist complete";
        return;
    }

    if (progress.isRequiredComplete) {
        checklistCard.classList.add("required-ready");
        pluginTitle.classList.add("hidden");
        readyStatus.classList.add("visible", "required");
        readyStatus.textContent = "✓ Required items complete";
    }
}

function renderChecklistSelect() {
    checklistDropdownMenu.innerHTML = "";

    const activeChecklist = getActiveChecklist();
    checklistDropdownLabel.textContent = activeChecklist ? activeChecklist.name : "Checklist";

    appData.checklists.forEach((list) => {
        const option = document.createElement("li");
        option.className = "custom-dropdown-option";
        option.setAttribute("role", "option");
        option.dataset.id = list.id;
        option.textContent = list.name;

        if (list.id === activeChecklistId) {
            option.classList.add("selected");
            option.setAttribute("aria-selected", "true");
        }

        option.addEventListener("click", () => {
            activeChecklistId = list.id;
            closeChecklistDropdown();

            saveActiveChecklist();
            renderChecklistSelect();
            renderNotes();
            renderItems();
        });

        checklistDropdownMenu.appendChild(option);
    });

    deleteChecklistButton.disabled = appData.checklists.length <= 1;
}

function openChecklistDropdown() {
    checklistDropdown.classList.add("open");
    checklistDropdownButton.setAttribute("aria-expanded", "true");
}

function closeChecklistDropdown() {
    checklistDropdown.classList.remove("open");
    checklistDropdownButton.setAttribute("aria-expanded", "false");
}

function toggleChecklistDropdown() {
    if (checklistDropdown.classList.contains("open")) {
        closeChecklistDropdown();
    } else {
        closeTemplateDropdown();
        openChecklistDropdown();
    }
}

function closeAllDropdowns() {
    closeChecklistDropdown();
    closeTemplateDropdown();
}

function createAddButtonRow() {
    const addRow = document.createElement("div");
    addRow.className = "inline-add-row";

    const addButton = document.createElement("button");
    addButton.className = "add-button";
    addButton.type = "button";
    addButton.textContent = "+ Add new item";
    addButton.addEventListener("click", () => openItemModal());

    addRow.appendChild(addButton);

    return addRow;
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
            "This checklist is empty. Click + Add new item below, or use + in the header to create from a template.";

        checklistItemsElement.appendChild(emptyState);
        checklistItemsElement.appendChild(createAddButtonRow());
        return;
    }

    tickAllButton.disabled = activeChecklist.items.every((item) => item.completed);
    untickAllButton.disabled = activeChecklist.items.every((item) => !item.completed);

    activeChecklist.items.forEach((item) => {
        const row = document.createElement("div");
        row.className = [
            "checklist-row",
            item.completed ? "done" : "",
            item.optional ? "optional" : ""
        ].join(" ").trim();

        row.dataset.itemId = item.id;

        const dragHandle = document.createElement("div");
        dragHandle.className = "drag-handle";
        dragHandle.title = "Drag to reorder";
        dragHandle.textContent = "⋮⋮";

        attachPointerDrag(dragHandle, row, item.id);

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = item.completed;

        checkbox.addEventListener("change", () => {
            item.completed = checkbox.checked;
            saveData();
            renderItems();
        });

        const itemContent = document.createElement("div");
        itemContent.className = "item-content";

        const label = document.createElement("div");
        label.className = "item-label";
        label.innerHTML = escapeHtml(item.text);

        itemContent.appendChild(label);

        if (item.optional) {
            const optionalBadge = document.createElement("div");
            optionalBadge.className = "optional-badge";
            optionalBadge.textContent = "Optional";
            itemContent.appendChild(optionalBadge);
        }

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

        row.appendChild(dragHandle);
        row.appendChild(checkbox);
        row.appendChild(itemContent);
        row.appendChild(editButton);
        row.appendChild(deleteButton);

        checklistItemsElement.appendChild(row);
    });

    checklistItemsElement.appendChild(createAddButtonRow());
}

/**
 * Attaches a Pointer Events based drag interaction to the whole row.
 *
 * The drag starts anywhere on the row EXCEPT on the checkbox, edit button,
 * or delete button, so those controls keep working normally. A small movement
 * threshold prevents accidental reordering on simple taps. A floating "ghost"
 * clone follows the pointer for visual feedback.
 *
 * @param {HTMLElement} surface Element that receives the pointerdown listener.
 * @param {HTMLElement} row Checklist row element being dragged.
 * @param {string} itemId Id of the checklist item represented by the row.
 */
function attachPointerDrag(surface, row, itemId) {
    surface.addEventListener("pointerdown", (event) => {
        if (event.button !== undefined && event.button !== 0) {
            return;
        }

        const activeChecklist = getActiveChecklist();

        if (!activeChecklist || activeChecklist.items.length < 2) {
            return;
        }

        event.preventDefault();
        event.stopPropagation();

        closeAllDropdowns();
        enableReorderLock();

        const pointerId = event.pointerId;
        const startX = event.clientX;
        const startY = event.clientY;

        let ghost = null;
        let currentTargetItemId = null;
        let lastClientX = startX;
        let lastClientY = startY;
        let didMove = false;

        draggedItemId = itemId;
        row.classList.add("dragging");

        try {
            surface.setPointerCapture(pointerId);
        } catch {
            // Some embedded Android WebViews may fail pointer capture.
        }

        const createGhost = () => {
            ghost = row.cloneNode(true);
            ghost.classList.add("drag-ghost");
            ghost.style.width = `${row.offsetWidth}px`;
            ghost.style.left = `${startX - row.offsetWidth / 2}px`;
            ghost.style.top = `${startY - row.offsetHeight / 2}px`;

            document.body.appendChild(ghost);
        };

        const moveGhost = (clientX, clientY) => {
            if (!ghost) {
                return;
            }

            ghost.style.left = `${clientX - ghost.offsetWidth / 2}px`;
            ghost.style.top = `${clientY - ghost.offsetHeight / 2}px`;
        };

        const updateTargetFromPoint = (clientX, clientY) => {
            if (!ghost) {
                return;
            }

            ghost.style.visibility = "hidden";

            const targetRow = document
                .elementsFromPoint(clientX, clientY)
                .find((element) => {
                    return element.classList &&
                        element.classList.contains("checklist-row") &&
                        element.dataset.itemId &&
                        element.dataset.itemId !== itemId;
                });

            ghost.style.visibility = "visible";

            if (targetRow) {
                currentTargetItemId = targetRow.dataset.itemId;
            }
        };

        createGhost();
        moveGhost(startX, startY);

        const onPointerMove = (moveEvent) => {
            if (moveEvent.pointerId !== pointerId) {
                return;
            }

            moveEvent.preventDefault();
            moveEvent.stopPropagation();

            lastClientX = moveEvent.clientX;
            lastClientY = moveEvent.clientY;

            const deltaX = Math.abs(lastClientX - startX);
            const deltaY = Math.abs(lastClientY - startY);

            if (deltaX > 2 || deltaY > 2) {
                didMove = true;
            }

            moveGhost(lastClientX, lastClientY);
            updateTargetFromPoint(lastClientX, lastClientY);
        };

        const finishDrag = (endEvent) => {
            if (endEvent && endEvent.pointerId !== pointerId) {
                return;
            }

            document.removeEventListener("pointermove", onPointerMove);
            document.removeEventListener("pointerup", finishDrag);
            document.removeEventListener("pointercancel", finishDrag);

            try {
                surface.releasePointerCapture(pointerId);
            } catch {
                // Safe fallback for Android WebViews.
            }

            if (ghost) {
                ghost.remove();
                ghost = null;
            }

            row.classList.remove("dragging");
            draggedItemId = null;

            disableReorderLock();

            if (didMove && currentTargetItemId) {
                reorderItems(itemId, currentTargetItemId);
            }

            currentTargetItemId = null;
            didMove = false;
        };

        document.addEventListener("pointermove", onPointerMove, {
            passive: false
        });

        document.addEventListener("pointerup", finishDrag);
        document.addEventListener("pointercancel", finishDrag);
    }, {
        passive: false
    });
}

function enableReorderLock() {
    isReorderingItems = true;
    document.documentElement.classList.add("is-reordering");
}

function disableReorderLock() {
    isReorderingItems = false;
    document.documentElement.classList.remove("is-reordering");
}

function preventNativeTouchMoveDuringReorder(event) {
    if (!isReorderingItems) {
        return;
    }

    event.preventDefault();
    event.stopPropagation();
}


function reorderItems(sourceItemId, targetItemId) {
    if (!sourceItemId || !targetItemId || sourceItemId === targetItemId) {
        return;
    }

    const activeChecklist = getActiveChecklist();
    const sourceIndex = activeChecklist.items.findIndex((item) => item.id === sourceItemId);
    const targetIndex = activeChecklist.items.findIndex((item) => item.id === targetItemId);

    if (sourceIndex === -1 || targetIndex === -1) {
        return;
    }

    const [movedItem] = activeChecklist.items.splice(sourceIndex, 1);
    activeChecklist.items.splice(targetIndex, 0, movedItem);

    saveData();
    renderItems();
}

function renderNotes() {
    const activeChecklist = getActiveChecklist();

    if (!activeChecklist) {
        notesTextarea.value = "";
        return;
    }

    notesTextarea.value = activeChecklist.notes || "";

    if (notesOpen) {
        notesSection.classList.remove("collapsed");
        notesToggleButton.textContent = "Notes ▾";
    } else {
        notesSection.classList.add("collapsed");
        notesToggleButton.textContent = "Notes ▸";
    }
}

function renderAll() {
    renderChecklistSelect();
    renderNotes();
    renderItems();
}

function openItemModal(itemId = null) {
    editingItemId = itemId;

    const activeChecklist = getActiveChecklist();

    if (editingItemId) {
        const item = activeChecklist.items.find((entry) => entry.id === editingItemId);

        modalTitle.textContent = "Edit checklist item";
        itemInput.value = item ? item.text : "";
        optionalItemInput.checked = item ? Boolean(item.optional) : false;
    } else {
        modalTitle.textContent = "Add checklist item";
        itemInput.value = "";
        optionalItemInput.checked = false;
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
    optionalItemInput.checked = false;

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
            item.optional = optionalItemInput.checked;
        }
    } else {
        activeChecklist.items.push({
            id: generateId(),
            text: value,
            completed: false,
            optional: optionalItemInput.checked
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

function openRenameChecklistModal() {
    const activeChecklist = getActiveChecklist();

    checklistNameInput.value = activeChecklist ? activeChecklist.name : "";

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

    const activeChecklist = getActiveChecklist();

    if (activeChecklist) {
        activeChecklist.name = name;
    }

    saveData();
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
        notes: activeChecklist.notes || "",
        items: activeChecklist.items.map((item) => ({
            id: generateId(),
            text: item.text,
            completed: item.completed,
            optional: Boolean(item.optional)
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
        showPanelNotice("You must keep at least one checklist.", "info");
        return;
    }

    const activeChecklist = getActiveChecklist();

    openConfirmModal({
        title: "Delete checklist",
        message: `Delete "${activeChecklist.name}"? This cannot be undone.`,
        confirmText: "Delete",
        danger: true,
        onConfirm: () => {
            appData.checklists = appData.checklists.filter((list) => list.id !== activeChecklistId);

            activeChecklistId = appData.checklists[0].id;

            saveData();
            saveActiveChecklist();
            renderAll();

            showPanelNotice("Checklist deleted.", "success");
        }
    });
}

function openTemplateDropdown() {
    templateDropdown.classList.add("open");
    templateDropdownButton.setAttribute("aria-expanded", "true");
}

function closeTemplateDropdown() {
    if (!templateDropdown) {
        return;
    }

    templateDropdown.classList.remove("open");
    templateDropdownButton.setAttribute("aria-expanded", "false");
}

function toggleTemplateDropdown() {
    if (templateDropdown.classList.contains("open")) {
        closeTemplateDropdown();
    } else {
        closeChecklistDropdown();
        openTemplateDropdown();
    }
}

/**
 * Renders the custom template dropdown.
 *
 * @param {boolean} resetSelection When true, resets to the first template.
 */
function renderTemplateOptions(resetSelection = false) {
    if (resetSelection) {
        selectedTemplateIndex = 0;
    }

    templateDropdownMenu.innerHTML = "";

    TEMPLATES.forEach((template, index) => {
        const option = document.createElement("li");
        option.className = "custom-dropdown-option";
        option.setAttribute("role", "option");
        option.dataset.index = String(index);
        option.textContent = template.name;

        if (index === selectedTemplateIndex) {
            option.classList.add("selected");
            option.setAttribute("aria-selected", "true");
        }

        option.addEventListener("pointerdown", (event) => {
            event.preventDefault();
            event.stopPropagation();
        });

        option.addEventListener("click", (event) => {
            event.preventDefault();
            event.stopPropagation();

            selectedTemplateIndex = index;

            closeTemplateDropdown();
            renderTemplateOptions(false);
            renderTemplatePreview();
        });

        templateDropdownMenu.appendChild(option);
    });

    renderTemplatePreview();
}

function renderTemplatePreview() {
    const template = TEMPLATES[selectedTemplateIndex] || TEMPLATES[0];

    templateDropdownLabel.textContent = template.name;
    templateNameInput.value = template.name;

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
    renderTemplateOptions(true);

    templateModal.classList.add("visible");
    templateModal.setAttribute("aria-hidden", "false");

    setTimeout(() => {
        templateNameInput.focus();
        templateNameInput.select();
    }, 50);
}

function closeTemplateModal() {
    templateModal.classList.remove("visible");
    templateModal.setAttribute("aria-hidden", "true");
}

function createChecklistFromTemplate() {
    const template = TEMPLATES[selectedTemplateIndex] || TEMPLATES[0];
    const checklistName = templateNameInput.value.trim() || template.name;

    const newChecklist = {
        id: generateId(),
        name: checklistName,
        notes: "",
        items: template.items.map((itemText) => ({
            id: generateId(),
            text: itemText,
            completed: false,
            optional: false
        }))
    };

    appData.checklists.push(newChecklist);
    activeChecklistId = newChecklist.id;

    saveData();
    saveActiveChecklist();
    renderAll();
    closeTemplateModal();
}

function showPanelNotice(message, type = "info") {
    if (noticeTimeoutId) {
        clearTimeout(noticeTimeoutId);
    }

    panelNotice.textContent = message;
    panelNotice.className = `panel-notice visible ${type}`;

    noticeTimeoutId = setTimeout(() => {
        panelNotice.className = "panel-notice";
        panelNotice.textContent = "";
    }, 3500);
}

function openConfirmModal({ title, message, confirmText = "Confirm", danger = true, onConfirm }) {
    pendingConfirmAction = typeof onConfirm === "function" ? onConfirm : null;

    confirmTitle.textContent = title;
    confirmMessage.textContent = message;
    confirmActionButton.textContent = confirmText;

    confirmActionButton.className = danger
        ? "modal-button danger"
        : "modal-button primary";

    confirmModal.classList.add("visible");
    confirmModal.setAttribute("aria-hidden", "false");
}

function closeConfirmModal() {
    pendingConfirmAction = null;

    confirmModal.classList.remove("visible");
    confirmModal.setAttribute("aria-hidden", "true");
}

function runPendingConfirmAction() {
    const action = pendingConfirmAction;

    closeConfirmModal();

    if (action) {
        action();
    }
}

function toggleNotesSection() {
    notesOpen = !notesOpen;

    writeStorageValue(STORAGE_NOTES_OPEN_KEY, String(notesOpen));
    renderNotes();
}

function saveActiveChecklistNotes() {
    const activeChecklist = getActiveChecklist();

    if (!activeChecklist) {
        return;
    }

    activeChecklist.notes = notesTextarea.value;

    if (notesSaveTimeoutId) {
        clearTimeout(notesSaveTimeoutId);
    }

    notesSaveTimeoutId = setTimeout(() => {
        saveData();
    }, 250);
}

checklistDropdownButton.addEventListener("click", (event) => {
    event.stopPropagation();
    toggleChecklistDropdown();
});

document.addEventListener("click", (event) => {
    if (checklistDropdown && !checklistDropdown.contains(event.target)) {
        closeChecklistDropdown();
    }

    if (templateDropdown && !templateDropdown.contains(event.target)) {
        closeTemplateDropdown();
    }
});

document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
        closeChecklistDropdown();
        closeTemplateDropdown();
    }
});


newChecklistButton.addEventListener("click", openTemplateModal);

renameChecklistButton.addEventListener("click", openRenameChecklistModal);

duplicateChecklistButton.addEventListener("click", duplicateActiveChecklist);

themeToggleButton.addEventListener("click", cycleThemeMode);

deleteChecklistButton.addEventListener("click", deleteActiveChecklist);

tickAllButton.addEventListener("click", tickAllItemsInActiveChecklist);

untickAllButton.addEventListener("click", untickAllItemsInActiveChecklist);

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

templateDropdownButton.addEventListener("click", (event) => {
    event.stopPropagation();
    toggleTemplateDropdown();
});

cancelTemplateModalButton.addEventListener("click", closeTemplateModal);

createFromTemplateButton.addEventListener("click", createChecklistFromTemplate);

templateNameInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        createChecklistFromTemplate();
    }

    if (event.key === "Escape") {
        closeTemplateModal();
    }
});

templateModal.addEventListener("click", (event) => {
    if (event.target === templateModal) {
        closeTemplateModal();
    }
});

cancelConfirmButton.addEventListener("click", closeConfirmModal);

confirmActionButton.addEventListener("click", runPendingConfirmAction);

confirmModal.addEventListener("click", (event) => {
    if (event.target === confirmModal) {
        closeConfirmModal();
    }
});

document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && confirmModal.classList.contains("visible")) {
        closeConfirmModal();
    }
});

notesToggleButton.addEventListener("click", toggleNotesSection);

notesTextarea.addEventListener("input", saveActiveChecklistNotes);

loadData();
renderAll();