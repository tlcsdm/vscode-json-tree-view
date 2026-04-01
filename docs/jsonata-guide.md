# JSONata Expression Guide

[JSONata](https://jsonata.org/) is a lightweight query and transformation language for JSON data. This guide explains how to use JSONata expressions within the JSON Tree View extension.

## Getting Started

1. Open a JSON, JSONC, or JSON5 file in VS Code
2. Open the JSON Tree View (using `Ctrl+Shift+J` / `Cmd+Shift+J`, or right-click → "Open JSON Tree View")
3. Enter a JSONata expression in the **JSONata Expression** input field at the bottom of the panel
4. Press `Enter` or wait for the auto-evaluation (500ms debounce)
5. The result will appear in the result area below the input

## Basic Syntax

### Accessing Fields

Given the following JSON:

```json
{
  "name": "Alice",
  "age": 30,
  "address": {
    "city": "Beijing",
    "zip": "100000"
  }
}
```

| Expression | Result | Description |
|---|---|---|
| `name` | `"Alice"` | Access a top-level field |
| `address.city` | `"Beijing"` | Access a nested field |
| `address.zip` | `"100000"` | Access another nested field |

### Accessing Array Elements

Given the following JSON:

```json
{
  "users": [
    { "name": "Alice", "age": 30 },
    { "name": "Bob", "age": 25 },
    { "name": "Charlie", "age": 35 }
  ]
}
```

| Expression | Result | Description |
|---|---|---|
| `users[0]` | `{ "name": "Alice", "age": 30 }` | First element |
| `users[-1]` | `{ "name": "Charlie", "age": 35 }` | Last element |
| `users.name` | `["Alice", "Bob", "Charlie"]` | All names from the array |
| `users[0].name` | `"Alice"` | Specific field from first element |

## Filtering

Use filter expressions within square brackets to select matching elements:

| Expression | Result | Description |
|---|---|---|
| `users[age > 28]` | Elements with age > 28 | Filter by condition |
| `users[age >= 30].name` | `["Alice", "Charlie"]` | Names of users aged 30+ |
| `users[name = "Bob"]` | `{ "name": "Bob", "age": 25 }` | Filter by exact match |

## Operators

### Comparison Operators

| Operator | Description | Example |
|---|---|---|
| `=` | Equal | `users[age = 30]` |
| `!=` | Not equal | `users[age != 30]` |
| `>` | Greater than | `users[age > 25]` |
| `>=` | Greater or equal | `users[age >= 30]` |
| `<` | Less than | `users[age < 30]` |
| `<=` | Less or equal | `users[age <= 30]` |

### Arithmetic Operators

| Operator | Description | Example |
|---|---|---|
| `+` | Addition | `age + 5` |
| `-` | Subtraction | `age - 5` |
| `*` | Multiplication | `age * 2` |
| `/` | Division | `age / 2` |
| `%` | Modulo | `age % 10` |

### String Concatenation

Use `&` to concatenate strings:

```
name & " is " & $string(age) & " years old"
```

Result: `"Alice is 30 years old"`

## Built-in Functions

### String Functions

| Function | Description | Example |
|---|---|---|
| `$string(value)` | Convert to string | `$string(42)` → `"42"` |
| `$length(str)` | String length | `$length("hello")` → `5` |
| `$substring(str, start, length)` | Extract substring | `$substring("hello", 0, 3)` → `"hel"` |
| `$uppercase(str)` | Convert to uppercase | `$uppercase("hello")` → `"HELLO"` |
| `$lowercase(str)` | Convert to lowercase | `$lowercase("HELLO")` → `"hello"` |
| `$trim(str)` | Remove whitespace | `$trim("  hi  ")` → `"hi"` |
| `$contains(str, pattern)` | Check if contains | `$contains("hello", "ell")` → `true` |
| `$replace(str, pattern, replacement)` | Replace text | `$replace("hello", "l", "r")` → `"herro"` |
| `$split(str, separator)` | Split string | `$split("a,b,c", ",")` → `["a","b","c"]` |
| `$join(arr, separator)` | Join array | `$join(["a","b"], ",")` → `"a,b"` |

### Numeric Functions

| Function | Description | Example |
|---|---|---|
| `$number(value)` | Convert to number | `$number("42")` → `42` |
| `$abs(n)` | Absolute value | `$abs(-5)` → `5` |
| `$floor(n)` | Floor | `$floor(3.7)` → `3` |
| `$ceil(n)` | Ceiling | `$ceil(3.2)` → `4` |
| `$round(n, precision)` | Round | `$round(3.456, 2)` → `3.46` |
| `$power(base, exp)` | Power | `$power(2, 3)` → `8` |
| `$sqrt(n)` | Square root | `$sqrt(16)` → `4` |

### Aggregation Functions

| Function | Description | Example |
|---|---|---|
| `$sum(array)` | Sum of numbers | `$sum(users.age)` |
| `$max(array)` | Maximum value | `$max(users.age)` |
| `$min(array)` | Minimum value | `$min(users.age)` |
| `$average(array)` | Average value | `$average(users.age)` |
| `$count(array)` | Count elements | `$count(users)` |

### Array Functions

| Function | Description | Example |
|---|---|---|
| `$count(array)` | Count elements | `$count(users)` → `3` |
| `$append(arr1, arr2)` | Append arrays | `$append([1,2], [3,4])` → `[1,2,3,4]` |
| `$sort(array)` | Sort array | `$sort(users, function($a,$b){ $a.age > $b.age })` |
| `$reverse(array)` | Reverse array | `$reverse([1,2,3])` → `[3,2,1]` |
| `$distinct(array)` | Remove duplicates | `$distinct([1,1,2,3])` → `[1,2,3]` |
| `$map(array, func)` | Map function | `$map(users, function($v){ $v.name })` |
| `$filter(array, func)` | Filter function | `$filter(users, function($v){ $v.age > 28 })` |
| `$reduce(array, func)` | Reduce function | `$reduce([1,2,3], function($prev,$cur){ $prev + $cur })` |

### Object Functions

| Function | Description | Example |
|---|---|---|
| `$keys(obj)` | Get object keys | `$keys(address)` → `["city", "zip"]` |
| `$values(obj)` | Get object values | `$values(address)` |
| `$lookup(obj, key)` | Lookup by key | `$lookup(address, "city")` |
| `$merge(arr)` | Merge objects | `$merge([{"a":1}, {"b":2}])` → `{"a":1,"b":2}` |
| `$type(value)` | Get type | `$type(42)` → `"number"` |

### Date/Time Functions

| Function | Description | Example |
|---|---|---|
| `$now()` | Current timestamp | `$now()` → `"2024-01-01T00:00:00.000Z"` |
| `$millis()` | Current milliseconds | `$millis()` |
| `$toMillis(str)` | Parse to milliseconds | `$toMillis("2024-01-01")` |
| `$fromMillis(ms)` | Format from milliseconds | `$fromMillis(1704067200000)` |

## Transformation Examples

### Restructure Data

Transform the structure of JSON data:

```
{
  "total": $count(users),
  "names": users.name,
  "oldest": users[$max(users.age) = age].name
}
```

### Create a Summary

```
{
  "count": $count(users),
  "averageAge": $round($average(users.age), 1),
  "youngest": $min(users.age),
  "oldest": $max(users.age)
}
```

### Conditional Logic

Use ternary-style conditions:

```
users.(age >= 30 ? name & " is senior" : name & " is junior")
```

### Wildcard Navigation

Use `**` to search at any depth in the object:

```
**.name
```

This returns all `name` fields regardless of their nesting depth.

## Tips

- Expressions are evaluated against the full JSON document loaded in the tree view
- Use `$` to reference the root of the document
- Use `$$` to reference the current context
- Errors in expressions will be shown in the result area
- Complex expressions can be tested incrementally — start simple and build up

## Further Resources

- [JSONata Documentation](https://docs.jsonata.org/)
- [JSONata Exerciser (Online Playground)](https://try.jsonata.org/)
