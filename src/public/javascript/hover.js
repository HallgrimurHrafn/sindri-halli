const $ = require('jquery');

$('.newThreadDiv').hover(() => {
  $(this).parent('div').addClass('menuFade');
});
