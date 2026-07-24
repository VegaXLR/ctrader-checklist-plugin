const STORAGE_ITEMS_KEY = "vegaxlr_ctrader_checklist_items";
const STORAGE_THEME_KEY = "vegaxlr_ctrader_checklist_theme";

const checklistItemsElement = document.getElementById("checklistItems");
const addItemButton = document.getElementById("addItemButton");
const themeToggle = document.getElementById("themeToggle");

const itemModal = document.getElementById("itemModal");
const modalTitle = document.getElementById("modalTitle");
const itemInput = document.getElementById("itemInput");
const cancelModalButton = document.getElementById("cancelModalButton");
const saveItemButton = document.getElementById("saveItemButton");

let checklistItems = [];
let editingItemId = null;

function generateId() {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

function loadItems() {
    try {
        const storedItems = localStorage.getItem(STORAGE_ITEMS_KEY);
        checklistItems = storedItems ? JSON.parse(storedItems) : [];
    } catch {
        checklistItems = [];
    }
}

function saveItems() {
    localStorage.setItem(STORAGE_ITEMS_KEY, JSON.stringify(checklistItems));
}

function loadTheme() {
    const savedTheme = localStorage.getItem(STORAGE_THEME_KEY) || "dark";

    if (savedTheme === "dark") {
        document.body.classList.add("dark");
        themeToggle.textContent = "Light Mode";
    } else {
        document.body.classList.remove("dark");
        themeToggle.textContent = "Dark Mode";
    }
}

function toggleTheme() {
    const isDarkMode = document.body.classList.toggle("dark");

    localStorage.setItem(STORAGE_THEME_KEY, isDarkMode ? "dark" : "light");
    themeToggle.textContent = isDarkMode ? "Light Mode" : "Dark Mode";
}

function escapeHtml(value) {
    return value
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function renderItems() {
    checklistItemsElement.innerHTML = "";

    if (checklistItems.length === 0) {
        const emptyState = document.createElement("div");
        emptyState.className = "empty-state";
        emptyState.textContent =
            "Your checklist is empty. Click + Add new item to create your first trading reminder.";

        checklistItemsElement.appendChild(emptyState);
        return;
    }

    checklistItems.forEach((item) => {
        const row = document.createElement("div");
        row.className = item.completed ? "checklist-row done" : "checklist-row";

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = item.completed;

        checkbox.addEventListener("change", () => {
            item.completed = checkbox.checked;
            saveItems();
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
            openModal(item.id);
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

function openModal(itemId = null) {
    editingItemId = itemId;

    if (editingItemId) {
        const item = checklistItems.find((entry) => entry.id === editingItemId);

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

function closeModal() {
    editingItemId = null;
    itemInput.value = "";

    itemModal.classList.remove("visible");
    itemModal.setAttribute("aria-hidden", "true");
}

function saveModalItem() {
    const value = itemInput.value.trim();

    if (!value) {
        itemInput.focus();
        return;
    }

    if (editingItemId) {
        const item = checklistItems.find((entry) => entry.id === editingItemId);

        if (item) {
            item.text = value;
        }
    } else {
        checklistItems.push({
            id: generateId(),
            text: value,
            completed: false
        });
    }

    saveItems();
    renderItems();
    closeModal();
}

function deleteItem(itemId) {
    checklistItems = checklistItems.filter((item) => item.id !== itemId);

    saveItems();
    renderItems();
}

addItemButton.addEventListener("click", () => {
    openModal();
});

themeToggle.addEventListener("click", toggleTheme);

cancelModalButton.addEventListener("click", closeModal);

saveItemButton.addEventListener("click", saveModalItem);

itemInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        saveModalItem();
    }

    if (event.key === "Escape") {
        closeModal();
    }
});

itemModal.addEventListener("click", (event) => {
    if (event.target === itemModal) {
        closeModal();
    }
});

loadTheme();
loadItems();
renderItems();
