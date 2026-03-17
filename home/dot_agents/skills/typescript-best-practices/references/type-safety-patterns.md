# Type Safety Patterns

Use this reference when replacing `any`, removing unsafe assertions, or reviewing whether a TypeScript change actually improves safety.

## Type-First Design

For exported APIs, shared utilities, and complex domain logic, design the types before the implementation details. Define the domain shapes, input and output contracts, and invariants first, then write the runtime logic to satisfy those contracts.

This is especially useful when:

- the change introduces a new reusable helper
- the function returns different shapes based on state
- the code models domain concepts such as IDs, statuses, or validated payloads

If the implementation is becoming hard to type, stop and simplify the type model before adding more assertions.

## External Boundaries

Model data from APIs, files, JSON, local storage, the DOM, environment variables, and third-party packages as `unknown` until you prove the shape. Do not assert these values into trusted application types at the point of entry.

```ts
const payload: unknown = await response.json();

if (!isUser(payload)) {
  throw new Error("Invalid user payload");
}
```

Prefer a user-defined type guard or assertion function over `as User`.

## Replacing `any`

- Use generics when the type depends on a caller-supplied value.
- Use unions for a closed set of variants.
- Use utility types to derive new shapes from existing domain types.
- Use `unknown` when the shape is not yet known.
- Use `never` only for impossible states, exhaustiveness checks, and unreachable branches.

If a value truly cannot be typed precisely, contain the unsafety at one small boundary and document why it is safe there.

## Replacing Unsafe `as`

Prefer one of these patterns:

- Control-flow narrowing with `typeof`, `instanceof`, `in`, or null checks
- Discriminated unions for stateful objects
- Type guards for reusable validation logic
- `satisfies` for object literals that must conform without losing inference
- Small refactors that move uncertain data into a validated parsing step

```ts
const config = {
  mode: "strict",
  retries: 3,
} satisfies AppConfig;
```

`as const` is acceptable when you are intentionally preserving literal values for inference. Avoid using it as a shortcut to silence mismatches.

Never use `as unknown as T`. This double-cast pattern defeats the type system entirely — the compiler cannot verify the conversion is safe. If you find yourself writing it, treat it as a signal to redesign the type boundary: add a type guard, introduce a discriminated union, or refactor the data flow so the shape is known before the call site.

## Extract Complex Types

Extract a type when an inline annotation is doing too much work. Good candidates include:

- long unions that encode domain states
- conditional or mapped types reused across files
- function signatures whose return type carries business meaning
- inferred object literals that deserve a stable public name

Prefer descriptive names that explain the role of the type. Use descriptive generic parameter names when they carry domain meaning, and short conventional names only for simple container-style helpers.

## Modeling Shapes

- Prefer `interface` for object shapes that need extension or implementation.
- Prefer `type` for unions, primitive aliases, mapped types, conditional types, and utility-derived shapes.
- Prefer discriminated unions over optional-property state machines when the runtime object can have distinct modes.
- Prefer explicit return types on exported functions and public APIs when the inferred type is non-obvious or too broad.

## Branded Types

Use branded types when two values share the same runtime representation but should not be mixed accidentally, such as `UserId` vs `OrgId`, or raw strings vs validated strings.

```ts
declare const userIdBrand: unique symbol;

type UserId = string & {
  readonly [userIdBrand]: "UserId";
};
```

Brand values at a clear construction or validation boundary. Do not brand everything by default; use the pattern only when it prevents a real class of mistakes.

## Exhaustiveness

Treat non-exhaustive union handling as a bug. The missing branch should fail during development rather than leak to runtime.

```ts
switch (result.kind) {
  case "ok":
    return result.value;
  case "error":
    throw result.error;
  default: {
    const _exhaustive: never = result;
    return _exhaustive;
  }
}
```

## Type-Level Tests

Use compile-time type tests for exported utility types, generic helpers, branded constructors or parsers, and any API where the main failure mode is an incorrect type relationship.

Prefer existing repository tooling first. If the repository already uses `tsd`, `expectTypeOf`, or framework-native type tests, extend that pattern. If not, prefer small `.ts` fixtures validated by the normal typecheck command.

```ts
const userId = parseUserId("user_123");
const ok: UserId = userId;

// @ts-expect-error plain strings are not branded IDs
const bad: UserId = "user_123";
```

Keep these tests focused on type behavior. Do not add a new dependency only to test types unless the user asks for it.

## Review Checklist

- Did the change design the public types before forcing the implementation through assertions?
- Did the change introduce or preserve `any`?
- Did it use `as` where narrowing or a guard would be clearer?
- Did it use `as unknown as T` to silence a type error instead of fixing the type relationship?
- Did it leave a complex inline type that should be extracted and named?
- Did a domain identifier or validated value need a branded type?
- Did a reusable generic or utility type need a compile-time type test?
- Did it duplicate a type that could be derived?
- Did it trust external input without validation?
- Did it widen a public API just to make an internal call compile?
- Did it leave a union or enum partially handled?
