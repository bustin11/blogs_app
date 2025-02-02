
CREATE TABLE blogs (
  id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  heading VARCHAR(256) NOT NULL DEFAULT '',
  chapter BIGINT NOT NULL DEFAULT -1,
  title TEXT NOT NULL DEFAULT '',
  message TEXT,
  created_on TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_on TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  question JSONB NOT NULL DEFAULT '[]'::JSONB
);

CREATE UNIQUE INDEX IF NOT EXISTS blogs_user_id_id_created_on_key
  ON blogs (id, created_on);

CREATE OR REPLACE FUNCTION updated_on_function()                         
    RETURNS trigger                                                                
    LANGUAGE plpgsql                                                               
    AS $$                                                                   
      BEGIN                                                                     
        NEW.updated_on = NOW(); 
        RETURN NEW;
      END;                                                                      
    $$;

CREATE OR REPLACE TRIGGER updated_on_trigger
    BEFORE INSERT OR UPDATE
    ON blogs
    FOR EACH ROW
    EXECUTE FUNCTION updated_on_function();


CREATE TABLE heading_info (
  -- blog_id UUID NOT NULL REFERENCES blogs (id) ON DELETE CASCADE,
  heading TEXT NOT NULL,
  count BIGINT NOT NULL DEFAULT 0,
  value_hash CHAR(32) GENERATED ALWAYS AS (COALESCE(md5(heading), '')) STORED,
  UNIQUE (value_hash)
);

CREATE INDEX IF NOT EXISTS heading_info_id_heading_key
  ON heading_info (value_hash);

-- heading
CREATE OR REPLACE FUNCTION add_heading_cardinality_function()
  RETURNS TRIGGER 
  LANGUAGE plpgsql
  AS $$
    BEGIN
      INSERT INTO heading_info
      (heading, count)
      VALUES
      (NEW.heading, 1)
      ON CONFLICT (value_hash)
      DO UPDATE SET
      count = heading_info.count + 1;
      RETURN NEW;
    END;
  $$;

CREATE OR REPLACE TRIGGER add_heading_cardinality_trigger
  AFTER INSERT
  ON blogs
  FOR EACH ROW
  EXECUTE FUNCTION add_heading_cardinality_function();


CREATE OR REPLACE FUNCTION delete_heading_cardinality_function()
  RETURNS TRIGGER 
  LANGUAGE plpgsql
  AS $$
    BEGIN
      UPDATE heading_info
      SET
        count = heading_info.count - 1
      WHERE value_hash = md5(OLD.heading);
      RETURN OLD;
    END;
  $$;

CREATE OR REPLACE TRIGGER delete_heading_cardinality_trigger
  AFTER DELETE
  ON blogs
  FOR EACH ROW
  EXECUTE FUNCTION delete_heading_cardinality_function();


CREATE OR REPLACE FUNCTION update_heading_cardinality_function()
  RETURNS TRIGGER 
  LANGUAGE plpgsql
  AS $$
    BEGIN
      UPDATE heading_info
      SET
        count = heading_info.count - 1
      WHERE value_hash = md5(OLD.heading);

      INSERT INTO heading_info
      (heading, count)
      VALUES
      (NEW.heading, 1)
      ON CONFLICT (value_hash)
      DO UPDATE SET
      count = heading_info.count + 1;
      RETURN NEW;
    END;
  $$;

CREATE OR REPLACE TRIGGER update_heading_cardinality_trigger
  AFTER UPDATE
  ON blogs
  FOR EACH ROW
  EXECUTE FUNCTION update_heading_cardinality_function();


------------------------------------------------------

