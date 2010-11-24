module.exports.run = function(benchmark, next) {
  
  var assert = require('assert');
  var sys    = require('sys') || require('util');
  var fs     = require('fs');
  var cached_key_map = require(__dirname + '/../lib/alfred/indexed_key_map.js');

  var OBJECT_COUNT = 20000;
  var file_path = __dirname + '/../tmp/indexed_key_map_random_benchmark.alf';

  try {
    fs.unlinkSync(file_path);
  } catch(excp) {
    // do nothing
  }

  benchmark.start('open empty indexed key map');
  cached_key_map.open(file_path, function(err, key_map) {

    if (err) {
      throw err;
    }
    
    benchmark.end();
    
    var createRandomString = function(string_length) {
      var chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz";
      var randomstring = '';
      for (var i=0; i<string_length; i++) {
        var rnum = Math.floor(Math.random() * chars.length);
        randomstring += chars.substring(rnum,rnum+1);
      }
      return randomstring;
    };
    
    var createRandomObject = function() {
      return {
        a: createRandomString(10),
        b: createRandomString(100),
        c: createRandomString(100)
      };
    };

    var map = {};
    var keys = [];
    var key_count = 0;
    
    benchmark.start('clear empty indexed key map');
    key_map.clear(function(err) {
      if (err) {
        throw err;
      }
      benchmark.end();
      
      benchmark.start('populate indexed key map', OBJECT_COUNT);
      for (var i = 0; i < OBJECT_COUNT; i ++) {
        var value = createRandomObject();
        var key = createRandomString(16);
        keys.push(key);
        map[key] = value;
        key_map.put(key, value, function(err) {
          if (err) {
            throw err;
          }
          key_count ++;
          if (key_count == OBJECT_COUNT) {
            benchmark.end();

            setTimeout(function() {

              // test if we can retrieve all keys
              key_map.end(function(err) {
                if (err) {
                  throw err;
                }

                benchmark.start('reopen indexed key map', OBJECT_COUNT);
                cached_key_map.open(file_path, function(err, key_map) {

                  if (err) {
                    throw err;
                  }

                  benchmark.end();

                  var timeout = setTimeout(function() {
                    assert.ok(false, "timeout");
                  }, 30000)

                  var tested_keys = 0;

                  var going_for = OBJECT_COUNT * 3;

                  benchmark.start('cached_key_map.get', going_for);
                  
                  var gets = 0;
                  for(var j = 0; j < going_for; j++) {
                    var key = keys[Math.floor(Math.random() * keys.length)];
                    key_map.get(key, function(err, value) {
                      if (err) {
                        throw err;
                      }
                      gets ++;
                      if (gets == going_for) {
                        benchmark.end();
                        clearTimeout(timeout);
                        next();
                      }
                    });
                  }

                });

              });

            }, 2000);
          }
        });
      }

      // wait for flush

    });

  });
  

}
