/* eslint max-len: ["error", { "ignoreStrings": true }]*/
/* routes hér */
const express = require('express');
const pgp = require('pg-promise')();

const router = express.Router();
const env = process.env.DATABASE_URL;
const db = pgp(env || 'postgres://postgres:hallgrimur@localhost/test');


// tekur inn thread id og skilar fjolda paragrapha
function pageNum(id) {
  let str = 'SELECT COUNT(*) FROM';
  str = str.concat('(SELECT id FROM threads WHERE id = $1 UNION');
  str = str.concat('SELECT id FROM comments WHERE threadid = $1) AS test');
  return db.one(str, id);
}

// sækir þræði af gerðinni sub. page fyrir blaðsíðu númer.
function getSub(req, res) {
  const x = req.url;
  const re = /[=]/;
  let sub = x.split(re);
  sub = sub[1];
  db.any('SELECT * FROM threads WHERE sub = $1', sub) // select, where sub=sub.
    .then((threads) => {
      res.render('index', {
        title: sub,
        threads });
    })
    .catch((error) => {
      res.render('error', { title: 'oohh shiet', error });
    });
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
      let offset = 10;
      let num = 10;
      if (page === 0) {
        num = 9;
      } else if (page === 1) {
        offset = 9;
      }
      db.one('SELECT * FROM threads WHERE id = $1', threadID)
      .then((thread) => {
        // fáum öll kommentin. innan við page.
        db.any('SELECT * FROM comments WHERE threadID = $1 limit $2 offset $3',
          [threadID, num, page * offset])
        .then((comments) => {
          pageNum(threadID)
            .then((ParaNum) => {
              // const Pnum =
              res.render('thread', {
                thread,
                comments,
                page,
                Pnum: ParaNum,
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
  const re = /[=]/;
  let threadID = x.split(re);
  threadID = threadID[1];

  const str = 'insert into comments (name, paragraph, threadID) values ($1, $2, $3)';
  db.none(str, [name, paragraph, threadID])
    .then(() => {
      res.redirect(req.url);
      // success;
    })
    .catch((error) => {
      res.render('error', { title: 'oohh shiet', error });
    });
}

// sækir 10 nýlegast modified þræðina.
// function top10() {
//   return;
// }

function index(req, res) {
  db.any('SELECT * FROM threads LIMIT $1', 10)
    .then((thread) => {
      res.render('index', {
        title: 'BASIC',
        threads: thread,
      });
    })
    .catch((error) => {
      res.render('error', { title: 'oohh shiet', error });
    });
}

function DirectToSub(req, res) {
  const sub = req.body.sub;
  let x = '/cat=';
  x = x.concat(sub);
  res.redirect(x);
}

function createThread(req, res) {
  res.render('newthread');
}

function nolink(req, res) {
  res.redirect('/');
}

router.get('/', index);
router.post('/', DirectToSub);
router.post('/newthread', newThread);
router.get('/newthread', createThread);
router.get('/threadID=*&page=*', getThread);
router.post('/threadID=*', newComment);
router.get('/cat=*', getSub);

// VERDUR AD VERA NEDSTUR
router.get('/*', nolink);

module.exports = router;
