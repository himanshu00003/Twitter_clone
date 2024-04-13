var mysqlobj = require("mysql2");
var con = mysqlobj.createConnection({
  host: "localhost",
  user: "root",
  password: "Himanshu2003",
  database: "twitter",
});
con.connect(function (err) {
  if (err) throw err;
});
module.exports = con;
