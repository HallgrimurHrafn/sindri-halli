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

CREATE TABLE comments (
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


SELECT COUNT(*) from
(SELECT * FROM total WHERE name @@ to_tsquery('Sindri')) as test
