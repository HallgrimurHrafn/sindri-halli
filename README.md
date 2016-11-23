
# Verkefni 6

## Lýsing

Útbúa skal Express vef sem tengist apis.is og birtir dagskrá fyrir sjónvarpsstöðvar.

Ekki þarf að notast við Gulp í verkefninu (þó það sé í lagi t.d. til að setja upp BrowserSync) og í grind að lausn er búið að setja upp NPM scriptur:

* `npm start` kveikir á vefþjón sem skilgreindur er í `bin/www`, athugið að fyrst þarf að útfæra `src/app.js`
* `npm run lint -s` keyrir eslint á kóða með gefnum reglum

### Vefþjónusta

Notast skal við vefþjónustu sem er aðgengileg á `http://apis.is/tv/`. Sú þjónusta skilar fylki af mögulegum stöðvum og endapunktum á hverja stöð.

Útfæra skal tvö föll í `schedule.js` sem hjúpa að öllu leiti samskipti við vefþjónustu þ.a. express vefur fái aðeins gögn eða villu til baka. Fyrir samskipti skal nota `axios` pakka.

Þar sem samskipti yfir net taka tíma verður að gera ráð fyrir því og nota _promises_ en `axios` er einfaldan og góðan stuðning við vefþjónustuköll með promises. Föll í `schedule.js` skulu því skila promise sem, þegar það er uppfyllt, skilar gögnum.

### Express vefur

Setja skal upp einfalt útlit á framenda þar sem forsíða listar upp allar mögulegar stöðvar og við að smella á stöð er sótt dagskrá fyrir hana. Fyrir þetta þarf a.m.k. tvö `route` (`/`), eitt fyrir forsíðu og annað sem tekur við stöð með `get`, (t.d. `/:name`, hægt að nota `params` í Express).

Meðhöndla skal:
* Ef engar stöðvar koma upp (tóma fylki frá `channels` falli)
* Ef stöð er ekki til (tóma fylki frá `channel` falli)
* Ef villa kemur upp í vefþjónustu (hægt að framkalla með því að breyta slóð)

## Uppsetning

Setja skal vef upp á vefþjón og skila slóð. Mælt er með að nota Heroku. Til að harðkóða ekki gögn sem gætu breyst í kóða, skal lesa slóð á vefþjónustu úr _environment_.

## Mat

* 20% - JavaScript (á bakenda) snyrtilegt og **engar** lint villur m.v. gefið `.eslintrc`
* 30% - Tenging við vefþjónustu og meðhöndlun á gögnum
* 30% - Express virkni með Pug templates
* 20% - Vefur uppsettur og keyrir á vefþjón, slóð á vefþjónustu sótt úr _environment_ breytu

## Sett fyrir

Verkefni sett fyrir á Uglu 4. nóvember 2016.

## Skil

Senda skal tölvupóst til dæmatímakennara með fyrirsögn "Vefforritun - Verkefni 6" fyrir lok dags 19. nóv. Póstur skal innihalda:

* Zip skjal með lausn sem heitir `notendanafn.zip`
* Slóð á vef

Ekki skal skila `/node_modules` möppu. Verkefni verða opnuð í möppu og þar skrifað:
```
npm install
npm run -s lint
```

og við það ætti að skrifast út að engar lint villur séu í kóða.

```
npm start
```

er síðan keyrt til að kveikja á vefþjón.

## Einkunn
Sett verða fyrir sex verkefni þar sem fimm bestu gilda 6% hvert, samtals 30%.
