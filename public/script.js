const TOTAL_CHECKBOXES = 1_000_000;
const PAGE_SIZE = 500;
const SCROLL_THRESHOLD_PX = 300;

const container = document.getElementById("container");
const checkedCountElement = document.getElementById("checked-count");
const statusToastElement = document.getElementById("status-toast");
const socket = io();

let nextOffset = 0;
let isLoadingPage = false;
let hasLoadedAllPages = false;
let checkedCount = 0;
let toastTimeoutId = null;

function showStatusToast(message, type = "error") {
    if (!statusToastElement) return;

    statusToastElement.textContent = message;
    statusToastElement.className = `status-toast ${type}`;
    statusToastElement.style.display = "block";

    if (toastTimeoutId) {
        clearTimeout(toastTimeoutId);
    }

    toastTimeoutId = window.setTimeout(() => {
        if (!statusToastElement) return;
        statusToastElement.style.display = "none";
    }, 2500);
}

function setCheckedCount(value) {
    checkedCount = Math.max(0, Math.min(TOTAL_CHECKBOXES, value));
    checkedCountElement.textContent = String(checkedCount);
}

function incrementCheckedCount(delta) {
    setCheckedCount(checkedCount + delta);
}

function createCheckboxElement(id, isChecked) {
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.dataset.id = String(id);
    checkbox.checked = isChecked;
    return checkbox;
}

function appendCheckboxPage(offset, items) {
    const fragment = document.createDocumentFragment();

    for (let i = 0; i < items.length; i++) {
        const checkboxId = offset + i;
        fragment.appendChild(createCheckboxElement(checkboxId, items[i]));
    }

    container.appendChild(fragment);
}

async function fetchJson(url) {
    const response = await fetch(url);
    const payload = await response.json();

    if (!response.ok) {
        const message =
            payload?.message || `Request failed: ${response.status}`;
        throw new Error(message);
    }

    return payload;
}

async function fetchCheckedCount() {
    const payload = await fetchJson("/api/checkboxes/count");
    return payload?.data?.count ?? 0;
}

async function loadNextPage() {
    if (isLoadingPage || hasLoadedAllPages) return;

    isLoadingPage = true;

    try {
        const payload = await fetchJson(
            `/api/checkboxes?offset=${nextOffset}&limit=${PAGE_SIZE}`,
        );

        const items = Array.isArray(payload?.data?.items)
            ? payload.data.items
            : [];

        appendCheckboxPage(nextOffset, items);
        nextOffset += items.length;

        if (items.length < PAGE_SIZE || nextOffset >= TOTAL_CHECKBOXES) {
            hasLoadedAllPages = true;
        }
    } catch (error) {
        console.error(error);
    } finally {
        isLoadingPage = false;
    }
}

function isNearBottom() {
    const remainingScroll =
        container.scrollHeight - container.scrollTop - container.clientHeight;
    return remainingScroll <= SCROLL_THRESHOLD_PX;
}

function toggleCheckboxById(id) {
    const checkbox = container.querySelector(
        `input[type="checkbox"][data-id="${id}"]`,
    );
    if (!checkbox) return false;

    checkbox.checked = !checkbox.checked;
    incrementCheckedCount(checkbox.checked ? 1 : -1);
    return true;
}

async function rollbackOptimisticToggle(id) {
    const didToggleVisibleCheckbox = toggleCheckboxById(id);
    if (didToggleVisibleCheckbox) return;

    try {
        const latestCount = await fetchCheckedCount();
        setCheckedCount(latestCount);
    } catch (error) {
        console.error(error);
    }
}

function handleContainerChange(event) {
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) return;
    if (target.type !== "checkbox") return;

    if (!isAuthenticated()) {
        target.checked = !target.checked;
        alert("Please log in to participate");
        return;
    }

    const id = Number(target.dataset.id);
    if (!Number.isInteger(id)) return;

    incrementCheckedCount(target.checked ? 1 : -1);
    socket.emit("client:toggled", { id });
}

async function initialize() {
    try {
        const [initialPagePayload, initialCount] = await Promise.all([
            fetchJson(`/api/checkboxes?offset=0&limit=${PAGE_SIZE}`),
            fetchCheckedCount(),
        ]);

        const initialItems = Array.isArray(initialPagePayload?.data?.items)
            ? initialPagePayload.data.items
            : [];

        appendCheckboxPage(0, initialItems);
        nextOffset = initialItems.length;
        setCheckedCount(initialCount);

        if (initialItems.length < PAGE_SIZE || nextOffset >= TOTAL_CHECKBOXES) {
            hasLoadedAllPages = true;
        }

        if (isNearBottom()) {
            loadNextPage();
        }
    } catch (error) {
        console.error(error);
    }
}

container.addEventListener("change", handleContainerChange);

container.addEventListener("scroll", () => {
    if (isNearBottom()) {
        loadNextPage();
    }
});

socket.on("server:toggled", async (payload) => {
    if (payload?.origin && payload.origin === socket.id) return;

    const id = Number(payload?.id);
    if (!Number.isInteger(id)) return;

    const didToggleVisibleCheckbox = toggleCheckboxById(id);
    if (!didToggleVisibleCheckbox) {
        try {
            const latestCount = await fetchCheckedCount();
            setCheckedCount(latestCount);
        } catch (error) {
            console.error(error);
        }
    }
});

socket.on("server:error", (payload) => {
    const message =
        typeof payload?.message === "string"
            ? payload.message
            : "Action failed";

    showStatusToast(message, "error");
    console.error(message);

    const id = Number(payload?.id);
    if (Number.isInteger(id)) {
        rollbackOptimisticToggle(id);
    }
});

initialize();
