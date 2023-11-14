import { useState } from 'preact/hooks';

export default function Greeting({messages}) {

  const randomMessage = () => messages[(Math.floor(Math.random() * messages.length))];

  const [greeting, setGreeting] = useState(messages[0]);

  return (
    <div>
      <h3 class="greeting">{greeting}</h3>
      <button class="button" onClick={() => setGreeting(randomMessage())}>
        Generate Random Ron Burgundy Quote
      </button>
    </div>
  );
}