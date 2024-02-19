import WebSocket from 'ws'
import { sign } from 'jsonwebtoken'
import crypto from 'crypto'
import dotenv from 'dotenv'


type Snapshot = {
    type: "snapshot",
    product_id: `${string}-USD`,
    updates: {
        side: "bid" | "offer",
        /**This is a Date */
        event_time: string,
        /**Current Price Actually Number */
        price_level: string,
        /**Actually Number */
        new_quantity: string
    }[]
}

type Bid = {
    event_time: string,
    /**Current Price Actually Number */
    price_level: string,
    /**Actually Number */
    new_quantity: string
}

type Offer = {
    event_time: string,
    /**Current Price Actually Number */
    price_level: string,
    /**Actually Number */
    new_quantity: string
}

type Update = {
    type: "update",
    product_id: `${string}-USD`,
    updates: {
        side: "bid" | "offer",
        /**This is a Date */
        event_time: string,
        /**Current Price Actually Number */
        price_level: string,
        /**Actually Number */
        new_quantity: string
    }[]
}



const result = dotenv.config();

if (result.error) {
    console.error("Error loading .env file:", result.error);
    process.exit(1); // Exit with failure code
}

const {
    API_KEY,
    CHANNEL_NAMES,
    SIGNING_KEY,
    algorithm,
    WS_API_URL,
    ws,
    arrTopBids,
    arrTopOffers,
    MAX_ITEMS
} = createGlobals()

start()


function createGlobals() {

    const API_KEY = process.env.API_KEY
    console.log(API_KEY)

    const SIGNING_KEY = process.env.SIGNING_KEY

    const algorithm = 'ES256'

    const CHANNEL_NAMES = {
        level2: 'level2',
        user: 'user',
        tickers: 'ticker',
        ticker_batch: 'ticker_batch',
        status: 'status',
        market_trades: 'market_trades',
        candles: 'candles',
    };
    const WS_API_URL = 'wss://advanced-trade-ws.coinbase.com';
    const ws = new WebSocket(WS_API_URL);

    const arrTopBids = [] as Bid[]
    const arrTopOffers = [] as Offer[]

    const MAX_ITEMS = 11

    return {
        WS_API_URL,
        ws,
        arrTopBids,
        arrTopOffers,
        CHANNEL_NAMES,
        algorithm,
        SIGNING_KEY,
        API_KEY,
        MAX_ITEMS
    } as const
}

function timestampAndSign(message, channel, products = []) {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    //@ts-ignore
    const jwt = sign(
        {
            aud: ['public_websocket_api'],
            iss: 'coinbase-cloud',
            nbf: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + 120,
            sub: API_KEY,
        },
        SIGNING_KEY,
        {
            algorithm,
            header: {
                kid: API_KEY,
                nonce: crypto.randomBytes(16).toString('hex'),
            },
        }
    );

    return { ...message, jwt: jwt, timestamp: timestamp };
}

function productsSubscribe(products, channelName, ws) {
    const message = {
        type: 'subscribe',
        channel: channelName,
        product_ids: products,
    };
    const subscribeMsg = timestampAndSign(message, channelName, products);
    ws.send(JSON.stringify(subscribeMsg));
}

function productsUnsubscribe(products, channelName, ws) {
    const message = {
        type: 'unsubscribe',
        channel: channelName,
        product_ids: products,
    };
    const subscribeMsg = timestampAndSign(message, channelName, products);
    ws.send(JSON.stringify(subscribeMsg));
}

function productsOnSnapShot(data: Snapshot) {

    const topBids = [] as Bid[]
    const topOffers = [] as Offer[]

    for (const x of data.updates) {
        if (x.side == 'bid') {
            if (topBids.length < MAX_ITEMS) {
                topBids.push(x)
            }
        }
        else if (x.side == 'offer') {
            if (topOffers.length < MAX_ITEMS) {
                topOffers.push(x)
            }
        }
        else {
            assertCompleteSwitch(x.side)
        }
    }

    arrTopBids.push(...topBids)
    arrTopOffers.push(...topOffers)
}

