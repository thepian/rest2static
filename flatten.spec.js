const flatten = require("./flatten");

describe("Flatten", function() {
  it("Should extract with array spec", function() {
    const out = flatten([{ a: "a" }], [{a: 1},{a: 2},{a: 3}]);
    expect(out).toEqual([{a: 1},{a: 2},{a: 3}]);
  });

  it("Should extract value to multiple names", function() {
    const out = flatten([{ a: "a b c" }], [{a: 1},{a: 2},{a: 3}]);
    expect(out).toEqual([{a: 1, b: 1, c: 1},{a: 2, b: 2, c: 2},{a: 3, b: 3, c: 3}]);
  });

  it("Should allow simple ! expression", function() {
    const out = flatten([{ a: "a", b: "!" }], [{a: 1, b: false},{a: 2, b: false},{a: 3, b: false}]);
    expect(out).toEqual([{a: 1},{a: 2},{a: 3}]);
  });

  it("Should allow skip when disabled: ! is triggered", function() {
    const out = flatten([{ a: "a", b: "!" }], [{a: 1, b: false},{a: 2, b: true},{a: 3, b: false}]);
    expect(out).toEqual([{a: 1},{a: 3}]);
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
    const out = flatten([{ a: "a", b: "b", c: { d: "d" } }], [{a: 1},{a: 2},{a: 3}]);
    expect(out).toEqual([{a: 1},{a: 2},{a: 3}]);

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
