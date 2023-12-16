class Polynomial {

    constructor() {
        this.terms = new Map();
        this.isValid = false;
    }

    addTerm(coefficient, variables, exponent) {
        // In JavaScript, we'll use a stringified object as the key
        const termKey = JSON.stringify({ [variables]: exponent });
        const currentCoefficient = this.terms.get(termKey) || 0;
        this.terms.set(termKey, currentCoefficient + coefficient);
    }

    multiply(other) {
        const result = new Map();

        for (const [term1Key, coeff1] of other.terms) {
            const term1 = JSON.parse(term1Key);

            for (const [term2Key, coeff2] of this.terms) {
                const term2 = JSON.parse(term2Key);
                const combinedTerm = { ...term1 };

                for (const variable in term2) {
                    if (combinedTerm.hasOwnProperty(variable)) {
                        combinedTerm[variable] += term2[variable];
                    } else {
                        combinedTerm[variable] = term2[variable];
                    }
                }

                const combinedTermKey = JSON.stringify(combinedTerm);
                const currentCoefficient = result.get(combinedTermKey) || 0;
                result.set(combinedTermKey, currentCoefficient + coeff1 * coeff2);
            }
        }

        this.terms = result;
    }

    add(other) {
        for (const [termKey, coeff] of other.terms) {
            const currentCoefficient = this.terms.get(termKey) || 0;
            this.terms.set(termKey, currentCoefficient + coeff);
        }
    }

    checkMax(other) {
        for (const [termKey, coeff] of other.terms) {
            const term = JSON.parse(termKey);
            if (this.terms.has(termKey)) {
                const thisCoeff = this.terms.get(termKey);
                const exponents1 = Object.values(term);
                const exponents2 = Object.values(JSON.parse(termKey));

                const maxExponent1 = Math.max(...exponents1);
                const maxExponent2 = Math.max(...exponents2);

                if (maxExponent1 > maxExponent2) {
                    return other;
                } else if (maxExponent1 < maxExponent2) {
                    return this;
                }

                if (coeff > thisCoeff) {
                    return other;
                } else if (coeff < thisCoeff) {
                    return this;
                }
            }
        }

        return this;
    }

    print() {
        if (this.isValid) {
            return "Infinite";
        }

        // Convert the Map to an array for sorting
        const sortedTerms = Array.from(this.terms).map(([termKey, coeff]) => ({
            term: JSON.parse(termKey),
            coefficient: coeff
        }));

        // Here you should implement your sorting logic
        // For the purpose of this example, I'll sort by the first term's exponent, descending
        sortedTerms.sort((a, b) => {
            const expA = Object.values(a.term).reduce((acc, exp) => acc + exp, 0);
            const expB = Object.values(b.term).reduce((acc, exp) => acc + exp, 0);
            return expB - expA;
        });

        // Construct the polynomial string
        let polynomial = "T(n) = ";
        let firstTerm = true;
        for (const { term, coefficient } of sortedTerms) {
            if (coefficient !== 0) {
                if (!firstTerm) {
                    polynomial += coefficient > 0 ? " + " : " - ";
                }

                let coef = Math.abs(coefficient);

                if (Math.floor(coef) !== coef) {
                    // Assuming decimalToFraction is a function that returns a string representation of the fraction
                    polynomial += decimalToFraction(coef, "n");
                } else {
                    polynomial += coef.toString();
                    const sortedVariables = Object.entries(term).sort((a, b) => b[1] - a[1]);
                    for (const [variable, exponent] of sortedVariables) {
                        if (variable.includes("log")) {
                            let v = variable.substring(variable.indexOf(")") + 1);
                            let num = parseInt(variable.substring(0, variable.indexOf("l")), 10);

                            polynomial += ` log(${num}`;

                            if (exponent * 10 / num > 1) {
                                polynomial += `)^${exponent * 10 / num} ${v}`;
                            } else {
                                polynomial += `) ${v}`;
                            }

                        } else {
                            let isCancelled = false;
                            if (variable.includes("sqrt") && exponent === 1) {
                                variable = "n";
                                isCancelled = true;
                            }
                         
                            polynomial += `${variable}`;
                            if (exponent > 1 && !isCancelled) {
                                polynomial += `^${exponent}`;
                            }
                        }
                    }
                }

                firstTerm = false;
            }
        }

        return polynomial;
    }

}
function gcd(a, b) {
    if (a == 0)
        return b;
    else if (b == 0)
        return a;
    if (a < b)
        return gcd(a, b % a);
    else
        return gcd(b, a % b);
}

function decimalToFraction(number, str) {

    let ans = [];
    // Fetch letegral value of the decimal
    let letVal = Math.floor(number);

    // Fetch fractional part of the decimal
    let fVal = number - letVal;

    // Consider precision value to
    // convert fractional part to
    // letegral equivalent
    let pVal = 1000000000;

    // Calculate GCD of letegral
    // equivalent of fractional
    // part and precision value
    let gcdVal = gcd(Math.round(
        fVal * pVal), pVal);

    // Calculate num and deno
    let num = Math.round(fVal * pVal) / gcdVal;
    let deno = pVal / gcdVal;

    // Print the fractionb
    // Construct the fraction string
    let fraction = (letVal * deno + num) + str + "/" + deno;

    // Return the fraction string
    return fraction;

}

module.exports = Polynomial;