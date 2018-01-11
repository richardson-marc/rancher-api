# rancher-tools

Tools to deploy and maintain services in rancher.

## `rancher_catalog_upgrade_stacks`

Like pushing the `Upgrade Available` button on your stack.

### Limitations

This will use existing values for `questions` during an upgrade. New `Questions` will be populated with the default answer.

### Installation

Use npm to install. It will create the necessary scripts and put them in your path.

```
cd rancher_catalog_upgrade_stacks
npm install -g
```

### Config

Place a configuration json file in `~/.rancher/rancher_tools.json`. Place an entry for each rancher server.

```json
{
  "d1-rancher": {
    "baseUrl": "https://d1-rancher.example.com",
    "accessKey": "Rancher API Key",
    "secretKey": "Rancher API Secret"
  },
  "rancher-b": {
    "baseUrl": "https://rancher-b.example.com",
    "accessKey": "Rancher API Key",
    "secretKey": "Rancher API Secret"
  }
}
```

### Usage

```bash
rancher_catalog_upgrade_stacks --help
Options:
  --config       config file to use                                     [string]
  --server, -s   which rancher server config to use config   [string] [required]
  --env, -e      Environment to upgrade                [string] [default: "all"]
  --stack, -s    Name of stack to update.                    [string] [required]
  --catalog, -c  Catalog Version to apply.          [string] [default: "latest"]
  --log          log level (info, debug, silly)       [string] [default: "info"]
  --concurrent   number of concurrent environments to upgrade       [default: 3]

Missing required arguments: server, stack
```

### Examples

#### Upgrade Stack `datadog` in Environments `all` to Version `latest` on `d1-rancher`
All environments your user has access to on a server.

```bash
rancher_catalog_upgrade_stacks --server d1-rancher --stack datadog
```

#### Upgrade Stack `datadog` in Environment `d1-d01-b` to Version `11.0.5121-74.master` on `d1-rancher`

A single environment. You can "Upgrade" to a previous version, but be careful. The current question values are maintained.

```bash
rancher_catalog_upgrade_stacks --server d1-rancher --stack datadog --catalog 11.0.5121-74.master --env d1-d01-b
```
