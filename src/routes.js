/* routes hér */
const express = require('express');

const router = express.Router();
const dbop = require('./db.js')

function index(req, res) {
  res.render('index', {
    title: 'basic',
  });
}


router.get('/', index);
// router.post('/', index);

module.exports = router;
