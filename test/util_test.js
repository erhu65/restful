
let expect = require('chai').expect;
let Util = require('../src/util');


describe('util tests', function () {
    let util;

    beforeEach(function () {
        util = new Util();
    });

    it('canary test', function () {
        expect(true).to.be.equal(true);
    });


    it('Should pass if f2c retrue o C for 32 F', function () {
        let fahrenheit = 32;
        let celsius = util.f2c(fahrenheit);
        expect(celsius).to.eql(0);
    });

    it('Should pass if f2c retrue  10C for 50F', function () {
        let fahrenheit = 50;
        let celsius = util.f2c(fahrenheit);
        expect(celsius).to.eql(10);
    });

});