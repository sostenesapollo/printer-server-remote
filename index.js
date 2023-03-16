// Remote server to receive in realtime messages from api and send to connected printers

const activePrintersBySocket = new Map()
const activePrintersByCompanyBase = new Map()
const activePrintersByCompany = new Map()

// Realtime socket connection
const server = require('http').createServer();
const io = require('socket.io')(server);
io.on('connection', async function(socket){
    console.log(`Socket ${socket.id} connected`);

    socket.emit('ask_for_register', {})

    socket.on('register_printer', data => { 
      console.log(`Registering printer for ${socket.id} `, data);
      activePrintersBySocket.set(socket.id, {...data, socket})
      activePrintersByCompanyBase.set(data?.company_base_id, [...(activePrintersByCompanyBase.get(data?.company_base_id) || []), socket.id])
      activePrintersByCompany.set(data?.company_id, [...(activePrintersByCompany.get(data?.company_id) || []), socket.id])
    });

    socket.on('disconnect', (disconnected) => { 
      console.log(`Socket ${socket.id} disconnected`);
      const _socket = activePrintersBySocket.get(socket.id)
      activePrintersBySocket.set(socket.id, null)
      activePrintersByCompanyBase.set(_socket.company_base_id, [])
      activePrintersByCompany.set(_socket.company_id, [])
    });

    socket.on('error', (error) => { 
      console.log(`Socket ${socket.id} error ${error}`);
    });

});

const port_socket_id = process.env.PORT_SOCKET_ID || 3007

server.listen(port_socket_id ,'0.0.0.0', ()=> {
    console.log('Waiting for connection at port socket io:', port_socket_id)
});

// Server
const fastify = require('fastify')({ logger: true })

fastify.get('/', async (request, reply) => "up")

fastify.get('/active', async (request, reply) => {
  return {
    activePrintersBySocket: Array.from(activePrintersBySocket),
    activePrintersByCompanyBase: Array.from(activePrintersByCompanyBase),
    activePrintersByCompany: Array.from(activePrintersByCompany) 
  }
})

fastify.post('/print', async (request, reply) => {
  request.log.info('some info')
  const content = request.body.content
  const company_base_id = request.body.company_base_id

  const socketId = activePrintersByCompanyBase.get(company_base_id)
  console.log('Socket', socketId);

  if(!socketId) 
    return {error: "Socket not found for company base "+company_base_id}

  if(!activePrintersByCompanyBase.get(company_base_id)) 
    return {error: "No socket connected."}
  
  io.to(socketId).emit('print', content)

  return { result: "Printing content to company_base_id "+company_base_id+" socket "+activePrintersByCompanyBase.get(company_base_id) }
})

const start = async () => {
  try {
    console.log('Waiting for connection at port API:', process.env.PORT || 3010)
    await fastify.listen({ port: process.env.PORT || 3010, host: '0.0.0.0' })
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}
start()