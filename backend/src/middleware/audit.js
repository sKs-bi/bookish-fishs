const { AuditLog, Notification, User } = require('../models');

const logAction = async ({
    user,
    ip,
    module,
    action,
    actionName,
    entityType,
    entityId,
    beforeData,
    afterData,
    result = 'success',
    errorMessage,
    userAgent
}) => {
    try {
        await AuditLog.create({
            user_id: user.id,
            user_name: user.real_name,
            user_code: user.username,
            ip_address: ip,
            module,
            action,
            action_name: actionName,
            entity_type: entityType,
            entity_id: entityId,
            before_data: beforeData,
            after_data: afterData,
            result,
            error_message: errorMessage,
            user_agent: userAgent
        });
    } catch (error) {
        console.error('审计日志记录失败:', error);
    }
};

const sendNotification = async ({
    title,
    content,
    type,
    senderId,
    recipientId,
    recipientRole,
    relatedModule,
    relatedId
}) => {
    try {
        if (recipientRole === 'super_admin') {
            const superAdmins = await User.findAll({ where: { role: 'super_admin', status: 'active' } });
            for (const admin of superAdmins) {
                await Notification.create({
                    title,
                    content,
                    type,
                    sender_id: senderId,
                    recipient_id: admin.id,
                    related_module: relatedModule,
                    related_id: relatedId
                });
            }
        } else if (recipientId) {
            await Notification.create({
                title,
                content,
                type,
                sender_id: senderId,
                recipient_id: recipientId,
                related_module: relatedModule,
                related_id: relatedId
            });
        } else {
            await Notification.create({
                title,
                content,
                type,
                sender_id: senderId,
                recipient_role: recipientRole,
                related_module: relatedModule,
                related_id: relatedId
            });
        }
    } catch (error) {
        console.error('通知发送失败:', error);
    }
};

const sendSensitiveOperationNotification = async (user, operation, description, module = '系统') => {
    await sendNotification({
        title: `【敏感操作告警】${operation}`,
        content: `用户 ${user.real_name}（${user.username}）执行了敏感操作：${description}`,
        type: 'system',
        senderId: user.id,
        recipientRole: 'super_admin',
        relatedModule: module
    });
};

module.exports = {
    logAction,
    sendNotification,
    sendSensitiveOperationNotification
};
