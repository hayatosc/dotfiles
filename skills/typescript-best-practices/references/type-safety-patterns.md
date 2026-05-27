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

TypeScript's type system is structural (shape-based), which means different types with the same shape (e.g., raw primitive strings/numbers or similar objects) are assignable to each other. To prevent logical bugs from accidentally mixing values that share the same runtime representation, actively use **branded types** (also called **opaque types**) to emulate nominal (name-based) typing.

Actively model core domain models (like unique identifiers, units of measurement, and input schemas) with branded types. It adds substantial compile-time safety and self-documentation to the codebase.

### Branding Patterns

Choose the level of strictness that matches your safety requirements:

#### 1. Strong Branding (Property-Based)
Use a shared generic utility to quickly define branded primitives. This is suitable for general domain boundaries where standardizing brand keys is preferred.

```ts
type Branded<T, Brand> = T & { readonly __brand: Brand };

type UserId = Branded<string, "UserId">;
type OrderId = Branded<string, "OrderId">;

// @ts-expect-error - Different brands cannot be assigned to each other
const bad: UserId = "order_123" as OrderId;
```

#### 2. Strict Branding (Symbol-Based)
For sensitive domain boundaries (e.g., security tokens, critical database keys, or money/currency), use a non-exported `unique symbol` as the brand key. This makes it impossible for code outside the defining module to manually cast a primitive using a plain property brand.

```ts
// In user-domain.ts
declare const userIdBrand: unique symbol;
export type UserId = string & { readonly [userIdBrand]: "UserId" };

// Only functions exported from user-domain.ts can construct a UserId
```

#### 3. Weak Branding (Flavored Types)
If strong branding is too restrictive (e.g., you want to allow passing raw string literals to functions accepting branded IDs, but still prevent passing a `UserId` to an `OrderId` parameter), make the brand property optional.

```ts
type Flavored<T, Brand> = T & { readonly __flavor?: Brand };

type UserId = Flavored<string, "UserId">;
type OrderId = Flavored<string, "OrderId">;

let raw: string = "user_123";
let userId: UserId = raw; // OK: primitives can be assigned to flavored types

// @ts-expect-error - Different flavors cannot be assigned to each other
let orderId: OrderId = userId;
```

### Validation & Construction Boundaries

Never cast a value to a branded type (`as UserId`) directly in the application flow. Instead, encapsulate the type assertion inside a dedicated validation boundary or constructor helper.

#### 1. Runtime Type Predicates (`is`)
Use type predicates when you want to safely check and narrow a primitive's type dynamically:

```ts
type Positive = Branded<number, "Positive">;

function isPositive(n: number): n is Positive {
  return n > 0;
}
```

#### 2. Assertion Functions (`asserts is`)
Use assertion functions at entry points (like API boundaries or form submissions) to validate and enforce invariants, throwing readable errors when invariants fail.

```ts
function assertPositive(n: number): asserts n is Positive {
  if (n <= 0) {
    throw new Error(`Invalid positive number: ${n}`);
  }
}
```

#### 3. Reusable Constructor Factories
Use factories to bundle runtime validation with type casting, ensuring that every branded value in the system has passed validation rules:

```ts
function createBrandedConstructor<T, Brand>(
  validator: (val: T) => boolean,
  errorMessage: (val: T) => string
) {
  return (val: T): Branded<T, Brand> => {
    if (!validator(val)) {
      throw new Error(errorMessage(val));
    }
    return val as Branded<T, Brand>;
  };
}

export const asEmailAddress = createBrandedConstructor<string, "EmailAddress">(
  (email) => email.includes("@"),
  (email) => `Invalid email format: ${email}`
);
```

### Common Use Cases & Limitations

- **Domain Identifiers**: Distinguish between `UserId`, `OrgId`, `PostId`, and `CommentId` to catch parameter-swapping bugs at compile time.
- **Validated Content**: Model strings that require parsing or sanitization, such as `EmailAddress`, `Url`, or `SafeHtml`.
- **Units of Measure**: Distinguish numeric values with units, such as `Meters`, `Kilometers`, or `Seconds`.
  - **WARNING**: In TypeScript, binary arithmetic operations (like `+`, `-`, `*`) on branded numbers discard the brand and return a plain `number`. Be prepared to re-cast or re-validate the result of calculations when passing the result back to branded boundaries:
    ```ts
    const distance1 = 10 as Meters;
    const distance2 = 20 as Meters;
    const totalRaw = distance1 + distance2; // type is plain number
    const total = totalRaw as Meters; // re-cast/assert if safe
    ```

### Type-Level Testing

To guarantee your brands behave correctly in the type system, write compile-time tests using `@ts-expect-error` to assert type boundaries:

```ts
// type-tests.ts
import { asEmailAddress } from "./email";
import type { UserId } from "./user";

const email = asEmailAddress("test@example.com");

// @ts-expect-error - Raw string cannot be assigned to strong brand EmailAddress
const badEmail: EmailAddress = "plain-string";

// @ts-expect-error - Different brands must not be compatible
const badUser: UserId = email;
```

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
