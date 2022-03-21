import * as R from 'ramda';

() => {
    interface FormatSpec {
        indent: number;
        value: string;
    }

    const indentN = R.pipe(R.times(R.always(' ')), R.join(''), R.replace(/^(?!$)/gm));

    // $ExpectType (args_0: FormatSpec) => string
    const format = R.converge(R.call, [
        ({ indent }: FormatSpec) => indentN(indent),
        ({ value }: FormatSpec) => value,
    ] as const);

    // $ExpectType string
    const indented = format({ indent: 2, value: 'foo\nbar\nbaz\n' }); // => '  foo\n  bar\n  baz\n'
};

() => {
    const add = (a: number, b: number) => a + b;
    const multiply = (a: number, b: number) => a * b;
    const subtract = (a: number, b: number) => a - b;
    const concat = (a: string, b: string) => a + b;

    const add3 = (a: number, b: number, c: number) => a + b + c;
    const add10 = (
        a: number,
        b: number,
        c: number,
        d: number,
        e: number,
        f: number,
        g: number,
        h: number,
        i: number,
        j: number,
    ) => a + b + c + d + e + f + g + h + i + j;

    // ≅ multiply( add(1, 2), subtract(1, 2) );
    // $ExpectType (a: number, b: number) => number
    const fn = R.converge(multiply, [add, subtract]);

    // $ExpectType number
    const x = fn(1, 2);

    // $ExpectError
    fn('1', 2);

    // $ExpectError
    fn(1, 2, 3);

    // $ExpectError
    const fnMismatchedTypesV1 = R.converge(concat, [add, subtract]);

    // for more helpful error messages better to use const
    // $ExpectError
    const fnMismatchedTypesV2 = R.converge(concat, [add, subtract] as const);

    // $ExpectError
    const fnWrongNumberOfBranchesV1 = R.converge(concat, []);

    // $ExpectError
    const fnWrongNumberOfBranchesV2 = R.converge(add10, [
        multiply,
        add,
        subtract,
        multiply,
        add,
        subtract,
        multiply,
        add,
        subtract,
        multiply,
        add,
        subtract,
    ]);

    // $Expect () => void
    const emptyFunction = R.converge(() => {}, []);

    // because last function in branches has arity of 3 result function also must have largest arity
    // $ExpectType (a: number, b: number, c: number) => number
    const fn10 = R.converge(add10, [add, multiply, add, multiply, add, subtract, multiply, add, subtract, add3]);

    // $ExpectType number
    const mathOperartionResult = fn10(1, 2, 3);

    // $ExpectType (a: number, b: number, c: number) => number
    const fn3 = R.converge(multiply, [multiply, add3]);

    const args1 = (a1: number | string) => 1;
    const args2 = (a1: number | symbol, a2: { q: string }) => 2;
    const args3 = (a1: number | bigint, a2: { w: number }, a3: number) => 3;

    // resulted function must accept types of parameters that will satisfy every function in branches, so intersection must be used
    // $ExpectType (a1: number, a2: { w: number; } & { q: string; }, a3: number) => number
    const intersectionOfArguments = R.converge(add3, [args1, args2, args3]);

    // $ExpectType number
    const resultNumber = intersectionOfArguments(1, { q: 'text', w: 22 }, 11);

    // $ExpectError
    const errorArguments = intersectionOfArguments(1, { q: 'text' }, 11);

    const addGeneric = <T>(a: T, b: T): T => b;

    // need to use const if converging function is generic
    // $ExpectType (a: number, b: number) => number
    const withGeneric0 = R.converge(addGeneric, [multiply, subtract] as const);

    // unable to infer types correctly because generic `R.or` has overloads with different number of arguments
    // $ExpectType (a: number, b: number) => <U>(b: U) => unknown
    const withGenericWorongInferred = R.converge(R.or, [add, subtract] as const);

    // need to use wrapper `(...args) => convergingFunction(...args)` if converging function
    // is generic that has overloads with different number of arguments
    // $ExpectType (a: number, b: number, c: number) => number
    const withGeneric1 = R.converge((...args) => R.or(...args), [add, add3] as const);

    // or explicitly set type for converging function arguments
    // $ExpectType (a: number, b: number) => number
    const withGeneric2 = R.converge((...args: [number, number]) => R.or(...args), [add, subtract]);

    // $ExpectType (list: readonly number[] & ArrayLike<unknown>) => number
    const getAverage = R.converge((...args) => R.divide(...args), [R.sum, R.length] as const);

    // $ExpectType number
    const average = getAverage([1, 3, 0, 4]); // => 2

    // $ExpectType (a: number, b: number) => <U>(b: U) => number | U
    const withGenericMultiLevelTypeInference = R.converge((...args) => R.or(...args), [add] as const);
};
