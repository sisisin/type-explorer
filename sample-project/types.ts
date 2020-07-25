type Baz = number;
type Bar = {
  a: string[] | string;
  baz: Baz;
};

type Bar1 = { b: string[] };

export type Foo = {
  x: string;
  bar?: Bar;
};
