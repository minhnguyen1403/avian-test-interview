const saltedMd5 = require('salted-md5');
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function isValidPhone(phone) {
    const phoneRegex = /^\d{9,11}$/; 
    return phoneRegex.test(phone);
}

async function getPassMd5 (password, salt) {
    return saltedMd5(password, salt);
};

function removeAccent(str){
    return str.normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd').replace(/Đ/g, 'D');
}

module.exports = {
    isValidEmail,
    isValidPhone,
    getPassMd5,
    removeAccent,
};