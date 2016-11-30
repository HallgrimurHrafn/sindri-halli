# Lokaverkefni


## Hallgrímur Hrafn Einarsson hhe6
## Sindri Bergsson sib61


### Uppsetning
#### opna þarf cmd/terminal i moppunni sindri-halli
búum til database til að insert-a í.

#### Createdb -U postgres sh
þá erum við með database-ið sh undir postgres.

pw fyrir postgress er liklega passwordið á tölvunni þinni.
#### pg_restore -U postgres -v -d sh data.dump
Eftir að skrifa password ætti núna að vera búið að loada
inn database-inu sem er i notkun.

Næst þarf að opna dbOp.js undir Src.
Lína numer 5 er:
#### const db = pgp(env || 'postgres://postgres:hallgrimur@localhost/sh');
Hér þarf að breyta "hallgrimur" i passwordið fyrir postgres á þínu
kerfi.

#### Næst má gera npm install og svo npm start.

### Pug
Pug skrárnar vinna saman á 4 stigum með extends:
  1        2        3           4
______________________________________


layout -> error

       -> menu -> newthread

               -> pages     -> index

                            -> thread

                            -> search
______________________________________

#### javascript kerfið.
