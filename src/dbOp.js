const pgp = require('pg-promise')();

const env = process.env.DATABASE_URL;
const db = pgp(env || 'postgres://postgres:hallgrimur@localhost/test');

// tekur inn thread id og skilar fjolda paragrapha
function pageNum(id) {
  let str = 'SELECT COUNT(*) FROM ';
  str = str.concat('(SELECT id FROM threads WHERE id = $1 UNION ALL ');
  str = str.concat('SELECT id FROM comments WHERE threadid = $1) AS test');
  return db.one(str, id);
}

module.exports = {
  pageNum,
};
