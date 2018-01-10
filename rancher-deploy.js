#!/usr/bin/env node
const PromisePool = require('es6-promise-pool');
const rp = require('request-promise-native');
const log = require('winston');
const chalk = require('chalk');
const config = require('./config.js').config;
const applicationMap = {
  'web-lightning-ui': 'wlui',
  'core-leankit-api': 'cla',
};


const yargs = config.yargs;
const auth = {
  user: config.accessKey,
  pass: config.secretKey,
};

log.cli();
log.level = yargs.log;

const setColorForProject = function setColorForProject(project) {
  return new Promise(
    (resolve) => {
      log.debug(chalk.supportsColor);
      const randomHex = (Math.random() * 0xFFFFFF << 0).toString(16);
      const color = `000000${randomHex}`.slice(-6).toUpperCase();
      log.debug(`Color is ${color}`);
      log.info(chalk `{hex('${color}') ${project.name}}: Starting Upgrade`);
      resolve({
        color,
        name: project.name,
        project,
      });
    });
};

const getProjects = function getProjects() {
  return new Promise(
    (resolve, reject) => {
      let uri = `${config.baseUrl}/v2-beta/projects?name=${yargs.env}`;
      if (yargs.env === 'all') {
        uri = `${config.baseUrl}/v2-beta/projects`;
      }
      const options = {
        uri,
        auth,
        json: true,
      };
      rp(options)
        .then((body) => {
          if (body.data.length === 0) {
            reject(`${yargs.env}: Project object is Empty. Have you logged in?`);
          } else {
            log.silly(`${yargs.env}: Project object`);
            log.silly(JSON.stringify(body.data, null, 4));
            resolve(body.data);
          }
        })
        .catch((err) => {
          reject(err);
        });
    });
};


const getStack = function getStack(upgrade) {
  UpgradeObject = upgrade;
  // this is not fully dereferenced, so some objects we need are not in UpgradeObject
  return new Promise(
    (resolve, reject) => {
      const options = {
        uri: `${upgrade.project.links.stacks}?name=${yargs.stack}`,
        auth,
        json: true,
      };
      log.info(chalk `{hex('${upgrade.color}') ${upgrade.name}}: Getting Stack Object`);
      rp(options)
        .then((body) => {
          if (body.data.length === 0) {
            reject(chalk `{hex('${upgrade.color}') ${upgrade.name}}: Stack Not Found`);
          } else {
            log.silly(chalk `{hex('${upgrade.color}') ${upgrade.name}}: Stack object`);
            log.silly(JSON.stringify(body.data[0], null, 4));
            resolve({
              color: upgrade.color,
              name: upgrade.project.name,
              project: upgrade.project,
              stack: body.data[0],
            });
          }
        })
        .catch((err) => {
          reject(err, upgrade);
        });
    });
    return UpgradeObject
};

const getCatalog = function getCatalog(upgrade) {
  return new Promise(
    (resolve, reject) => {
      const ext = upgrade.stack.externalId.match('^catalog://(.*):(.*):([0-9]+)$');
      const external = {
        repo: ext[1],
        folder: ext[2],
        id: ext[3],
      };
      const options = {
        uri: `${config.baseUrl}/v1-catalog/templates/${external.repo}:${external.folder}`,
        auth,
        json: true,
      };
      log.info(chalk `{hex('${upgrade.color}') ${upgrade.name}}: Getting Catalog Object for ${external.repo}:${external.folder}`);
      rp(options)
        .then((body) => {
          log.silly(chalk `{hex('${upgrade.color}') ${upgrade.name}}: Catalog object for ${external.repo}:${external.folder}`);
          log.silly(JSON.stringify(body, null, 4));
          resolve({
            color: upgrade.color,
            name: upgrade.name,
            project: upgrade.project,
            stack: upgrade.stack,
            catalog: body,
          });
        })
        .catch((err) => {
          reject(err, upgrade);
        });
    });
};

