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

const app = express();

app.use(helmet());
app.use(compression());
app.use(morgan('combined'));
app.use(cors({
    origin: '*',
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use(express.static(path.join(__dirname, '../../frontend/dist')));

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

app.use((req, res) => {
    res.status(404).json({ code: 404, message: '接口不存在' });
});

app.use(errorHandler);

const PORT = config.port;

const startServer = async () => {
    try {
        await sequelize.authenticate();
        console.log('数据库连接成功');

        await sequelize.sync({ alter: false });
        console.log('数据库同步完成');

        app.listen(PORT, '0.0.0.0', () => {
            console.log(`服务器运行在 http://0.0.0.0:${PORT}`);
            console.log(`环境: ${config.env}`);
        });
    } catch (error) {
        console.error('服务器启动失败:', error);
        process.exit(1);
    }
};

startServer();

module.exports = app;
