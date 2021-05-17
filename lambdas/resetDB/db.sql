CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS services (
  id serial,
  uuid uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamp NOT NULL DEFAULT now(),
  deleted_at timestamp NOT NULL DEFAULT to_timestamp(0),
  PRIMARY KEY (id),
  UNIQUE (name, deleted_at)
);

CREATE TABLE IF NOT EXISTS users (
  id serial,
  service_id integer NOT NULL,
  uuid uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamp NOT NULL DEFAULT now(),
  deleted_at timestamp NOT NULL DEFAULT to_timestamp(0),
  PRIMARY KEY (id),
  FOREIGN KEY (service_id) REFERENCES services(id),
  UNIQUE (service_id, name, deleted_at)
);

CREATE TABLE IF NOT EXISTS event_types (
  id serial,
  service_id integer NOT NULL,
  uuid uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
	sns_topic_arn text NOT NULL,
  created_at timestamp NOT NULL DEFAULT now(),
  deleted_at timestamp NOT NULL DEFAULT to_timestamp(0),
  PRIMARY KEY (id),
  FOREIGN KEY (service_id) REFERENCES services(id),
  UNIQUE (service_id, name, deleted_at)
);

CREATE TABLE IF NOT EXISTS endpoints (
  id serial,
  user_id integer NOT NULL,
  uuid uuid NOT NULL DEFAULT gen_random_uuid(),
  url text NOT NULL,
  created_at timestamp NOT NULL DEFAULT now(),
  deleted_at timestamp NOT NULL DEFAULT to_timestamp(0),
  PRIMARY KEY (id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS subscriptions (
  id serial,
  event_type_id integer NOT NULL,
  endpoint_id integer NOT NULL,
  uuid uuid NOT NULL DEFAULT gen_random_uuid(),
  subscription_arn text NOT NULL UNIQUE,
  created_at timestamp NOT NULL DEFAULT now(),
  deleted_at timestamp NOT NULL DEFAULT to_timestamp(0),
  PRIMARY KEY (id),
  FOREIGN KEY (endpoint_id) REFERENCES endpoints(id),
  FOREIGN KEY (event_type_id) REFERENCES event_types(id),
  UNIQUE (event_type_id, endpoint_id, deleted_at)
);

CREATE TABLE IF NOT EXISTS events (
  id serial,
  event_type_id integer NOT NULL,
  user_id integer NOT NULL,
  uuid uuid NOT NULL DEFAULT gen_random_uuid(),
  payload jsonb NOT NULL,
  idempotency_key text,
  created_at timestamp NOT NULL DEFAULT now(),
  deleted_at timestamp NOT NULL DEFAULT to_timestamp(0),
  PRIMARY KEY (id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (event_type_id) REFERENCES event_types(id),
  UNIQUE (user_id, idempotency_key)
);

CREATE TABLE IF NOT EXISTS messages (
  id serial,
  event_id integer NOT NULL,
  uuid uuid NOT NULL DEFAULT gen_random_uuid(),
  endpoint text NOT NULL,
  delivered boolean NOT NULL,
  delivered_at timestamp,
  delivery_attempt integer NOT NULL,
  status_code integer NOT NULL,
  created_at timestamp NOT NULL DEFAULT now(),
  deleted_at timestamp NOT NULL DEFAULT to_timestamp(0),
  PRIMARY KEY (id),
  FOREIGN KEY (event_id) REFERENCES events(id)
);