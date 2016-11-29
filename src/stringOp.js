
function splitter(text) {
  let re = /["]/;
  let str = text.split(re);
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
  let url = x.split(re);
  url = url[1];
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
  let ord = order;
  ord = ord.toUpperCase();
  if (ord === 'MDATE') {
    ord = 'mdate DESC';
  } else if (ord === 'COMNUM') {
    ord = 'comnum DESC';
  } else if (ord === 'VIEWS') {
    ord = 'views DESC';
  } else if (ord === 'NAME') {
    ord = 'name ASC';
  } else if (ord === 'TITLE') {
    ord = 'title ASC';
  } else if (ord === 'DATE') {
    ord = 'date DESC';
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

module.exports = {
  splitter,
  catFix,
  orderCheck,
  subPrep,
  threadPrep,
  indexPrep,
};
