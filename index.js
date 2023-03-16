// Remote server to receive in realtime messages from api and send to connected printers 

const activePrinters = new Map()

// Realtime socket connection
const server = require('http').createServer();
const io = require('socket.io')(server);

io.on('connection', async function(socket){

  socket.on('message', async function(msg){
    console.log(msg);
  });

  socket.on('disconnect', ()=>{ console.log('user disconnected');});
})

server.listen(process.env.SOCKET_IO_PORT || 3006, ()=> {
  console.log(`Waiting for connection socket io at ${process.env.SOCKET_IO_PORT || 3006}`)
});

// Server
const fastify = require('fastify')({ logger: true })

fastify.get('/', async (request, reply) => "up")

fastify.get('/active', async (request, reply) => {
  return Array.from(activePrinters)
})

fastify.post('/print', async (request, reply) => {
  return request
})

const start = async () => {
  try {
    await fastify.listen({ port: process.env.PORT || 3006 })
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}
start()