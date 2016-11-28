/* eslint max-len: ["error", { "ignoreStrings": true }]*/
/* routes hér */
const express = require('express');
const pgp = require('pg-promise')();

const router = express.Router();
const env = process.env.DATABASE_URL;
const db = pgp(env || 'postgres://postgres:hallgrimur@localhost/test');


// tekur inn thread id og skilar fjolda paragrapha
function pageNum(id) {
  let str = 'SELECT COUNT(*) FROM ';
  str = str.concat('(SELECT id FROM threads WHERE id = $1 UNION ALL ');
  str = str.concat('SELECT id FROM comments WHERE threadid = $1) AS test');
  return db.one(str, id);
}

// sækir þræði af gerðinni sub. page fyrir blaðsíðu númer.
function getSub(req, res) {
  const x = req.url;
  const re = /[=&]/;
  let sub = x.split(re);
  const page = sub[3];
  sub = sub[1].toUpperCase();
  if (sub === 'TECH' || sub === 'PARTY' || sub === 'SCHEMES' || sub === 'VIDEOGAMES') {
    db.any('SELECT * FROM threads WHERE sub ilike $1 ORDER BY mdate DESC LIMIT $2 offset $3', [sub, 10, (page * 10)]) // select, where sub=sub.
    .then((threads) => {
      let str = 'SELECT COUNT(*) FROM ';
      str = str.concat('(SELECT id FROM threads WHERE sub = $1) AS test');
      db.one(str, sub)
      .then((tNum) => {
        const Pnum = Math.floor((tNum.count - 1) / 10) + 1;
        res.render('index', {
          title: sub,
          threads,
          Pnum,
          page,
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
    res.redirect('/');
  }
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
          pageNum(threadID)
            .then((ParaNum) => {
              const Pnum = Math.floor((ParaNum.count - 1) / 10) + 1;
              res.render('thread', {
                title: thread.title,
                thread,
                comments,
                page,
                Pnum,
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
      pageNum(threadID)
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


function index(req, res) {
  const x = req.url;
  const re = /[=]/;
  let page = x.split(re);
  page = parseInt(page[1], 10);
  db.any('SELECT * FROM threads ORDER BY mdate DESC LIMIT $1 offset $2', [10, (page * 10)])
    .then((thread) => {
      let str = 'SELECT COUNT(*) FROM ';
      str = str.concat('(SELECT id FROM threads ) AS test');
      db.one(str)
        .then((tNum) => {
          const Pnum = Math.floor((tNum.count - 1) / 10) + 1;
          res.render('index', {
            title: 'The Front of the Frón of the Friend of the Foe',
            threads: thread,
            Pnum,
            page,
          });
        })
        .catch((error) => {
          res.render('error', { title: 'page amount', error });
        });
    })
    .catch((error) => {
      res.render('error', { title: 'Cant load threads', error });
    });
}

// function DirectToSub(req, res) {
//   const sub = req.body.sub;
//   let x = '/cat=';
//   x = x.concat(sub);
//   res.redirect(x);
// }

function DirectToIndex(req, res) {
  res.redirect('/page=0');
}

function createThread(req, res) {
  const x = req.url;
  const re = /[&]/;
  let sel = 1;
  let url = x.split(re);
  url = url[1];
  if (url === 'Schemes') {
    sel = 1;
  } else if (url === 'Party') {
    sel = 2;
  } else if (url === 'Tech') {
    sel = 3;
  } else if (url === 'Videogames') {
    sel = 4;
  }
  res.render('newthread', { sel });
}

function nolink(req, res) {
  res.redirect('/');
}

function split(text) {
  let re = /["]/;
  const str = text.split(re);
  const quotes = '( ';
  cont temp = [];
  let counter = 0;
  str.forEach((block) => {
    if (counter % 2 === 1) {
      re = /[\s]/;

      str[counter] = quotes.concat(block[counter]);
    } else {
      str[counter] = temp.concat(block[counter]);
    }
    counter += 1;
  });
}

function searchName(req, res) {
  const name = req.body.search;
  db.any('SELECT * FROM total WHERE name @@ to_tsquery($1) ORDER BY date desc', name)
    .then((results) => {
      res.render('search', {
        searched: name,
        results,
      });
    })
    .catch((error) => {
      res.render('error', { title: 'page amount', error });
    });
}

function searchPar(req, res) {
  const par = req.body.search;
  db.any('SELECT * FROM total WHERE paragraph @@ to_tsquery($1) ORDER BY dat desc', par)
    .then((results) => {
      res.render('search', {
        searched: par,
        results,
      });
    })
    .catch((error) => {
      res.render('error', { title: 'page amount', error });
    });
}

function searchTitle(req, res) {
  const title = req.body.search;
  db.any('SELECT * FROM total WHERE title @@ to_tsquery($1) ORDER BY dat desc', title)
    .then((results) => {
      res.render('search', {
        searched: title,
        results,
      });
    })
    .catch((error) => {
      res.render('error', { title: 'page amount', error });
    });
}

function searchAll(req, res) {
  let all = req.body.search;
  all = split(all);
  let str = 'SELECT * FROM total WHERE name @@ to to_tsquery($1) or ';
  str = str.concat('title @@ to to_tsquery($1) or paragraph @@ to to_tsquery($1) ');
  str = str.concat('ORDER BY date desc');
  db.any(str, all)
    .then((results) => {
      res.render('search', {
        searched: all,
        results,
      });
    })
    .catch((error) => {
      res.render('error', { title: 'page amount', error });
    });
}

function search(req, res) {
  const type = req.body.type;
  if (type === 'name') {
    searchName(req, res);
  } else if (type === 'paragraph') {
    searchPar(req, res);
  } else if (type === 'title') {
    searchTitle(req, res);
  } else if (type === 'all') {
    searchAll(req, res);
  } else {
    res.redirect('/');
  }
}

router.get('/page=*', index);
router.get('/', DirectToIndex);
// router.post('/', DirectToSub);
router.post('/newthread(&*)?', newThread);
router.get('/newthread(&*)?', createThread);
router.get('/threadID=*&page=*', getThread);
router.post('/threadID=*&page=*', newComment);
router.get('/cat=*&page=*', getSub);
router.get('/cat=*', getSub);
router.post('/search=*', search);
// VERDUR AD VERA NEDSTUR
router.get('/*', nolink);

module.exports = router;
