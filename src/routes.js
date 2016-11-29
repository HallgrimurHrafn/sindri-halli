/* eslint max-len: ["error", { "ignoreStrings": true }]*/
/* routes hér */
const express = require('express');
const pgp = require('pg-promise')();
const strOp = require('./stringOp.js');
const dbOp = require('./dbOp.js');

const router = express.Router();
const env = process.env.DATABASE_URL;
const db = pgp(env || 'postgres://postgres:hallgrimur@localhost/test');


function getSubPrep(x, req, res) {
  let page = x[5];
  const sub = x[1].toUpperCase();
  let url = '/';
  page = parseInt(page, 10);
  if (!isNaN(page)) {
    url = ('&').concat('page=').concat(page);
    if (sub === 'TECH') {
      url = ('/cat=Tech&sort=').concat(x[3]).concat(url);
    } else if (sub === 'PARTY') {
      url = ('/cat=Party&sort=').concat(x[3]).concat(url);
    } else if (sub === 'VIDEOGAMES') {
      url = ('/cat=Videogames&sort=').concat(x[3]).concat(url);
    } else if (sub === 'SCHEMES') {
      url = ('/cat=Schemes&sort=').concat(x[3]).concat(url);
    } else {
      url = '/';
    }
  }
  res.redirect(url);
}

// sækir þræði af gerðinni sub. page fyrir blaðsíðu númer.
function getSub(req, res) {
  let x = req.url;
  const re = /[=&]/;
  x = x.split(re);
  const page = x[5];
  const sub = x[1];
  const ord = strOp.orderCheck(x[3]);
  // database command 1:
  let str = ('SELECT * FROM threads WHERE sub ilike $1 ORDER BY ');
  str = str.concat(ord).concat(' LIMIT $2 offset $3');
  // database command 2:
  let str2 = 'SELECT COUNT(*) FROM ';
  str2 = str2.concat('(SELECT id FROM threads WHERE sub = $1) AS test');
  // tryggja ad page number se ekki rugl
  if (!isNaN(page)) {
    // thad sem sub verdur ad vera jafnt og.
    if (sub === 'Tech' || sub === 'Party' || sub === 'Schemes' || sub === 'Videogames') {
      db.any(str, [sub, 10, (page * 10)]) // select, where sub=sub.
      .then((threads) => {
        db.one(str2, sub)
        .then((tNum) => {
          const Pnum = Math.floor((tNum.count - 1) / 10) + 1;
          const info = ('/cat=').concat(sub).concat('&sort=').concat(x[3]);
          res.render('index', {
            title: sub,
            threads,
            Pnum,
            page,
            info,
          });
        })
        .catch((error) => {
          res.render('error', { title: 'oohh shiet', error });
        });
      })
      .catch((error) => {
        res.render('error', { title: 'oohh shiet', error });
      });
    } else {
      getSubPrep(x, req, res);
    }
  } else {
    getSubPrep(x, req, res);
  }
}


function DirectToPage0(req, res) {
  let url = req.url;
  url = url.concat('&page=0');
  res.redirect(url);
}


// ef linkurinn er rangur innan marka logum vid.
// annars sendum vid a forsidu.
function getThreadPrep(req, res, x) {
  const threadID = parseInt(x[1], 10);
  const page = parseInt(x[3], 10);
  if (!isNaN(threadID)) {
    if (!isNaN(page)) {
      let str = x[0];
      str = str.concat('=').concat(threadID).concat('&');
      str = str.concat(x[2]).concat('=').concat(page);
      res.redirect(str);
    } else {
      res.redirect('/');
    }
  } else {
    res.redirect('/');
  }
}

// sækir þráðin með kommentum þessarar blaðsíðu
// function getThread(threadID, page) {
function getThread(req, res) {
  let x = req.url;
  const re = /[=&]/;
  x = x.split(re);
  const threadID = x[1];
  let page = x[3];
  if (!isNaN(threadID)) {
    if (!isNaN(page)) {
      // select, faum fyrsta innleggið
      page = parseInt(page, 10);
      let offset = 9;
      let num = 10;
      let add = 0;
      if (page === 0) {
        num = 9;
      }
      if (page === 2) {
        add = 1;
      }
      if (page > 2) {
        offset = 10;
        add = -1;
      }
      db.one('SELECT * FROM threads WHERE id = $1', threadID)
      .then((thread) => {
        // fáum öll kommentin. innan við page.
        db.any('SELECT * FROM comments WHERE threadID = $1 limit $2 offset $3',
          [threadID, num, (page * offset) + add])
        .then((comments) => {
          dbOp.pageNum(threadID)
            .then((ParaNum) => {
              const Pnum = Math.floor((ParaNum.count - 1) / 10) + 1;
              const info = ('threadid=').concat(threadID).concat('&');
              res.render('thread', {
                title: thread.title,
                thread,
                comments,
                page,
                Pnum,
                info,
              });
              // teljum views en okkur er sama hvort thad virki.
              // þ.e. birtum síðuna þó error komi upp.
              db.none('UPDATE threads SET views=views+1 WHERE id=$1', threadID);
            })
            .catch((error) => {
              res.render('error', { title: 'oohh shiet', error });
            });
        })
        .catch((error) => {
          res.render('error', { title: 'oohh shiet', error });
        });
      })
      .catch((error) => {
        res.render('error', { title: 'oohh shiet', error });
      });
    } else {
      getThreadPrep(req, res, x);
    }
  } else {
    getThreadPrep(req, res, x);
  }
}

