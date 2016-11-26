/* routes hér */
const express = require('express');
const pgp = require('pg-promise')();

const router = express.Router();
const env = process.env.DATABASE_URL;
const db = pgp(env);


// sækir þræði af gerðinni sub. page fyrir blaðsíðu númer.
function getSub(sub, page) {
  db.any(); // select, where sub=sub.
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
        .then((comment) => {
          res.render('index', {
            // thread,
            // comments,
            threads: thread,
            comments: comment,
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
function newThread(title, name, date, sub, paragraph) {
  db.none()  // insert og svo viljum við fá þráðin
  .then(() => {
    // þurfum að searcha ID.
    getThread(ID, 0);  // faum þráðinn og bls 0 for now.
    // success;
  })
  .catch((error) => {
    // error;
  });
  return;
}

// nýtt komment er búið til
function newComment(name, date, threadID, paragraph) {
  db.none()  // insert, svo viljum við fá þráðin
  .then(() => {
    getThread(threadID, 0);  // faum þráðinn og bls 0 for now.
    // success;
  })
  .catch((error) => {
    // error;
  });
  return;
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


router.get('/', index);
router.get('/', newThread);
// router.post('/', index);
router.get('/threadID=*', getThread);

module.exports = router;
