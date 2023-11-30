import { useState } from 'preact/hooks';

export default function Greeting({ messages }) {

  const randomMessage = () => messages[(Math.floor(Math.random() * messages.length))];

  const [greeting, setGreeting] = useState(messages[0]);

  return (
    <div>
      <h3 class="min-h-[250px] flex min-w-0 overflow-auto">{greeting}</h3>
      <button class="bg-blue-500 hover:bg-blue-400 text-[rgb(245,245,245)] font-bold py-2 px-4 border-b-4 border-blue-700 hover:border-blue-500 rounded" onClick={() => setGreeting(randomMessage())}>
        Generate Random Ron Burgundy Quote
      </button>
    </div>
  );
}
