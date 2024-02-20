"use client"
import { createMutable } from "solid-js/store"
import type { WSCoinbaseData } from "../../../websocket/coinbase"
import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "~/components/ui/table"
import { For, Show } from "solid-js"

const store = createMutable({
    wsData: null as any as WSCoinbaseData
})

export default function OrderbookConnection() {
    const socket = new WebSocket(`${location.origin.replace("http", "ws")}/ws`)
    socket.addEventListener("message", (event) => {
        store.wsData = JSON.parse(event.data)
    })

    return (
        <div class="text-left text-gray-400 max-w-[800px] m-auto">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead class="w-[50px] max-w-[50px]">Price</TableHead>
                        <TableHead class="w-[50px] max-w-[50px]">Quantity</TableHead>
                        <TableHead class="w-[50px] max-w-[50px]">USD</TableHead>
                        <TableHead class="w-[50px] max-w-[50px]">Volume Sum</TableHead>
                        <TableHead class="w-[50px] max-w-[50px] text-right">Time</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    <Show when={store.wsData?.relativeOffers.length}>
                    <For each={Array.from({length: store.wsData.MAX_ITEMS}).map((_, i) => (
                        store.wsData.relativeOffers[i] || {event_time: "", moveVolume: "--", new_quantity: "--", price_level: "--", totalMoveVolume: "--"}
                    )).slice().reverse()}>
                        {(offer, i) => (
                            <TableRow>
                                <TableCell class="p-0 w-[50px] text-red-400 max-w-[50px] text-ellipsis overflow-hidden font-medium font-mono">{offer.price_level}</TableCell>
                                <TableCell class="p-0 w-[50px] max-w-[50px] text-ellipsis overflow-hidden font-mono">{offer.new_quantity}</TableCell>
                                <TableCell class="p-0 w-[50px] max-w-[50px] text-ellipsis overflow-hidden font-mono">{offer.moveVolume}</TableCell>
                                <TableCell class="p-0 w-[50px] max-w-[50px] text-ellipsis overflow-hidden font-mono">{offer.totalMoveVolume}</TableCell>
                                <TableCell class="p-0 w-[50px] max-w-[50px] text-ellipsis overflow-hidden text-right whitespace-nowrap">{offer.event_time}</TableCell>
                            </TableRow>
                        )}
                    </For>
                    </Show>
                </TableBody>
            </Table>
            <Table>
                {/* 
                <TableHeader>
                    <TableRow>
                        <TableHead class="w-[50px] max-w-[50px]">Bid</TableHead>
                        <TableHead class="w-[50px] max-w-[50px]">Quantity</TableHead>
                        <TableHead class="w-[50px] max-w-[50px]">USD</TableHead>
                        <TableHead class="w-[50px] max-w-[50px]">Volume Sum</TableHead>
                        <TableHead class="w-[50px] max-w-[50px] text-right">Time</TableHead>
                    </TableRow>
                </TableHeader> 
                */}
                <TableBody>
                    <Show when={store.wsData?.relativeBids.length}>
                    <For each={Array.from({length: store.wsData.MAX_ITEMS}).map((_, i) => (
                        store.wsData.relativeBids[i] || {event_time: "", moveVolume: "--", new_quantity: "--", price_level: "--", totalMoveVolume: "--"}
                    ))}>
                        {(bid, i) => (
                            <TableRow>
                                <TableCell class="p-0 w-[50px] text-green-400 max-w-[50px] text-ellipsis overflow-hidden font-medium font-mono">{bid.price_level}</TableCell>
                                <TableCell class="p-0 w-[50px] max-w-[50px] text-ellipsis overflow-hidden font-mono">{bid.new_quantity}</TableCell>
                                <TableCell class="p-0 w-[50px] max-w-[50px] text-ellipsis overflow-hidden font-mono">{bid.moveVolume}</TableCell>
                                <TableCell class="p-0 w-[50px] max-w-[50px] text-ellipsis overflow-hidden font-mono">{bid.totalMoveVolume}</TableCell>
                                <TableCell class="p-0 w-[50px] max-w-[50px] text-ellipsis overflow-hidden text-right whitespace-nowrap">{bid.event_time}</TableCell>
                            </TableRow>
                        )}
                    </For>
                    </Show>
                </TableBody>
            </Table>
        </div>
    )
}