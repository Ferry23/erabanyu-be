// hash.js
const bcrypt = require('bcrypt');
const password = 'adminera123'; // <-- PASSWORD MENTAH YANG AKAN ANDA GUNAKAN DI POSTMAN
const saltRounds = 10;

console.log(`Password mentah: ${password}`);
console.log('---');

bcrypt.hash(password, saltRounds, (err, hash) => {
    if (err) {
        console.error('Error saat membuat hash:', err);
        return;
    }
    // HASH INI YANG HARUS ANDA SALIN KE DATABASE
    console.log('HASIL HASH YANG PERLU DISALIN:');
    console.log(hash); 
});