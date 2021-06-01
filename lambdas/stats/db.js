const nullTimeValue = '1970-01-01T00:00:00.000Z';
const { Pool } = require('pg');
const user = process.env.DATABASE_USER;
const password = process.env.DATABASE_PASSWORD;
const host = process.env.DATABASE_HOST;
const database = process.env.DATABASE_NAME;
const port = 5432;
const db = new Pool({
  user,
  host,
  database,
  password,
  port,
});

// Simple count queries
const getEndpointCount = async (serviceId) => {
  const query = `SELECT count(*) FROM endpoints
    JOIN users ON endpoints.user_id = users.id
    WHERE users.service_id = $1`;
  const queryParams = [serviceId];
  return await getCount(query, queryParams);
};

const getEventCount = async (serviceId) => {
  const query = `SELECT count(*) as count FROM events e
    JOIN users u ON u.id = e.user_id
    WHERE u.service_id = $1`;
  const queryParams = [serviceId];
  return await getCount(query, queryParams);
};

const getFailedMessageCount = async (serviceId) => {
  const query = `SELECT count(m.uuid)
    FROM messages m
    JOIN events e ON e.id = m.event_id
    JOIN users u ON u.id = e.user_id
    WHERE u.service_id = $1 AND m.delivered = 'false'`;
  const queryParams = [serviceId];
  return await getCount(query, queryParams);
};

const getMessageCount = async (serviceId) => {
  const query = `SELECT count(m.uuid)
    FROM messages m
    JOIN events e ON e.id = m.event_id
    JOIN users u ON u.id = e.user_id
    WHERE u.service_id = $1`;
  const queryParams = [serviceId];
  return await getCount(query, queryParams);
};

const getUserCount = async (serviceId) => {
  const query = `SELECT count(*) FROM users
    WHERE users.service_id = $1`;
  const queryParams = [serviceId];
  return await getCount(query, queryParams);
};

// Compound count queries
const getMessageCountByEndpoint = async (userId) => {
  const query = `SELECT e.url, count(e.url) as all,
    SUM(1) FILTER (WHERE m.delivered = 'false') AS failed
    FROM endpoints e
    JOIN messages m ON m.endpoint = e.url
    WHERE e.user_id = $1 AND e.deleted_at = '${nullTimeValue}'
    GROUP BY e.url`;
  const queryParams = [userId];
  const counts = await getEntities(query, queryParams);
  return counts.reduce((agg, curr) => {
    const { url, all, failed } = curr;
    agg[url] = { all, failed };
    return agg;
  }, {});
};

const getEventsByType = async (serviceId) => {
  const query = `SELECT count(et.name), et.name as type FROM events e
    JOIN event_types et ON et.id = e.event_type_id
    WHERE et.service_id = $1
    GROUP BY et.name`;
  const queryParams = [serviceId];
  const counts = await getEntities(query, queryParams);
  return counts.reduce((agg, curr) => {
    agg[curr.type] = curr.count;
    return agg;
  }, {});
};

const getEventsByUser = async (serviceId) => {
  const query = `SELECT count(u.name), u.name as user FROM events e
    JOIN users u ON u.id = e.user_id
    WHERE u.service_id = $1
    GROUP BY u.name`;
  const queryParams = [serviceId];
  const counts = await getEntities(query, queryParams);
  return counts.reduce((agg, curr) => {
    agg[curr.user] = curr.count;
    return agg;
  }, {});
};

const getEventsWithMessageCount = async (userId) => {
  const query = `SELECT e.uuid, e.event_type_id, et.name as event_type_name, e.user_id, e.created_at, e.payload, e.idempotency_key, count(m.id)
    FROM events e
    LEFT JOIN messages m ON m.event_id = e.id
    JOIN event_types et ON et.id = e.event_type_id
    JOIN users u ON u.id = e.user_id
    WHERE e.user_id = $1
    GROUP BY e.id, et.id
    ORDER BY e.created_at DESC`;
  const queryParams = [userId];
  const counts = await getEntities(query, queryParams);
  return counts;
  // return counts.reduce((agg, curr) => {
  //   agg[curr.user] = curr.count;
  //   return agg;
  // }, {});
};

const getEventTypeCountByEndpoint = async (userId) => {
  const query = `SELECT e.uuid, e.created_at, e.url, array_agg(et.name) AS event_types
    FROM endpoints e
    JOIN subscriptions s ON s.endpoint_id = e.id
    JOIN event_types et ON et.id = s.event_type_id
    WHERE e.user_id = $1 AND e.deleted_at = '${nullTimeValue}'
    GROUP BY e.id`;
  const queryParams = [userId];
  return await getEntities(query, queryParams);
};

const getMessagesByDay = async (serviceId) => {
  const date = new Date(),
    y = date.getFullYear(),
    m = date.getMonth();
  const firstDay = new Date(y, m, 1);
  const query = `SELECT count(m.id) as count, date_trunc('day', m.created_at) as day FROM messages m
    JOIN events e ON e.id = m.event_id
    JOIN users ON e.user_id = users.id
    WHERE users.service_id = $1 AND date_trunc('month', m.created_at) = $2
    GROUP BY date_trunc('day', m.created_at)`;
  const queryParams = [serviceId, firstDay];
  const counts = await getEntities(query, queryParams);
  return counts.reduce((agg, curr) => {
    agg[curr.day] = curr.count;
    return agg;
  }, {});
};

