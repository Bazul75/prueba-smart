import { Model, DataTypes } from 'sequelize'
import sequelize from '../shared/database/database.js'

class User extends Model {}

User.init({
        name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        dni: {
            type: DataTypes.STRING,
            unique: true,
            allowNull: false
        }
    },
    {
        sequelize,
        modelName: 'user',
        timestamps: false
    }
)

export default User
