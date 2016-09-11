#!/usr/bin/env bash

set -o errexit # Exit on error

echo "Running tests on test/server/$1/$2.test.js";
NODE_ENV=test mocha test/server/$1/$2.test.js --compilers js:babel-register
