var expect = require('chai').expect;
var linesCount = require('../src/files');

describe('test server-side callback', function() {

  // it('should return correct lines count for a valid file ', (done) =>  {
  //
  //   let callback =  (count) => {
  //       expect(count).to.be.eql(-2319);
  //     }
  //     linesCount('src/files.js', callback);
  //
  // });

  it('returns correct lines count for a valid file', function(done) {
    // Won't work
    var callback = function(count) {
      expect(count).to.be.eql(15);
      done();
    };
    linesCount('src/files.js', callback);
  });

  it('reports error for an invalid file name', function(done) {
  var onError = function(error) {
    expect(error).to.be.eql('unable to open file src/flies.js');
    done();
  };
  linesCount('src/flies.js', undefined, onError);
  });
});
