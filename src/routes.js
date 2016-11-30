/* eslint max-len: ["error", { "ignoreStrings": true }]*/
const express = require('express');
const strOp = require('./stringOp.js');
const dbOp = require('./dbOp.js');

const router = express.Router();

const pgp = require('pg-promise')();

const env = process.env.DATABASE_URL;
const db = pgp(env || 'postgres://postgres:hallgrimur@localhost/sh');

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


// Get faum forsiduna
function getIndex(req, res) {
  const re = /[=&]/;
  const x = req.url.split(re);
  const sort = x[1].toLowerCase();
  const page = x[3];
  const ord = strOp.orderCheck(x[1]);
  const info = ('/sort=').concat(x[1]).concat('&');
  if (!isNaN(page)) {
    if (ord !== 'nope') {
      dbOp.indexx(ord, page)
        .then((results) => {
          const Pnum = Math.floor((results[1].count - 1) / 15) + 1;
          res.render('index', {
            title: 'Front',
            threads: results[0],
            Pnum,
            page,
            info,
            sort,
          });
        })
        .catch((error) => { res.render('error', { title: 'oohh shiet', error }); });
    } else { res.redirect('/'); }
  } else { indexprep(x, req, res); }
}


// sækir þræði af gerðinni sub. page fyrir blaðsíðu númer.
function getSub(req, res) {
  // lesum ur url
  const re = /[=&]/;
  const x = req.url.split(re);
  // veljum mikilvaeg variables ur url
  const page = x[5];
  const sub = x[1];
  const sort = x[3].toLowerCase();
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
          const Pnum = Math.floor((results[1].count - 1) / 15) + 1;
          res.render('index', {
            title: sub,
            threads: results[0],
            Pnum,
            page,
            info,
            sort,
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
    .then((results) => {
      const str = 'UPDATE threads SET comnum = $1, mdate = $2 where id = $3';
      db.none(str, [results[1].count, results[2], threadID])
        .then((none) => {
          // oll innsetning buinn, refreshum sidunni.
          res.redirect(req.url);
        })
        .catch((error) => { res.render('error', { title: 'oohh shiet', error }); });
    })
    // ef upp kom villa.
    .catch((error) => { res.render('error', { title: 'oohh shiet', error }); });
}


// NOTE: hér byrja search aðgerðir.

// search fyrir individual columns.
function search(text, req, res, page, type) {
  // af koðum textan í url
  const text1 = decodeURIComponent(text);
  // kóðum textan svo search vélin virki rétt
  const text2 = strOp.splitter(text1);
  const titill = ('Search: ').concat(text1);
  const info = ('type=').concat(type).concat('&search=').concat(text).concat('&');
  // gerum database aðgerirnar.
  dbOp.searcher(text2, page, type)
    .then((results) => {
      // fáum blaðsíðu fjölda.
      const Pnum = Math.floor((results[1].count - 1) / 10) + 1;
      res.render('search', {
        title: titill,
        searched: text1,
        results: results[0],
        page,
        Pnum,
        info,
      });
    })
    .catch((error) => { res.render('error', { title: 'oohh shiet', error }); });
}


// search aðgerðir sem leita að öllu.
function searchAll(all, req, res, page) {
  // afkóðum url textan.
  const all1 = decodeURIComponent(all);
  // kóðum textann svo leitarvélin skilur hann betur
  const all2 = strOp.splitter(all1);
  const info = ('type=all&search=').concat(all).concat('&');
  const t = ('Search: ').concat(all1);
  // gerum database aðgerðirnar
  dbOp.allsearch(all2, page)
    .then((results) => {
      // fáum blaðsíðufj0lda
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


// les inn gögn frá body og sendir þig á viðeigandi search link.
function searching(req, res) {
  const type = req.body.type;
  const text = req.body.search;
  const str = strOp.Searching(type, text);
  res.redirect(str);
}


// skoðar search beiðnina, ef hún er af réttu formati er beiðnin send áfram
// háð upplýsingum hennar en annars er notanda beint aftur á forsíðu.
function searchprep(req, res) {
  // sækjum breytur úr url
  const url = req.url;
  const re = /[=&]/;
  const str = url.split(re);
  const type = str[1];
  const TYPE = type.toUpperCase();
  const searched = str[3];
  const page = parseInt(str[5], 10);
  // er siðan rétt?
  if (isNaN(page)) {
    // ef ekki, forsíða.
    res.redirect('/');
    // search fyrir einn hlut
  } else if (TYPE === 'NAME' || TYPE === 'PARAGRAPH' || TYPE === 'TITLE') {
    search(searched, req, res, page, TYPE.toLowerCase());
    // search fyrir alla hluti
  } else if (TYPE === 'ALL') {
    searchAll(searched, req, res, page);
  } else {
    // ekkert af þessu? FORSÍÐA
    res.redirect('/');
  }
}

router.get('/sort=*&page=*', getIndex);
router.post('/newthread(&*)?', newThread);
router.get('/newthread(&*)?', createThread);
router.get('/threadID=*&page=*', getThread);
router.post('/threadID=*&page=*', newComment);
router.get('/threadID=*', DirectToPage0);
router.get('/cat=*&sort=*&page=*', getSub);
router.get('/cat=*', DirectToSub);
router.post('/search=*', searching);
router.get('/type=*&search=*&page=*', searchprep);

// VERÐUR AÐ VERA NEÐST
router.get('/*', DirectToIndex);

module.exports = router;
