import * as dotenv from 'dotenv'
import { Sequelize } from 'sequelize'

dotenv.config()

const sequelize = new Sequelize('test-db', process.env.DATABASE_USER, process.env.DATABASE_PASSWORD, {
  dialect: 'sqlite',
  host: process.env.DATABASE_NAME
})

export default sequelize
