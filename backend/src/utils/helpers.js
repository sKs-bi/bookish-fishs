const formatDate = (date) => {
    if (!date) return null;
    const d = new Date(date);
    return d.toISOString().split('T')[0];
};

const formatDateTime = (date) => {
    if (!date) return null;
    const d = new Date(date);
    return d.toISOString().replace('T', ' ').substring(0, 19);
};

const calculateDepreciation = (purchasePrice, purchaseDate, depreciationYears) => {
    if (!purchasePrice || !purchaseDate || !depreciationYears || depreciationYears === 0) {
        return purchasePrice || 0;
    }

    const startDate = new Date(purchaseDate);
    const now = new Date();
    const yearsElapsed = (now - startDate) / (365.25 * 24 * 60 * 60 * 1000);

    if (yearsElapsed >= depreciationYears) {
        return 0;
    }

    const annualDepreciation = purchasePrice / depreciationYears;
    const totalDepreciation = annualDepreciation * yearsElapsed;
    return Math.max(0, purchasePrice - totalDepreciation);
};

const isOverdue = (expectedDate) => {
    if (!expectedDate) return false;
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const expected = new Date(expectedDate);
    expected.setHours(0, 0, 0, 0);
    return now > expected;
};

const daysUntil = (targetDate) => {
    if (!targetDate) return null;
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const target = new Date(targetDate);
    target.setHours(0, 0, 0, 0);
    const diff = target - now;
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

module.exports = {
    formatDate,
    formatDateTime,
    calculateDepreciation,
    isOverdue,
    daysUntil
};
