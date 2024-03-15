const express = require('express')
const path = require('path')

const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const app = express()

app.use(express.json())

const dbPath = path.join(__dirname, 'todoApplication.db')

let db = null

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server Running at http://localhost:3000/')
    })
  } catch (e) {
    console.log(`DB Error: ${e.message}`)
    process.exit(1)
  }
}

initializeDBAndServer()
const hasPriorityAndStatusProperties = requestQuery => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  )
}

const hasPriorityProperty = requestQuery => {
  return requestQuery.priority !== undefined
}

const hasStatusProperty = requestQuery => {
  return requestQuery.status !== undefined
}

app.get('/', async (request, response) => {
  const getTodo = `
    SELECT * FROM todo;
  `
  const todoList = await db.all(getTodo)
  response.send(todoList)
})

app.get('/todos/', async (request, response) => {
  let data = null
  let getTodosQuery = ''
  const {search_q = '', priority, status} = request.query
  console.log(status)
  console.log(priority)
  switch (true) {
    case hasPriorityAndStatusProperties(request.query):
      getTodosQuery = `
        SELECT
          *
        FROM
          todo 
        WHERE
          todo LIKE '%${search_q}%'
          AND status = '${status}'
          AND priority = '${priority}';`
      break
    case hasPriorityProperty(request.query):
      getTodosQuery = `
        SELECT
          *
        FROM
          todo 
        WHERE
          todo LIKE '%${search_q}%'
          AND priority = '${priority}';`
      break
    case hasStatusProperty(request.query):
      getTodosQuery = `
        SELECT
          *
        FROM
          todo 
        WHERE
          todo LIKE '%${search_q}%'
          AND status = '${status}';`
      break
    default:
      getTodosQuery = `
        SELECT
          *
        FROM
          todo 
        WHERE
          todo LIKE '%${search_q}%';`
  }

  data = await db.all(getTodosQuery)
  console.log(data)
  response.send(data)
})

//get todo list by id
app.get('/todos/:todoId', async (request, response) => {
  const {todoId} = request.params
  const getTodoIdQuery = `
    SELECT
        *
    FROM
      todo 
    WHERE
      id=${todoId};
  `
  const todo = await db.get(getTodoIdQuery)
  response.send(todo)
})

//add todo list
app.post('/todos/', async (request, response) => {
  const {id, todo, priority, status} = request.body
  console.log(status)
  const getTodoIdQuery = `
    INSERT INTO todo(id,todo,priority,status) VALUES (${id}, "${todo}", "${priority}", "${status}")
  `
  await db.run(getTodoIdQuery)
  response.send('Todo Successfully Added')
})

app.delete('/todos/:todoId', async (request, response) => {
  const {todoId} = request.params
  console.log(todoId)
  const getTodoIdQuery = `
    DELETE FROM todo WHERE id=${todoId};
  `
  await db.run(getTodoIdQuery)
  response.send('Todo Deleted')
})

// Updates the details of a specific todo based on the todo ID
app.put('/todos/:todoId', async (request, response) => {
  const {todoId} = request.params
  console.log(todoId)
  const requestBody = request.body
  let updateColumn = ''
  switch (true) {
    case requestBody.todo !== undefined:
      updateColumn = 'Todo'
      break
    case requestBody.status !== undefined:
      updateColumn = 'Status'
      break
    case requestBody.priority !== undefined:
      updateColumn = 'Priority'
      break
  }
  const previousTodoQuery = `
      SELECT * FROM todo WHERE id=${todoId};
      `
  console.log(previousTodoQuery)
  const previousTodo = await db.get(previousTodoQuery)
  console.log(previousTodo)
  const {
    todo = previousTodo.todo,
    status = previousTodo.status,
    priority = previousTodo.priority,
  } = request.body

  const updateTodosQuery = `
    UPDATE
      todo 
    SET
      todo='${todo}',
      status = '${status}',
      priority='${priority}'
    WHERE id=${todoId};`
  console.log(updateTodosQuery)
  await db.run(updateTodosQuery)
  response.send(`${updateColumn} Updated`)
})
module.exports = app
