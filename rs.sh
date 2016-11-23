#!/bin/bash

git fetch origin
git checkout master
git merge origin/master

git add .
git commit -m "Updated through rs script"
git push origin master


# þessi getur vonandi komið í veg fyrir bæði dl og ul. Ættu einnig sjaldnar
# að koma upp merge vandamál.
