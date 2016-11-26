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
function getThread(threadID) {
    // select, faum fyrsta innleggið
  db.one('SELECT * FROM thread WHERE id = $1', threadID)
    .then((thread) => {
      // fáum öll kommentin. innan við page.
      db.any('SELECT * FROM thread WHERE threadID = $1', threadID)
        .then ((comments) => {
          res.render('index', {
            thread: thread,
            comments: comments,
          });
          }
        })
    }
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
  res.render('index', {
    title: 'basic',
  });
}


router.get('/', index);
// router.post('/', index);

module.exports = router;
