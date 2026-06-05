const { v4: uuidv4 } = require('uuid');

const generateCode = (prefix) => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = uuidv4().substring(0, 8).toUpperCase();
    return `${prefix}${year}${month}${day}${random}`;
};

const generateAssetCode = () => generateCode('ZC');

const generatePurchaseCode = () => generateCode('CG');

const generateRepairCode = () => generateCode('WX');

const generateTransferCode = () => generateCode('DB');

const generateScrapCode = () => generateCode('BF');

const generateCheckCode = () => generateCode('PD');

module.exports = {
    generateCode,
    generateAssetCode,
    generatePurchaseCode,
    generateRepairCode,
    generateTransferCode,
    generateScrapCode,
    generateCheckCode
};
