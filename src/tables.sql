CREATE TABLE threads (
  id serial primary key,
  name varchar(64) not null,
  paragraph text,
  date timestamp not null default current_timestamp,
  title varchar(100) not null,
  sub varchar(60) not null,
  comNum integer default 0,
  mDate timestamp not null default current_timestamp
);

CREATE TABLE comments (
  id serial PRIMARY KEY,
  threadID int NOT NULL references threads(id),
  name varchar(64),
  paragraph text,
  date timestamp not null default current_timestamp
);



Last edited: skilar dagsetningu þess sem síðast var breytt.
output.date er dagsetningin
(SELECT date FROM threads where id = 1 UNION ALL
SELECT date FROM comments where threadid = 1)
ORDER BY date desc limit 1;










select distinct threadid FROM
((SELECT threadid, date from comments order by date desc) UNION
(SELECT id, date from threads order by date desc)) as test;



select threads.id, comments.date from threads left outer join comments
on threads.id = comments.threadid
order by comments.date desc;



(SELECT threadid, date from comments order by date desc) UNION ALL
(SELECT id, date from threads order by date desc)



CREATE VIEW RichExec AS
	SELECT name, address, cert#, netWorth
	FROM MovieExec
	WHERE netWorth>10000000

CREATE VIEW index AS
