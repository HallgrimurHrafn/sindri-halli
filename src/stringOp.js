/* eslint max-len: ["error", { "ignoreStrings": true }]*/


function spaceremove(text) {
  // fjarlægjum ranga notkun á bil.
  const re = /[\s]/;
  const str = text.split(re);
  let strengur = '';
  str.forEach((t) => {
    if (t !== '') {
      strengur = strengur.concat(t).concat(' ');
    }
  });
  return strengur.slice(0, -1);
}


// slice(-1) skilar sidasta char i streng
// charAt(0) skilar fyrsta char i streng
function exclamationFix(text) {
  // lögum _!_
  let re = /\s!\s/;
  let str = text.split(re);
  str = str.join(' ');
  // breytum 'sa!ad ' => '' en !sad => !sad.
  re = /\w+!\w*/;
  str = str.split(re);
  str = str.join('');
  return spaceremove(str);
}

// kóðum textan fyrir search engine.
function splitter(text) {
  // fjarlægjum ranga notkun á bil.
  let str = spaceremove(text);
  // fjarlægjum rang notuð !
  str = exclamationFix(str);
  let re = /["]/;
  str = str.split(re);
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


function catFix(x, sele) {
  const re = /[&]/;
  const url = x.split(re)[1];
  let sel = sele;
  if (url === 'Schemes') {
    sel = 1;
  } else if (url === 'Party') {
    sel = 2;
  } else if (url === 'Tech') {
    sel = 3;
  } else if (url === 'Videogames') {
    sel = 4;
  }
  return sel;
}


function orderCheck(order) {
  let ord = order.toUpperCase();
  if (ord === 'COMNUM' || ord === 'VIEWS' || ord === 'DATE' || ord === 'MDATE') {
    ord = ord.toLowerCase().concat(' DESC');
  } else if (ord === 'NAME' || ord === 'TITLE') {
    ord = ord.toLowerCase().concat(' ASC');
  } else {
    ord = 'nope';
  }
  return ord;
}

function subPrep(x) {
  let page = x[5];
  const sub = x[1].toUpperCase();
  let url = '/';
  page = parseInt(page, 10);
  if (!isNaN(page)) {
    url = ('&').concat('page=').concat(page);
    if (sub === 'TECH') {
      url = ('/cat=Tech&sort=').concat(x[3]).concat(url);
    } else if (sub === 'PARTY') {
      url = ('/cat=Party&sort=').concat(x[3]).concat(url);
    } else if (sub === 'VIDEOGAMES') {
      url = ('/cat=Videogames&sort=').concat(x[3]).concat(url);
    } else if (sub === 'SCHEMES') {
      url = ('/cat=Schemes&sort=').concat(x[3]).concat(url);
    } else {
      url = '/';
    }
  }
  return url;
}

function threadPrep(x) {
  const threadID = parseInt(x[1], 10);
  const page = parseInt(x[3], 10);
  let str = '/';
  if (!isNaN(threadID)) {
    if (!isNaN(page)) {
      str = x[0];
      str = str.concat('=').concat(threadID).concat('&');
      str = str.concat(x[2]).concat('=').concat(page);
    }
  }
  return str;
}

function indexPrep(x) {
  const page = parseInt(x[3], 10);
  let url = '/';
  if (!isNaN(page)) {
    url = ('/sort=').concat(x[1]).concat('&page=').concat(page);
  }
  return url;
}

function Searching(type, text) {
  let str = ('/');
  const TYPE = type.toUpperCase();
  if (TYPE === 'NAME' || TYPE === 'PARAGRAPH' || TYPE === 'TITLE' || TYPE === 'ALL') {
    str = ('/type=').concat(type).concat('&search=').concat(text).concat('&page=0');
  }
  return str;
}

module.exports = {
  splitter,
  catFix,
  orderCheck,
  subPrep,
  threadPrep,
  indexPrep,
  Searching,
};
