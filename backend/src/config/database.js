const { Sequelize } = require('sequelize');
const config = require('./index');

const sequelize = new Sequelize(config.db.name, config.db.user, config.db.password, {
    host: config.db.host,
    port: config.db.port,
    dialect: config.db.dialect,
    storage: config.db.storage,
    pool: config.db.pool,
    logging: config.env === 'development' ? console.log : false,
    timezone: config.useSQLite ? '+00:00' : '+08:00',
    define: {
        timestamps: true,
        underscored: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    }
});

module.exports = sequelize;
