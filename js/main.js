document.addEventListener('DOMContentLoaded', () => {
    // 初始化UI
    UI.init();

    // 显示欢迎消息
    Chat.addMessage('ai', '你好！我是 NeoMind AI，你的智能助手。请问有什么可以帮你的吗？');

    // 检查会员过期状态
    Membership.checkMembershipExpiry();

    // 检查管理员状态
    checkAdminStatus();
});

// 添加错误处理
window.onerror = function(message, source, lineno, colno, error) {
    console.error('Global error:', {message, source, lineno, colno, error});
    return false;
};

// 添加未处理的Promise错误处理
window.addEventListener('unhandledrejection', function(event) {
    console.error('Unhandled promise rejection:', event.reason);
}); 