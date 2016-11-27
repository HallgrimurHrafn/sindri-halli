CREATE TABLE threads (
  id serial primary key,
  name varchar(64) not null,
  paragraph text,
  date timestamp with time zone not null default current_timestamp,
  ldate
  title varchar(100) not null,
  sub varchar(60) not null
);

CREATE TABLE comments (
  id serial PRIMARY KEY,
  threadID int NOT NULL references threads(id),
  name varchar(64),
  paragraph text,
  date timestamp with time zone not null default current_timestamp
);

Last edited: skilar dagsetningu þess sem síðast var breytt.
output.date er dagsetningin
(SELECT date FROM threads where id = $1 UNION ALL
SELECT date FROM comments where threadid = $1)
ORDER BY date desc limit 1;

select distinct threadid FROM
((SELECT threadid, date from comments order by date desc) UNION
(SELECT id, date from threads order by date desc)) as test;



select threads.id, comments.date from threads left outer join comments
on threads.id = comments.threadid
order by comments.date desc;
