# RestRocket 🚀

RestRocket is a lightning-fast, developer-friendly framework for creating REST APIs in seconds. Built with modern technologies and best practices, it allows you to focus on defining your data model while taking care of the heavy lifting of API creation.

## Features ✨

- **Instant API Generation**: Define your Prisma schema and routes configuration - RestRocket handles the rest
- **Type Safety**: Built with TypeScript for robust type checking and better developer experience
- **Authentication Ready**: Integrated with Better Auth for secure authentication out of the box
- **Multiple Response Formats**: Supports JSON and XML responses
- **Database Integration**: Seamless PostgreSQL integration with Prisma
- **Performance Optimized**: Built on top of Bun and Hono for maximum performance
- **Logging**: Structured logging with Pino

## Tech Stack 💻

- **Runtime**: [Bun](https://bun.sh/)
- **Framework**: [Hono](https://hono.dev/)
- **Database**: PostgreSQL with [Prisma](https://www.prisma.io/)
- **Authentication**: [Better Auth](https://better-auth.dev)
- **Validation**: [Zod](https://zod.dev/)
- **Logging**: [Pino](https://getpino.io/)
- **Code Quality**: [Biome](https://biomejs.dev/)

## Prerequisites 📋

- [Bun](https://bun.sh/) (Latest version)
- [Docker](https://www.docker.com/) and Docker Compose
- [Node.js](https://nodejs.org/) 18+ (for development tools)

## Getting Started 🚀

1. Clone the repository:
   ```bash
   git clone https://github.com/BramSuurdje/RestRocket.git
   cd restrocket
   ```

2. Copy the environment file and configure your variables:
   ```bash
   cp .env.example .env
   ```

3. Install dependencies:
   ```bash
   bun install
   ```

4. Run database migrations:
   ```bash
   bun run migrate:dev
   ```

5. Deploy the migrations to the database:
   ```bash
   bun run migrate:deploy
   ```

6. Start the development server:
   ```bash
   bun run dev
   ```

The API will be available at `http://localhost:3000` by default.

## Environment Variables 🔧

| Variable | Description | Default |
|----------|-------------|---------|
| `POSTGRES_PASSWORD` | PostgreSQL password | changeme |
| `POSTGRES_USER` | PostgreSQL username | restrocket |
| `POSTGRES_DB` | PostgreSQL database name | restrocket |
| `BETTER_AUTH_SECRET` | Authentication secret key | changeme |
| `BETTER_AUTH_URL` | Base URL of your application | http://localhost:3000 |
| `LOG_LEVEL` | Application log level | debug |

## Development Commands 🛠️

- `bun run dev` - Start development server with hot reload
- `bun run build` - Generate Prisma client
- `bun run start` - Start production server
- `bun run format` - Format code using Biome
- `bun run migrate:dev` - Run database migrations for development
- `bun run migrate:prod` - Run database migrations for production

## Creating an API Endpoint 📝

1. Define your model in `prisma/schema.prisma`:
   ```prisma
   model Post {
     id        String   @id @default(uuid())
     title     String
     content   String
     createdAt DateTime @default(now())
     updatedAt DateTime @updatedAt
   }
   ```

2. Add your route configuration in `src/config/routes.ts`:
   ```typescript   
   export const routeConfigurations: RouteConfigInputType = {
      Post: { routeName: "post"}
   } as const;
   ```

3. RestRocket automatically generates:
   - CRUD endpoints
   - Input validation
   - Type-safe responses
   - API documentation

## Authentication with Better Auth 🔐

RestRocket uses [Better Auth](https://better-auth.dev) for authentication. To set up authentication:

1. Create a Better Auth client instance by following the [Better Auth documentation](https://www.better-auth.com/docs/installation#create-client-instance)

2. Point your Better Auth client's baseUrl to your RestRocket API instance:
   ```typescript
   export const authClient = createAuthClient({
      baseURL: "http://localhost:3000" // the base url of your api server
   })
   ```

3. All routes in RestRocket are automatically protected by the authentication middleware. The middleware will verify the session token and make the user data available in your route handlers.

For more details about authentication features and configuration options, please refer to the [Better Auth documentation](https://www.better-auth.com/docs/).

## License 📄

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Author ✍️

Bram Suurd

---

Made with ❤️ by Bram Suurd
