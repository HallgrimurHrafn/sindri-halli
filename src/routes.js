/* eslint max-len: ["error", { "ignoreStrings": true }]*/
/* routes hér */
const express = require('express');
const pgp = require('pg-promise')();

const router = express.Router();
const env = process.env.DATABASE_URL;
const db = pgp(env || 'postgres://postgres:hallgrimur@localhost/test');


// sækir þræði af gerðinni sub. page fyrir blaðsíðu númer.
function getSub(req, res) {
  const sub = req.body.sub;
  db.any('SELECT * FROM threads WHERE sub = %1', sub); // select, where sub=sub.
  return;
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
  const x = req.url;
  const re = /[=]/;
  let threadID = x.split(re);
  threadID = threadID[1];

   // insert og svo viljum við fá þráðin
  db.none('INSERT into comments (title, name, paragraph, sub, threadID) values ($1, $2, $3, $4, $5)', [title, name, paragraph, sub, threadID])
    .then((data) => {
    // þurfum að searcha ID.
      getThread(req, res);  // faum þráðinn og bls 0 for now.
    // success;
    })
    .catch((error) => {
      res.render('error', { title: 'oohh shiet', error });
    });
}

// nýtt komment er búið til
function newComment(req, res) {
  const name = req.body.name;
  const paragraph = req.body.paragraph;
  const x = req.url;
  const re = /[=]/;
  let threadID = x.split(re);
  threadID = threadID[1];

  db.none('INSERT ')  // insert, svo viljum við fá þráðin
    .then(() => {
      getThread(req, res);  // faum þráðinn og bls 0 for now.
      // success;
    })
    .catch((error) => {
      res.render('error', { title: 'oohh shiet', error });
    });
}

// sækir 10 nýlegast modified þræðina.
function top10() {
  return;
}

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


function createThread(req, res) {
  res.render('newthread');
}


router.get('/', index);
router.post('/newthread', newThread);
router.get('/newthread', createThread);
// router.post('/', index);
router.get('/threadID=*', getThread);
router.post('/threadID=*', newComment);
router.post('/', getSub);

module.exports = router;
