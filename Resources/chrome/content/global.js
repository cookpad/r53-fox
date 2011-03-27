Function.prototype.bind = function(self) {
  var func = this;

  return function() {
    return func.apply(self, arguments);
  };
}

Array.prototype.uniq = function() {
  var hash = {}

  for (var i = 0; i < this.length; i++) {
    var value = this[i];
    hash[value] = value;
  }

  var array = [];

  for (var i in hash) {
    array.push(i);
  }

  return array;
};
