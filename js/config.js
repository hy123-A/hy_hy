// 配置文件
const CONFIG = {
    API_KEY: 'f3878817a6cbc5ec31aed8d1e534a94e.8XS7MGSTAExlE3UM',
    API_URL: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
    ADMIN: {
        username: 'admin',
        password: 'admin123'
    },
    MEMBERSHIP_LEVELS: {
        normal: { name: '普通用户', usageLimit: 10, price: 0 },
        silver: { name: '白银会员', usageLimit: 80, price: 29 },
        gold: { name: '黄金会员', usageLimit: 200, price: 99 },
        platinum: { name: '铂金会员', usageLimit: 500, price: 199 },
        lifetime: { name: '终身会员', usageLimit: 'unlimited', price: 999 }
    }
}; 