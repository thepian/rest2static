// if (typeof data["!"])

/*
  Convert the graph to a stream of objects based on mapping names.
  It emits an object at end of object transfer if it has no nested array, and
  no parent or parent is an array.

  Pure object graphs(no arrays within) are emitted flat.
*/

const emitter = Symbol("Emitter");

/**
 1. Array repeats the single spec for each of the entries.
 2. Object with nested array collects variables for nested entries.
 3. Objects without arrays are flattened and emitted.
 */
function parseSpec(state, spec, parent) {
    if (Array.isArray(spec)) {
        spec[emitter] = arrayEmitter(parseSpec(state, spec[0], spec));
    } else {
        Object.keys(spec).forEach(key => {
            if (typeof spec[key] === "object") {
                parseSpec(state, spec[key], spec);
            }
        });
        if (specHasArray(spec)) {
            spec[emitter] = collectingEmitter(spec, parent);
        } else {
            if (Array.isArray(parent) || !parent) {
                spec[emitter] = mappingEmitter(spec, parent);
            } else {
                spec[emitter] = subMappingEmitter(spec, parent);
            }
        }
    }
    return spec;
}


function arrayEmitter(spec, parent) {
    return (result, seed, data) => {
        if (!data.forEach) {
            spec.error = new Error(`Array Error, ${JSON.stringify(data)}`);
            throw spec.error;
        }
        data.forEach(entry => spec[emitter](result, seed, entry));
    };
}

function collectingEmitter(spec, parent) {
    return (result, seed, data) => {
        const collected = Object.assign({}, seed);
        collect(spec, collected, data, result);
        return result;
    };
}

function mappingEmitter(spec, parent) {
    return (result, seed, data) => {
        const collected = Object.assign({}, seed);
        const apply = collect(spec, collected, data, result);
        if (apply) result.push(collected);
        return result;
    };
}

function subMappingEmitter(spec, parent) {
  return (result, collected, data) => {
      collect(spec, collected, data);
      return result;
  };
}

// !a b c{}="haha"
function parseStringValue(expr, value, lookupValue) {
    const match = /([!])?([\w\s\._-]+)?(\{.*\})?(=.*)?/.exec(expr);
    if (!match) throw new Error(`Couldn't parse ${expr} with ${value}`);
    // if value falsy, skip the entry (post ! mapping)
    const apply = match[1] === "!" ? !value : true;
    const names = match[2] ? match[2].split(" ") : [];
    const rules = match[3]; // future support
    value = value || (match[4] && lookupValue(match[4].substr(1)))

    return {
        names,
        apply,
        expr,
        value
    };
}

const KEYWORDS = {
    "null": null,
    "false": false,
    "true": true
};

function collect(spec, collected, data, result) {
    let applyData = true;
    Object.keys(spec).forEach(key => {
        switch(typeof spec[key]) {
        // string: name to translate key to
        case "string":
            const {apply,names,value} = parseStringValue(spec[key], data[key], expr => {
                if (expr.charAt(0) === '"' || expr.charAt(0) === "'") return expr.substr(1,expr.length-2);
                if (Number(expr) == expr) return Number(expr);
                return data[expr] || KEYWORDS[expr];
            });
            names.forEach(name => {
                collected[name] = value;
            });
            if (!apply) {
                applyData = false;
            }
        }
    });
    Object.keys(spec).forEach(key => {
        // sub object: navigate down
        if (typeof spec[key] === "object" && typeof data[key] === "object") {
            spec[key][emitter](result, collected, data[key])
        }
    });

    return applyData;
}

function specHasArray(spec) {
    return Object.keys(spec).reduce( (has, key) => {
        if (Array.isArray(spec[key]) || has) {
            return true;
        }
        if (typeof spec[key] === "object") {
            return specHasArray(spec[key]);
        }

        return has;
    }, false);
}

/**
 * @param spec Specification of data
 * @param data Object to interpret
 * @return Array with the entries.
 */
module.exports = function flatten(spec, data) {
    const parsed = parseSpec({ level: 0 }, spec);

    const result = [];
    parsed[emitter](result, {}, data);
    return result;
};
