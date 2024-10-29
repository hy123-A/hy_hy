// UI相关功能
class UI {
    static init() {
        this.bindEvents();
        this.checkInitialState();
    }

    static bindEvents() {
        // 登录按钮事件
        document.getElementById('login-button').addEventListener('click', () => {
            document.getElementById('login-modal').style.display = 'block';
        });

        // 关闭按钮事件
        document.querySelector('.close').addEventListener('click', () => {
            this.hideLoginModal();
        });

        // 切换登录/注册表单
        document.getElementById('switch-link').addEventListener('click', (e) => {
            e.preventDefault();
            this.toggleForm();
        });

        // 提交按钮事件
        document.getElementById('submit-btn').addEventListener('click', () => {
            this.handleSubmit();
        });

        // 登出按钮事件
        document.getElementById('logout-button').addEventListener('click', () => {
            Auth.logout();
        });

        // 发送消息事件
        document.getElementById('send-button').addEventListener('click', () => Chat.sendMessage());
        document.getElementById('user-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') Chat.sendMessage();
        });

        // 点击模态框外部关闭
        window.addEventListener('click', (e) => {
            if (e.target === document.getElementById('login-modal')) {
                this.hideLoginModal();
            }
        });

        // 添加找回密码链接事件
        document.getElementById('reset-password-link').addEventListener('click', (e) => {
            e.preventDefault();
            this.showPasswordResetForm();
        });
    }

    static checkInitialState() {
        const currentUser = Storage.getCurrentUser();
        if (currentUser) {
            this.updateLoginStatus(true, currentUser.username);
            this.updateUsageCount(currentUser.freeUsageCount);
            this.showMembershipStatus(currentUser);
        } else {
            this.updateGuestUsageCount();
        }
    }

    static hideLoginModal() {
        document.getElementById('login-modal').style.display = 'none';
        document.getElementById('error-message').textContent = '';
    }

    static updateLoginStatus(isLoggedIn, username = '') {
        const loginButton = document.getElementById('login-button');
        const logoutButton = document.getElementById('logout-button');
        
        if (isLoggedIn) {
            loginButton.style.display = 'none';
            logoutButton.style.display = 'inline-block';
            logoutButton.textContent = `退出 (${username})`;
        } else {
            loginButton.style.display = 'inline-block';
            logoutButton.style.display = 'none';
        }
    }

    static updateUsageCount(count) {
        document.querySelector('.usage-count')?.remove();
        const usageCount = document.createElement('div');
        usageCount.classList.add('usage-count');
        usageCount.textContent = count === 'unlimited' || count === '无限制' ? 
            '使用次数: 无限制' : `剩余使用次数: ${count}`;
        document.querySelector('.chat-header').appendChild(usageCount);
    }

    static updateGuestUsageCount() {
        const count = Storage.getGuestUsageCount();
        this.updateUsageCount(count);
    }

    static showMembershipStatus(user) {
        document.querySelector('.membership-info')?.remove();
        const membershipInfo = document.createElement('div');
        membershipInfo.classList.add('membership-info');
        const level = CONFIG.MEMBERSHIP_LEVELS[user.membershipLevel];
        const expiryDate = user.membershipExpiry ? new Date(user.membershipExpiry).toLocaleDateString() : '无';
        membershipInfo.innerHTML = `
            <span class="member-level ${user.membershipLevel}">${level.name}</span>
            ${user.membershipLevel !== 'lifetime' && user.membershipExpiry ? 
                `<span class="expiry-date">到期时间: ${expiryDate}</span>` : ''}
            ${user.membershipLevel !== 'lifetime' ? 
                '<button onclick="Membership.showUpgradeModal()">升级会员</button>' : ''}
        `;
        document.querySelector('.chat-header').appendChild(membershipInfo);
    }

    static toggleForm() {
        const isLoginForm = document.getElementById('modal-title').textContent === '登录';
        const modalTitle = document.getElementById('modal-title');
        const submitBtn = document.getElementById('submit-btn');
        const switchLink = document.getElementById('switch-link');
        const resetLink = document.getElementById('reset-password-link');
        const errorMessage = document.getElementById('error-message');

        if (isLoginForm) {
            modalTitle.textContent = '注册';
            submitBtn.textContent = '注册';
            switchLink.textContent = '已有账号？登录';
            resetLink.style.display = 'none';
        } else {
            modalTitle.textContent = '登录';
            submitBtn.textContent = '登录';
            switchLink.textContent = '还没有账号？注册';
            resetLink.style.display = 'inline';
        }
        
        errorMessage.textContent = '';
    }

    static handleSubmit() {
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const modalTitle = document.getElementById('modal-title').textContent;
        const errorMessage = document.getElementById('error-message');

        if (modalTitle === '找回密码') {
            this.handlePasswordReset();
            return;
        }

        if (!username || !password) {
            errorMessage.textContent = '用户名和密码不能为空';
            return;
        }

        if (modalTitle === '登录') {
            const success = Auth.login(username, password);
            if (!success) {
                errorMessage.textContent = '用户名或密码错误';
            }
        } else {
            const success = Auth.register(username, password);
            if (!success) {
                errorMessage.textContent = '用户名已存在';
            }
        }
    }

    static clearUserInterface() {
        document.querySelector('.usage-count')?.remove();
        document.querySelector('.membership-info')?.remove();
    }

    static showPasswordResetForm() {
        const modalTitle = document.getElementById('modal-title');
        const submitBtn = document.getElementById('submit-btn');
        const switchLink = document.getElementById('switch-link');
        const resetLink = document.getElementById('reset-password-link');
        const passwordInput = document.getElementById('password');
        const errorMessage = document.getElementById('error-message');

        modalTitle.textContent = '找回密码';
        submitBtn.textContent = '提交申请';
        switchLink.textContent = '返回登录';
        resetLink.style.display = 'none';
        passwordInput.style.display = 'none';
        errorMessage.textContent = '';
        
        // 修改切换链接行为
        switchLink.onclick = (e) => {
            e.preventDefault();
            modalTitle.textContent = '登录';
            submitBtn.textContent = '登录';
            switchLink.textContent = '还没有账号？注册';
            resetLink.style.display = 'inline';
            passwordInput.style.display = 'block';
            this.bindEvents(); // 重新绑定原始事件
        };
    }

    static handlePasswordReset() {
        const username = document.getElementById('username').value;
        const errorMessage = document.getElementById('error-message');

        if (!username) {
            errorMessage.textContent = '请输入用户名';
            return;
        }

        // 检查用户是否存在
        const users = Storage.getUsers();
        const user = users.find(u => u.username === username);
        if (!user) {
            errorMessage.textContent = '用户不存在';
            return;
        }

        // 创建密码重置申请
        const application = {
            id: Date.now(),
            username: username,
            status: 'pending',
            createTime: new Date().toISOString()
        };

        Storage.addPasswordResetApplication(application);
        this.hideLoginModal();
        Chat.addMessage('ai', '密码重置申请已提交，请等待管理员审核。');
    }
} 