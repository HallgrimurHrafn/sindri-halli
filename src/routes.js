/* eslint max-len: ["error", { "ignoreStrings": true }]*/
/* routes hér */
const express = require('express');
const pgp = require('pg-promise')();
const strOp = require('./stringOp.js');
const dbOp = require('./dbOp.js');

const router = express.Router();
const env = process.env.DATABASE_URL;
const db = pgp(env || 'postgres://postgres:hallgrimur@localhost/test');


// NOTE: Hér koma öll function til að laga linka nema search tengd.


// ef linkurinn er rangur innan marka logum vid.
// annars sendum vid a forsidu videigandi category.
function getSubPrep(x, req, res) {
  const url = strOp.subPrep(x);
  res.redirect(url);
}


// ef linkurinn er rangur innan marka logum vid.
// annars sendum vid a forsidu.
function getThreadPrep(req, res, x) {
  const url = strOp.threadPrep(x);
  res.redirect(url);
}


// setjum baetum vid &page=0 aftan a url.
function DirectToPage0(req, res) {
  const url = req.url.concat('&page=0');
  res.redirect(url);
}


// ef linkurinn er rangur innan marka logum vid.
// annars sendum vid a forsidu.
function indexprep(x, req, res) {
  const url = strOp.indexPrep(x);
  res.redirect(url);
}


// NOTE: Hér byrja get að ferðir.


// sækir þræði af gerðinni sub. page fyrir blaðsíðu númer.
function getSub(req, res) {
  // lesum ur url
  const re = /[=&]/;
  const x = req.url.split(re);
  // veljum mikilvaeg variables ur url
  const page = x[5];
  const sub = x[1];
  const ord = strOp.orderCheck(x[3]);
  const info = ('/cat=').concat(sub).concat('&sort=').concat(x[3]).concat('&');
  // tryggja ad page number se ekki rugl og thad sem sub verdur ad vera jafnt og
  if ((!isNaN(page)) && (sub === 'Tech' || sub === 'Party' || sub === 'Schemes' || sub === 'Videogames')) {
    // order typan verdur ad vera rett.
    if (ord !== 'nope') {
      // SAEKJUM UPPLYSINGAR.
      dbOp.getSub(sub, page, ord)
        .then((results) => {
          // reiknum bladsidu fjolda
          const Pnum = Math.floor((results[1].count - 1) / 10) + 1;
          res.render('index', {
            title: sub,
            threads: results[0],
            Pnum,
            page,
            info,
          });
        })
        .catch((error) => { res.render('error', { title: 'oohh shiet', error }); });
      // ef sort var rangt, forum a forsidu subsins.
    } else { res.redirect(('/cat=').concat(sub)); }
    // ef linkurinn er rangur, reynum ad laga.
  } else { getSubPrep(x, req, res); }
}


// sækir þráðin með kommentum þessarar blaðsíðu
function getThread(req, res) {
  // saekjum breytur ur url.
  const re = /[=&]/;
  const x = req.url.split(re);
  const threadID = x[1];
  const page = x[3];
  const info = ('threadid=').concat(threadID).concat('&');
  // tryggjum ad format sloðarinnar se rett.
  if ((!isNaN(threadID)) && (!isNaN(page))) {
    // Database adgerdir
    dbOp.getThread(threadID, page)
      .then((results) => {
      // fáum öll kommentin. innan við page.
        const Pnum = Math.floor((results[2].count - 1) / 10) + 1;
        res.render('thread', {
          title: results[0].title,
          threadid: threadID,
          comments: results[1],
          page,
          Pnum,
          info,
        });
      })
    .catch((error) => { res.render('error', { title: 'oohh shiet', error }); });
  } else {
    getThreadPrep(req, res, x);
  }
}

// Get faum forsiduna
function index(req, res) {
  const re = /[=&]/;
  const x = req.url.split(re);
  const page = x[3];
  const ord = strOp.orderCheck(x[1]);
  const info = ('/sort=').concat(x[1]).concat('&');
  if (!isNaN(page)) {
    if (ord !== 'nope') {
      dbOp.indexx(ord, page)
        .then((results) => {
          const Pnum = Math.floor((results[1].count - 1) / 10) + 1;
          res.render('index', {
            title: 'Front',
            threads: results[0],
            Pnum,
            page,
            info,
          });
        })
        .catch((error) => { res.render('error', { title: 'oohh shiet', error }); });
    } else { res.redirect('/'); }
  } else { indexprep(x, req, res); }
}


// nýr þráður er búinn til.
function newThread(req, res) {
  const title = req.body.title;
  const name = req.body.name;
  const paragraph = req.body.paragraph.replace(/\n?\r\n/g, '<br />');
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
  const paragraph = req.body.paragraph.replace(/\n?\r\n/g, '<br />');
  const re = /[=&]/;
  const x = req.url.split(re);
  const threadID = x[1];

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
                .catch((error) => { res.render('error', { title: 'oohh shiet', error }); });
            })
            .catch((error) => { res.render('error', { title: 'oohh shiet', error }); });
        })
        .catch((error) => { res.render('error', { title: 'oohh shiet', error }); });
    })
    .catch((error) => { res.render('error', { title: 'oohh shiet', error }); });
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
    .catch((error) => { res.render('error', { title: 'oohh shiet', error }); });
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
        .catch((error) => { res.render('error', { title: 'oohh shiet', error }); });
    })
    .catch((error) => { res.render('error', { title: 'oohh shiet', error }); });
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
        .catch((error) => { res.render('error', { title: 'oohh shiet', error }); });
    })
    .catch((error) => { res.render('error', { title: 'oohh shiet', error }); });
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
        .catch((error) => { res.render('error', { title: 'oohh shiet', error }); });
    })
    .catch((error) => { res.render('error', { title: 'oohh shiet', error }); });
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
