const pgp = require('pg-promise')();

const env = process.env.DATABASE_URL;
const db = pgp(env);

// sækir þræði af gerðinni sub. page fyrir blaðsíðu númer.
function getSub(sub, page) {
  db.any(); // select, where sub=sub.
  return;
}

// sækir þráðin með kommentum þessarar blaðsíðu
function getThread(threadID, page) {
  if (page === 0) {
    db.one(); // select, faum fyrsta innleggið
  }
  db.any();  // fáum öll kommentin. innan við page.
  return;
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


module.exports = {
  newComment,
  newThread,
  getThread,
  top10,
  getSub };
