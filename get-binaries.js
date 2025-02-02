import fs from "fs";
import path, { dirname, join } from "path";
import { fileURLToPath } from "url";
import { execSync, spawn } from "child_process";
const __dirname = dirname(fileURLToPath(import.meta.url));

const rubyBuilderUrl = 'https://github.com/ruby/ruby-builder/releases/expanded_assets/toolcache';
const rvmRubiesPath = path.join(process.env.HOME, '.rvm/rubies');
const tarPath = path.join(__dirname, 'public');

const getVersions = async () => {
  const rubyBuilderData = await (await fetch(rubyBuilderUrl, {
    headers: {
      'user-agent': 'curl/8.11.0'
    }
  })).text();

  let versions = [];
  {
    const hrefRegex = new RegExp(`href="[-\\w/]+?\\/((ruby-3|jruby-|truffleruby-)[.\\d]+)-ubuntu-24.04.tar.gz"`, 'g');

    // @ts-ignore
    var matches = [
      ...("" + rubyBuilderData).matchAll(hrefRegex),
    ];
    for (const match of matches) {
      if (!versions.includes(match[1])) {
        versions.push(match[1]);
      }
    }
    versions = sortSemver(versions).reverse();
    // remove minor versions
    versions = versions.filter((x, i) => versions.findIndex(y => y.startsWith(x.substring(0, x.indexOf('.') + 3))) == i);
  }

  fs.writeFileSync(
    __dirname + "/public/metadata.json",
    JSON.stringify({
      os: execSync('gcc --version').toString().split('\n')[0],
      versions
    }, null, 2)
  );
};

const installVersions = async () => {
  const desiredVersions = JSON.parse(fs.readFileSync('./public/metadata.json')).versions;
  const installedVersions = fs.readdirSync(rvmRubiesPath);
  const missingVersions = desiredVersions.filter(version => !installedVersions.includes(version));

  missingVersions.forEach(version => {
    try {
      execSync(`rvm install ${version}`, { stdio: 'inherit' });
      console.log(`Successfully installed Ruby ${version}`);
    } catch (error) {
      console.error(`Failed to install Ruby ${version}:`, error.message);
    }
  });
}

const packVersions = async () => {
  const desiredVersions = JSON.parse(fs.readFileSync('./public/metadata.json')).versions;
  desiredVersions.forEach(version => {
    const rubyDir = path.join(rvmRubiesPath, `${version}`);
    const archivePath = path.join(tarPath, `${version}.tar.gz`);

    if (fs.existsSync(rubyDir) && !fs.existsSync(archivePath)) {
      try {
        console.log(`Compressing Ruby ${version}...`);
        execSync(`tar -czf ${archivePath} -C ${rvmRubiesPath} ${version}`, { stdio: 'inherit' });
        console.log(`Compressed to ${archivePath}`);
      } catch (error) {
        console.error(`Failed to compress Ruby ${version}:`, error.message);
      }
    }
  });

  fs.readdirSync(tarPath)
    .filter(file => file.endsWith('.tar.gz'))
    .forEach(file => {
      if (!desiredVersions.includes(file.replace(/.tar.gz$/, ''))) {
        fs.unlinkSync(path.join(tarPath, file));
        console.log(`Deleted outdated archive: ${file}`);
      }
    });
}

// https://stackoverflow.com/a/40201629/3908409
/**
 * @param {string[]} arr
 */
function sortSemver(arr) {
  return arr
    .map((a) => a.replace(/\d+/g, (n) => +n + 100000 + ""))
    .sort()
    .map((a) => a.replace(/\d+/g, (n) => +n - 100000 + ""));
}


async function main() {
  await getVersions();
  await installVersions();
  await packVersions();
  console.log("builder tasks completed")
}

main();