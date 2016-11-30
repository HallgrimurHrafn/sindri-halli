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


function indexx(ord, page) {
  const str1 = ('SELECT * FROM threads ORDER BY ').concat(ord).concat(' LIMIT $1 offset $2');
  const str2 = 'SELECT COUNT(*) FROM (SELECT id FROM threads ) AS test';
  return Promise.all([db.any(str1, [10, (page * 10)]), db.one(str2)]);
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


function newThread(name, paragraph, title, sub) {
  const str = 'insert into threads (name, paragraph, title, sub) values ($1, $2, $3, $4) returning id';
  return db.one(str, [name, paragraph, title, sub]);
}


function newComment1(name, paragraph, threadID) {
  const str = 'insert into comments (name, paragraph, threadID) values ($1, $2, $3)';
  let str2 = '(SELECT date FROM threads where id = $1 UNION ALL ';
  str2 = str2.concat('SELECT date FROM comments where threadid = $1) ');
  str2 = str2.concat('ORDER BY date desc limit 1');
  return Promise.all([
    db.none(str, [name, paragraph, threadID]),
    pageNum(threadID),
    db.one(str2, threadID),
  ]);
}


function newComment2(results, threadID) {
  const str3 = 'UPDATE threads SET comnum = $1, mdate = $2 where id=$3';
  return Promise.all([
    results,
    db.none(str3, [results[1].count - 1, results[2].date, threadID]),
  ]);
}


function searcher(searched, page, type) {
  let str = ('SELECT * FROM total WHERE ').concat(type);
  str = str.concat(' @@ to_tsquery($1) ORDER BY date desc');
  const str2 = str.concat(' LIMIT $2 offset $3');
  const count = ('SELECT COUNT(*) FROM ( ').concat(str).concat(') AS blah');
  return Promise.all([
    db.any(str2, [searched, 10, 10 * page]),
    db.one(count, searched),
  ]);
}

function allsearch(searched, page) {
  let str = ('SELECT * FROM total WHERE name @@ to_tsquery($1) or ');
  str = str.concat('title @@ to_tsquery($1) or paragraph @@ to_tsquery($1)');
  str = str.concat('ORDER BY date desc');
  const str2 = str.concat(' LIMIT $2 offset $3');
  const count = ('SELECT COUNT(*) FROM ( ').concat(str).concat(') AS blah');
  return Promise.all([
    db.any(str2, [searched, 10, 10 * page]),
    db.one(count, searched),
  ]);
}

module.exports = {
  pageNum,
  indexx,
  getSub,
  getThread,
  newThread,
  newComment1,
  newComment2,
  searcher,
  allsearch,
};
