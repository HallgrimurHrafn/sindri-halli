
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

module.exports = {
  splitter,
};
