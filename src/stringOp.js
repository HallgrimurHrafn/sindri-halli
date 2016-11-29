
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

module.exports = {
  splitter,
  catFix,
};
