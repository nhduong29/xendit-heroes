require("dotenv").config();
const PORT = process.env.PORT || 8080;
const PUBLIC_KEY = process.env.PUBLIC_KEY;
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const DURATION = process.env.DURATION * 1000 * 60;
const MARVEL_API_URL = process.env.MARVEL_API_URL || "https://gateway.marvel.com:443/v1/public";
const TOTAL_CHARACTER_KEY = "xendit_heroes:total";
const DURATION_KEY = "xendit_heroes:duration";
const HEROES_IDS_KEY = "xendit_heroes:heroesIDs";
const CACHE_NAME = "xendit_heroes";
const TIMESTAMP = 1621398536;
const MARVEL_LIMIT = 100; //
const express = require("express");
const { handleError,ErrorHandler } = require('./ErrorHandler')
const app = express();
app.use((err, req, res, next) => {
  handleError(err, res);
});
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const path = require("path");
const flatCache = require("flat-cache");
const axios = require("axios");
const md5 = require("md5");
const _axios = axios.create({
  baseURL: MARVEL_API_URL,
  params: {
    apikey: PUBLIC_KEY,
    hash: md5(`${TIMESTAMP}${PRIVATE_KEY}${PUBLIC_KEY}`),
    ts: TIMESTAMP,
  },
});
const cache = flatCache.load(CACHE_NAME, path.resolve("./cache"));

const firstCheck = async (offset = 0) => {
  const response = await _axios.get(
    `/characters?offset=${offset}&limit=${MARVEL_LIMIT}`
  );
  let { count, total, results } = response.data.data;
  return { count, total, results };
};

const getListOfOffsetByTotal = (total) => {
  if (!total || total <= 0) {
    return [];
  }
  if (total <= MARVEL_LIMIT) {
    return [0];
  }
  let start = total - (total % MARVEL_LIMIT);
  const offsets = [start];
  do {
    start = start - MARVEL_LIMIT;
    offsets.push(start);
  } while (start > 0);
  return offsets;
};

const getAllCharacters = async (total = 0, characterIDsArr = []) => {
  try {
    const listOffsets = getListOfOffsetByTotal(total);
    const requests = [];
    listOffsets.forEach((offset) => {
      requests.push(
        _axios.get(`/characters?offset=${offset}&limit=${MARVEL_LIMIT}`)
      );
    });
    return await Promise.all(requests)
      .then((res) => {
        res
          .filter((item) => item.status === 200)
          .forEach((item) => {
            const itemArr = item.data.data.results.map((hero) => hero.id);
            characterIDsArr = characterIDsArr.concat(itemArr);
          });
        return characterIDsArr;
      })
      .catch(function (err) {
        console.log(err.message);
        throw new ErrorHandler(400, err.message);
      });
  } catch (error) {
    console.log("An Error Occurred", error);
    throw new ErrorHandler(400, error.message);
  }
};

app.get("/characters", async (req, res) => {
  let totalCharacters = cache.getKey(TOTAL_CHARACTER_KEY);
  let cacheContent = cache.getKey(HEROES_IDS_KEY);
  let duration = cache.getKey(DURATION_KEY);

  //Checking the cache, if data is there or not.
  if (cacheContent && duration && totalCharacters) {
    if (duration < new Date().getTime()) {
      //Checking the expired time

      cache.getKey(TOTAL_CHARACTER_KEY);
      //Checking new data by calling an API to marvel
      let { count, total, results } = await firstCheck(totalCharacters);
      const diff = total - totalCharacters; //Because Marvel hero is never removed, then the total of the api call will be greater than the current total value is stored in our cache.
      if (diff > 0 && count > 0) {
        //There is new heroes
        const newCharacters = results.map((character) => character.id);
        const newHeroesArrIDs = cacheContent.concat(newCharacters);
        cache.setKey(TOTAL_CHARACTER_KEY, total);
        if (diff <= MARVEL_LIMIT) {
          // The new number of new heroes is added in Marvel is less than or equal the limit of the record per request
          //=> Meaning we can get all new heroes in the api call above, => we will added the new heroes ids to our cache.
          cache.setKey(HEROES_IDS_KEY, newHeroesArrIDs);
          res.send(newHeroesArrIDs);
        } else {
          //case nay thi so luong hero moi no nhieu hown ca limit=> api firstCheck chua du
          //In this case the number of new heroes is added in Marvel is greater than the limit of the record per request
          //=>We need to get new all heroes with the offset is 
          getAllCharacters(total, newHeroesArrIDs)
            .then((data) => {
              console.log(data.length);
              cache.setKey(HEROES_IDS_KEY, data);
              res.send(data);
            })
            .catch((err) => {
              throw new ErrorHandler(err.statusCode, err.message);
            });
        }
      }
      //set new duration and save all the change into the cache
      const newDuration = new Date().getTime() + DURATION;
      console.log("Set new Duration: ", new Date(newDuration));
      cache.setKey(DURATION_KEY, newDuration);
      cache.save(true);
      res.send(cacheContent);
    } else {
      res.send(cacheContent);
    }
  } else {
    //Nothing from cache  then we get all heroes and set to cache
    try {
      const response = await firstCheck();
      let { total, results } = response;
      let charactersArr = results.map((character) => character.id);
      getAllCharacters(total, charactersArr).then(
        (data) => {
          cache.setKey(HEROES_IDS_KEY, data);
          cache.setKey(TOTAL_CHARACTER_KEY, data.length);
          cache.setKey(DURATION_KEY, new Date().getTime() + DURATION);
          cache.save(true);
          res.send(data);
        },
        (err) => {
          console.error(err);
          res.send(err)
        }
      )
    } catch (error) {
      res.send(new ErrorHandler(error.statusCode, error.message))
    }
  }
});

app.get("/clear-cache", async (req, res) => {
  cache.destroy();
  res.send({ message: "Cache is cleared!!" });
});

app.listen(PORT, function () {
  console.log(`The app running on port ${PORT}`);
  console.log(`Cache duration: ${new Date(new Date().getTime() + DURATION)} `);
});
