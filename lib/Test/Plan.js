var assert = require('assert');

function Plan(count, done) {
  this.done = done;
  this.count = count;
  this.ok = this.ok.bind(this);
}

Plan.prototype.ok = function () {

  if (this.count === 0) {
    assert(false, 'Too many assertions called');
  } else {
    this.count--;
  }

  if (this.count === 0) {
    this.done();
  }
};

exports = Plan;
