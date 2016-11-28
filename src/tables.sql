CREATE TABLE threads (
  id serial primary key,
  name varchar(64) not null,
  paragraph text,
  date timestamp not null default current_timestamp,
  title varchar(100) not null,
  sub varchar(60) not null,
  comNum integer default 0,
  mDate timestamp not null default current_timestamp,
  views integer default 0
);

CREATE TABLE comments (a
  id serial PRIMARY KEY,
  threadID int NOT NULL references threads(id),
  name varchar(64),
  paragraph text,
  date timestamp not null default current_timestamp
);

Create view total as
(Select * from
  ((SELECT comments.paragraph, comments.date, comments.threadid, comments.id, comments.name, threads.title
    FROM comments left outer join threads
    on threads.id = comments.threadid)
    union
    (select paragraph, date, id, 0, name, title
      from threads)) as test)
      order by date desc;



Search:
select * from
(Select to_tsvector('sindri')) as search
left outer join total on search.to_tsvector ilike total.name
;


Last edited: skilar dagsetningu þess sem síðast var breytt.
output.date er dagsetningin
(SELECT date FROM threads where id = 1 UNION ALL
SELECT date FROM comments where threadid = 1)
ORDER BY date desc limit 1;


-- Fyrir search þarf:
paragraph, date, id/threadid, id/id, title, name

comments: paragraph, date, threadid, id, (select title from threads), name
threads: paragraph, date, id, ???, title, name,
kannski setja ??? sem 0



on test2.id = test2.threadid and
test3.?column?=test2.id


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
