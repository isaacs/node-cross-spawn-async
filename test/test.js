'use strict';

var path     = require('path');
var expect   = require('expect.js');
var buffered = require('./util/buffered');
var spawn    = require('../');

var isWin    = process.platform === 'win32';

describe('cross-spawn', function () {
    it('should support shebang in executables', function (next) {
        buffered(__dirname + '/fixtures/shebang', function (err, data, code) {
            var envPath;

            expect(err).to.not.be.ok();
            expect(code).to.be(0);
            expect(data).to.equal('shebang works!');

            // Test if the actual shebang file is resolved against the PATH
            envPath = process.env.PATH;
            process.env.PATH = path.normalize(__dirname + '/fixtures/') + path.delimiter + process.env.PATH;

            buffered('shebang', function (err, data, code) {
                process.env.PATH = envPath;

                expect(err).to.not.be.ok();
                expect(code).to.be(0);
                expect(data).to.equal('shebang works!');

                next();
            });
        });
    });

    it('should expand using PATHEXT properly', function (next) {
        buffered(__dirname + '/fixtures/foo', function (err, data, code) {
            expect(err).to.not.be.ok();
            expect(code).to.be(0);
            expect(data.trim()).to.equal('foo');

            next();
        });
    });

    it('should handle commands with spaces', function (next) {
        buffered(__dirname + '/fixtures/bar space', function (err, data, code) {
            expect(err).to.not.be.ok();
            expect(code).to.be(0);
            expect(data.trim()).to.equal('bar');

            next();
        });
    });

    it('should handle commands with special shell chars', function (next) {
        buffered(__dirname + '/fixtures/()%!^&;, ', function (err, data, code) {
            expect(err).to.not.be.ok();
            expect(code).to.be(0);
            expect(data.trim()).to.equal('special');

            next();
        });
    });

    it('should handle empty arguments', function (next) {
        buffered('node', [
            __dirname + '/fixtures/echo',
            'foo',
            '',
            'bar'
        ], function (err, data, code) {
            expect(err).to.not.be.ok();
            expect(code).to.be(0);
            expect(data).to.equal('foo\n\nbar');

            buffered('echo', [
                'foo',
                '',
                'bar'
            ], function (err, data, code) {
                expect(err).to.not.be.ok();
                expect(code).to.be(0);
                expect(data.trim()).to.equal('foo  bar');

                next();
            });
        });
    });

    it('should handle non-string arguments', function (next) {
        buffered('node', [
            __dirname + '/fixtures/echo',
            1234
        ], function (err, data, code) {
            expect(err).to.not.be.ok();
            expect(code).to.be(0);
            expect(data).to.equal('1234');

            next();
        });
    });

    it('should handle arguments with spaces', function (next) {
        buffered('node', [
            __dirname + '/fixtures/echo',
            'I am',
            'André Cruz'
        ], function (err, data, code) {
            expect(err).to.not.be.ok();
            expect(code).to.be(0);
            expect(data).to.equal('I am\nAndré Cruz');

            next();
        });
    });

    it('should handle arguments with \\"', function (next) {
        buffered('node', [
            __dirname + '/fixtures/echo',
            'foo',
            '\\"',
            'bar'
        ], function (err, data, code) {
            expect(err).to.not.be.ok();
            expect(code).to.be(0);
            expect(data).to.equal('foo\n\\"\nbar');

            next();
        });
    });

    it('should handle arguments that end with \\', function (next) {
        buffered('node', [
            __dirname + '/fixtures/echo',
            'foo',
            'bar\\',
            'baz'
        ], function (err, data, code) {
            expect(err).to.not.be.ok();
            expect(code).to.be(0);
            expect(data).to.equal('foo\nbar\\\nbaz');

            next();
        });
    });

    it('should handle arguments that contain shell special chars', function (next) {
        buffered('node', [
            __dirname + '/fixtures/echo',
            'foo',
            '()',
            'foo',
            '%!',
            'foo',
            '^<',
            'foo',
            '>&',
            'foo',
            '|;',
            'foo',
            ', ',
            'foo'
        ], function (err, data, code) {
            expect(err).to.not.be.ok();
            expect(code).to.be(0);
            expect(data).to.equal('foo\n()\nfoo\n%!\nfoo\n^<\nfoo\n>&\nfoo\n|;\nfoo\n, \nfoo');

            next();
        });
    });

    it('should handle special arguments when using echo', function (next) {
        buffered('echo', ['foo\\"foo\\foo&bar"foo\'bar'], function (err, data, code) {
            expect(err).to.not.be.ok();
            expect(code).to.be(0);
            expect(data.trim()).to.equal('foo\\"foo\\foo&bar"foo\'bar');

            buffered('echo', [
                'foo',
                '()',
                'foo',
                '%!',
                'foo',
                '^<',
                'foo',
                '>&',
                'foo',
                '|;',
                'foo',
                ', ',
                'foo'
            ], function (err, data, code) {
                expect(err).to.not.be.ok();
                expect(code).to.be(0);
                expect(data.trim()).to.equal('foo () foo %! foo ^< foo >& foo |; foo ,  foo');

                next();
            });
        });
    });

    it('should handle optional args correctly', function (next) {
        buffered(__dirname + '/fixtures/foo', function (err, data, code) {
            expect(err).to.not.be.ok();
            expect(code).to.be(0);

            buffered(__dirname + '/fixtures/foo', {
                stdio: ['pipe', 'ignore', 'pipe'],
            }, function (err, data, code) {
                expect(err).to.not.be.ok();
                expect(code).to.be(0);
                expect(data).to.be(null);

                buffered(__dirname + '/fixtures/foo', null, {
                    stdio: ['pipe', 'ignore', 'pipe'],
                }, function (err, data, code) {
                    expect(err).to.not.be.ok();
                    expect(code).to.be(0);
                    expect(data).to.be(null);

                    next();
                });
            });
        });
    });

    it('should not mutate args nor options', function (next) {
        var args = [];
        var options = {};

        buffered(__dirname + '/fixtures/foo', function (err, data, code) {
            expect(err).to.not.be.ok();
            expect(code).to.be(0);

            expect(args).to.have.length(0);
            expect(Object.keys(options)).to.have.length(0);

            next();
        });
    });

    it('should give correct exit code', function (next) {
        buffered('node', [__dirname + '/fixtures/exit'], function (err, data, code) {
            expect(err).to.not.be.ok();
            expect(code).to.be(25);

            next();
        });
    });

    it('should work with a relative command', function (next) {
        buffered(path.relative(process.cwd(), __dirname + '/fixtures/foo'), function (err, data, code) {
            expect(err).to.not.be.ok();
            expect(code).to.be(0);
            expect(data.trim()).to.equal('foo');

            if (!isWin) {
                return next();
            }

            buffered(path.relative(process.cwd(), __dirname + '/fixtures/foo.bat'), function (err, data, code) {
                expect(err).to.not.be.ok();
                expect(code).to.be(0);
                expect(data.trim()).to.equal('foo');

                next();
            });
        });
    });

    it('should emit "error" and "close" if command does not exist', function (next) {
        var spawned;
        var errors = [];
        var timeout;

        this.timeout(5000);

        spawned = spawn('somecommandthatwillneverexist')
        .on('error', function (err) {
            errors.push(err);
        })
        .on('exit', function () {
            spawned.removeAllListeners();
            clearTimeout(timeout);
            next(new Error('Should not emit exit'));
        })
        .on('close', function (code, signal) {
            expect(code).to.not.be(0);
            expect(signal).to.be(null);

            timeout = setTimeout(function () {
                var err;

                expect(errors).to.have.length(1);

                err = errors[0];
                expect(err).to.be.an(Error);
                expect(err.message).to.contain('spawn');
                expect(err.message).to.contain('ENOENT');
                expect(err.message).to.not.contain('undefined');
                expect(err.code).to.be('ENOENT');
                expect(err.errno).to.be('ENOENT');
                expect(err.syscall).to.contain('spawn');
                expect(err.syscall).to.not.contain('undefined');

                next();
            }, 1000);
        });
    });

    it('should NOT emit "error" if shebang command does not exist', function (next) {
        var spawned;
        var exited;
        var timeout;

        this.timeout(5000);

        spawned = spawn(__dirname + '/fixtures/shebang_enoent')
        .on('error', function (err) {
            spawned.removeAllListeners();
            clearTimeout(timeout);
            next(new Error('Should not emit error'));
        })
        .on('exit', function () {
            exited = true;
        })
        .on('close', function (code, signal) {
            expect(code).to.not.be(0);
            expect(signal).to.be(null);
            expect(exited).to.be(true);

            timeout = setTimeout(next, 1000);
        });
    });

    it('should NOT emit "error" if the command actual exists but exited with 1', function (next) {
        var spawned;
        var exited;
        var timeout;

        this.timeout(5000);

        spawned = spawn(__dirname + '/fixtures/exit1')
        .on('error', function (err) {
            spawned.removeAllListeners();
            clearTimeout(timeout);
            next(new Error('Should not emit error'));
        })
        .on('exit', function () {
            exited = true;
        })
        .on('close', function (code, signal) {
            expect(code).to.not.be(0);
            expect(signal).to.be(null);
            expect(exited).to.be(true);

            timeout = setTimeout(next, 1000);
        });
    });
});
