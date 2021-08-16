var mysql = require('mysql');
var db = mysql.createConnection({
    host : 'localhost',
    user : 'nodejs',
    password : '1111',
    database : 'opentutorials'
});
db.connect();
module.exports = db;