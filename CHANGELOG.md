# Changelog

## 3.0.0 (2023-04-03)

**Breaking changes:**

This version is a complete rewrite of the extension. The usage also changed drastically.\
If you are upgrading from a previous version your current code will still work but none of the binding functionality is activated.\
Read the README to see how to implement this version.

**Improvements**

- `bind` tags are no longer needed

**Bugfixes**

- Context can now contain references to itself (i.e. circular structure) and will no longer cause an infinite loop

**Known issues**

- Included template parts (i.e. using the `include` tag) will not re-render when the context is updated
- Sometimes unchanged nodes are recreated in the DOM when updating context causing their state to be lost unnecessarily
- Only first level nodes are re-rendered which means that variables used in deeply nested children might not reflect their actual value unless the parent (which is re-rendered also uses that variable)