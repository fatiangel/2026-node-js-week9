// utils/validUtils.js — 驗證工具函式

const isUndefined = (value) => {
  return value === undefined || value === 'undefined'
};
const isValidString = (value) =>
  typeof value === "string" && value.trim() !== "";
const isInteger = (value) =>
  typeof value === "number" && Number.isInteger(value);
const isValidInteger = (value) =>
  isInteger(value) && value >= 0;
const isValidPassword = (value) =>
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,16}$/.test(value);

module.exports = { isUndefined, isValidString, isInteger, isValidInteger, isValidPassword };
