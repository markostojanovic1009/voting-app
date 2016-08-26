#!/usr/bin/env bash

set -o errexit # Exit on error

echo "Arguments passed to bash.sh: $@";
NODE_ENV=test mocha test/server/$1/$2.test.js --compilers js:babel-register