CREATE TABLE users (
  id BIGINT NOT NULL PRIMARY KEY, -- we will manually add users
  password TEXT NOT NULL,
  hashed_password CHAR(32) GENERATED ALWAYS AS (md5(password)) STORED,
  name VARCHAR(256),
  created_on TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE blogs
  ADD COLUMN user_id BIGINT NOT NULL REFERENCES users(id) DEFAULT 1;

ALTER TABLE blogs
  ALTER COLUMN user_id DROP DEFAULT;

-- ALTER TABLE blogs
--   DROP CONSTRAINT blogs_pkey,
--   ADD PRIMARY KEY (user_id, id)

CREATE INDEX CONCURRENTLY IF NOT EXISTS newidx
  ON blogs (user_id, id, created_on);
DROP INDEX blogs_user_id_id_created_on_key;
ALTER INDEX newidx RENAME TO blogs_user_id_id_created_on_key;


------------------------------------------------------

ALTER TABLE users
  ADD COLUMN num_blogs BIGINT NOT NULL DEFAULT 0;

UPDATE users
SET
num_blogs = t.count
FROM
(SELECT user_id, COUNT(*) AS count
  FROM blogs 
  GROUP BY user_id) AS t
WHERE users.id = t.user_id;

CREATE OR REPLACE FUNCTION increase_num_blogs()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  AS $$ 
    BEGIN
      UPDATE users
      SET num_blogs = num_blogs + t.count
      FROM (SELECT user_id, COUNT(*) AS count FROM new_table GROUP BY user_id) AS t
      WHERE id = t.user_id;
      RETURN NULL;
    END;
  $$;
CREATE OR REPLACE TRIGGER increase_num_blogs_trigger
  AFTER INSERT
  ON BLOGS
  REFERENCING NEW TABLE AS new_table
  FOR EACH STATEMENT
  EXECUTE FUNCTION increase_num_blogs();
CREATE OR REPLACE FUNCTION decrease_num_blogs()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  AS $$ 
    BEGIN
      UPDATE users
      SET num_blogs = num_blogs - t.count
      FROM (SELECT user_id, COUNT(*) AS count FROM old_table GROUP BY user_id) AS t
      WHERE id = t.user_id;
      RETURN NULL;
    END;
  $$;
CREATE OR REPLACE TRIGGER decrease_num_blogs_trigger
  AFTER DELETE
  ON BLOGS
  REFERENCING OLD TABLE AS old_table
  FOR EACH STATEMENT
  EXECUTE FUNCTION decrease_num_blogs();



------------------------------------------------------

CREATE OR REPLACE FUNCTION check_password(uname TEXT, pwd TEXT)
  RETURNS BIGINT
  LANGUAGE plpgsql
  AS $$
    DECLARE
      user_id BIGINT;
    BEGIN
      -- Attempt to find the user with the matching username and password
      SELECT id INTO user_id
      FROM users
      WHERE name = $1 AND password = $2
      LIMIT 1;

      -- Return the user ID, or NULL if no match was found
      RETURN user_id;
    END;
  $$
  SECURITY DEFINER
  SET search_path = public, pg_temp;

------------------------------------------------------

ALTER TABLE heading_info
  ADD COLUMN user_id BIGINT NOT NULL REFERENCES users(id) DEFAULT 1;

ALTER TABLE heading_info
  ALTER COLUMN user_id DROP DEFAULT;

CREATE OR REPLACE FUNCTION add_heading_cardinality_function()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  AS $$
  BEGIN
    INSERT INTO heading_info
    (heading, count, user_id)
    VALUES
    (NEW.heading, 1, NEW.user_id)
    ON CONFLICT (value_hash)
    DO UPDATE SET
    count = heading_info.count + 1;
    RETURN NEW;
  END;
  $$;

CREATE OR REPLACE FUNCTION remove_heading_cardinality_function()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  AS $$
  BEGIN
    IF (NEW.count <= 0)
    THEN
    DELETE FROM heading_info WHERE value_hash = NEW.value_hash;
    END IF;
    RETURN NULL;
  END;
  $$;
CREATE OR REPLACE TRIGGER remove_heading_cardinality_trigger
  AFTER UPDATE
  ON heading_info
  FOR EACH ROW
  EXECUTE FUNCTION remove_heading_cardinality_function();

CREATE OR REPLACE FUNCTION update_heading_cardinality_function()
  RETURNS TRIGGER 
  LANGUAGE plpgsql
  AS $$
    BEGIN
      UPDATE heading_info
      SET
        count = heading_info.count - 1
      WHERE value_hash = md5(OLD.heading);

      INSERT INTO heading_info
      (heading, count, user_id)
      VALUES
      (NEW.heading, 1, NEW.user_id)
      ON CONFLICT (value_hash)
      DO UPDATE SET
      count = heading_info.count + 1;
      RETURN NEW;
    END;
  $$;

------------------------------------------------------

CREATE TABLE tags (
  id UUID NOT NULL DEFAULT uuid_generate_v4(),
  user_id BIGINT NOT NULL REFERENCES users(id),
  name VARCHAR(256) NOT NULL CHECK (LENGTH(name) > 0),
  created_on TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, name),
  PRIMARY KEY (id)
);

