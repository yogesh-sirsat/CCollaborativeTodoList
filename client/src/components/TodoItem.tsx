import {Todo} from '../interfaces/todo.interface'

interface TodoItemProps {
  todo: Todo
  toggleTodoStatus: (id: string) => void
  setEditTodo: (todo: Todo) => void
  handleDeleteTodo: (id: string) => void
}

export default function TodoItem({todo, toggleTodoStatus, setEditTodo, handleDeleteTodo}: TodoItemProps) {
  return <>
    <div className="flex items-center gap-2">
      <input
        className="cursor-pointer h-4 w-4 rounded-md"
        type="checkbox"
        checked={todo.completed}
        onChange={() => toggleTodoStatus(todo.id)}
      />
      <p className={`${todo.completed ? 'line-through' : ''}`}>{todo.text}</p>
    </div>
    <div className="flex gap-2">
      <button className="bg-purple-500 text-white text-sm rounded-md px-2 py-1"
              onClick={() => setEditTodo(todo)}
      >Edit
      </button>
      <button className="bg-red-500 text-white text-sm rounded-md px-2 py-1" onClick={() =>
        handleDeleteTodo(todo.id)
      }>Delete
      </button>
    </div>
  </>
}