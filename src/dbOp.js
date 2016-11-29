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

function getSub(sub, page, ord) {
  // database command 1:
  let str = ('SELECT * FROM threads WHERE sub ilike $1 ORDER BY ');
  str = str.concat(ord).concat(' LIMIT $2 offset $3');
  // database command 2:
  let str2 = 'SELECT COUNT(*) FROM ';
  str2 = str2.concat('(SELECT id FROM threads WHERE sub = $1) AS test');
  return Promise.all([db.any(str, [sub, 10, (page * 10)]), db.one(str2, sub)]);
}

module.exports = {
  pageNum,
  getSub,
};
