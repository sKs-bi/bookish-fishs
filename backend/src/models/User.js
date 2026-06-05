const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    username: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
        comment: '用户名/工号/学号'
    },
    password: {
        type: DataTypes.STRING(255),
        allowNull: false,
        comment: '密码(bcrypt加密)'
    },
    real_name: {
        type: DataTypes.STRING(50),
        allowNull: false,
        comment: '真实姓名'
    },
    email: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: '邮箱'
    },
    phone: {
        type: DataTypes.STRING(20),
        allowNull: true,
        comment: '联系电话'
    },
    role: {
        type: DataTypes.ENUM('super_admin', 'dept_admin', 'normal_user'),
        allowNull: false,
        defaultValue: 'normal_user',
        comment: '角色'
    },
    department_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: '所属部门ID'
    },
    status: {
        type: DataTypes.ENUM('active', 'inactive', 'frozen'),
        defaultValue: 'active',
        comment: '状态'
    },
    avatar: {
        type: DataTypes.STRING(255),
        allowNull: true,
        comment: '头像URL'
    },
    last_login_time: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: '最后登录时间'
    },
    last_login_ip: {
        type: DataTypes.STRING(50),
        allowNull: true,
        comment: '最后登录IP'
    },
    created_by: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: '创建人ID'
    }
}, {
    tableName: 'users',
    comment: '用户表',
    hooks: {
        beforeCreate: async (user) => {
            if (user.password) {
                user.password = await bcrypt.hash(user.password, 10);
            }
        },
        beforeUpdate: async (user) => {
            if (user.changed('password')) {
                user.password = await bcrypt.hash(user.password, 10);
            }
        }
    }
});

User.prototype.comparePassword = async function(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

User.prototype.toJSON = function() {
    const values = Object.assign({}, this.get());
    delete values.password;
    return values;
};

module.exports = User;
