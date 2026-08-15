// utils/appError.js — 統一錯誤格式
const appError = (statusCode, message) => {
    const error = new Error(message);
    error.status = statusCode;
    return error;
};

module.exports = appError;