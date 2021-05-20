var assert = require("assert");
let chai = require("chai");
let chaiHttp = require("chai-http");
let server = require("../index");
let should = chai.should();

chai.use(chaiHttp);

describe("Xendit API Test", () => {
  beforeEach((done) => {
    //Before each test we empty the database
    //do something
    done();
  });

  describe("/GET characters", () => {
    it("it should GET all the characters", (done) => {
      chai
        .request(server)
        .get("/characters")
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.be.a("array");
          res.body.length.should.not.be.eql(0);
          done();
        });
    });
  });

  describe("/GET characters by ID", () => {
    it("it should a character with specific ID", (done) => {
      chai
        .request(server)
        .get("/characters/1017100")
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.be.a("object");
          res.body.name.should.be.eql("A-Bomb (HAS)");
          done();
        });
    });
  });
});