const getTemplate = function getTemplate(upgrade) {
  return new Promise(
    (resolve, reject) => {
      let upgradeTo = yargs.catalog;
      if (upgradeTo === 'latest') {
        upgradeTo = upgrade.catalog.defaultVersion;
      }
      if (!(upgradeTo in upgrade.catalog.versionLinks)) {
        reject(chalk `{hex('${upgrade.color}') ${upgrade.name}}: ${upgradeTo} Catalog version not found.`);
      }
      const options = {
        uri: upgrade.catalog.versionLinks[upgradeTo],
        auth,
        json: true,
      };
      log.info(chalk `{hex('${upgrade.color}') ${upgrade.name}}: Get Catalog Templates for ${upgrade.catalog.name} ${upgradeTo}`);
      rp(options)
        .then((body) => {
          log.silly(chalk `{hex('${upgrade.color}') ${upgrade.name}}: Catalog Template object for ${upgrade.catalog.name} ${upgradeTo}`);
          log.silly(JSON.stringify(body, null, 4));
          resolve({
            color: upgrade.color,
            name: upgrade.name,
            project: upgrade.project,
            stack: upgrade.stack,
            catalog: upgrade.catalog,
            template: body,
          });
        })
        .catch((err) => {
          reject(err, upgrade);
        });
    });
};

// add defaults for new questions
const parseQuestions = function parseQuestions(upgrade) {
  // Take the question and see if there is stack environment key for that question
  const stack = upgrade.stack;
  return new Promise(
    (resolve) => {
      for (const question in upgrade.template.questions) {
        if (question.variable) {
          if (!(question.variable in stack.environment)) {
            log.debug(chalk `{hex('${upgrade.color}') ${upgrade.name}}: Found new question ${question.variable} - Assigning default value ${question.default}`);
            stack.environment[question.variable] = question.default;
          }
        }
      }
      resolve({
        color: upgrade.color,
        name: upgrade.name,
        project: upgrade.project,
        stack,
        catalog: upgrade.catalog,
        template: upgrade.template,
      });
    });
};

const checkHealth = function checkHealth(upgrade) {
  return new Promise(
    (resolve, reject) => {
      if (upgrade.stack.state !== 'active') {
        reject(chalk `{hex('${upgrade.color}') ${upgrade.name}}: Failed Health Check - Stack state is not 'active' - ${upgrade.stack.state}`, upgrade);
      } else if (upgrade.stack.transitioning !== 'no') {
        reject(chalk `{hex('${upgrade.color}') ${upgrade.name}}: Failed Health Check - Stack transitioning is not 'no' - ${upgrade.stack.transitioning}`, upgrade);
      } else if (upgrade.stack.healthState !== 'healthy') {
        reject(chalk `{hex('${upgrade.color}') ${upgrade.name}}: Failed Health Check - Stack state is not 'healthy' - ${upgrade.stack.healthState}`, upgrade);
      } else {
        log.info(chalk `{hex('${upgrade.color}') ${upgrade.name}}: Stack is Healthy`);
        resolve(upgrade);
      }
    });
};

const doUpgrade = function doUpgrade(upgrade) {
  return new Promise(
    (resolve, reject) => {
      const options = {
        method: 'POST',
        uri: upgrade.stack.actions.upgrade,
        auth,
        body: {
          externalId: `catalog://${upgrade.template.id}`,
          dockerCompose: upgrade.template.files['docker-compose.yml'],
          rancherCompose: upgrade.template.files['rancher-compose.yml'],
          environment: upgrade.template.files.environment,
        },
        json: true,
      };
      log.info(chalk `{hex('${upgrade.color}') ${upgrade.name}}: Posting Upgrade`);
      rp(options)
        .then((body) => {
          log.silly(chalk `{hex('${upgrade.color}') ${upgrade.name}}: Upgrade Return Object`);
          log.silly(JSON.stringify(body, null, 4));
          resolve(upgrade);
        })
        .catch((err) => {
          reject(err, upgrade);
        });
    });
};

