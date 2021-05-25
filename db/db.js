const dbController = require("./controller")
const models = require("./models/all");
const utils = require("../chat/utils");

class Database {
    dbSession;
    models;
    constructor(dbname, username, password, host='localhost') {
        this.dbSession = dbController.openDBConnection(dbname, username, password, host);
        this.models = {}
    }

    async connect() {
        try {
            await this.dbSession.authenticate();
            console.log('Database Connection has been established successfully.');
            this.models.users = models.defineUsers(this.dbSession);
            await this.dbSession.sync();
        } catch (error) {
            console.error('Unable to connect to the database:', error);
            process.exit(-1);
        }
    }

    getAllUsers() {
        return this.models.users.findAll();
    }

    getUser(userId, callback) {
        this.models.users.findAll({
            where: {
                userId
            }
        }).then(function (data) {
            callback((data === undefined || data.length < 1) ? undefined : data[0]);
        });
    }

    getUserOrCreate(userId) {
        return new Promise((resolve, reject) => {
            this.getUser(userId, item => {
                if (item === undefined) {
                    this.addUser(userId, utils.defaultState()).then(() => {
                        resolve({userId, state: utils.defaultState()});
                    }).catch(err => {
                        reject(err);
                    })
                } else
                    resolve(item);
            });
        })

    }

    addUser(userId, state) {
        return this.models.users.create({userId, state});
    }

    updateUser(userId, state) {
        return this.models.users.update({state}, {where: {userId}});
    }

}

module.exports = {
    Database: Database
}