// nýr þráður er búinn til.
function newThread(req, res) {
  const title = req.body.title;
  const name = req.body.name;
  const paragraph = req.body.paragraph;
  const sub = req.body.sub;

  // insert og svo viljum við fá þráðin
  const str = 'insert into threads (name, paragraph, title, sub) values ($1, $2, $3, $4) returning id';
  db.one(str, [name, paragraph, title, sub])
    .then((data) => {
    // þurfum að searcha ID.
      let x = '/threadid=';
      x = x.concat(data.id);
      res.redirect(x);
    // // success;
    });
    // .catch((error) => {
    //   res.render('error', { title: 'oohh shiet', error });
    // });
}

// nýtt komment er búið til
function newComment(req, res) {
  const name = req.body.name;
  const paragraph = req.body.paragraph;
  const x = req.url;
  const re = /[=&]/;
  let threadID = x.split(re);
  threadID = threadID[1];

  const str = 'insert into comments (name, paragraph, threadID) values ($1, $2, $3)';
  db.none(str, [name, paragraph, threadID])
    .then(() => {
      dbOp.pageNum(threadID)
        .then((comNum) => {
          let str2 = '(SELECT date FROM threads where id = $1 UNION ALL ';
          str2 = str2.concat('SELECT date FROM comments where threadid = $1) ');
          str2 = str2.concat('ORDER BY date desc limit 1');
          db.one(str2, threadID)
            .then((mdate) => {
              db.none('UPDATE threads SET comnum = $1, mdate = $2 where id=$3', [comNum.count - 1, mdate.date, threadID])
                .then(() => {
                  res.redirect(req.url);
                })
                .catch((error) => {
                  res.render('error', { title: 'oohh shiet', error });
                });
            })
            .catch((error) => {
              res.render('error', { title: 'oohh shiet', error });
            });
        })
        .catch((error) => {
          res.render('error', { title: 'oohh shiet', error });
        });
    })
    .catch((error) => {
      res.render('error', { title: 'oohh shiet', error });
    });
}

function indexprep(x, req, res) {
  const page = parseInt(x[3], 10);
  if (!isNaN(page)) {
    const url = ('/sort=').concat(x[1]).concat('&page=').concat(page);
    res.redirect(url);
  } else {
    res.redirect('/');
  }
}

function index(req, res) {
  let x = req.url;
  const re = /[=&]/;
  x = x.split(re);
  const page = x[3];
  const ord = strOp.orderCheck(x[1]);
  if (!isNaN(page)) {
    if (ord !== 'nope') {
      const str1 = ('SELECT * FROM threads ORDER BY ').concat(ord).concat(' LIMIT $1 offset $2');
      const str2 = 'SELECT COUNT(*) FROM (SELECT id FROM threads ) AS test';
      Promise.all([db.any(str1, [10, (page * 10)]), db.one(str2)])
      .then((results) => {
        const Pnum = Math.floor((results[1].count - 1) / 10) + 1;
        res.render('index', {
          title: 'Front',
          threads: results[0],
          Pnum,
          page,
          info: '/sort='.concat(x[1]),
        });
      })
      .catch((error) => {
        res.render('error', { title: 'Cant load threads', error });
      });
    } else { res.redirect('/'); }
  } else { indexprep(x, req, res); }
}

function DirectToSub(req, res) {
  let sub = req.url;
  sub = sub.concat('&sort=mdate').concat('&page=0');
  res.redirect(sub);
}

function DirectToIndex(req, res) {
  res.redirect('/sort=mdate&page=0');
}

function createThread(req, res) {
  const x = req.url;
  let sel = 1;
  sel = strOp.catFix(x, sel);
  res.render('newthread', { sel });
}


function searchName(name, req, res, page) {
  const name1 = decodeURIComponent(name);
  const name2 = strOp.splitter(name1);
  const titill = ('Search: ').concat(name1);
  const str = 'SELECT * FROM total WHERE name @@ to_tsquery($1) ORDER BY date desc';
  const count = ('SELECT COUNT(*) FROM ( ').concat(str).concat(') AS blah');
  const str2 = str.concat(' LIMIT $2 offset $3');
  Promise.all([db.any(str2, [name2, 10, page * 10]), db.one(count, name2)])
    .then((results) => {
      const Pnum = Math.floor((results[1].count - 1) / 10) + 1;
      const info = ('type=name&search=').concat(name).concat('&');
      res.render('search', {
        title: titill,
        searched: name1,
        results: results[0],
        page,
        Pnum,
        info,
      });
    })
    .catch((error) => {
      res.render('error', { title: 'page amount', error });
    });
}

