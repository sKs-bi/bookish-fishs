const QRCode = require('qrcode');
const path = require('path');
const fs = require('fs');
const config = require('../config');

const generateQRCode = async (data) => {
    try {
        const qrCodeDataUrl = await QRCode.toDataURL(data, {
            width: 200,
            margin: 2,
            color: {
                dark: '#000000',
                light: '#ffffff'
            }
        });
        return qrCodeDataUrl;
    } catch (error) {
        throw error;
    }
};

const generateAssetQRCode = async (assetId, assetCode) => {
    const qrData = JSON.stringify({
        type: 'asset',
        id: assetId,
        code: assetCode
    });
    return generateQRCode(qrData);
};

module.exports = { generateQRCode, generateAssetQRCode };
