/* eslint max-len: ["error", { "ignoreStrings": true }]*/
/* routes hér */
const express = require('express');
const pgp = require('pg-promise')();

const router = express.Router();
const env = process.env.DATABASE_URL;
const db = pgp(env || 'postgres://postgres:hallgrimur@localhost/test');


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

// sækir þráðin með kommentum þessarar blaðsíðu
// function getThread(threadID, page) {
function getThread(req, res) {
  const x = req.url;
  const re = /[=]/;
  let threadID = x.split(re);
  threadID = threadID[1];
    // select, faum fyrsta innleggið
  db.one('SELECT * FROM threads WHERE id = $1', threadID)
    .then((thread) => {
      // fáum öll kommentin. innan við page.
      db.any('SELECT * FROM comments WHERE threadID = $1', threadID)
        .then((comments) => {
          res.render('thread', {
            thread,
            comments,
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
  db.any('SELECT * FROM threads')
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


router.get('/', index);
router.post('/newthread', newThread);
router.get('/newthread', createThread);
// router.post('/', index);
router.get('/threadID=*', getThread);
router.post('/threadID=*', newComment);
router.post('/', DirectToSub);
router.get('/cat=*', getSub);

module.exports = router;
