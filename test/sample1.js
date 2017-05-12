var math = require('../modules/math');

exports.test_add = function (test) {
    test.equal(math.add(1, 1), 2, "fail...1");
    test.done();
};
exports.test_subtract = function (test) {
    test.equals(math.subtract(4,2), 2, "fail...2");
    test.done();
};

