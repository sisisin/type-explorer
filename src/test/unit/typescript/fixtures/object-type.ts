export type FooObject = {
  foo: number | number[];
  bar: BarObject;
};

type BarObject = {
  a: number;
  b: string;
  c: AliasOfBoolean;
};

export type AliasOfBoolean = boolean;

type BazObject = {
  baz: AliasOfString | string[];
  boo: {
    a: 1;
    b: '';
  };
};
type AliasOfString = string;
