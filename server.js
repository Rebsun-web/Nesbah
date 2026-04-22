import { createServer } from 'http'
import { parse } from 'url'
import next from 'next'

const port = parseInt(process.env.PORT || '8080', 10)
const hostname = '0.0.0.0'
const dev = process.env.NODE_ENV !== 'production'

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      await handle(req, res, parse(req.url, true))
    } catch (err) {
      console.error('Unhandled request error:', req.url, err)
      res.statusCode = 500
      res.end('internal server error')
    }
  })

  // GCP's GFE keeps backend connections for 600 s.
  // Node.js default keepAliveTimeout is 5 s — after idle, Node.js closes the
  // connection, GFE doesn't know, and the next POST hangs indefinitely.
  // Both values must exceed GCP's 600 s backend timeout; headersTimeout >= keepAliveTimeout.
  server.keepAliveTimeout = 620 * 1000
  server.headersTimeout   = 620 * 1000

  server.listen(port, hostname, () => {
    console.log(`> Ready on http://${hostname}:${port} (keepAlive: 620s)`)
  })
})
