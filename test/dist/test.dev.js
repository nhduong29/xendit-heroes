"use strict";

var assert = require('assert');

var chai = require('chai');

var chaiHttp = require('chai-http');

var server = require('../index');

var should = chai.should();
chai.use(chaiHttp);
describe('Xendit API Test', function () {
  beforeEach(function (done) {
    //Before each test we empty the database
    //do something
    done();
  });
  /*
    * Test the /GET route
    */

  describe('/GET characters', function () {
    it('it should GET all the characters', function (done) {
      chai.request(server).get('/characters').end(function (err, res) {
        res.should.have.status(200);
        res.body.should.be.a('array');
        res.body.length.should.not.be.eql(0);
        done();
      });
    });
  });
});