// 聊天相关功能
class Chat {
    static async sendMessage() {
        const message = document.getElementById('user-input').value.trim();
        if (!message) return;

        const currentUser = Storage.getCurrentUser();
        const guestUsageCount = Storage.getGuestUsageCount();

        if (this.canSendMessage(currentUser, guestUsageCount)) {
            await this.processMessage(message, currentUser);
        } else {
            this.handleUsageLimitExceeded(currentUser);
        }
    }

    static canSendMessage(user, guestCount) {
        if (user) {
            if (user.membershipLevel === 'lifetime') {
                return true;
            }
            return user.freeUsageCount > 0;
        }
        return guestCount > 0;
    }

    static async processMessage(message, user) {
        const userInput = document.getElementById('user-input');
        userInput.value = '';
        this.addMessage('user', message);

        // 显示AI思考状态
        const loadingMessage = this.createLoadingMessage();
        document.getElementById('chatbox').appendChild(loadingMessage);

        try {
            const response = await fetch(CONFIG.API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': CONFIG.API_KEY
                },
                body: JSON.stringify({
                    model: "glm-4",
                    messages: [{
                        role: "user",
                        content: message
                    }],
                    stream: false
                })
            });

            if (!response.ok) {
                throw new Error('API 请求失败: ' + response.status);
            }

            const data = await response.json();
            document.getElementById('chatbox').removeChild(loadingMessage);

            if (data.choices && data.choices[0] && data.choices[0].message) {
                this.addMessage('ai', data.choices[0].message.content);
                this.updateUsageCount(user);
            } else {
                this.addMessage('ai', '抱歉，我现在无法回答。');
            }
        } catch (error) {
            console.error('API 错误:', error);
            document.getElementById('chatbox').removeChild(loadingMessage);
            this.addMessage('ai', '抱歉，发生了错误：' + error.message);
        }
    }

    static createLoadingMessage() {
        const loadingMessage = document.createElement('div');
        loadingMessage.classList.add('message', 'ai-message', 'thinking');
        
        const avatar = document.createElement('img');
        avatar.src = 'images/Tx.png';
        avatar.alt = 'AI头像';
        avatar.title = 'AI助手';
        avatar.classList.add('ai-avatar');
        
        const thinkingText = document.createElement('div');
        thinkingText.textContent = '正在思考';
        const dots = document.createElement('span');
        dots.classList.add('thinking-dots');
        thinkingText.appendChild(dots);
        
        loadingMessage.appendChild(avatar);
        loadingMessage.appendChild(thinkingText);
        
        return loadingMessage;
    }

    static addMessage(sender, message) {
        const chatbox = document.getElementById('chatbox');
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', `${sender}-message`);
        
        if (sender === 'ai') {
            const avatar = document.createElement('img');
            avatar.src = 'images/Tx.png';
            avatar.alt = 'AI头像';
            avatar.title = 'AI助手';
            avatar.classList.add('ai-avatar');
            messageElement.appendChild(avatar);
            
            const messageText = document.createElement('div');
            messageText.textContent = message;
            messageElement.appendChild(messageText);
        } else {
            messageElement.textContent = message;
        }
        
        chatbox.appendChild(messageElement);
        chatbox.scrollTop = chatbox.scrollHeight;
    }

    static updateUsageCount(user) {
        if (user) {
            // 终身会员显示无限制
            if (user.membershipLevel === 'lifetime' || user.freeUsageCount === 'unlimited') {
                UI.updateUsageCount('无限制');
                return;
            }
            
            // 所有其他会员正常减少使用次数
            user.freeUsageCount = Math.max(0, user.freeUsageCount - 1);
            Storage.setCurrentUser(user);
            
            // 更新存储中的用户信息
            const users = Storage.getUsers();
            const userIndex = users.findIndex(u => u.username === user.username);
            if (userIndex !== -1) {
                users[userIndex] = user;
                Storage.setUsers(users);
            }
            
            // 更新界面显示
            UI.updateUsageCount(user.freeUsageCount);
        } else {
            // 游客使用次数处理
            const guestCount = Math.max(0, Storage.getGuestUsageCount() - 1);
            Storage.setGuestUsageCount(guestCount);
            UI.updateGuestUsageCount();
        }
    }

    static handleUsageLimitExceeded(user) {
        if (user) {
            if (user.membershipLevel === 'normal') {
                this.addMessage('ai', '您的使用次数已用完，请升级会员以继续使用。');
                Membership.showUpgradeModal();
            } else if (user.membershipLevel !== 'lifetime') {
                this.addMessage('ai', '您的会员使用次数已用完，请续费。');
                Membership.showUpgradeModal();
            }
        } else {
            this.addMessage('ai', '游客使用次数已用完，请登录或注册账号继续使用。');
        }
    }
} 