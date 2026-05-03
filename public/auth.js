function isAuthenticated() {
    return window._isAuthenticated || false;
}

function getCurrentUser() {
    return window._currentUser || null;
}

function updateAuthUI() {
    const loginBtn = document.getElementById("login-btn");
    const logoutBtn = document.getElementById("logout-btn");
    const userInfo = document.getElementById("user-info");
    const userName = document.getElementById("user-name");
    const loginMessage = document.getElementById("login-message");
    const container = document.getElementById("container");

    if (!loginBtn || !logoutBtn || !userInfo || !userName || !loginMessage) {
        console.error("Auth UI elements not found");
        return;
    }

    const authenticated = isAuthenticated();
    const user = getCurrentUser();

    if (authenticated && user) {
        loginBtn.style.display = "none";
        logoutBtn.style.display = "inline-block";
        userInfo.style.display = "flex";
        userName.textContent = user.name || user.email || user.userId;
        loginMessage.style.display = "none";

        if (container) {
            container.classList.remove("disabled");
        }
    } else {
        loginBtn.style.display = "inline-block";
        logoutBtn.style.display = "none";
        userInfo.style.display = "none";
        loginMessage.style.display = "block";

        if (container) {
            container.classList.add("disabled");
        }
    }
}

async function initAuth() {
    try {
        const response = await fetch("/auth/me");
        if (response.ok) {
            const data = await response.json();
            if (data.success) {
                window._isAuthenticated = true;
                window._currentUser = data.data;
            }
        }
    } catch (error) {
        console.error("Failed to fetch auth status:", error);
    }

    updateAuthUI();
}

document.addEventListener("DOMContentLoaded", initAuth);
