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

function getSubPrep(x, req, res) {
  let page = x[3];
  const sub = x[1].toUpperCase();
  let url = '&';
  page = parseInt(page, 10);
  if (!isNaN(page)) {
    url = url.concat('page=').concat(page);
    if (sub === 'TECH') {
      url = ('/cat=Tech').concat(url);
      res.redirect(url);
    } else if (sub === 'PARTY') {
      url = ('/cat=Party').concat(url);
      res.redirect(url);
    } else if (sub === 'VIDEOGAMES') {
      url = ('/cat=Videogames').concat(url);
      res.redirect(url);
    } else if (sub === 'SCHEMES') {
      url = ('/cat=Schemes').concat(url);
      res.redirect(url);
    } else {
      res.redirect('/');
    }
  } else {
    res.redirect('/');
  }
}

// sækir þræði af gerðinni sub. page fyrir blaðsíðu númer.
function getSub(req, res) {
  let x = req.url;
  const re = /[=&]/;
  x = x.split(re);
  const page = x[3];
  const sub = x[1];
  if (!isNaN(page)) {
    if (sub === 'Tech' || sub === 'Party' || sub === 'Schemes' || sub === 'Videogames') {
      db.any('SELECT * FROM threads WHERE sub ilike $1 ORDER BY mdate DESC LIMIT $2 offset $3', [sub, 10, (page * 10)]) // select, where sub=sub.
      .then((threads) => {
        let str = 'SELECT COUNT(*) FROM ';
        str = str.concat('(SELECT id FROM threads WHERE sub = $1) AS test');
        db.one(str, sub)
        .then((tNum) => {
          const Pnum = Math.floor((tNum.count - 1) / 10) + 1;
          const info = ('/cat=').concat(sub).concat('&');
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
          pageNum(threadID)
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

function indexprep(x, req, res) {
  const page = parseInt(x[1], 10);
  if (!isNaN(page)) {
    const url = ('/page=').concat(page);
    res.redirect(url);
  } else {
    res.redirect('/');
  }
}

function index(req, res) {
  let x = req.url;
  const re = /[=]/;
  x = x.split(re);
  const page = x[1];
  if (!isNaN(page)) {
    db.any('SELECT * FROM threads ORDER BY mdate DESC LIMIT $1 offset $2', [10, (page * 10)])
    .then((thread) => {
      let str = 'SELECT COUNT(*) FROM ';
      str = str.concat('(SELECT id FROM threads ) AS test');
      db.one(str)
      .then((tNum) => {
        const Pnum = Math.floor((tNum.count - 1) / 10) + 1;
        res.render('index', {
          title: 'Front',
          threads: thread,
          Pnum,
          page,
          info: '/',
        });
      })
      .catch((error) => {
        res.render('error', { title: 'page amount', error });
      });
    })
    .catch((error) => {
      res.render('error', { title: 'Cant load threads', error });
    });
  } else {
    indexprep(x, req, res);
  }
}

function DirectToSub(req, res) {
  let sub = req.url;
  sub = sub.concat('&page=0');
  res.redirect(sub);
}

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


function splitter(text) {
  let re = /["]/;
  let str = text.split(re);
  const quotes = '( ';
  let parts;
  let counter = 0;
  re = /[\s]/;
  str.forEach(() => {
    if (counter % 2 === 1) {
      parts = str[counter].split(re);
      parts = parts.join(' & ');
      str[counter] = quotes.concat(parts).concat(' )');
    } else {
      parts = str[counter].split(re);
      str[counter] = parts.join(' | ');
    }
    counter += 1;
  });
  str = str.join(' ');
  return str;
}

function searchName(name, req, res, page) {
  const name1 = decodeURIComponent(name);
  const name2 = splitter(name1);
  const count = 'SELECT COUNT(*) FROM ( ';
  let str = 'SELECT * FROM total WHERE name @@ to_tsquery($1) ORDER BY date desc';
  const str2 = str.concat(' LIMIT $2 offset $3');
  db.any(str2, [name2, 10, page * 10])
    .then((results) => {
      let t = 'Search: ';
      t = t.concat(name1);
      str = count.concat(str).concat(') AS blah');
      db.one(str, name2)
        .then((p) => {
          const Pnum = Math.floor((p.count - 1) / 10) + 1;
          const info = ('type=name&search=').concat(name).concat('&');
          res.render('search', {
            title: t,
            searched: name1,
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

function searchPar(par, req, res, page) {
  const par1 = decodeURIComponent(par);
  const par2 = splitter(par1);
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
  const title2 = splitter(title1);
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
  const all2 = splitter(all1);
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

router.get('/page=*', index);
router.post('/newthread(&*)?', newThread);
router.get('/newthread(&*)?', createThread);
router.get('/threadID=*&page=*', getThread);
router.post('/threadID=*&page=*', newComment);
router.get('/threadID=*', DirectToPage0);
router.get('/cat=*&page=*', getSub);
router.get('/cat=*', DirectToSub);
router.post('/search=*', search);
router.get('/type=*&search=*&page=*', searchprep);
// VERDUR AD VERA NEDSTUR
router.get('/*', DirectToIndex);

module.exports = router;
