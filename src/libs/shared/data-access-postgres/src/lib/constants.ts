export const POSTGRESQL_PROMPT_TEMPLATE_INSTRUCTIONS = `
IMPORTANT SECURITY NOTE:
- All queries must be read-only (SELECT statements only)
- Do not generate any DML (INSERT, UPDATE, DELETE) or DDL (CREATE, ALTER, DROP) statements
- This is to prevent SQL injection and ensure data safety

Here are some PostgreSQL SQL syntax specifics you should be aware of:
- PostgreSQL is ANSI SQL compliant with extensive extensions and advanced features
- PostgreSQL uses single quotes (') for string literals and double quotes (") for identifiers
- PostgreSQL has strong type checking and supports custom types, domains, and composite types
- PostgreSQL supports materialized views that can be refreshed manually or automatically
- PostgreSQL has advanced indexing support including B-tree, Hash, GiST, SP-GiST, GIN, and BRIN
- PostgreSQL supports ACID transactions with multiple isolation levels
- PostgreSQL supports both OLAP and OLTP workloads with features like:
  - Partitioning: Range, list, and hash partitioning for large tables
  - Inheritance: Table inheritance for hierarchical data structures
  - Foreign Data Wrappers: Access external data sources
  - Parallel Query: Automatic parallelization for large queries
- PostgreSQL has extensive JSON/JSONB support with rich operators and functions
- PostgreSQL supports advanced window functions, CTEs, and recursive queries
- PostgreSQL supports user-defined functions in multiple languages (SQL, PL/pgSQL, Python, etc.)

Common PostgreSQL Functions:
'count': Counts the number of rows or non-null values in a column
'sum': Calculates the sum of values in a column
'max': Returns the maximum value in a column
'min': Returns the minimum value in a column
'avg': Calculates the average of values in a column
'coalesce': Returns the first non-null value from a list of expressions
'date_trunc': Truncates a date or timestamp to a specified precision
'row_number': Assigns a unique sequential number to each row in a result set (window function, requires OVER clause)
'unnest': Expands an array into a set of rows
'array_agg': Aggregates values into an array
'string_agg': Concatenates strings with a delimiter
'generate_series': Generates a series of values
'extract': Extracts parts from date/time values
'to_char': Converts values to formatted strings
'to_date': Converts strings to date values
'to_timestamp': Converts strings to timestamp values
'json_extract_path': Extracts a value from a JSON document using a path
'jsonb_extract_path': Extracts a value from a JSONB document using a path
'array_length': Returns the length of an array
'cardinality': Returns the number of elements in an array
'concat': Concatenates strings or arrays
'split_part': Splits a string and returns the specified part
'regexp_replace': Replaces text using regular expressions
'regexp_matches': Returns matches from regular expression search

Common PostgreSQL Statements:
'SELECT': Retrieves data from one or more tables
'FROM': Specifies the source tables for a query
'WHERE': Filters rows based on specified conditions
'GROUP BY': Groups rows by specified columns
'HAVING': Filters groups based on specified conditions
'ORDER BY': Sorts the result set by specified columns
'LIMIT': Limits the number of rows returned
'OFFSET': Skips a specified number of rows
'JOIN': Combines rows from multiple tables (INNER, LEFT, RIGHT, FULL OUTER, CROSS)
'UNION': Combines the results of multiple SELECT statements
'INTERSECT': Returns rows common to multiple SELECT statements
'EXCEPT': Returns rows from first SELECT that are not in the second
'WITH': Defines Common Table Expressions (CTEs)
'WINDOW': Defines window specifications for window functions
'LATERAL': Allows subqueries to reference columns from preceding tables
'TABLESAMPLE': Samples a percentage or number of rows from a table

Common PostgreSQL Types:
'BOOLEAN': True/false values (also BOOL)
'SMALLINT': 2-byte signed integer (-32,768 to 32,767)
'INTEGER': 4-byte signed integer (-2^31 to 2^31-1) (also INT)
'BIGINT': 8-byte signed integer (-2^63 to 2^63-1)
'REAL': 4-byte floating point (also FLOAT4)
'DOUBLE PRECISION': 8-byte floating point (also FLOAT8)
'NUMERIC': Arbitrary precision decimal (also DECIMAL)
'SERIAL': Auto-incrementing 4-byte integer
'BIGSERIAL': Auto-incrementing 8-byte integer
'DATE': Date without time
'TIME': Time without date
'TIMESTAMP': Date and time without timezone
'TIMESTAMPTZ': Date and time with timezone
'INTERVAL': Time interval
'CHAR': Fixed-length string (also CHARACTER)
'VARCHAR': Variable-length string (also CHARACTER VARYING)
'TEXT': Variable-length string with no limit
'JSON': JSON data stored as text
'JSONB': Binary JSON data with indexing support
'UUID': Universally unique identifier
'BYTEA': Binary data
'ARRAY': Array of any data type
'COMPOSITE': User-defined composite types
'ENUM': User-defined enumeration types
'RANGE': Range types (int4range, tsrange, etc.)
'INET': IPv4 or IPv6 network address
'CIDR': IPv4 or IPv6 network specification
'MACADDR': MAC address

Common PostgreSQL Keywords:
'AS': Creates an alias for a column or table
'DISTINCT': Removes duplicate rows
'DISTINCT ON': Removes duplicates based on specified expressions
'IN': Tests if a value is in a set of values
'NOT IN': Tests if a value is not in a set of values
'OVER': Specifies a window for window functions
'PARTITION BY': Partitions data for window functions
'LIKE': Tests if a string matches a pattern
'ILIKE': Case-insensitive pattern matching
'SIMILAR TO': SQL standard regular expression matching
'~': Regular expression match (case-sensitive)
'~*': Regular expression match (case-insensitive)
'IS NULL': Tests if a value is NULL
'IS NOT NULL': Tests if a value is not NULL
'IS DISTINCT FROM': Null-safe inequality comparison
'IS NOT DISTINCT FROM': Null-safe equality comparison
'BETWEEN': Tests if a value is within a range
'EXISTS': Tests if a subquery returns any rows
'NOT EXISTS': Tests if a subquery returns no rows
'ANY': Tests if a value matches any value in a set (also SOME)
'ALL': Tests if a value matches all values in a set
'UNION': Combines the results of multiple SELECT statements
'UNION ALL': Combines results without removing duplicates
'INTERSECT': Returns the intersection of multiple SELECT statements
'EXCEPT': Returns the difference of multiple SELECT statements
'CASE': Performs conditional logic
'WHEN': Specifies a condition in a CASE statement
'THEN': Specifies the result of a condition in a CASE statement
'ELSE': Specifies the default result in a CASE statement
'END': Ends a CASE statement
'NULLS FIRST': Sorts NULL values first in ORDER BY
'NULLS LAST': Sorts NULL values last in ORDER BY
'USING': Specifies join conditions or operator classes
'NATURAL': Natural join based on common column names
`;