function productsOnUpdate(data: Update) {

    loop: for (const x of data.updates) {
        if (x.side == 'bid') {

            const newBid = x

            // 1) If I have removed all our bids, add this one
            if (arrTopBids.length == 0) {
                arrTopBids.push(newBid)
            }

            // 2) Ignore bids lower than our lowest
            if (arrTopBids.length >= MAX_ITEMS) {
                const ourLowest = arrTopBids[arrTopBids.length - 1]

                if (Number(newBid.price_level) < Number(ourLowest.price_level)) {
                    // Ignore update
                    continue loop
                }
            }

            // 3) Try to match up bids that we have
            const ourMatchingBidIndex = arrTopBids.findIndex((ourBid) => newBid.price_level == ourBid.price_level)
            const ourMatchingBid = arrTopBids[ourMatchingBidIndex]
            if (ourMatchingBid) {
                // Quantity is zero, bid is unlisted, remove from ours
                if (newBid.new_quantity == '0') {
                    arrTopBids.splice(ourMatchingBidIndex, 1)
                }
                else {
                    // Update our bid, then do next update
                    ourMatchingBid.new_quantity = newBid.new_quantity
                }
                continue loop
            }

            // 4) If the new quantity is zero, but we do not have the bid, ignore it
            if (newBid.new_quantity == '0') {
                continue loop
            }

            // 5) Check to see if new bid is higher than all of ours
            const ourHighest = arrTopBids[0]

            if (Number(newBid.price_level) > Number(ourHighest.price_level)) {
                arrTopBids.splice(0, 0, newBid)
                arrTopBids.splice(MAX_ITEMS)
                continue loop
            }

            // 6) Add bids we don't
            // Loop backwards through list
            for (let i = arrTopBids.length - 1; i >= 0; i--) {
                const ourBid = arrTopBids[i]
                // Find the first of our bids which beat the new bid
                if (Number(newBid.price_level) < Number(ourBid.price_level)) {
                    // Insert new bid at the previous index
                    arrTopBids.splice(i + 1, 0, newBid)
                    // Ensure the list doesn't exceed max items
                    arrTopBids.splice(MAX_ITEMS)
                    continue loop
                }
            }
        }
        else if (x.side == 'offer') {

            const newOffer = x

            // 1) If we have removed all our bids, add this one
            if (arrTopOffers.length == 0) {
                arrTopOffers.push(newOffer)
            }

            // 2) Ignore bids lower than our lowest
            if (arrTopOffers.length >= MAX_ITEMS) {
                const ourHighest = arrTopOffers[arrTopOffers.length - 1]

                if (Number(newOffer.price_level) > Number(ourHighest.price_level)) {
                    // Ignore update
                    continue loop
                }
            }

            // 3) Try to match up bids that we have
            const ourMatchingBidIndex = arrTopOffers.findIndex((ourOffer) => newOffer.price_level == ourOffer.price_level)
            const ourMatchingBid = arrTopOffers[ourMatchingBidIndex]
            if (ourMatchingBid) {
                // Quantity is zero, bid is unlisted, remove from ours
                if (newOffer.new_quantity == '0') {
                    arrTopOffers.splice(ourMatchingBidIndex, 1)
                }
                else {
                    // Update our bid, then do next update
                    ourMatchingBid.new_quantity = newOffer.new_quantity
                }
                continue loop
            }

            // 4) If the new quantity is zero, but we do not have the bid, ignore it
            if (newOffer.new_quantity == '0') {
                continue loop
            }

            // 5) Check to see if new bid is higher than all of ours
            const ourLowest = arrTopOffers[0]

            if (Number(newOffer.price_level) < Number(ourLowest.price_level)) {
                arrTopOffers.splice(0, 0, newOffer)
                arrTopOffers.splice(MAX_ITEMS)
                continue loop
            }

            // 6) Add bids we don't
            // Loop backwards through list
            for (let i = arrTopOffers.length - 1; i >= 0; i--) {
                const ourOffer = arrTopOffers[i]
                // Find the first of our bids which beat the new bid
                if (Number(newOffer.price_level) > Number(ourOffer.price_level)) {
                    // Insert new bid at the previous index
                    arrTopOffers.splice(i + 1, 0, newOffer)
                    // Ensure the list doesn't exceed max items
                    arrTopOffers.splice(MAX_ITEMS)
                    continue loop
                }
            }
        }
        else {
            assertCompleteSwitch(x.side)
        }

    }
}

type RelativeBid = Bid & { moveVolume: number, totalMoveVolume: number }
type RelativeOffer = Offer & { moveVolume: number, totalMoveVolume: number }

function calcRelativeOrderSize(bids: Bid[], offers: Offer[]) {
    const relativeBids = [] as RelativeBid[]
    const relativeOffers = [] as RelativeOffer[]

    for (let i = 0; i < bids.length; i++) {
        const b = bids[i]
        const lastTotalVolume = relativeBids[i - 1]?.totalMoveVolume || 0

        const moveVolume = Number(b.price_level) * Number(b.new_quantity)
        const totalMoveVolume = lastTotalVolume + moveVolume
        relativeBids.push({
            ...b,
            moveVolume,
            totalMoveVolume
        })
    }
    for (let i = 0; i < offers.length; i++) {
        const o = offers[i]
        const lastTotalVolume = relativeBids[i - 1]?.totalMoveVolume || 0

        const moveVolume = Number(o.price_level) * Number(o.new_quantity)
        const totalMoveVolume = lastTotalVolume + moveVolume
        relativeOffers.push({
            ...o,
            moveVolume,
            totalMoveVolume
        })
    }
    return { relativeBids, relativeOffers }
}


function assertCompleteSwitch(lastEnum: never) {
    throw new Error(`switch(<your enum>) did not handle every case of ${JSON.stringify(lastEnum)}`)
}
function start() {
    ws.on('message', function (data) {
        const parsedData = JSON.parse(data as any as string);
        const events: (Snapshot | Update)[] = parsedData.events

        events.forEach(event => {
            // console.log(event)
            if ("subscriptions" in event) return

            switch (event.type) {
                case 'snapshot':
                    productsOnSnapShot(event)
                    break;
                case 'update':
                    productsOnUpdate(event)
                    break;
                default:
                    assertCompleteSwitch(event)
                    break;
            }
        });
        const { relativeBids, relativeOffers } = calcRelativeOrderSize(arrTopBids, arrTopOffers)
        console.clear()
        console.table(relativeOffers.slice().reverse())
        console.table(relativeBids)
        // console.table(arrTopOffers)
    });

    ws.on('open', function () {
        const products = ['BTC-USD'];
        productsSubscribe(products, CHANNEL_NAMES.level2, ws);
    });
}