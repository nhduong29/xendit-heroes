require("dotenv").config();
const MARVEL_LIMIT = 100;
const _axios = require("../_axios");
const flatCache = require("flat-cache");
const HEROES_CACHE_NAME = "xendit_heroes";
const HEROES_DETAIL_CACHE_NAME = "xendit_heroes_detail";
const path = require("path");
const Character = require("../controllers/models/Character");
const ErrorHandler = require("../controllers/models/ErrorHandler");
const heroesDetailCache = flatCache.load(
  HEROES_DETAIL_CACHE_NAME,
  path.resolve("./cache")
);
const heroesCache = flatCache.load(HEROES_CACHE_NAME, path.resolve("./cache"));

const firstCheck = async (offset = 0) => {
  const response = await _axios.get(
    `/characters?offset=${offset}&limit=${MARVEL_LIMIT}`
  );
  let { count, total, results } = response.data.data;
  return { count, total, results };
};

const getListOfOffsetByTotal = (min = 0, total) => {
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
  } while (start > min);
  return offsets;
};

const getRemainingCharacters = async (
  min = 0,
  offset = 0,
  characterIDsArr = []
) => {
  try {
    const listOffsets = getListOfOffsetByTotal(min, offset);
    const requests = [];
    listOffsets.forEach((offset) => {
      requests.push(
        _axios.get(`/characters?offset=${offset}&limit=${MARVEL_LIMIT}`)
      );
    });
    return Promise.all(requests)
      .then((res) => {
        res
          .filter((item) => item.status === 200)
          .forEach((item) => {
            const itemArr = item.data.data.results.map((hero) => {
              heroesDetailCache.setKey(
                hero.id,
                new Character(hero.id, hero.name, hero.description)
              );
              heroesDetailCache.save(true);
              return hero.id;
            });
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
    throw new ErrorHandler(500, error.message);
  }
};

module.exports = {
  getRemainingCharacters,
  firstCheck,
  heroesDetailCache,
  heroesCache,
};
