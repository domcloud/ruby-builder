import fs from "fs";
import os from "os";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";
import { argv, exit } from "process";
const __dirname = dirname(fileURLToPath(import.meta.url));

const rubyBuilderUrl = 'https://github.com/ruby/ruby-builder/releases/expanded_assets/toolcache';
const rvmExecPath = execSync('which rvm').toString().trim();
if (!fs.existsSync(rvmExecPath)) {
  console.error("RVM is not found!");
  exit(1);
}

const rvmRubiesPath = path.join(path.dirname(rvmExecPath), '../rubies');
const tarPath = path.join(__dirname, 'public');
const prefix = argv.length > 2 ? argv[2] : `${os.arch()}-${os.platform()}`;
const metadataPath = `${__dirname}/public/${prefix}-metadata.json`;
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
    versions = versions.filter((x, i) => versions.findIndex(y => y.startsWith(x.substring(0, x.indexOf('-') + 4))) == i);
  }

  fs.writeFileSync(
    metadataPath,
    JSON.stringify({
      date: new Date().toISOString(),
      gcc: execSync('gcc --version').toString().split('\n')[0],
      machine: [os.platform(), os.arch()].join('-'),
      prefix,
      versions,
    }, null, 2)
  );
};

const installVersions = async () => {
  const desiredVersions = JSON.parse(fs.readFileSync(metadataPath)).versions;
  const installedVersions = fs.readdirSync(rvmRubiesPath);
  const missingVersions = desiredVersions.filter(version => !installedVersions.includes(version));

  missingVersions.forEach(version => {
    try {
      execSync(`rvm install ${version} -C "--enable-load-relative,--disable-install-doc"`, { stdio: 'inherit' });
      console.log(`Successfully installed Ruby ${version}`);
    } catch (error) {
      console.error(`Failed to install Ruby ${version}:`, error.message);
    }
  });
}

const packVersions = async () => {
  const desiredVersions = JSON.parse(fs.readFileSync(metadataPath)).versions;
  desiredVersions.forEach(version => {
    const rubyDir = path.join(rvmRubiesPath, `${version}`);
    const fileName = `${prefix}-${version}.tar.gz`;
    const archivePath = path.join(tarPath, fileName);

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
    .filter(file => file.endsWith('.tar.gz') && file.startsWith(prefix + '-'))
    .forEach(file => {
      if (!desiredVersions.includes(file.replace(prefix + '-', '').replace(/\.tar\.gz$/, ''))) {
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
  // await getVersions();
  // await installVersions();
  await packVersions();
  console.log("builder tasks completed")
}

main();