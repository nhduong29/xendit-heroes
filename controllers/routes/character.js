const DURATION = process.env.DURATION * 1000 * 60;
const TOTAL_CHARACTER_KEY = "xendit_heroes:total";
const DURATION_KEY = "xendit_heroes:duration";
const HEROES_IDS_KEY = "xendit_heroes:heroesIDs";
const MARVEL_LIMIT = 100; 
const _axios = require("../../_axios");
const util = require("../../utils/util");
const Character = require("../models/Character");
const ErrorHandler = require("../models/ErrorHandler");

const getCharacterIDs = async (req, res) => {
  let totalCharacters = util.heroesCache.getKey(TOTAL_CHARACTER_KEY);
  let cacheContent = util.heroesCache.getKey(HEROES_IDS_KEY);
  let duration = util.heroesCache.getKey(DURATION_KEY);

  //Checking the cache, if data is there or not.
  if (cacheContent && duration && totalCharacters) {
    if (duration < new Date().getTime()) {
      //Checking the expired time
      //Checking new data by calling an API to marvel
      let { count, total, results } = await util.firstCheck(totalCharacters);
      const diff = total - totalCharacters; //Because Marvel hero is never removed, then the total of the api call will be greater than the current total value is stored in our cache.
      if (diff > 0 && count > 0) {
        //There is new heroes
        const newCharacters = results.map((character) => character.id);
        const newHeroesArrIDs = cacheContent.concat(newCharacters);
        util.heroesCache.setKey(TOTAL_CHARACTER_KEY, total);
        if (diff <= MARVEL_LIMIT) {
          // The new number of new heroes is added in Marvel is less than or equal the limit of the record per request
          //=> Meaning we can get all new heroes in the api call above, => we will added the new heroes ids to our cache.
          util.heroesCache.setKey(HEROES_IDS_KEY, newHeroesArrIDs);
          res.send(newHeroesArrIDs);
        } else {
          //In this case the number of new heroes is added in Marvel is greater than the limit of the record per request
          //=>We need to get new all heroes with the offset is
          util.getRemainingCharacters(count, total, newHeroesArrIDs)
            .then((data) => {
              console.log(data.length);
              util.heroesCache.setKey(HEROES_IDS_KEY, data);
              res.send(data);
            })
            .catch((err) => {
                console
              throw new ErrorHandler(err.statusCode, err.message);
            });
        }
      }
      //set new duration and save all the change into the cache
      const newDuration = new Date().getTime() + DURATION;
      console.log("Set new expiration at: ", new Date(newDuration));
      util.heroesCache.setKey(DURATION_KEY, newDuration);
      util.heroesCache.save(true);
      res.send(cacheContent);
    } else {
      res.send(cacheContent);
    }
  } else {
    //Nothing from cache  then we get all heroes and set to cache
    try {
      const response = await util.firstCheck();
      let { total, results, count } = response;
      let charactersArr = results.map((character) => character.id);
      util.getRemainingCharacters(count, total, charactersArr)
        .then((data) => {
          util.heroesCache.setKey(HEROES_IDS_KEY, data);
          util.heroesCache.setKey(TOTAL_CHARACTER_KEY, data.length);
          util.heroesCache.setKey(DURATION_KEY, new Date().getTime() + DURATION);
          util.heroesCache.save(true);
          res.send(data);
        })
        .catch((err) => {
          throw new ErrorHandler(err.statusCode, err.message);
        });
    } catch (error) {
        console.log(error)
      res
        .status(error.statusCode || 500)
        .send(new ErrorHandler(error.statusCode || 500, error.message || "Server error"));
    }
  }
};
const getCharacter = (req, res) => {
    try {
    const characterId = req.params.characterId;
    let character = util.heroesDetailCache.getKey(characterId);
    if (character) {
      res.send(character);
    } else {
      _axios
        .get(`/characters/${characterId}`)
        .then(
          (result) => {
            character = new Character(result.data.data.results[0].id, result.data.data.results[0].name, result.data.data.results[0].description)
            util.heroesDetailCache.setKey(characterId, character);
            util.heroesDetailCache.save(true);
            res.send(character);
          },
          (err) => {
            console.log(err);
            throw new ErrorHandler(
              err.response.data.code,
              err.response.data.status
            );
          }
        )
        .catch((err) => {
          console.log(err);
          res
            .status(err.statusCode)
            .send(new ErrorHandler(err.statusCode, err.message));
        });
    }
  } catch (error) {
      console.log(error)
    res.status(500).end(new ErrorHandler(500, error.message));
  }
};

const clearAllCache = (req, res) => {
    try {
      util.heroesCache.destroy();
      util.heroesDetailCache.destroy()
      console.log("Cache is cleared!!")
      res.send({ message: "Cache is cleared!!" });
    } catch (error) {
      res.status(500).send({ message: "Can't no clear the cache" });
    }
  }
module.exports = { getCharacterIDs, getCharacter, clearAllCache };
