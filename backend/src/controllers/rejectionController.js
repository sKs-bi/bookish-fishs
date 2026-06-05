const { AssetRejection, User } = require('../models');
const { Op } = require('sequelize');

const getUnreadRejections = async (req, res, next) => {
    try {
        const rejections = await AssetRejection.findAll({
            where: {
                user_id: req.user.id,
                is_read: false
            },
            include: [
                { model: User, as: 'rejector', attributes: ['id', 'real_name', 'username'] }
            ],
            order: [['rejected_at', 'DESC']]
        });

        res.json({
            code: 200,
            message: 'success',
            data: rejections
        });
    } catch (error) {
        next(error);
    }
};

const markRejectionRead = async (req, res, next) => {
    try {
        const { id } = req.params;

        const rejection = await AssetRejection.findOne({
            where: {
                id: id,
                user_id: req.user.id
            }
        });

        if (!rejection) {
            return res.status(404).json({ code: 404, message: '驳回记录不存在' });
        }

        rejection.is_read = true;
        rejection.read_at = new Date();
        await rejection.save();

        res.json({
            code: 200,
            message: '已标记为已读',
            data: rejection
        });
    } catch (error) {
        next(error);
    }
};

const markAllRejectionsRead = async (req, res, next) => {
    try {
        await AssetRejection.update(
            { is_read: true, read_at: new Date() },
            {
                where: {
                    user_id: req.user.id,
                    is_read: false
                }
            }
        );

        res.json({
            code: 200,
            message: '已全部标记为已读',
            data: null
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getUnreadRejections,
    markRejectionRead,
    markAllRejectionsRead
};
