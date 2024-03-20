import fastify from "fastify";
import { z } from "zod";
import { sql } from "../lib/postgres";
import postgres from "postgres";
import { get } from "http";
import { redis } from "../lib/redis";

const app = fastify();

app.get("/:code", async (request, reply) => {
  const getURLCode = z.object({
    code: z.string().min(3),
  });

  const { code } = getURLCode.parse(request.params);

  const result = await sql/*sql*/ `
    SELECT id, original_url FROM shorter_urls
    WHERE code = ${code}
  `;

  if (result.length === 0) {
    return reply.status(404).send({
      message: "URL not found",
    });
  }

  const url = result[0];

  await redis.zIncrBy("url_views", 1, String(url.id));

  return reply.redirect(301, url.original_url);
});

app.get("/api/urls", async (request, reply) => {
  const result = await sql/*sql*/ `
    SELECT * FROM shorter_urls
    ORDER BY created_at DESC
  `;

  return result;
});

app.post("/api/urls", async (request, reply) => {
  const createUrlSchema = z.object({
    code: z.string().min(3),
    url: z.string().url(),
  });

  const { code, url } = createUrlSchema.parse(request.body);

  try {
    const result = await sql/*sql*/ `
    INSERT INTO shorter_urls (code, original_url)
    VALUES (${code}, ${url})
    RETURNING id
  `;

    const urlCreated = result[0];

    return reply.status(201).send({
      shorterUrlId: urlCreated.id,
    });
  } catch (error) {
    if (error instanceof postgres.PostgresError) {
      if (error.code === "23505") {
        return reply.status(400).send({
          message: "Code already in use",
        });
      }
    }

    console.error(error);

    return reply.status(500).send({
      message: "Internal server error",
    });
  }
});

app.get("/api/metrics", async () => {
  const result = await redis.zRangeByScoreWithScores("url_views", 0, 50);

  const metrics = result
    .sort((a, b) => b.score - a.score)
    .map((item) => ({ shorterUrlId: item.value, views: item.score }));

  return metrics;
});

app
  .listen({
    port: 3333,
  })
  .then(() => console.log("Server is running on port 3333"));
