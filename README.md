# Installation

1. Clone the repository
2. Setup and Install Instructions in client and server README.md

## Using Docker
```bash
docker-compose up -d
```

# Architecture

## Decesion between WebRTC and WebSockets

While WebRTC could've been used with its advantages of P2P communication
and low server load, well low server load is when we start the project.
But when it comes to scalling, there are many things to maintain like 
signaling, ICE, STUN, TURN, etc. servers etc. And if there is lots of data to
be transferred and so many clients at the same time, we may also have to 
maintain SFU server. So, we decided to go with WebSockets. WebSockets also
gives us more control compared to WebRTC, it and can be scaled using redis pub/sub.
Also Socket.io offers fallback mechanisms out of the box vie long polling and
transport protocol.

## WebSocket implementaion using socket.io

We maintain connection status before connecting, after connecting or in case of error happens,
and display the status in the UI.
When user first time connects we trigger `emitInitializeDocument` function which
sends the initial document state to the client and listens on `initialize-document` event
to apply the updates. Further we send local updates emiting `client-update` event
and receive updates from server of remote clients listening on `sync-update` event to
apply the updates to the Y.Doc.

## CRDT implementation

We used Yjs for our CRDT implementation. Y.Array for Todo List and Y.Map for
Todo Item. Whenever an update happens to Y.Array `yTodoArrayRef` in our case we
can listen to it using `yArray.observe` and `yArray.observeDeep` events. we are
using `observeDeep` because we want to listen to all the updates happening to
the array including the updates happening to the items inside the array. After we
get the updates from both local and remote we update the state of the Todo List in
our React app.
To sent the local updates to the server we use `yDoc.on("update", (update: Uint8Array) => {})`
event and send the update to the server using socket.io. and we use 
`Y.applyUpdate(ydoc, new Uint8Array(update))` to apply the updates received from the server
to the Y.Doc.
We also use `Y.mergeUpdates` to merge the chunks of updates saved to the database
without creating `Y.doc`.

## Data persistence

We use mongodb to store the updates received from the server. We store the updates between
in a collection called `yDocUpdates` and we maintain the incremental version of the updates
in the database. We use `getLatestYDocUpdateVersion` function to get the latest
version of the updates and `saveYDocUpdateToDB` function to save the chunk update to the 
database which can  be later applied to the Y.Doc. We use `getFullYDocUpdateBuild` function
to get the full  update from the database by applying all the chunk of updates to the Y.Doc.

Using `Y_DOC_DB_PERSIST_INTERVAL` env variable we can set the interval in which
we want to persist the updates to the database. Since it's not efficient to save every
chunk of updates to the database and we save the update when all the clients disconnects
in case db persist interval didn't covered the last update.

Even with db persist interval, we may still store lots of updates in the database and to
manage that we can merge mutiple chunks of updates on some time interval and save the
merged update to the database. We can also maintain snapshots of updates to avoid building
the full YDoc update from the database frequently.

## Scaling considerations

We can scale the server by using multiple instances of the server and using redis pub/sub
to broadcast the updates to the clients and Socket.io gives multiple alternatives to redis pub/sub. 
We can also use `socket.io/cluster-adapter` to make  use of multiple threads from the single server.
Socket.io connections can be managed more robustly using all the different types of events and methods
they provide example, ackTimeout, retries and many others, we can use `manager` from socket.io to listen
on more revents like reconnecting, reconnect_attempt, ping etc.
We can also scale mongodb using replicas and sharding, if we used MongoDB Atlas we may don't have worry
much about scaling mongodb.

## Known limitations
- Since we are using WebSocket server needs to be alive all the time in order clints to make communication.
- Lack of offline support, we could use y-leveldb to store the updates in the browser in case user goes offline
and then sync the updates with the server when user comes back online, but we'll have to take of conflicts.
- MongoDB only supports 16MB of document so may need to split the updates into multiple documents in case of 
large document updates.
- No support for rooms yet any client that connects will see same global document state.
- YJS shared data structures consumes lots of memory.
- Lack of shared locks for concurrent edits, this may lead to confusing behaviour between clients but in rare cases.


### Note
I've written some code for awareness protocol but its not implemented yet, due to lack of time. and I'm already
late to submitting the assignment.
About undo/redo feature, we can use yjs undo manager to implement it for client side.
I tried to research about implementing shared locks for concurrent edits, and I got to know that it'll be harder
to implement really robust concurrent edits in yjs and the need for concurrent edits may occur rarely , even 
yjs maintainers were saying the same.