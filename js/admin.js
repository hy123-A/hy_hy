class AdminPanel {
    constructor() {
        this.adminButton = document.getElementById('admin-panel-button');
        this.adminModal = document.getElementById('admin-modal');
        this.setupEventListeners();
    }

    setupEventListeners() {
        // 管理员按钮点击事件
        this.adminButton?.addEventListener('click', () => {
            // 添加权限检查
            if (this.isAdmin()) {
                this.openAdminPanel();
            } else {
                alert('您没有管理员权限！');
            }
        });

        // 关闭模态框
        const closeButton = this.adminModal?.querySelector('.close');
        if (closeButton) {
            closeButton.addEventListener('click', () => {
                this.adminModal.style.display = 'none';
            });
        }

        // 点击模态框外部关闭
        window.addEventListener('click', (e) => {
            if (e.target === this.adminModal) {
                this.adminModal.style.display = 'none';
            }
        });
    }

    // 添加管理员权限检查方法
    isAdmin() {
        return sessionStorage.getItem('isAdmin') === 'true';
    }

    openAdminPanel() {
        // 添加权限检查
        if (!this.isAdmin()) {
            alert('您没有管理员权限！');
            return;
        }

        const users = Storage.getUsers();
        const currentUser = Storage.getCurrentUser();
        
        // 获取模态框内容元素
        const modalContent = this.adminModal.querySelector('.modal-content');
        
        const applications = Storage.getUpgradeApplications().filter(a => a.status === 'pending');
        const passwordResetApplications = Storage.getPasswordResetApplications().filter(a => a.status === 'pending');
        
        modalContent.innerHTML = `
            <span class="close">&times;</span>
            <h2>管理员面板</h2>
            <div class="admin-panel">
                <h3>密码重置申请</h3>
                <div class="password-reset-applications">
                    ${passwordResetApplications.length > 0 ? passwordResetApplications.map(app => `
                        <div class="application-item">
                            <span>用户: ${app.username}</span>
                            <span>申请时间: ${new Date(app.createTime).toLocaleString()}</span>
                            <div class="password-reset-actions">
                                <input type="password" class="new-password" placeholder="设置新密码">
                                <button class="approve-reset-btn" data-id="${app.id}" data-username="${app.username}">批准</button>
                                <button class="reject-reset-btn" data-id="${app.id}" data-username="${app.username}">拒绝</button>
                            </div>
                        </div>
                    `).join('') : '<p>暂无待处理的密码重置申请</p>'}
                </div>
                <h3>会员升级申请</h3>
                <div class="upgrade-applications">
                    ${applications.length > 0 ? applications.map(app => `
                        <div class="application-item">
                            <span>用户: ${app.username}</span>
                            <span>当前等级: ${CONFIG.MEMBERSHIP_LEVELS[app.currentLevel].name}</span>
                            <span>申请等级: ${CONFIG.MEMBERSHIP_LEVELS[app.requestedLevel].name}</span>
                            <span>申请时间: ${new Date(app.createTime).toLocaleString()}</span>
                            <button class="approve-btn" data-id="${app.id}" data-username="${app.username}" data-level="${app.requestedLevel}">批准</button>
                            <button class="reject-btn" data-id="${app.id}" data-username="${app.username}">拒绝</button>
                        </div>
                    `).join('') : '<p>暂无待处理的升级申请</p>'}
                </div>
                <h3>用户管理</h3>
                <div class="admin-user-list">
                    ${users.map(user => `
                        <div class="user-item">
                            <span>${user.username}</span>
                            <span>会员等级: ${user.membershipLevel}</span>
                            <span>剩余使用次数: ${user.freeUsageCount}</span>
                            ${user.username !== 'admin' ? `
                                <button class="modify-btn" data-username="${user.username}">修改会员</button>
                                <button class="delete-btn" data-username="${user.username}">删除用户</button>
                            ` : ''}
                        </div>
                    `).join('')}
                </div>
                <div class="usage-stats">
                    <h3>使用统计</h3>
                    <p>总用户数：${users.length}</p>
                    <p>高级会员数：${users.filter(u => u.membershipLevel !== 'normal').length}</p>
                </div>
            </div>
        `;

        // 重新添加关闭按钮事件
        const closeButton = modalContent.querySelector('.close');
        if (closeButton) {
            closeButton.addEventListener('click', () => {
                this.adminModal.style.display = 'none';
            });
        }

        // 添加事件监听
        this.setupAdminPanelEvents(modalContent);
        
        // 添加申请处理事件
        this.setupApplicationEvents(modalContent);
        
        // 添加密码重置申请处理事件
        this.setupPasswordResetEvents(modalContent);
        
        // 显示面板
        this.adminModal.style.display = 'block';
    }

    setupAdminPanelEvents(panel) {
        // 添加权限检查
        if (!this.isAdmin()) {
            return;
        }

        // 修改会员按钮事件
        panel.querySelectorAll('.modify-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const username = e.target.dataset.username;
                const users = Storage.getUsers();
                const user = users.find(u => u.username === username);
                
                // 显示会员等级选择
                const levels = Object.keys(CONFIG.MEMBERSHIP_LEVELS).filter(level => level !== 'normal');
                const newLevel = prompt(
                    `请选择新的会员等级 (${levels.join('/')})\n当前等级: ${user.membershipLevel}`,
                    user.membershipLevel
                );

                if (newLevel && CONFIG.MEMBERSHIP_LEVELS[newLevel]) {
                    // 更新用户会员信息
                    user.membershipLevel = newLevel;
                    user.freeUsageCount = CONFIG.MEMBERSHIP_LEVELS[newLevel].usageLimit;
                    
                    // 设置会员过期时间（30天）
                    if (newLevel !== 'normal') {
                        user.membershipExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
                    } else {
                        user.membershipExpiry = null;
                    }

                    // 更新存储
                    Storage.updateUser(user);
                    
                    // 如果修改的是当前登录用户，更新界面显示
                    const currentUser = Storage.getCurrentUser();
                    if (currentUser && currentUser.username === user.username) {
                        Storage.setCurrentUser(user);
                        UI.updateUsageCount(user.freeUsageCount);
                        UI.showMembershipStatus(user);
                    }

                    // 刷新管理员面板
                    this.openAdminPanel();
                    
                    // 显示成功消息
                    alert(`已将用户 ${username} 的会员等级修改为 ${newLevel}`);
                }
            });
        });

        // 删除用户按钮事件
        panel.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const username = e.target.dataset.username;
                if (confirm(`确定要删除用户 ${username} 吗？`)) {
                    Storage.deleteUser(username);
                    this.openAdminPanel(); // 刷新面板
                }
            });
        });
    }

    // 添加申请处理事件方法
    setupApplicationEvents(panel) {
        // 批准申请
        panel.querySelectorAll('.approve-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const { id, username, level } = e.target.dataset;
                if (confirm(`确定批准用户 ${username} 升级到 ${CONFIG.MEMBERSHIP_LEVELS[level].name}？`)) {
                    // 更新用户会员信息
                    const users = Storage.getUsers();
                    const user = users.find(u => u.username === username);
                    if (user) {
                        user.membershipLevel = level;
                        user.freeUsageCount = CONFIG.MEMBERSHIP_LEVELS[level].usageLimit;
                        user.membershipExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
                        Storage.updateUser(user);
                        
                        // 更新申请状态
                        Storage.updateUpgradeApplication(parseInt(id), 'approved');
                        
                        // 刷新管理员面板
                        this.openAdminPanel();
                        
                        alert(`已批准用户 ${username} 的升级申请`);
                    }
                }
            });
        });
        
        // 拒绝申请
        panel.querySelectorAll('.reject-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const { id, username } = e.target.dataset;
                if (confirm(`确定拒绝用户 ${username} 的升级申请？`)) {
                    Storage.updateUpgradeApplication(parseInt(id), 'rejected');
                    this.openAdminPanel();
                    alert(`已拒绝用户 ${username} 的升级申请`);
                }
            });
        });
    }

    // 添加密码重置申请处理事件方法
    setupPasswordResetEvents(panel) {
        // 批准密码重置
        panel.querySelectorAll('.approve-reset-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const { id, username } = e.target.dataset;
                const newPassword = e.target.parentElement.querySelector('.new-password').value;
                
                if (!newPassword) {
                    alert('请输入新密码');
                    return;
                }
                
                if (confirm(`确定为用户 ${username} 重置密码？`)) {
                    // 更新用户密码
                    const users = Storage.getUsers();
                    const user = users.find(u => u.username === username);
                    if (user) {
                        user.password = newPassword;
                        Storage.updateUser(user);
                        
                        // 更新申请状态
                        Storage.updatePasswordResetApplication(parseInt(id), 'approved');
                        
                        // 刷新管理员面板
                        this.openAdminPanel();
                        
                        alert(`已重置用户 ${username} 的密码`);
                    }
                }
            });
        });
        
        // 拒绝密码重置
        panel.querySelectorAll('.reject-reset-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const { id, username } = e.target.dataset;
                if (confirm(`确定拒绝用户 ${username} 的密码重置申请？`)) {
                    Storage.updatePasswordResetApplication(parseInt(id), 'rejected');
                    this.openAdminPanel();
                    alert(`已拒绝用户 ${username} 的密码重置申请`);
                }
            });
        });
    }
}

// 初始化管理员面板
const adminPanel = new AdminPanel();

// 检查用户是否是管理员并显示/隐藏管理员按钮
function checkAdminStatus() {
    const isAdmin = sessionStorage.getItem('isAdmin') === 'true';
    const adminButton = document.getElementById('admin-panel-button');
    if (adminButton) {
        adminButton.style.display = isAdmin ? 'inline-block' : 'none';
    }
}

// 在页面加载时检查管理员状态
document.addEventListener('DOMContentLoaded', checkAdminStatus);