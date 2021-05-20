const PUBLIC_KEY = process.env.PUBLIC_KEY;
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const MARVEL_API_URL = process.env.MARVEL_API_URL || "https://gateway.marvel.com:443/v1/public";
const axios = require("axios");
const md5 = require("md5");
const TIMESTAMP = 1621398536;

const _axios = axios.create({
    baseURL: MARVEL_API_URL,
    params: {
      apikey: PUBLIC_KEY,
      hash: md5(`${TIMESTAMP}${PRIVATE_KEY}${PUBLIC_KEY}`),
      ts: TIMESTAMP,
    },
  });

  module.exports = _axios;