CREATE TABLE blog_tags (
  tag_id UUID NOT NULL REFERENCES tags(id),
  blog_id UUID NOT NULL REFERENCES blogs(id),
  created_on TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (blog_id, tag_id)
);

-- WITH b as (
-- SELECT 
--   message, created_on, 
--   updated_on, COUNT(*) OVER() as num_blogs,
--   heading, id, title, chapter, question
-- FROM blogs
-- WHERE user_id = 1
-- )
WITH out as (
SELECT 
  b.user_id,
  message, b.created_on, 
  updated_on, COUNT(*) OVER() as num_blogs,
  heading, b.id, title, chapter, question, 
  COALESCE(ARRAY_AGG(bt.tag_id ORDER BY t.created_on) FILTER (WHERE bt.tag_id IS NOT NULL), '{}'::UUID[]) as tag_ids, 
  COALESCE(ARRAY_AGG(t.name ORDER BY t.created_on) FILTER (WHERE t.name IS NOT NULL), '{}'::TEXT[]) as tag_names
FROM 
  blogs b LEFT JOIN blog_tags bt 
  ON b.id = bt.blog_id 
  LEFT JOIN tags t 
  ON t.id = bt.tag_id
  WHERE b.user_id = 1
  GROUP BY b.id
)
SELECT * FROM out WHERE out.user_id = 1;

------------------------------------------------------

ALTER TABLE blogs
  ADD COLUMN active_version BIGINT NOT NULL DEFAULT 0,
  ADD COLUMN num_versions BIGINT NOT NULL DEFAULT 1;

ALTER TABLE blogs
  ALTER COLUMN active_version DROP DEFAULT;

ALTER TABLE blog_tags
  DROP CONSTRAINT IF EXISTS blog_tags_blog_id_fkey,
  DROP CONSTRAINT IF EXISTS blog_tags_pkey,
  ALTER COLUMN blog_id DROP NOT NULL,
  ADD CONSTRAINT blog_tags_blog_id_fkey 
    FOREIGN KEY (blog_id)
    REFERENCES blogs(id)
    ON DELETE SET NULL,
  ADD CONSTRAINT blog_tags_unique_key UNIQUE (blog_id, tag_id);

-- CREATE TABLE blogs_history (
--   blog_id UUID REFERENCES blogs (id) ON DELETE SET NULL,
--   version BIGINT,
--   operation JSONB NOT NULL,
--   timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
--   PRIMARY KEY (blog_id, version)
-- );

CREATE TABLE blogs_history (
  blog_id UUID REFERENCES blogs (id) ON DELETE SET NULL,
  version BIGINT,
  operation JSONB NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (blog_id, version)
);

