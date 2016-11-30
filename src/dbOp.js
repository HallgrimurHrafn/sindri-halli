/* eslint max-len: ["error", { "ignoreStrings": true }]*/
const pgp = require('pg-promise')();

const env = process.env.DATABASE_URL;
const db = pgp(env || 'postgres://postgres:hallgrimur@localhost/sh');

// dbOp. stytting af database Opperations.


// tekur inn thread id og skilar fjolda paragrapha
function pageNum(id) {
  let str = 'SELECT COUNT(*) FROM ';
  str = str.concat('(SELECT id FROM threads WHERE id = $1 UNION ALL ');
  str = str.concat('SELECT id FROM comments WHERE threadid = $1) AS test');
  return db.one(str, id);
}


// tekurin flokkun og bladsidutal. skilar gognum fyrir forsidu had flokkun og
// hvada bladsidu notandinn er á.
function indexx(ord, page) {
  // fyrsta database aðgerðin
  const str1 = ('SELECT * FROM threads ORDER BY ').concat(ord).concat(' LIMIT $1 offset $2');
  // önnur database aðgerðin
  const str2 = 'SELECT COUNT(*) FROM (SELECT id FROM threads ) AS test';
  return Promise.all([db.any(str1, [15, (page * 15)]), db.one(str2)]);
}


// tekur inn sub (category), blaðsíðutal og flokkun. Skilar gögnum fyrir
// category háð blaðsíðutali og flokkun.
function getSub(sub, page, ord) {
  // fyrsta database aðgerðin
  let str = ('SELECT * FROM threads WHERE sub ilike $1 ORDER BY ');
  str = str.concat(ord).concat(' LIMIT $2 offset $3');
  // önnur database aðgerðin
  let str2 = 'SELECT COUNT(*) FROM ';
  str2 = str2.concat('(SELECT id FROM threads WHERE sub = $1) AS test');
  // sækjum og skilum gögnum
  return Promise.all([db.any(str, [sub, 15, (page * 15)]), db.one(str2, sub)]);
}


// sækir gögn fyrir þráð háð blaðsíðu.
function getThread(threadID, page) {
  // fyrsta database aðgerðin
  const str1 = 'SELECT distinct title FROM total WHERE threadid = $1';
  // önnur database aðgerðin
  const str2 = 'SELECT * FROM total WHERE threadID = $1 order BY id ASC LIMIT $2 OFFSET $3';
  // þriðja (fjórða í raun) database aðgerðin
  const str3 = 'UPDATE threads SET views=views+1 WHERE id=$1';
  // sækjum og skilum gögnum.
  return Promise.all([
    db.one(str1, threadID),
    db.any(str2, [threadID, 10, (page * 10)]),
    pageNum(threadID),
    db.none(str3, threadID),
  ]);
}


// styngur nýjum þráð inn í table-ið thread. "býr til þráð"
function newThread(name, paragraph, title, sub) {
  const str = 'insert into threads (name, paragraph, title, sub) values ($1, $2, $3, $4) returning id';
  return db.one(str, [name, paragraph, title, sub]);
}


// fyrri hluti commenta kerfis.
function newComment1(name, paragraph, threadID) {
  // fyrsta dabase aðgerðin
  const str = 'insert into comments (name, paragraph, threadID) values ($1, $2, $3)';
  // önnur (þriðja í raun) dabase aðgerðin
  let str2 = '(SELECT date FROM threads where id = $1 UNION ALL ';
  str2 = str2.concat('SELECT date FROM comments where threadid = $1) ');
  str2 = str2.concat('ORDER BY date desc limit 1');
  // sækjum og skilum gögnum.
  return Promise.all([
    db.none(str, [name, paragraph, threadID]),
    pageNum(threadID),
    db.one(str2, threadID),
  ]);
}

// síðari hluti kommenta kerfisins.
// þessi er háður niðurstöðum fyrra kerfisins svo hann er sér.
function newComment2(results, threadID) {
  // database aðgerðin
  const str = 'UPDATE threads SET comnum = $1, mdate = $2 where id=$3';
  // sækjum og skilum gögnum. látum gömlu niðurstöðurnar líka fylgja.
  return db.none(str, [results[1].count - 1, results[2].date, threadID]);
}


// sækir gögn fyrir search háð blaðsíðu, hverju var leitað af
// og tegund leitunnar
function searcher(searched, page, type) {
  // búum til aðgerðina og setjum inn týpun.
  let str = ('SELECT * FROM total WHERE ').concat(type);
  str = str.concat(' @@ to_tsquery($1) ORDER BY date desc');
  // editum aðgerðina svo hún skili ákveðið mörgum og sé háð blaðsíðu.
  const str2 = str.concat(' LIMIT $2 offset $3');
  // editum aðgerðina svo við teljum fjölda niðurstaða.
  const count = ('SELECT COUNT(*) FROM ( ').concat(str).concat(') AS blah');
  // sækjum og skilum gögnum.
  return Promise.all([
    db.any(str2, [searched, 10, 10 * page]),
    db.one(count, searched),
  ]);
}


// search aðgerð fyrir search tegundina all.
function allsearch(searched, page) {
  // database aðgerðin
  let str = ('SELECT * FROM total WHERE name @@ to_tsquery($1) or ');
  str = str.concat('title @@ to_tsquery($1) or paragraph @@ to_tsquery($1)');
  str = str.concat('ORDER BY date desc');
  // editum fyrir hámarksfjölda og blaðsíðunúmer
  const str2 = str.concat(' LIMIT $2 offset $3');
  // skilum fjölda niðurstaða
  const count = ('SELECT COUNT(*) FROM ( ').concat(str).concat(') AS blah');
  // sækjum og skilum gögnum.
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
