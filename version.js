const fs = require('fs');
const { spawn } = require('bun');

async function getCurrentDockerTag() {
  try {
    const proc = spawn([
      'curl',
      '-s',
      'https://hub.docker.com/v2/repositories/erfianugrah/revista-4/tags/?page_size=1&ordering=last_updated',
    ]);
    const output = await new Response(proc.stdout).text();
    const data = JSON.parse(output);
    if (data.results && data.results.length > 0) {
      return data.results[0].name;
    }
    console.log('No tags found, defaulting to 1.0.0');
    return '1.0.0';
  } catch (error) {
    console.error('Error fetching Docker tag:', error);
    console.log('Defaulting to 1.0.0');
    return '1.0.0';
  }
}

async function getLastCommitMessage() {
  try {
    const proc = spawn(['git', 'log', '-1', '--pretty=%B']);
    return await new Response(proc.stdout).text();
  } catch (error) {
    console.error('Error fetching last commit message:', error);
    return '';
  }
}

function incrementVersion(version, type) {
  const parts = version.split('.').map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) {
    console.error('Invalid version format:', version);
    return '1.0.0';
  }
  const [major, minor, patch] = parts;
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
  console.log('Current Docker tag:', currentTag);

  const commitMessage = await getLastCommitMessage();
  console.log('Last commit message:', commitMessage);

  let incrementType = 'patch';
  if (commitMessage.includes('#minor')) {
    incrementType = 'minor';
  } else if (commitMessage.includes('#major')) {
    incrementType = 'major';
  }
  console.log('Increment type:', incrementType);

  const newVersion = incrementVersion(currentTag, incrementType);
  console.log('New version:', newVersion);

  // Update package.json
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    packageJson.version = newVersion;
    fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));
    console.log('package.json updated successfully');
  } catch (error) {
    console.error('Error updating package.json:', error);
  }

  console.log(`Version updated to ${newVersion}`);
  console.log(`::set-output name=new_version::${newVersion}`);
}

updateVersion().catch(console.error);
