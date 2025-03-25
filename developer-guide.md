# Developer Guidelines

## NEXT.js (app router)

Nextjs is a full-stack web application framework built on top of React that utilizes server-side rendering (SSR).

Please read the following texts:

(1) https://nextjs.org/learn/react-foundations/what-is-react-and-nextjs (currently, 10 chapters)

(2) https://nextjs.org/learn/dashboard-app/getting-started (currently, 16 chapters)

Documentation: https://nextjs.org/docs

Please note:

(1) We're using Auth.js (https://authjs.dev/) for authentication/authorization; as per the docs: "You should not rely on middleware exclusively for authorization. Always ensure that the session is verified as close to your data fetching as possible." Therefore, a suggested guideline is that functions that read from the database always call `auth()` and use the returned user information to condition access (see `app/usersExample/lib/data.ts`).

(2) Nextjs actions, as defined by the `"use server"` directive, expose endpoints for users to call, and so they must also be protected in the same way outlined above. Please note that arguments that are bound server-side to an action will also be exposed to users if the action is used in a client component.

(3) Suggested project structure: For each view, there may be a directory with a `lib` folder, and inside that `lib` folder there may be a `data.ts` file for functions that read from the database, an `actions.ts` file for mutations, a `components` folder for client/helping components, and a `utils` folder for utility functions (see `app/usersExample/*`). There is also an uppermost `lib` directory for common pieces of code (with the same sub-files and sub-directories mentioned above).

## Prisma

Prisma is an ORM; we use it with PostgreSQL.

Documentation: https://www.prisma.io/docs/orm

Please note:

(1) In the original ZEVA app, we experienced some scalability issues; please read the following article on query optimization on how to avoid such issues: https://www.prisma.io/docs/orm/prisma-client/queries/query-optimization-performance. Please note that the `relationLoadStrategy: "join"` configuration has been applied globally in `schema.prisma`.

(2) During early development, we will use `prisma db push` and `prisma db pull` to avoid an excess of migrations that will have to be squashed later; we will, of course, transition to migrations once the schema is more fully built out.

(3) In `package.json`, there are scripts that utilize Prisma commands; in particular, each time a developer locally starts the `next` container, the contents of their `schema.prisma` file will be pushed to the database, and a tailored database client will be generated (`prisma/generated/*`).

(4) In order to seed the zeva2 database with data from the original zeva (zeva1) database, your `next` container, zeva2 db container, and your zeva1 db container all have to be running. Once that is the case, execute `npm run seedFromOldDB` in your `next` container. The seeding implementation is defined in `prisma/seed.ts`; please build this file out as you develop the zeva2 schema.

(5) During development, database queries are logged; please keep an eye on them as you develop to ensure your code is not generating an excessive number of queries, or returning data you don't need.

(6) In production, there may be multiple instances of the `next` service and the `bullmq` service; if that's the case, we will have to manually
set the Prisma connection pool size (probably using an environment variable; also, please see: https://www.prisma.io/docs/orm/prisma-client/setup-and-configuration/databases-connections#recommended-connection-pool-size)

## TypeScript

We're using TypeScript!

Docs: https://www.typescriptlang.org/docs/handbook/intro.html

Please note:

(1) TypeScript will have to be installed outside of your `next` container in order for you to experience, in a TypeScript project, the VS code IntelliSense features (code completion, navigation, errors/warnings, etc.). In the `next` project folder outside of your container, you can execute `npm install` to install TypeScript outside of the container.

## Styling

We're using Tailwind CSS.

You can find the custom colours defined in tailwind.config.ts.

Docs: https://tailwindcss.com/docs/styling-with-utility-classes

## Formatting

We're using Prettier; in the `/next` working directory of your `next` container, execute `npx prettier --write .` to format your source code.

Docs: https://prettier.io/docs/

## Queue System

We're using BullMQ; this requires using Redis as a message broker.

Docs: https://docs.bullmq.io/ and https://redis.io/docs/latest/

You can use a Redis GUI such as Redis Insight (https://redis.io/insight/) to inspect the messages BullMQ generates.

Within our project, the `next` service acts as a producer of jobs, and the `bullmq` service
acts as the consumer that works on the jobs.

## DevOps

Suggested Dockerfile build steps for the `next` service, which assumes a base node image; in development, we're currently using node 22.13.1

(1) Copy over the contents of zeva2/next

(2) Install all dependencies (`npm install`); will need dev dependencies as well.

(3) Execute `npx prisma generate`.

(4) Execute `npm run build`.

(5) Expose port 3000.

(6) Set `npm run start` as the startup command (using, for example, CMD).

Suggested Dockerfile build steps for the `bullmq` service, which assumes a base node image; in development, we're currently using node 22.13.1:

(1) Copy over the contents of zeva2/next

(2) Install all dependencies (`npm install`); will need dev dependencies as well.

(3) Execute `npx prisma generate`.

(4) Set `npm run bullmq` as the startup command (using, for example, CMD).

Deployment notes:

(1) Once the database container is running, we will need to execute, in an equivalent environment
outlined in the build steps above (one with the dependencies installed): `npm run pushSchemaToDB`.
This command creates/updates database tables; this command will be replaced with a command
that applies database migrations once the schema is more fully built out.

(2) Environment variables: please see the `environment` section under the `next` and `bullmq` services of the
`docker-compose` file. Please note that the `DATABASE_URL` and `DATABASE_URL_OLD` connection strings
have the format: `postgresql://{db_username}:{db_password}@{db_hostname_or_ip_address}:{db_port}/{db_name}?schema={db_schema_name}`
In order for the `next` app to connect to the old zeva database, a network policy will probably have to be created;
the `next` app's access to the old database should be read-only.
