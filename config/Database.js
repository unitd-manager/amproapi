var mysql = require('mysql');
var db = mysql.createConnection({
    host: 'localhost',
    user: 'foodecom',
    password: '4b29e35a430fb8',
    database: 'foodecom'
});
db.connect(); 
module.exports = db;