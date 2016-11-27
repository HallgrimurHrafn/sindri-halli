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

SELECT COUNT(*) FROM (
  SELECT id from threads where id = 1 UNION
  SELECT threadid from comments where threadid = 1
)