const getMessagesByMonth = async (serviceId) => {
  const date = new Date(),
    y = date.getFullYear();
  const firstDay = new Date(y, 0, 1);
  const query = `SELECT count(m.id) as count, date_trunc('month', m.created_at) as month FROM messages m
    JOIN events e ON e.id = m.event_id
    JOIN users ON e.user_id = users.id
    WHERE users.service_id = $1 AND date_trunc('year', m.created_at) = $2
    GROUP BY date_trunc('month', m.created_at)`;
  const queryParams = [serviceId, firstDay];
  const counts = await getEntities(query, queryParams);
  return counts.reduce((agg, curr) => {
    agg[curr.month] = curr.count;
    return agg;
  }, {});
};

const getMessagesByStatus = async (serviceId) => {
  const query = `SELECT count(m.id) as count, m.status_code FROM messages m
    JOIN events e ON e.id = m.event_id
    JOIN users u ON u.id = e.user_id
    WHERE u.service_id = $1
    GROUP BY m.status_code`;
  const queryParams = [serviceId];
  const counts = await getEntities(query, queryParams);
  return counts.reduce((agg, curr) => {
    agg[curr.status_code] = curr.count;
    return agg;
  }, {});
};

const getMessagesByYear = async (serviceId) => {
  const query = `SELECT count(m.id) as count, date_trunc('year', m.created_at) as year FROM messages m
    JOIN events e ON e.id = m.event_id
    JOIN users ON e.user_id = users.id
    WHERE users.service_id = $1
    GROUP BY date_trunc('year', m.created_at)`;
  const queryParams = [serviceId];
  const counts = await getEntities(query, queryParams);
  return counts.reduce((agg, curr) => {
    agg[curr.year] = curr.count;
    return agg;
  }, {});
};

const getFirstMessageDate = async (serviceId) => {
  const query = `SELECT m.created_at FROM messages m
    JOIN events e ON e.id = m.event_id
    JOIN users u ON u.id = e.user_id
    WHERE u.service_id = $1
    ORDER BY m.created_at
    LIMIT 1`;
  const queryParams = [serviceId];
  const response = await db.query(query, queryParams);
  const messageData = response.rows;
  const { created_at } = messageData[0];
  if (created_at) {
    const firstDate = new Date(created_at);
    return {
      day: firstDate.getDate() - 1,
      month: firstDate.getMonth(),
      year: firstDate.getFullYear(),
    };
  }
};

// Utility functions
const getCount = async (query, queryParams) => {
  const response = await db.query(query, queryParams);
  const count = response.rows[0].count;
  return parseInt(count, 10);
};

const getEntities = async (query, queryParams) => {
  const response = await db.query(query, queryParams);
  let entities = response.rows;

  if (entities[0]) {
    const { count, subscribers, day, month, year } = entities[0];

    if (count) {
      entities = entities.map((entity) => {
        return { ...entity, count: parseInt(entity.count, 10) };
      });
    }

    if (subscribers) {
      entities = entities.map((entity) => {
        return { ...entity, subscribers: parseInt(entity.subscribers, 10) };
      });
    }

    if (day) {
      entities = entities.map((entity) => {
        const day = new Date(entity.day).getDate() - 1;
        return { ...entity, day };
      });
    }

    if (month) {
      entities = entities.map((entity) => {
        const month = new Date(entity.month).getMonth();
        return { ...entity, month };
      });
    }

    if (year) {
      entities = entities.map((entity) => {
        const year = new Date(entity.year).getFullYear();
        return { ...entity, year };
      });
    }
  }

  return entities;
};

const getEventTypes = async (serviceId) => {
  const query = `SELECT et.uuid, et.name, et.created_at, count(s.event_type_id) as subscribers
    FROM event_types et
    LEFT JOIN subscriptions s ON s.event_type_id = et.id
    WHERE et.service_id = $1 AND et.deleted_at = '${nullTimeValue}'
    GROUP BY et.id, s.event_type_id`;
  const queryParams = [serviceId];
  const entities = await getEntities(query, queryParams);
  return entities;
};

const getService = async (serviceUuid) => {
  const query = `SELECT id
    FROM services
    WHERE uuid = $1 AND deleted_at = '${nullTimeValue}'`;
  const queryParams = [serviceUuid];
  const response = await db.query(query, queryParams);
  const service = response.rows[0];
  return service;
};

const getUser = async (serviceId, userUuid) => {
  const query = `SELECT id
    FROM users
    WHERE service_id = $1 AND uuid = $2 AND deleted_at = '${nullTimeValue}'`;
  const queryParams = [serviceId, userUuid];
  const response = await db.query(query, queryParams);
  const user = response.rows[0];
  return user;
};

const uuidToId = async (table, uuid) => {
  const query = `SELECT id FROM ${table} WHERE uuid = $1`;
  const queryParams = [uuid];
  const response = await db.query(query, queryParams);
  const entity = response.rows[0];
  return entity && entity.id;
};

module.exports = {
  getEndpointCount,
  getEventCount,
  getEventsByType,
  getEventsByUser,
  getEventsWithMessageCount,
  getEventTypeCountByEndpoint,
  getEventTypes,
  getFailedMessageCount,
  getFirstMessageDate,
  getMessageCount,
  getMessageCountByEndpoint,
  getMessagesByDay,
  getMessagesByMonth,
  getMessagesByStatus,
  getMessagesByYear,
  getService,
  getUser,
  getUserCount,
  uuidToId,
};
