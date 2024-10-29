// 会员相关功能
class Membership {
    static showUpgradeModal() {
        // 先移除已存在的升级模态框
        document.getElementById('upgrade-modal')?.remove();
        
        // 获取当前用户的会员等级
        const currentUser = Storage.getCurrentUser();
        if (!currentUser) return;
        
        // 定义会员等级顺序
        const levelOrder = ['normal', 'silver', 'gold', 'platinum', 'lifetime'];
        const currentLevelIndex = levelOrder.indexOf(currentUser.membershipLevel);
        
        // 只显示比当前等级更高的会员选项
        const availableLevels = levelOrder.slice(currentLevelIndex + 1);
        
        const modalHtml = `
            <div id="upgrade-modal" class="modal">
                <div class="modal-content membership-upgrade">
                    <span class="close">&times;</span>
                    <h2>会员升级</h2>
                    <div class="membership-options">
                        ${availableLevels.map(level => `
                            <div class="membership-card ${level}">
                                <h3>${CONFIG.MEMBERSHIP_LEVELS[level].name}</h3>
                                <p class="price">¥${CONFIG.MEMBERSHIP_LEVELS[level].price}${level === 'lifetime' ? '' : '/月'}</p>
                                <ul>
                                    ${level === 'lifetime' ? `
                                        <li>无限次数使用</li>
                                        <li>最高优先级响应</li>
                                        <li>24小时专属客服</li>
                                        <li>高级功能解锁</li>
                                        <li>永久有效</li>
                                    ` : `
                                        <li>每月${CONFIG.MEMBERSHIP_LEVELS[level].usageLimit}次使用限额</li>
                                        ${level === 'silver' ? `
                                            <li>优先响应</li>
                                        ` : level === 'gold' ? `
                                            <li>优先响应</li>
                                            <li>专属客服</li>
                                        ` : `
                                            <li>最高优先级响应</li>
                                            <li>24小时专属客服</li>
                                            <li>高级功能解锁</li>
                                        `}
                                    `}
                                </ul>
                                <button onclick="Membership.upgradeMembership('${level}')">立即升级</button>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        const modal = document.getElementById('upgrade-modal');
        modal.style.display = "block";
        
        // 绑定关闭事件
        const closeBtn = modal.querySelector('.close');
        closeBtn.onclick = () => modal.remove();
        
        window.onclick = (event) => {
            if (event.target === modal) {
                modal.remove();
            }
        };
    }

    static async upgradeMembership(level) {
        const currentUser = Storage.getCurrentUser();
        if (!currentUser) return;

        const membershipLevel = CONFIG.MEMBERSHIP_LEVELS[level];
        const success = confirm(`确认申请升级到${membershipLevel.name}？\n价格：${membershipLevel.price}${level === 'lifetime' ? '' : '/月'}`);
        
        if (success) {
            // 显示支付方式选择模态框
            this.showPaymentModal(level, membershipLevel);
        }
    }

