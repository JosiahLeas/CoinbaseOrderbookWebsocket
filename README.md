# Fast Coinbase Orderbook
![image](https://github.com/JosiahLeas/CoinbaseOrderbookWebsocket/assets/17595354/9885fcf0-044b-4939-b23c-279f6399b0b6)

## Simple terminal app that shows the Coinbase Orderbook for a desired coin using their websocket connection

Get API Key here - https://cloud.coinbase.com/access/api?keyType=trade

Websocket Docs (Connection Info) - https://docs.cloud.coinbase.com/advanced-trade-api/docs/ws-auth

### Start application
1. Open two terminals, one to the `./websocket/` directory, the other to the `./solid-start/` directory.
2. In each terminal run:
```sh
npm install
```
3. In each terminal run:
```sh
npm start
```

   
### Change settings by editing the `./websocket/settings.ts` file: 

```ts
export function yourSettings() {
    return {
        MAX_ORDERBOOK_SIZE: 10,
        TRACKED_COIN_PAIR: "BTC-USD"
    }
}
```