const pollForDone = function pollForDone(upgrade) {
  return new Promise(
    (resolve, reject) => {
      const pollingInterval = 10000; // 10 seconds
      const pollingLimit = (yargs.wait * 1000) / pollingInterval;
      let numberOfChecks = 0;
      const options = {
        uri: upgrade.stack.links.self,
        auth,
        json: true,
      };
      const check = () => {
        log.info(chalk `{hex('${upgrade.color}') ${upgrade.name}}: Polling for Upgrade Finish`);
        numberOfChecks += 1;
        rp(options)
          .then((body) => {
            log.silly(chalk `{hex('${upgrade.color}') ${upgrade.name}}: Upgrade Return Object`);
            log.silly(JSON.stringify(body, null, 4));
            if (body.state === 'upgraded') {
              resolve({
                color: upgrade.color,
                name: upgrade.name,
                project: upgrade.project,
                stack: body,
                catalog: upgrade.catalog,
                template: upgrade.template,
              });
            } else if (numberOfChecks < pollingLimit) {
              setTimeout(check, pollingInterval);
            } else {
              reject(chalk `{hex('${upgrade.color}') ${upgrade.name}}: Waiting for Upgrade Timed Out`, upgrade);
            }
          })
          .catch((err) => {
            reject(err);
          });
      };
      check();
    });
};

const finishUpgrade = function finishUpgrade(upgrade) {
  return new Promise(
    (resolve, reject) => {
      const options = {
        method: 'POST',
        uri: upgrade.stack.actions.finishupgrade,
        auth,
        json: true,
      };
      log.info(chalk `{hex('${upgrade.color}') ${upgrade.name}}: Finishing Upgrade`);
      rp(options)
        .then((body) => {
          log.silly(chalk `{hex('${upgrade.color}') ${upgrade.name}}: Finish Return Object`);
          log.silly(JSON.stringify(body, null, 4));
          resolve(upgrade);
        });
      GetApiKey();
    });
};


const runUpgrade = function runUpgrade(project) {
  return new Promise(
    (resolve) => {
      setColorForProject(project)
        .then(getStack)
        .then(getCatalog)
        .then(getTemplate)
        .then(checkHealth)
        .then(parseQuestions)
        .then(doUpgrade)
        .then(pollForDone)
        .then(finishUpgrade)
        .then((results) => {
          resolve(results);
        })
        .catch((err, upgrade) => {
          resolve({
            upgrade,
            err,
          });
        });
    });
};

const runUpgradePool = function runStacksPool(projects) {
  return new Promise(
    (resolve) => {
      const generateUpgradePromises = function* generateUpgradePromises() {
        for (const project of projects) {
          if (project.state === 'active') {
            yield runUpgrade(project);
          } else {
            log.debug(`${project.name}: Skipping project, state is not active`);
          }
        }
      };
      const stackIterator = generateUpgradePromises();
      const pool = new PromisePool(stackIterator, yargs.concurrent);  
      pool.addEventListener('fulfilled', (event) => {
        if (event.data.result.err) {
          log.warn(`${event.data.result.err}: Upgrade Canceled`);
        } else {
          log.info(chalk `{hex('${event.data.result.color}') ${event.data.result.name}}: Upgrade done`);
        }
        log.silly(JSON.stringify(event.data.result, null, 4));
      });
      pool.start()
        .then(
          () => {
            log.info('All Upgrades Done');
            resolve();
          },
          (err, upgrade) => {
            log.warn(`Some Upgrades Failed: ${err}`);
            resolve();
          });
    });
};

const run = function run() {
  return new Promise(
    (resolve) => {
      log.info(`Starting Upgrade for Stack ${yargs.stack}`);
      resolve();
    });
};

