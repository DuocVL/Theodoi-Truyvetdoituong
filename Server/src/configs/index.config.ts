import { env } from "./env.js"

export const config = {
  app: {
    port: env.PORT,
    nodeEnv: env.NODE_ENV,
  },

  jwt: {
    secret: env.JWT_SECRET,
    refreshSecret: env.JWT_REFRESH_SECRET,
  },

  db: {
    url: env.DATABASE_URL,
  },
}