import * as express from "express"
import { listUsers, getUser, createUser  } from "./controller.js"
import { validateSchema } from "../shared/middleware/validateSchema.js"
import { getUserSchema, addUserSchema } from "../shared/schema/users.js"

const usersRouter = express.Router()

usersRouter.get("/", listUsers)
usersRouter.get("/:id", validateSchema(getUserSchema), getUser)
usersRouter.post("/", validateSchema(addUserSchema), createUser)

export { usersRouter }
