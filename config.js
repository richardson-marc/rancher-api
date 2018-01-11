const path = require('path');
const fs = require('fs');
const yargs = require('yargs')
  .option('config', {
    type: 'string',
    describe: 'config file to use',
  })
  .option('server', {
    describe: 'which rancher server config to use config',
    demandOption: true,
  })
  .option('env', {
    alias: 'e',
    type: 'string',
    describe: 'Environment to upgrade',
    default: 'all',
  })
  .option('stack', {
    alias: 's',
    type: 'string',
    describe: 'Name of stack to update.',
    demandOption: true,
  })
  .option('catalog', {
    alias: 'c',
    type: 'string',
    describe: 'Catalog Version to apply.',
    default: 'latest',
  })
  .option('log', {
    type: 'string',
    describe: 'log level (info, debug, silly)',
    default: 'info',
  })
  .option('concurrent', {
    type: 'int',
    describe: 'number of concurrent environments to upgrade',
    default: 3,
  })
  .option('wait', {
    type: 'int',
    describe: 'Seconds to wait for upgrade to finish',
    default: 600,
  })
  .argv;

const home = process.env.HOME;
const configFile = yargs.config || path.join(home, '.rancher', 'rancher_tools.json');
const configFromFile = JSON.parse(fs.readFileSync(configFile, 'utf8'));
let config = {};

if (yargs.server in configFromFile) {
  config = configFromFile[yargs.server];
} else {
  console.error(`Config (${yargs.server}) not found in ${configFile}`);
  process.exit(1);
}
config.yargs = yargs;

exports.config = config;
