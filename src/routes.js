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
// annars sendum vid a forsidu.
function indexprep(x, req, res) {
  const url = strOp.indexPrep(x);
  res.redirect(url);
}

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


// NOTE: her koma function til ad directa url einhvert.


// setjum baetum vid &page=0 aftan a url.
function DirectToPage0(req, res) {
  const url = req.url.concat('&page=0');
  res.redirect(url);
}

function DirectToSub(req, res) {
  const sub = req.url.concat('&sort=mdate').concat('&page=0');
  res.redirect(sub);
}

function DirectToIndex(req, res) {
  res.redirect('/sort=mdate&page=0');
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


// NOTE: nýtt dót fyrir database


function createThread(req, res) {
  // saekjum upplysingar ur url
  const x = req.url;
  let sel = 1;
  // sel visar til i hvada category notandi var thegar thradur var
  // buinn til. finnum hvert category-id var.
  sel = strOp.catFix(x, sel);
  // og sendum a newthread.pug
  res.render('newthread', { sel });
}


// nýr þráður er búinn til.
function newThread(req, res) {
  // saekjum upplysingarnar
  const title = req.body.title;
  const name = req.body.name;
  // skiptum ut gildum svo notandi geti gert nyjar linur i paragraph
  const paragraph = req.body.paragraph.replace(/\n?\r\n/g, '<br />');
  const sub = req.body.sub;
  // database operations
  dbOp.newThread(name, paragraph, title, sub)
    .then((data) => {
    // faum id thradsins ur dbop.newthread og förum þangað.
      const x = ('/threadid=').concat(data.id);
      res.redirect(x);
    })
    // ef upp kom villa.
    .catch((error) => { res.render('error', { title: 'oohh shiet', error }); });
}

// nýtt komment er búið til
function newComment(req, res) {
  // saekjum upplysingar ur body
  const name = req.body.name;
  // þyðum nyjar linur ur body yfir i það sem pug skilur.
  const paragraph = req.body.paragraph.replace(/\n?\r\n/g, '<br />');
  // saekjum upplysingar ur slodinni.
  const re = /[=&]/;
  const x = req.url.split(re);
  const threadID = x[1];
  // fyrri hluti database vinnslu
  dbOp.newComment1(name, paragraph, threadID)
    .then((results1) => {
      // tilgangslaus lina svo eslint kvarti ekki yfir notkuninni á =>.
      const results = results1;
      // sidari hluti database vinnslu, krefst fyrri hluta til ad virka.
      return dbOp.newComment2(results, threadID);
    })
    .then((results) => {
      // oll innsetning buinn, refreshum sidunni.
      res.redirect(req.url);
    })
    // ef upp kom villa.
    .catch((error) => { res.render('error', { title: 'oohh shiet', error }); });
}


// NOTE: hér byrja search aðgerðir.


function search(name, req, res, page, type) {
  const name1 = decodeURIComponent(name);
  const name2 = strOp.splitter(name1);
  const titill = ('Search: ').concat(name1);
  dbOp.searcher(name2, page, type)
    .then((results) => {
      const Pnum = Math.floor((results[1].count - 1) / 10) + 1;
      const info = ('type=').concat(type).concat('&search=').concat(name).concat('&');
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

function searchAll(all, req, res, page) {
  const all1 = decodeURIComponent(all);
  const all2 = strOp.splitter(all1);
  const info = ('type=all&search=').concat(all).concat('&');
  const t = ('Search: ').concat(all1);
  dbOp.allsearch(all2, page)
    .then((results) => {
      const Pnum = Math.floor((results[1].count - 1) / 10) + 1;
      res.render('search', {
        title: t,
        searched: all1,
        results: results[0],
        page,
        Pnum,
        info,
      });
    })
    .catch((error) => { res.render('error', { title: 'oohh shiet', error }); });
}

function searching(req, res) {
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
  } else if (TYPE === 'NAME' || TYPE === 'PARAGRAPH' || TYPE === 'TITLE') {
    search(searched, req, res, page, TYPE.toLowerCase());
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
router.post('/search=*', searching);
router.get('/type=*&search=*&page=*', searchprep);
// VERDUR AD VERA NEDSTUR
router.get('/*', DirectToIndex);

module.exports = router;