const GetApiKey = function GetApiKey() {
  const fs = require('fs');
  const file = __dirname + '/nr.json';  
  const ReadFile =    fs.readFile(file, 'utf8', function (err, data) {
      if (!fs.existsSync('nr.json') ) {
	  log.info("DERP:  you didn't read the README.md and don't have a nr.json file")
	  log.info("The deploy did not finish, and we won't be posting the deployment to NewRelic")
	  process.exit()
      }
      if (err) {
            console.log('Error: ' + err);
            return;
        }
      
        data = JSON.parse(data);
	const NewRelicKey = data.APIKEY
	getApm()
	const wlui = /web-lightning-ui/;
	const cla = /core-leankit-api/;
	//    const lk_nr_enabled = upgrade.stack.environment.enable_newrelic;
	// upgrade.stack.environment.enable_newrelic should be true, per Rancher API
	//but this is actually false
	// because of this, we have to do this matching...
	// if (lk_vnet.match("d1") &&(yargs.env.match("d1-i01-c" ) )||(lk_vnet.match("u3"|"e3"|"all") ) ) {
      // node does not like the three way match...
	if (lk_vnet.match("d1") &&(yargs.env.match("d1-i01-c" ) )||(lk_vnet.match("u3") ||lk_vnet.match("e3")||lk_vnet.match("all") ) ) {
    if (yargs.stack.match(wlui) ) {
	    getApm()
	    getNRAppID(NewRelicKey)
	}          else
	    if (yargs.stack.match(cla) ) {
	    getApm()
	    getNRAppID(NewRelicKey)
	}
}
    });
  const data = JSON.parse(data);
  const NewRelicKey = data.APIKEY;
  return NewRelicKey;
};


const getApm = function getApm() {
    name_array = UpgradeObject.name.split('-');
    lk_vnet = name_array[0]
  lk_instance = name_array[1];
  nr_appname = applicationMap[`${yargs.stack}`];
  nr_apm_name = `${lk_instance}-${nr_appname}`;
  return nr_appname;
};

const getNRAppID = function getNRAppID(NewRelicKey,lk_vnet) {
  nr_appname = applicationMap[`${yargs.stack}`];
  const nr_apm_name = `${lk_instance}-${nr_appname}`
  const options = {
    method: 'GET',
    uri: 'https://api.newrelic.com/v2/applications.json',
    resolveWithFullResponse: true,
    json: true,
    headers: {
      'Content-Type': 'application/json',
      'X-Api-Key': `${NewRelicKey}`,
    },
    qs: {
      'filter[name]': nr_apm_name,
    },
  };
  rp(options, function (error, response, body) {
    if (!error) { // && response.statusCode != 200) {
    }
    const thenewrelicappid = body.applications[0].id
	postDeploy(NewRelicKey,thenewrelicappid,nr_apm_name,yargs.catalog,lk_instance)
  });
//    log.info(`new relic app id is ${thenewrelicappid}`)
};
const postDeploy = function postDeploy(NewRelicKey,thenewrelicappid,nr_apm_name,upgradeTo,lk_instance) {
  const rp = require('request-promise-native');
  const options = {
    method: 'POST',
    uri: `https://api.newrelic.com/v2/applications/${thenewrelicappid}/deployments.json`,
    resolveWithFullResponse: true,
    headers: {
      'Content-Type': 'application/json',
      'X-Api-Key': `${NewRelicKey}`
    },
    body: { "deployment" :{'revision': `${upgradeTo}`, 'changelog': 'see description', 'description': `deployment of ${nr_appname} release ${upgradeTo} to ${lk_instance}`, 'user': 'lkdevops@leankit.com'} },
    json: true, // Automatically stringifies the body to JSON
    simple: false,
  };
  rp(options, function (error, response, body) {
    if (!error && response.statusCode != 200) {
    }
    })
    .then(function (response) {
    })
    .catch(function (err) {
    });
};



run()
  .then(getProjects)
  .then(runUpgradePool)
  .catch((err) => {
    log.error(err);
  });

