import * as yup from "yup"

export const addUserSchema = yup.object({
    body: yup.object({
        name: yup.string().required(),
        dni: yup.string().required(),
    }),
})

export const getUserSchema = yup.object({
    params: yup.object({
        id: yup.number().required(),
    }),
})
