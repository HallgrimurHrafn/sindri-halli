const pgp = require('pg-promise')();

const env = process.env.DATABASE_URL;
const db = pgp(env);


function placeholder(bla) {
  return;
}

function newthread(title, name, date, sub, paragraph) {
  return;
}


module.exports = {
  placeholder,
  newthread };
