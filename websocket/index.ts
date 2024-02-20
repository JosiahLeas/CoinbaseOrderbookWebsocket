import fastify from "fastify"
import fastifyProxy from "@fastify/http-proxy"
import fastifyWebsocket from "@fastify/websocket"
import { websocketConnect, websocketLeave } from "./websocket-api"

const server = fastify({logger: false})

start()

async function start() {

    await server.register(fastifyWebsocket, {
    
    })
    
    server.get("/ws", { websocket: true }, (incomingConnection, req) => {
        incomingConnection.socket.on("close", () => websocketLeave(incomingConnection))
        websocketConnect(incomingConnection)
    })
    
    await server.register(fastifyProxy, {
        upstream: 'http://localhost:3000',
    })
    
    server.listen({ port: 8080, host: "::" }, (err, address) => {
        if (err) {
            console.error(err)
            process.exit(1)
        }
        console.log(`Server listening at ${address}`)
    })

    import("./coinbase")
}