# How database indexes speed up queries

An index is a data structure that stores selected column values alongside pointers to matching table rows. Like a book’s index, it lets the database consult an ordered guide instead of reading every page.

Many indexes use a B-tree, a balanced tree that keeps keys sorted. For a query such as `WHERE email = 'dev@example.com'`, the database starts at the tree’s root, follows the branch covering the target value, and repeats until it reaches the relevant leaf. Because each step eliminates large portions of the data, the database can locate a small set of rows without performing a full table scan.

Indexes are not free. Every `INSERT`, `UPDATE`, or `DELETE` may require the database to update one or more index structures, sometimes rebalancing tree pages. More indexes therefore mean slower writes, additional storage, and maintenance overhead.

Do not add an index automatically. It may be wasteful on tiny tables, columns with very few distinct values, or columns rarely used for filtering, joining, or sorting. Measure real queries first, and keep indexes whose read-time benefit outweighs their write and storage cost.
