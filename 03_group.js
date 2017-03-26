

exports.group1 = { 
    setUp: function (callback) {
        // do something
        console.log("setUp");
        callback();
    },
    tearDown: function (callback) {
        // do something
        console.log("tearDown");
        callback();
    },
    test1: function (test) {
        console.log("test1");
        test.done();
    },
    test2: function (test) {
        console.log("test2");
        test.done();
    }
};
