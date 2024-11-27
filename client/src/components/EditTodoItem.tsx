import {Todo} from '../interfaces/todo.interface'

interface EditTodoItemProps {
  todo: Todo
  editTodo: Todo
  setEditTodo: (todo: Todo | null) => void
  handleSaveEditTodo: (todo: Todo) => void
}

export default function EditTodoItem({todo, editTodo, setEditTodo, handleSaveEditTodo}: EditTodoItemProps) {
  return <>
    <input
      className="px-1 rounded-md"
      type="text"
      value={editTodo?.text}
      onChange={(e) => setEditTodo({...todo, text: e.target.value})}
    />
    <div className="flex gap-2">
      <button
        className="bg-green-500 text-white text-sm rounded-md px-2 py-1 disabled:cursor-not-allowed"
        disabled={!editTodo?.text}
        onClick={() => handleSaveEditTodo(editTodo)}
      >Save
      </button>
      <button className="bg-gray-500 text-white text-sm rounded-md px-2 py-1" onClick={() =>
        setEditTodo(null)
      }>Cancel
      </button>
    </div>
  </>
}