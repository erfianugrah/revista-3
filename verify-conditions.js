const { spawn } = require('bun');

async function getCurrentTag() {
  const proc = spawn([
    'curl',
    '-s',
    'https://hub.docker.com/v2/repositories/erfianugrah/revista-4/tags/?page_size=1&ordering=last_updated',
  ]);
  const output = await new Response(proc.stdout).text();
  const data = JSON.parse(output);
  return data.results[0].name;
}

getCurrentTag()
  .then((currentTag) => {
    console.log(`Current Docker tag: ${currentTag}`);
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error fetching current Docker tag:', error);
    process.exit(1);
  });
