import { ApolloServerPluginLandingPageGraphQLPlayground } from "apollo-server-core";
import { ApolloServer } from "apollo-server-express";
import connectRedis from "connect-redis";
import cors from "cors";
import express from "express";
import session from "express-session";
import Redis from "ioredis";
import { buildSchema } from "type-graphql";
import { createConnection } from "typeorm";
import { COOKIE_NAME, __prod__ } from "./constants";
import { Post } from "./entities/Post";
import { User } from "./entities/User";
import { HelloResolver } from "./resolvers/hello";
import { PostResolver } from "./resolvers/post";
import { UserResolver } from "./resolvers/user";

const main = async () => {
  const conn = await createConnection({
    type: "postgres",
    database: "cn",
    username: "postgres",
    password: "akshat",
    logging: !__prod__,
    synchronize: true,
    entities: [User, Post],
  });
  await conn.runMigrations();
  const app = express();
  const app1 = express();
  const RedisStore = connectRedis(session);
  const redis = new Redis();

  app.use(
    cors({
      origin: "http://localhost:3000",
      credentials: true,
    })
  );
  app.use(
    session({
      name: COOKIE_NAME,
      store: new RedisStore({
        client: redis,
        disableTouch: true,
      }),
      cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 365 * 10,
        httpOnly: true,
        secure: __prod__,
        sameSite: "lax",
      },
      secret: "nbczcbjakcbkzc",
      saveUninitialized: false,
      resave: false,
    })
  );

  const server = new ApolloServer({
    plugins: [ApolloServerPluginLandingPageGraphQLPlayground()],
    schema: await buildSchema({
      resolvers: [HelloResolver, UserResolver, PostResolver],
      validate: false,
    }),
    context: ({ req, res }) => ({
      req,
      res,
      redis,
    }),
  });
  await server.start();
  server.applyMiddleware({ app, cors: false });
  app.listen(4000, () => {
    console.log("server started at 4000");
  });
  app1.get('/', (res, req)=> {
    req.sendStatus(301).send('page moved permanently').redirect('http://www.localhost:4000/graphql')
  })
  app1.listen(4001, () => {
    console.log("server started on 4001")
  })

};

main().catch((err) => {
  console.log('500 internal server error', err);
});
