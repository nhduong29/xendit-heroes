# Xendit Heroes Coding Challenge

APIs for getting all chacracters of Marvel using some caching tech to improve the performance.


## APIs - Feature

- `/characters` that returns all the Marvel character ids in a JSON array of numbers
- `/characters/{characterId}` that returns only the id, name and description of the character.

## OpenAPI Spec
- Please get it from: `api-doc/xendit-heroes.v1.yml`

## Online version on Heroku
- The APIs is public on: <https://xendit-heroes.herokuapp.com>

Notes:

> The Marvel API only returns a max of 100 records per request
> Therefore, we will use some form of caching in the first call to reduce latency in subsequent calls to this endpoint.
> Because new Marvel character may be added in the future, Therefore we added a duration time for our cache,
> Every time when user hit an API, we check the expiration and doing some algorithm to manage our cache

## Tech

- node.js - <http://nodejs.org> : back-end JavaScript runtime environment
- expressJS - <https://expressjs.com/> : A back end web application framework for Node.js
- mochajs - <https://mochajs.org/> : Making Unit testing
- chaijs - <https://www.chaijs.com/> : Chai is a BDD / TDD assertion library 
- chaijs http - <https://www.chaijs.com/> : test http apps or external services
- flat-cache - <https://www.npmjs.com/package/flat-cache> : A super simple in-memory cache with optional disk persistance.


## Pre Requires

- `node` in latest version. Make sure your local is installed NodeJS
- `npm` in latest version. Make sure your local installed npm
- Make sure you config the variable correctly on `.env`: `PUBLIC_KEY`, `PRIVATE_KEY` and `DURATION`


## Installation

Install the dependencies and devDependencies and start the server.

```sh
cd xendit-heroes
npm install
npm run dev
```

For running the tests.
```sh
npm test
```
