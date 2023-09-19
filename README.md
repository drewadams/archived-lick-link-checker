# Lick Links - Link Checker

[![npm version](https://badge.fury.io/js/lick-links.svg)](https://badge.fury.io/js/lick-links)

## About

This is a CLI link checker written in Typescript.

## Installation

```bash
npm i -g lick-links
```

## Usage

### npx

No install needed

```bash
npx lick-links <siteUrl> [options]
```

### If installed

```bash
lick <siteUrl> [options]
```

### Options

| Flag          | Description                                  | Value                                    |
| ------------- | -------------------------------------------- | ---------------------------------------- |
| --version     | Show version number                          | [boolean]                                |
| --help        | Show help                                    | [boolean]                                |
| -d, --depth   | Depth the checker goes to                    | [number] [default: 0]                    |
| -p, --path    | Path to the output file                      | [string] [default: "./lick-report.json"] |
| -s, --slow    | Increases fetch timeout                      | [boolean] [default: false]               |
| --csv         | Exports report to a CSV file instead of JSON | [boolean] [default: false]               |
| -v, --verbose | Adds additional logging to console           | [boolean] [default: false]               |

## Help

```bash
lick --help
```
