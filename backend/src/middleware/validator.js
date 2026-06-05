const { validationResult } = require('express-validator');

const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            code: 400,
            message: '参数校验失败',
            errors: errors.array().map(err => ({
                field: err.path,
                message: err.msg
            }))
        });
    }
    next();
};

const errorHandler = (err, req, res, next) => {
    console.error('错误:', err);

    if (err.name === 'SequelizeValidationError') {
        return res.status(400).json({
            code: 400,
            message: '数据验证失败',
            errors: err.errors.map(e => ({
                field: e.path,
                message: e.message
            }))
        });
    }

    if (err.name === 'SequelizeUniqueConstraintError') {
        return res.status(400).json({
            code: 400,
            message: '数据已存在',
            errors: err.errors.map(e => ({
                field: e.path,
                message: `${e.path} 已存在`
            }))
        });
    }

    if (err.name === 'SequelizeForeignKeyConstraintError') {
        return res.status(400).json({
            code: 400,
            message: '外键约束错误，请检查关联数据'
        });
    }

    res.status(err.status || 500).json({
        code: err.status || 500,
        message: err.message || '服务器内部错误'
    });
};

module.exports = { validate, errorHandler };
