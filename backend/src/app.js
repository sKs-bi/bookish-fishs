// 全局未捕获异常处理 — 记录日志后退出进程，由PM2自动重启
process.on('uncaughtException', (err) => {
    console.error('【未捕获异常】:', err);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('【未处理的Promise拒绝】:', reason);
    process.exit(1);
});

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const path = require('path');

const config = require('./config');
const { sequelize } = require('./models');
const { errorHandler } = require('./middleware/validator');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const departmentRoutes = require('./routes/departments');
const assetRoutes = require('./routes/assets');
const purchaseRoutes = require('./routes/purchases');
const repairRoutes = require('./routes/repairs');
const systemRoutes = require('./routes/system');
const rejectionRoutes = require('./routes/rejections');
const roleUpgradeRoutes = require('./routes/roleUpgrade');
const aiRoutes = require('./routes/ai');

const app = express();

app.use(helmet({ contentSecurityPolicy: false, cacheControl: false }));
app.use(compression());
app.use(morgan('combined'));
app.use(cors({
    origin: true,
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use(express.static(path.join(__dirname, '../../frontend/dist'), {
    setHeaders: (res, filePath) => {
        if (filePath.endsWith('.html')) {
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
            res.setHeader('Pragma', 'no-cache');
            res.setHeader('Expires', '0');
        } else if (filePath.endsWith('.js') || filePath.endsWith('.css')) {
            res.setHeader('Cache-Control', 'no-cache, must-revalidate');
        }
    }
}));

app.get('/api/health', (req, res) => {
    res.json({ code: 200, message: 'OK', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/purchases', purchaseRoutes);
app.use('/api/repairs', repairRoutes);
app.use('/api/system', systemRoutes);
app.use('/api/rejections', rejectionRoutes);
app.use('/api/role-upgrade', roleUpgradeRoutes);
app.use('/api/ai', aiRoutes);

// API 404处理 — 使用all方法匹配所有HTTP方法和/api下的所有路径
// 必须在SPA fallback之前，否则app.get('*')会先匹配
app.all('/api/*', (req, res) => {
    res.status(404).json({
        code: 404,
        message: 'API接口不存在'
    });
});

// SPA fallback: 非API请求返回index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../../frontend/dist/index.html'));
});

app.use(errorHandler);

const PORT = config.port;

const startServer = async () => {
    const maxRetries = 5;
    const retryDelay = 5000;
    let retries = 0;

    while (retries < maxRetries) {
        try {
            await sequelize.authenticate();
            console.log('数据库连接成功');

            await sequelize.sync({ alter: false });
            console.log('数据库同步完成');

            const server = app.listen(PORT, '0.0.0.0', () => {
                console.log('服务器运行在 http://0.0.0.0:' + PORT);
                console.log('环境: ' + config.env);
            });

            server.on('error', (error) => {
                if (error.code === 'EADDRINUSE') {
                    console.error('端口 ' + PORT + ' 已被占用');
                } else {
                    console.error('服务器启动错误:', error);
                }
                process.exit(1);
            });

            return;
        } catch (error) {
            retries++;
            console.error('数据库连接失败（第' + retries + '/' + maxRetries + '次）:', error.message);
            if (retries >= maxRetries) {
                console.error('达到最大重试次数，服务器启动失败');
                process.exit(1);
            }
            console.log((retryDelay / 1000) + '秒后重试...');
            await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
    }
};

startServer();

module.exports = app;
