require('dotenv').config();

const useSQLite = process.env.USE_SQLITE === 'true' || !process.env.DB_HOST;

module.exports = {
    env: process.env.NODE_ENV || 'development',
    port: process.env.PORT || 3000,
    db: useSQLite ? {
        dialect: 'sqlite',
        storage: process.env.DB_STORAGE || './database.sqlite',
        logging: false,
        pool: {
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 10000
        }
    } : {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 3306,
        database: process.env.DB_NAME || 'asset_management',
        username: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        dialect: 'mysql',
        pool: {
            max: 10,
            min: 0,
            acquire: 30000,
            idle: 10000
        }
    },
    useSQLite,
    jwt: {
        secret: process.env.JWT_SECRET || 'xcgl_asset_management_jwt_secret_key_2024',
        expiresIn: process.env.JWT_EXIRES_IN || '7d'
    },
    backup: {
        path: process.env.BACKUP_PATH || './backups'
    },
    upload: {
        path: process.env.UPLOAD_PATH || './uploads',
        maxSize: 10 * 1024 * 1024
    }
};
