import "./App.css";
import {useCallback, useEffect, useRef, useState} from "react";
import * as Y from "yjs";
import {Awareness} from "y-protocols/awareness";
import {io, Socket} from "socket.io-client";
import {Todo} from "./interfaces/todo.interface";
import TodoItem from "./components/TodoItem.tsx";
import EditTodoItem from "./components/EditTodoItem.tsx";
import {connectionStatuses, ConnectionStatusMessage} from "./interfaces/connection.interface";

function App() {
  const [username, setUsername] = useState<string>();
  const ydocRef = useRef<Y.Doc | null>(null);
  const yTodoArrayRef = useRef<Y.Array<Y.Map<any>> | null>(null);

  const socketRef = useRef<Socket | null>(null);

  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatusMessage>(
    connectionStatuses.disconnected
  );
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTodo, setNewTodo] = useState("");
  const [editTodo, setEditTodo] = useState<Todo | null>(null);

  // Function to update todos state from Y.Array
  const updateTodos = useCallback(() => {
    console.log("updateTodos");
    const currentTodos: Todo[] = [];
    yTodoArrayRef.current?.forEach((yMap: Y.Map<any>) => {
      const id: string | undefined = yMap.get("id");
      const text: string | undefined = yMap.get("text");
      const completed: boolean | undefined = yMap.get("completed");
      const createdAt: number | undefined = yMap.get("createdAt");

      if (id === undefined || text === undefined || completed === undefined || createdAt === undefined) {
        return;
      }
      const todo: Todo = {
        id,
        text,
        completed,
        createdAt,
      };
      currentTodos.push(todo);
    });
    setTodos(currentTodos);
  }, [yTodoArrayRef.current]);

  useEffect(() => {
    setUsername("user" + Math.floor(Math.random() * 10000));
    setConnectionStatus(connectionStatuses.connecting);
    if (!socketRef.current) {
      socketRef.current = io("http://localhost:3000");
    }
    if (!ydocRef.current) {
      ydocRef.current = new Y.Doc();
    }
    const ydoc = ydocRef.current;
    const socket = socketRef.current;
    yTodoArrayRef.current = ydoc.getArray("todos");
    const awareness = new Awareness(ydoc);
    awareness.setLocalState({
      user: {name: username, color: `#${Math.floor(Math.random() * 16777215).toString(16)}`}
    });

    socket.on("connect", () => {
      console.log("connected", socket.id);
      setConnectionStatus(connectionStatuses.connected);
      socket.emit("update-awareness", awareness.getLocalState());
    });

    socket.on("initialize-document", (update: Uint8Array) => {
      console.log("initialize-document");
      Y.applyUpdate(ydoc, new Uint8Array(update));
    });


    ydoc.on("update", (update: Uint8Array) => {
      console.log("Document update");
      socket.emit("client-update", new Uint8Array(update), username);
    });

    yTodoArrayRef.current?.observeDeep(() => {
      console.log("yTodoArray observed changes");
      updateTodos();
    });

    socket.on("sync-update", (update: Uint8Array) => {
      console.log("sync-update");
      Y.applyUpdate(ydoc, new Uint8Array(update));
    });

    socket.on("disconnect", () => {
      console.log("disconnect");
      setConnectionStatus(connectionStatuses.disconnected);
    });

    socket.on("error", (err) => {
      setConnectionStatus(connectionStatuses.error);
      console.error(err);
    });

    return () => {
      socket.disconnect();
      ydoc.destroy();
    };
  }, []);


  const handleAddTodo = () => {
    if (newTodo) {
      const todoYMap = new Y.Map<any>();
      todoYMap.set("id", Date.now().toString());
      todoYMap.set("text", newTodo);
      todoYMap.set("completed", false);
      todoYMap.set("createdAt", Date.now());
      console.log(todoYMap);
      yTodoArrayRef.current?.push([todoYMap]);
      setNewTodo("");
    }
  };

  const toggleTodoStatus = (todoId: string) => {
    const index = yTodoArrayRef.current?.toArray().findIndex((yMap) => yMap.get("id") === todoId);
    if (index !== -1) {
      const todoYMap: Y.Map<any> | undefined = yTodoArrayRef.current?.get(index) as Y.Map<any>;
      todoYMap.set("completed", !todoYMap?.get("completed"));
    }
  };

  const handleSaveEditTodo = (todo: Todo) => {
    const index = yTodoArrayRef.current?.toArray().findIndex((yMap) => yMap.get("id") === todo.id);
    if (index !== -1) {
      const todoYMap = yTodoArrayRef.current?.get(index) as Y.Map<any>;
      todoYMap.set("text", todo.text);
    }
    setEditTodo(null);
  };

  const handleDeleteTodo = (todoId: string) => {
    const index = yTodoArrayRef.current?.toArray().findIndex((yMap) => yMap.get("id") === todoId);
    if (index !== -1) {
      yTodoArrayRef.current?.delete(index);
    }
  };
  return (
    <section className="flex flex-col items-center h-screen w-screen bg-gradient-to-r from-blue-400 to-purple-500">
      <h3 className="text-md text-center bg-white p-2 rounded-md">
        {connectionStatus}
      </h3>
      <div className="mt-12 rounded-md p-4">
        <h1 className="text-3xl font-bold text-center">Collaborative Todo List</h1>
        <ul className="mt-8 flex flex-col gap-4 w-[24rem]">
          <li className="flex items-center justify-between gap-4">
            <input type="text" placeholder="Add a new todo" className="p-1 rounded-md" value={newTodo}
                   onChange={(e) => setNewTodo(e.target.value)}/>
            <div className="flex gap-2">
              <button
                className="bg-violet-700 text-white rounded-md px-3 py-1 disabled:cursor-not-allowed"
                disabled={!newTodo}
                onClick={handleAddTodo}>
                Add
              </button>
            </div>
          </li>
          {todos.map((todo) => (
            <li key={todo.id} className="flex items-center justify-between gap-4">
              {
                editTodo?.id === todo.id ?
                  <EditTodoItem todo={todo} editTodo={editTodo} setEditTodo={setEditTodo}
                                handleSaveEditTodo={handleSaveEditTodo}/>
                  :
                  <TodoItem todo={todo} toggleTodoStatus={toggleTodoStatus} setEditTodo={setEditTodo}
                            handleDeleteTodo={handleDeleteTodo}/>
              }
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export default App;
