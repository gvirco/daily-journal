import { createApp } from './app.js'
import { defaultDatabasePath, initializeDatabase } from './db.js'

const port = Number(process.env.PORT ?? 3001)
const databasePath = process.env.DATABASE_PATH ?? defaultDatabasePath

const database = initializeDatabase(databasePath)
const app = createApp(database)

const server = app.listen(port, () => {
  console.log(`Daily Journal API listening on http://localhost:${port}`)
})

function shutdown(): void {
  server.close(() => {
    database.close()
  })
}

process.once('SIGINT', shutdown)
process.once('SIGTERM', shutdown)
