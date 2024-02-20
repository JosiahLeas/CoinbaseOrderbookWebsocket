import { clientOnly } from "@solidjs/start"

const OrderbookConnection = clientOnly(() => import("../components/Client-Coinbase"))
export default function Coinbase() {

  return (
    <main class="text-center mx-auto text-gray-700 p-4">
      <h1 class="max-6-xs text-6xl text-sky-700 font-thin uppercase my-16">
        Coinbase Orderbook
      </h1>
      <OrderbookConnection  />
    </main>
  );
}