function searchPar(par, req, res, page) {
  const par1 = decodeURIComponent(par);
  const par2 = strOp.splitter(par1);
  const count = 'SELECT COUNT(*) FROM ( ';
  let str = 'SELECT * FROM total WHERE paragraph @@ to_tsquery($1) ORDER BY date desc';
  const str2 = str.concat(' LIMIT $2 offset $3');
  db.any(str2, [par2, 10, 10 * page])
    .then((results) => {
      let t = 'Search: ';
      t = t.concat(par1);
      str = count.concat(str).concat(') AS blah');
      db.one(str, par2)
        .then((p) => {
          const Pnum = Math.floor((p.count - 1) / 10) + 1;
          const info = ('type=paragraph&search=').concat(par).concat('&');
          res.render('search', {
            title: t,
            searched: par1,
            results,
            page,
            Pnum,
            info,
          });
        })
        .catch((error) => {
          res.render('error', { title: 'page amount', error });
        });
    })
    .catch((error) => {
      res.render('error', { title: 'page amount', error });
    });
}

function searchTitle(title, req, res, page) {
  const title1 = decodeURIComponent(title);
  const title2 = strOp.splitter(title1);
  const count = 'SELECT COUNT(*) FROM ( ';
  let str = 'SELECT * FROM total WHERE title @@ to_tsquery($1) ORDER BY date desc';
  const str2 = str.concat(' LIMIT $2 offset $3');
  db.any(str2, [title2, 10, 10 * page])
    .then((results) => {
      let t = 'Search: ';
      t = t.concat(title1);
      str = count.concat(str).concat(') AS blah');
      db.one(str, title2)
        .then((p) => {
          const Pnum = Math.floor((p.count - 1) / 10) + 1;
          const info = ('type=title&search=').concat(title).concat('&');
          res.render('search', {
            title: t,
            searched: title1,
            results,
            page,
            Pnum,
            info,
          });
        })
        .catch((error) => {
          res.render('error', { title: 'page amount', error });
        });
    })
    .catch((error) => {
      res.render('error', { title: 'page amount', error });
    });
}

function searchAll(all, req, res, page) {
  const all1 = decodeURIComponent(all);
  const all2 = strOp.splitter(all1);
  const count = 'SELECT COUNT(*) FROM ( ';
  let str = 'SELECT * FROM total WHERE name @@ to_tsquery($1) or ';
  str = str.concat('title @@ to_tsquery($1) or paragraph @@ to_tsquery($1) ');
  const str2 = str.concat('ORDER BY date desc LIMIT $2 offset $3');
  db.any(str2, [all2, 10, 10 * page])
    .then((results) => {
      let t = 'Search: ';
      t = t.concat(all1);
      str = count.concat(str).concat(') AS blah');
      db.one(str, all2)
        .then((p) => {
          const Pnum = Math.floor((p.count - 1) / 10) + 1;
          const info = ('type=all&search=').concat(all).concat('&');
          res.render('search', {
            title: t,
            searched: all1,
            results,
            page,
            Pnum,
            info,
          });
        })
        .catch((error) => {
          res.render('error', { title: 'page amount', error });
        });
    })
    .catch((error) => {
      res.render('error', { title: 'page amount', error });
    });
}

function search(req, res) {
  let type = req.body.type;
  const text = req.body.search;
  let str = '/type=';
  str = str.concat(type).concat('&search=').concat(text).concat('&page=0');
  type = type.toUpperCase();
  if (type === 'NAME' || type === 'PARAGRAPH' || type === 'TITLE' || type === 'ALL') {
    res.redirect(str);
  } else {
    res.redirect('/');
  }
}

function searchprep(req, res) {
  const url = req.url;
  const re = /[=&]/;
  const str = url.split(re);
  const type = str[1];
  const TYPE = type.toUpperCase();
  const searched = str[3];
  let page = str[5];
  page = parseInt(page, 10);
  if (isNaN(page)) {
    res.redirect('/');
  } else if (TYPE === 'NAME') {
    searchName(searched, req, res, page);
  } else if (TYPE === 'PARAGRAPH') {
    searchPar(searched, req, res, page);
  } else if (TYPE === 'TITLE') {
    searchTitle(searched, req, res, page);
  } else if (TYPE === 'ALL') {
    searchAll(searched, req, res, page);
  } else {
    res.redirect('/');
  }
}

router.get('/sort=*&page=*', index);
router.post('/newthread(&*)?', newThread);
router.get('/newthread(&*)?', createThread);
router.get('/threadID=*&page=*', getThread);
router.post('/threadID=*&page=*', newComment);
router.get('/threadID=*', DirectToPage0);
router.get('/cat=*&sort=*&page=*', getSub);
router.get('/cat=*', DirectToSub);
router.post('/search=*', search);
router.get('/type=*&search=*&page=*', searchprep);
// VERDUR AD VERA NEDSTUR
router.get('/*', DirectToIndex);

module.exports = router;