    static showPaymentModal(level, membershipLevel) {
        // 先移除已存在的支付模态框
        document.getElementById('payment-modal')?.remove();
        
        const modalHtml = `
            <div id="payment-modal" class="modal">
                <div class="modal-content payment-modal">
                    <span class="close">&times;</span>
                    <h2>选择支付方式</h2>
                    <div class="payment-info">
                        <p>升级套餐：${membershipLevel.name}</p>
                        <p>支付金额：¥${membershipLevel.price}${level === 'lifetime' ? '' : '/月'}</p>
                    </div>
                    <div class="payment-methods">
                        <button class="payment-btn wechat" onclick="Membership.showQRCode('wechat')">
                            <i class="fab fa-weixin"></i> 微信支付
                        </button>
                        <button class="payment-btn alipay" onclick="Membership.showQRCode('alipay')">
                            <i class="fab fa-alipay"></i> 支付宝
                        </button>
                    </div>
                    <div id="qrcode-container" style="display: none;">
                        <img id="payment-qrcode" src="" alt="支付二维码">
                        <p class="payment-tips">请使用手机扫码支付</p>
                        <button class="confirm-payment" onclick="Membership.confirmPayment('${level}')">已完成支付</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        const modal = document.getElementById('payment-modal');
        modal.style.display = "block";
        
        // 绑定关闭事件
        const closeBtn = modal.querySelector('.close');
        closeBtn.onclick = () => modal.remove();
        
        window.onclick = (event) => {
            if (event.target === modal) {
                modal.remove();
            }
        };
    }

    static showQRCode(paymentMethod) {
        const qrcodeContainer = document.getElementById('qrcode-container');
        const qrcodeImage = document.getElementById('payment-qrcode');
        
        // 根据支付方式显示对应的二维码
        qrcodeImage.src = paymentMethod === 'wechat' ? 'images/wx.jpg' : 'images/zfb.jpg';
        qrcodeContainer.style.display = 'block';
        
        // 隐藏支付方式按钮
        document.querySelector('.payment-methods').style.display = 'none';
    }

    static async confirmPayment(level) {
        const currentUser = Storage.getCurrentUser();
        if (!currentUser) return;

        // 创建升级申请
        const application = {
            id: Date.now(),
            username: currentUser.username,
            requestedLevel: level,
            currentLevel: currentUser.membershipLevel,
            status: 'pending',
            createTime: new Date().toISOString()
        };
        
        // 保存申请记录
        Storage.addUpgradeApplication(application);
        
        // 通知用户
        Chat.addMessage('ai', `您的${CONFIG.MEMBERSHIP_LEVELS[level].name}升级申请已提交，请等待管理员审核。`);
        
        // 关闭支付模态框
        document.getElementById('payment-modal')?.remove();
    }

    static async simulatePayment(amount) {
        // 模拟支付过程
        return new Promise(resolve => {
            setTimeout(() => {
                // 这里可以集成实际的支付系统
                resolve(true);
            }, 1000);
        });
    }

    static processUpgrade(user, level) {
        const users = Storage.getUsers();
        const userIndex = users.findIndex(u => u.username === user.username);
        
        if (userIndex !== -1) {
            const now = new Date();
            const expiryDate = new Date(now.setMonth(now.getMonth() + 1));
            
            users[userIndex].membershipLevel = level;
            users[userIndex].membershipExpiry = expiryDate.toISOString();
            users[userIndex].freeUsageCount = CONFIG.MEMBERSHIP_LEVELS[level].usageLimit;
            
            Storage.setUsers(users);
            Storage.setCurrentUser(users[userIndex]);
            
            // 更新界面显示
            document.querySelector('.membership-info')?.remove();
            document.querySelector('.usage-count')?.remove();
            UI.showMembershipStatus(users[userIndex]);
            UI.updateUsageCount(users[userIndex].freeUsageCount);
            
            // 关闭升级模态框
            document.getElementById('upgrade-modal')?.remove();
        }
    }

    static checkMembershipExpiry() {
        const currentUser = Storage.getCurrentUser();
        if (currentUser?.membershipExpiry) {
            const expiryDate = new Date(currentUser.membershipExpiry);
            if (expiryDate < new Date()) {
                // 会员已过期，降级为普通用户
                currentUser.membershipLevel = 'normal';
                currentUser.membershipExpiry = null;
                currentUser.freeUsageCount = CONFIG.MEMBERSHIP_LEVELS.normal.usageLimit;
                
                Storage.setCurrentUser(currentUser);
                const users = Storage.getUsers();
                const userIndex = users.findIndex(u => u.username === currentUser.username);
                if (userIndex !== -1) {
                    users[userIndex] = currentUser;
                    Storage.setUsers(users);
                }
                
                UI.showMembershipStatus(currentUser);
                UI.updateUsageCount(currentUser.freeUsageCount);
                Chat.addMessage('ai', '您的会员已过期，已降级为普通用户。');
            }
        }
    }
} 