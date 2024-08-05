const fs = require('fs');
const { spawn } = require('bun');

async function getCurrentDockerTag() {
  const proc = spawn([
    'curl',
    '-s',
    'https://hub.docker.com/v2/repositories/erfianugrah/revista-4/tags/?page_size=1&ordering=last_updated',
  ]);
  const output = await new Response(proc.stdout).text();
  const data = JSON.parse(output);
  return data.results[0].name;
}

async function getLastCommitMessage() {
  const proc = spawn(['git', 'log', '-1', '--pretty=%B']);
  return await new Response(proc.stdout).text();
}

function incrementVersion(version, type) {
  const [major, minor, patch] = version.split('.').map(Number);
  switch (type) {
    case 'major':
      return `${major + 1}.0.0`;
    case 'minor':
      return `${major}.${minor + 1}.0`;
    case 'patch':
    default:
      return `${major}.${minor}.${patch + 1}`;
  }
}

async function updateVersion() {
  const currentTag = await getCurrentDockerTag();
  const commitMessage = await getLastCommitMessage();

  let incrementType = 'patch';
  if (commitMessage.includes('#minor')) {
    incrementType = 'minor';
  } else if (commitMessage.includes('#major')) {
    incrementType = 'major';
  }

  const newVersion = incrementVersion(currentTag, incrementType);

  // Update package.json
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  packageJson.version = newVersion;
  fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));

  console.log(`Version updated to ${newVersion}`);
  console.log(`::set-output name=new_version::${newVersion}`);
}

updateVersion().catch(console.error);
