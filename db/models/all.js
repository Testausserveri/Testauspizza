const {DataTypes } = require('sequelize');

function defineUsers(sequelize) {
    return sequelize.define('users', {
        userId: {
            type: DataTypes.STRING,
            primaryKey: true,
            unique: true
        },
        state: {
            type: DataTypes.JSON,
            allowNull: false
        }
    });
}


module.exports = {
    defineUsers,
}