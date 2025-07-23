# Things to do
- Put the battle details to a new route with dynamic route segment. /[battleId]/page.tsx

- Turn the battle results into a table, with columns for query. Use shadcn's datatable for the ui. It uses tanstack table under the hood so read the docs for it using context7.

- Put the "New Battle" button to next of the "Battle Results" title, like on top of the table. And show it in the center if there is no results.

# Simplify

- Simplify how the credentials are stored greatly. Just have one text input for the credentials in the form of a .env file.



```
APPLICATION_ID=123
API_KEY=123
INDEX_NAME=123
```

In the ui, make the provider selectable and show these templates for each provider:

Upstash:
```
UPSTASH_URL=123
UPSTASH_TOKEN=123
UPSTASH_INDEX=123
```

Algolia:
```
ALGOLIA_APPLICATION_ID=123
ALGOLIA_API_KEY=123
ALGOLIA_INDEX=123
```

- Use the same modal for creating and editing a database. Just pass the database id to the modal and it will edit the database with that id.

- Simplify the database list endpoint, just return all the data, including credentials for the database, dont have seperate endpoint for getting the database details.

- Use the same endpoint for creating and editing a database. 