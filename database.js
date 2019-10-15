const Pool = require('pg').Pool
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database:'modrec',
    password: 'password',
    port: 5432
});

pool.connect();
module.exports = pool;
