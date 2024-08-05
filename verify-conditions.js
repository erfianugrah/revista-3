const { execSync } = require('child_process');
const semver = require('semver');

const lastReleaseVersion = process.argv[2];
const currentTag = execSync(
  'curl -s "https://hub.docker.com/v2/repositories/erfianugrah/revista-4/tags/?page_size=1&ordering=last_updated" | jq -r \'.results[0].name\''
)
  .toString()
  .trim();

console.log(`Last release version: ${lastReleaseVersion}`);
console.log(`Current Docker tag: ${currentTag}`);

const higherVersion = semver.gt(currentTag, lastReleaseVersion) ? currentTag : lastReleaseVersion;

console.log(`Using version: ${higherVersion}`);
console.log(`recommend-version:${higherVersion}`);
