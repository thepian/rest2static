const flatten = require("./flatten");

describe("Flatten", function() {
  it("Should extract with array spec", function() {
    const out = flatten([{ a: "a" }], [{a: 1},{a: 2},{a: 3}]);
    expect(out).toEqual([{a: 1},{a: 2},{a: 3}]);
  });

  it("Should extract with nested array spec", function() {
    const out = flatten(
      { b: [{ a: "a" }] },
      { b: [{a: 1},{a: 2},{a: 3}] }
    );
    expect(out).toEqual([{a: 1},{a: 2},{a: 3}]);
  });

  it("Should extract with array + complex object spec", function() {
    const out = flatten(
      [{ a: "a", b: { c: "b.c" } }],
      [{a: 1, b: { c: "1234" }}, {a: 2, b: { c: "1234" }}, {a: 3, b: { c: "1234" }}]
    );
    expect(out).toEqual([{a: 1, "b.c": "1234" }, {a: 2, "b.c": "1234"}, {a: 3, "b.c": "1234"}]);
  });

  it("Should extract from partial data", function() {

  });

  // multiple nested arrays (track nesting)

  it("Should extract nested arrays spec", function() {
    const out = flatten(
      [[[{ a: "a" }]]],
      [[[{a: 1},{a: 2},{a: 3}]]]
    );
    expect(out).toEqual([{a: 1},{a: 2},{a: 3}]);
  });
});
