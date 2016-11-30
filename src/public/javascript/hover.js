const $ = require('jquery');

$('.newThreadDiv').hover(function () {
  $(this).parent('div').addClass('menuFade');
});
