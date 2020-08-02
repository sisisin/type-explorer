export type FooObject = {
  foo: number | number[];
  bar: BarObject;
};

type BarObject = {
  a: number;
  b: string;
  c: AliasOfBoolean;
};

type AliasOfBoolean = boolean;
