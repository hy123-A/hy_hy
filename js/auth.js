// 认证相关功能
class Auth {
    static login(username, password) {
        if (username === CONFIG.ADMIN.username && password === CONFIG.ADMIN.password) {
            return this.loginAsAdmin();
        }
        return this.loginAsUser(username, password);
    }

    static loginAsAdmin() {
        UI.hideLoginModal();
        UI.updateLoginStatus(true, 'admin');
        sessionStorage.setItem('isAdmin', 'true');
        checkAdminStatus();
        return true;
    }

    static loginAsUser(username, password) {
        const users = Storage.getUsers();
        const user = users.find(u => u.username === username && u.password === password);
        if (user) {
            if (!user.membershipLevel) {
                user.membershipLevel = 'normal';
                user.membershipExpiry = null;
            }
            UI.hideLoginModal();
            UI.updateLoginStatus(true, username);
            Storage.setCurrentUser(user);
            UI.updateUsageCount(user.freeUsageCount);
            UI.showMembershipStatus(user);
            return true;
        }
        return false;
    }

    static register(username, password) {
        const users = Storage.getUsers();
        if (users.some(u => u.username === username)) {
            return false;
        }
        const newUser = {
            username,
            password,
            freeUsageCount: CONFIG.MEMBERSHIP_LEVELS.normal.usageLimit,
            membershipLevel: 'normal',
            membershipExpiry: null
        };
        Storage.addUser(newUser);
        Storage.setCurrentUser(newUser);
        UI.hideLoginModal();
        UI.updateLoginStatus(true, username);
        UI.updateUsageCount(newUser.freeUsageCount);
        UI.showMembershipStatus(newUser);
        return true;
    }

    static logout() {
        Storage.clearSession();
        UI.updateLoginStatus(false);
        UI.clearUserInterface();
        Chat.addMessage('ai', '您已退出登录。');
    }
}

// 在登录成功后保存用户信息
async function handleLogin(response) {
    const { token, user } = await response.json();
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    
    // 触发登录成功事件
    const event = new Event('userLoggedIn');
    document.dispatchEvent(event);
    
    // 检查管理员状态
    checkAdminStatus();
} 