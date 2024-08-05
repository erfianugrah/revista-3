const { execSync } = require('child_process');

try {
  const currentTag = execSync(
    'curl -s "https://hub.docker.com/v2/repositories/erfianugrah/revista-4/tags/?page_size=1&ordering=last_updated" | jq -r \'.results[0].name\''
  )
    .toString()
    .trim();
  console.log(`Current Docker tag: ${currentTag}`);
  process.exit(0);
} catch (error) {
  console.error('Error fetching current Docker tag:', error);
  process.exit(1);
}
