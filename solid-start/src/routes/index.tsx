import { A } from "@solidjs/router";
import Counter from "~/components/Counter";

export default function Home() {
  return (
    <main class="text-center mx-auto text-gray-700 p-4">
      <h1 class="max-6-xs text-6xl text-sky-700 font-thin uppercase my-16">
        Open your Coinbase orderbook!
      </h1>
      <p class="mt-8">
        Visit{" "}
        <a
          href="/coinbase"
          class="text-sky-600 hover:underline"
        >
          /coinbase
        </a>
      </p>
    </main>
  );
}
