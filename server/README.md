### Pre-requisites
Create a MongoDB database named `collaborativeTodoList` with a collection named `yDocUpdates`
Also create index on `docId` and `version` in `yDocUpdates` collection.

Create a .env file

```bash
PORT=3000
MONGODB_URI=mongodb://localhost:27017/collaborativeTodoList
MONGODB_NAME=collaborativeTodoList
CLIENT_URL=http://localhost:5173
Y_DOC_DB_PERSIST_INTERVAL=20  // After how many YDoc updates to persist to DB.
```


### Installation
```bash
npm install
```

### Usage
```bash
npm run dev
```