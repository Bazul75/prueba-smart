export const validateSchema = (schema) => async (request, response, next) => {
    try {
        await schema.validate(
            {
                body: request.body,
                query: request.query,
                params: request.params,
            },
            { abortEarly: false }
        )
        return next()
    } catch (error) {
        response.status(400).send({
            errors: (error).inner.map(
                ({ message, path }) => ({
                    message,
                    path,
                })
            ),
        })
    }
}
