const Pool = require('pg').Pool
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database:'modrec',
    password: 'password',
    port: 5432
});






//////////////////////////////////////   EXAMPLE   //////////////////////////////////////////////////

const getTesting = (request, response) => {
    pool.query('SELECT * FROM testing', (error, results) => {
        if(error) {
            throw error
        }
        response.status(200).json(results.rows)
    })
}

const updateTesting = (request, response) => {
    const uname = request.params.uname
    const { password, email } = request.body
  
    pool.query(
      'UPDATE testing SET password = $1, email = $2 WHERE uname = $3',
      [password, email, uname],
      (error, results) => {
        if (error) {
          throw error
        }
        response.status(200).send(`Testing modified with ID: ${id}`)
      }
    )
  }

const createTesting = (request, response) => {
    const { uname, password, email } = request.body
  
    pool.query('INSERT INTO testing VALUES ($1, $2)', [uname, password, email], (error, results) => {
      if (error) {
        throw error
      }
      response.status(201).send(`User added with uname: ${result.uname}`)
    })
  }


  const deleteTesting = (request, response) => {
    const id = parseInt(request.params.id)
  
    pool.query('DELETE FROM users WHERE id = $1', [id], (error, results) => {
      if (error) {
        throw error
      }
      response.status(200).send(`User deleted with ID: ${id}`)
    })
  }

const getTestingByID = (request, response) => {
    const uname = parseInt(request.param.uname)

    pool.query('SELECT * FROM testing WHERE uname = $1', [uname], (error, results) => {
        if(error){
            throw error
        }
        response.status(200).json(results.rows)
    })
}

const updateUser = (request, response) => {
    const id = parseInt(request.params.id)
    const { name, email } = request.body
  
    pool.query(
      'UPDATE users SET name = $1, email = $2 WHERE id = $3',
      [name, email, id],
      (error, results) => {
        if (error) {
          throw error
        }
        response.status(200).send(`User modified with ID: ${id}`)
      }
    )
  }
module.exports = {getTesting, getTestingByID, deleteTesting,createTesting, updateTesting}