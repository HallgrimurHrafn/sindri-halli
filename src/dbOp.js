/* eslint max-len: ["error", { "ignoreStrings": true }]*/
const pgp = require('pg-promise')();

const env = process.env.DATABASE_URL;
const db = pgp(env || 'postgres://postgres:hallgrimur@localhost/test');

// dbOp. stytting af database Opperations.

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

function getThread(threadID, page) {
  const str1 = 'SELECT distinct title FROM total WHERE threadid = $1';
  const str2 = 'SELECT * FROM total WHERE threadID = $1 order BY id ASC LIMIT $2 OFFSET $3';
  const str3 = 'UPDATE threads SET views=views+1 WHERE id=$1';
  return Promise.all([
    db.one(str1, threadID),
    db.any(str2, [threadID, 10, (page * 10)]),
    pageNum(threadID),
    db.none(str3, threadID),
  ]);
}

module.exports = {
  pageNum,
  getSub,
  getThread,
};