-- 1
-- CREATE OR REPLACE FUNCTION erase_old_versions_from_blogs_history_and_()
--   RETURNS TRIGGER
--   LANGUAGE plpgsql
--   AS $$
--   BEGIN
--       RAISE NOTICE '%' , NEW.active_version;
--       DELETE FROM blogs_history
--       WHERE blog_id = NEW.id
--       AND version > NEW.active_version;
--       RETURN NEW;
--   END;
--   $$;
-- CREATE OR REPLACE TRIGGER erase_old_versions_from_blogs_history_trigger
--   BEFORE UPDATE OF heading, title, chapter, message, question
--   ON blogs
--   FOR EACH ROW 
--   EXECUTE FUNCTION erase_old_versions_from_blogs_history();

-- -- 2
-- CREATE OR REPLACE FUNCTION increment_num_blog_versions()
--   RETURNS TRIGGER
--   LANGUAGE plpgsql
--   AS $$
--   BEGIN
--     NEW.active_version = OLD.active_version + 1;
--     NEW.num_versions = GREATEST(NEW.num_versions, NEW.active_version + 1);
--     RETURN NEW;
--   END;
--   $$;
  
-- CREATE OR REPLACE TRIGGER increment_num_blog_versions_trigger
--   BEFORE UPDATE OF heading, title, chapter, message, question
--   ON blogs
--   FOR EACH ROW 
--   WHEN (NEW.active_version IS NULL)
--   EXECUTE FUNCTION increment_num_blog_versions();

-- 3
CREATE OR REPLACE FUNCTION add_version_to_blogs_history()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  AS $$
  DECLARE
    operation JSONB;
    num_deleted BIGINT;
  BEGIN

      DELETE FROM blogs_history
      WHERE blog_id = OLD.id
      AND version >= OLD.active_version;

      GET DIAGNOSTICS num_deleted = ROW_COUNT;

      operation := jsonb_agg(OLD);

      INSERT INTO blogs_history
        (blog_id, operation, timestamp, version)
      VALUES 
        (OLD.id, operation, OLD.updated_on, OLD.active_version);

      NEW.active_version := OLD.active_version + 1;
      NEW.num_versions := GREATEST(NEW.num_versions - num_deleted, NEW.active_version + 1);

      RETURN NEW;
  END;
  $$;

CREATE OR REPLACE TRIGGER add_version_to_blogs_history_trigger
  BEFORE UPDATE OF heading, title, chapter, message, question
  ON blogs
  FOR EACH ROW 
  WHEN (NEW.active_version = OLD.active_version)
  EXECUTE FUNCTION add_version_to_blogs_history();

-- CREATE OR REPLACE FUNCTION decrement_num_blog_versions()
--   RETURNS TRIGGER
--   LANGUAGE plpgsql
--   AS $$
--   BEGIN
--     UPDATE blogs 
--     SET 
--     num_versions = num_versions - 1,
--     active_version = LEAST(active_version, num_versions - 2)
--     WHERE id = OLD.blog_id;
--     RETURN OLD;
--   END;
--   $$;
-- CREATE OR REPLACE TRIGGER decrement_num_blog_versions_trigger
--   AFTER DELETE
--   ON blogs_history
--   FOR EACH ROW 
--   EXECUTE FUNCTION decrement_num_blog_versions();

------------------------------------------------------

-- CREATE TABLE common_words (
--   user_id UUID NOT NULL REFERENCES user(id),
--   word VARCHAR(256) NOT NULL,
--   count BIGINT NOT NULL
-- );

-- CREATE OR REPLACE common_words_function()
--   RETURNS TRIGGER
--   LANGUAGE plpgsql
--   AS $$ 
--   BEGIN
--     WITH words AS (
--       SELECT unnest(string_to_array(NEW.message))
--     )
--     INSERT INTO common_words
--     (user_id, word, count)
--     VALUES
--     (NEW.user_id, words, 1)
--     ON CONFLICT (user_id, word)
--     DO UPDATE SET
--     count = common_words.count + 1 
--   END;
--   $$