const { spawn } = require('bun');
const semver = require('semver');

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

async function main() {
  const lastReleaseVersion = process.argv[2];
  const currentTag = await getCurrentTag();

  console.log(`Last release version: ${lastReleaseVersion}`);
  console.log(`Current Docker tag: ${currentTag}`);

  const higherVersion = semver.gt(currentTag, lastReleaseVersion) ? currentTag : lastReleaseVersion;

  console.log(`Using version: ${higherVersion}`);
  console.log(`recommend-version:${higherVersion}`);
}

main().catch(console.error);
