import { SocketStream } from "@fastify/websocket"

const websocketConnections = [] as SocketStream[]

export const websocketSendData = (data: any) => {
    for (const c of websocketConnections) {
        try {
            c.socket.send(JSON.stringify(data))
        } catch (error) {
            
        }
    }
}

export const websocketConnect = (incomingConnection: SocketStream) => {
    websocketConnections.push(incomingConnection)
}

export const websocketLeave = (closedConnection: SocketStream) => {
    const closedIdx = websocketConnections.findIndex(c => c == closedConnection)
    if(closedIdx < 0) return
    websocketConnections.splice(closedIdx, 1) 
}